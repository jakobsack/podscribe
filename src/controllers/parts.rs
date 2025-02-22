#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use axum::{debug_handler, Extension};
use loco_rs::controller::middleware;
use loco_rs::prelude::*;
use sea_orm::{QueryOrder, QuerySelect};
use serde::{Deserialize, Serialize};
use tantivy::collector::TopDocs;
use tantivy::query::TermQuery;
use tantivy::schema::IndexRecordOption;
use tantivy::{doc, IndexReader, TantivyDocument, Term};

use crate::initializers::tantivy_search::TantivyContainer;
use crate::models::_entities::parts::{ActiveModel, Column, Entity, Model};
use crate::models::_entities::sentences as SentencesNS;
use crate::models::_entities::words as WordsNS;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Params {
    pub text: String,
    pub part_type: i32,
    pub starts_at: f64,
    pub ends_at: f64,
    pub episode_speaker_id: i32,
}

impl Params {
    fn update(&self, item: &mut ActiveModel) {
        item.text = Set(self.text.clone());
        item.part_type = Set(self.part_type);
        item.starts_at = Set(self.starts_at);
        item.ends_at = Set(self.ends_at);
        item.episode_speaker_id = Set(self.episode_speaker_id);
    }
}

async fn load_item(ctx: &AppContext, id: i32) -> Result<Model> {
    let item = Entity::find_by_id(id).one(&ctx.db).await?;
    item.ok_or_else(|| Error::NotFound)
}

#[debug_handler]
pub async fn list(
    _auth: middleware::auth::JWT,
    State(ctx): State<AppContext>,
    Path(episode_id): Path<i32>,
) -> Result<Response> {
    format::json(
        Entity::find()
            .filter(Column::EpisodeId.eq(episode_id))
            .all(&ctx.db)
            .await?,
    )
}

#[debug_handler]
pub async fn add(
    _auth: middleware::auth::JWT,
    Extension(tantivy): Extension<TantivyContainer>,
    Path(episode_id): Path<i32>,
    State(ctx): State<AppContext>,
    Json(params): Json<Params>,
) -> Result<Response> {
    let mut item = ActiveModel {
        ..Default::default()
    };
    params.update(&mut item);
    item.episode_id = Set(episode_id);
    let item = item.insert(&ctx.db).await?;

    let index = tantivy.writer.clone();
    let mut index_writer = index.write().unwrap();
    let schema = tantivy.schema;
    let id = schema.get_field("id").unwrap();
    let text = schema.get_field("text").unwrap();

    index_writer
        .add_document(doc!(
            id => item.id.to_string(),
            text => item.text.clone()))
        .map_err(|e| Error::Message(e.to_string()))?;
    index_writer
        .commit()
        .map_err(|e| Error::Message(e.to_string()))?;

    format::json(item)
}

#[debug_handler]
pub async fn update(
    _auth: middleware::auth::JWT,
    Path((episode_id, id)): Path<(i32, i32)>,
    State(ctx): State<AppContext>,
    Json(params): Json<Params>,
) -> Result<Response> {
    let item = load_item(&ctx, id).await?;
    if item.episode_id != episode_id {
        return Err(Error::NotFound);
    }
    let mut item = item.into_active_model();
    params.update(&mut item);
    let item = item.update(&ctx.db).await?;
    format::json(item)
}

#[debug_handler]
pub async fn remove(
    _auth: middleware::auth::JWT,
    Path((_episode_id, id)): Path<(i32, i32)>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    load_item(&ctx, id).await?.delete(&ctx.db).await?;
    format::empty()
}

#[debug_handler]
pub async fn get_one(
    _auth: middleware::auth::JWT,
    Path((_episode_id, id)): Path<(i32, i32)>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    format::json(load_item(&ctx, id).await?)
}

#[debug_handler]
pub async fn get_display(
    _auth: middleware::auth::JWT,
    Path((_episode_id, id)): Path<(i32, i32)>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let part = load_item(&ctx, id).await?;

    let sentences = SentencesNS::Entity::find()
        .filter(SentencesNS::Column::PartId.eq(id))
        .order_by_asc(SentencesNS::Column::StartsAt)
        .all(&ctx.db)
        .await?;

    let sentence_ids: Vec<i32> = sentences.iter().map(|s| s.id).collect();

    let words = WordsNS::Entity::find()
        .filter(WordsNS::Column::SentenceId.is_in(sentence_ids))
        .all(&ctx.db)
        .await?;

    let display_sentences: Vec<SentenceDisplay> = sentences
        .iter()
        .map(|s| SentenceDisplay {
            sentence: s.clone(),
            words: words
                .iter()
                .filter(|w| w.sentence_id == s.id)
                .map(|w| w.clone())
                .collect(),
        })
        .collect();

    let output = Display {
        part,
        sentences: display_sentences,
    };

    format::json(output)
}

#[debug_handler]
pub async fn ui_update(
    _auth: middleware::auth::JWT,
    Extension(tantivy): Extension<TantivyContainer>,
    Path((episode_id, id)): Path<(i32, i32)>,
    State(ctx): State<AppContext>,
    Json(params): Json<UiUpdateParams>,
) -> Result<Response> {
    // First make the function word. Do not yet optimize.
    let original_part = load_item(&ctx, id).await?;
    if original_part.episode_id != episode_id {
        return Err(Error::NotFound);
    }

    let original_sentences = SentencesNS::Entity::find()
        .filter(SentencesNS::Column::PartId.eq(original_part.id))
        .all(&ctx.db)
        .await?;

    let original_sentence_ids: Vec<i32> = original_sentences.iter().map(|s| s.id).collect();

    let original_words = WordsNS::Entity::find()
        .filter(WordsNS::Column::SentenceId.is_in(original_sentence_ids))
        .all(&ctx.db)
        .await?;

    // Sanity check: all words in list
    let ui_words: Vec<UiUpdateParamsSentenceWord> = params
        .sentences
        .iter()
        .flat_map(|x| x.words.clone())
        .collect();
    if ui_words.len() != original_words.len() {
        return Err(Error::BadRequest(String::from(
            "Amount of words does not match",
        )));
    }

    if !ui_words
        .iter()
        .all(|x| ui_words.iter().filter(|y| y.id == x.id).count() == 1)
    {
        return Err(Error::BadRequest(String::from(
            "Not all word ids are unique",
        )));
    }

    if !original_words.iter().all(|original_word| {
        ui_words
            .iter()
            .any(|ui_word| original_word.id == ui_word.id)
    }) {
        return Err(Error::BadRequest(String::from("Not all words included")));
    }

    // Sanity check: no duplicate sentence ids
    if !params.sentences.iter().all(|x| {
        params
            .sentences
            .iter()
            .filter(|y| y.sentence.id == x.sentence.id)
            .count()
            == 1
    }) {
        return Err(Error::BadRequest(String::from(
            "Not all sentence ids are unique",
        )));
    }

    // Sanity check: all sentence ids > 0 loaded
    if !params
        .sentences
        .iter()
        .filter(|x| x.sentence.id > 0)
        .all(|x| original_sentences.iter().any(|y| y.id == x.sentence.id))
    {
        return Err(Error::BadRequest(String::from(
            "Not all sentences were loaded",
        )));
    }

    // Sanity check: No empty sentences
    if !params.sentences.iter().all(|x| x.words.len() > 0) {
        return Err(Error::BadRequest(String::from(
            "Not all sentences contain words",
        )));
    }

    // Prepare indexer
    let index = tantivy.writer.clone();
    let reader = tantivy.reader;
    let schema = tantivy.schema;
    let index_id = schema.get_field("id").unwrap();
    let index_text = schema.get_field("text").unwrap();

    // Find out which sentences stay and which ones are moved.
    let moved_sentences: Vec<&UiUpdateParamsSentence> = params
        .sentences
        .iter()
        .filter(|x| x.move_sentence.is_some())
        .collect();
    let sticky_sentences: Vec<&UiUpdateParamsSentence> = params
        .sentences
        .iter()
        .filter(|x| x.move_sentence.is_none())
        .collect();

    // First we work on sentences that move
    for ui_sentence in moved_sentences {
        let target_part = match ui_sentence.move_sentence.as_deref() {
            Some("up") => find_previous_part(&original_part, &ctx).await?,
            Some("upnew") => create_part(&original_part, &ctx).await?,
            Some("downnew") => create_part(&original_part, &ctx).await?,
            Some("down") => find_next_part(&original_part, &ctx).await?,
            _ => panic!("Unexpected data"),
        };

        let new_text = update_sentence(&ui_sentence, &target_part, &ctx).await?;

        // Update part
        let old_starts_at = target_part.starts_at;
        let old_ends_at = target_part.ends_at;
        let old_text = target_part.text.clone();

        let mut target_part = target_part.into_active_model();
        if old_starts_at == old_ends_at {
            // We just created this part
            target_part.starts_at = Set(ui_sentence.words[0].starts_at);
            target_part.ends_at = Set(ui_sentence.words[ui_sentence.words.len() - 1].ends_at);
            target_part.text = Set(new_text)
        } else if ui_sentence.move_sentence.as_deref() == Some("up") {
            // We are appending to the previous
            target_part.ends_at = Set(ui_sentence.words[ui_sentence.words.len() - 1].ends_at);
            let text = vec![old_text, new_text]
                .iter()
                .filter(|x| !x.is_empty())
                .map(|x| x.clone())
                .collect::<Vec<String>>()
                .join(" ");
            target_part.text = Set(text);
        } else {
            // We are appending to the previous
            target_part.starts_at = Set(ui_sentence.words[0].starts_at);
            let text = vec![new_text, old_text]
                .iter()
                .filter(|x| !x.is_empty())
                .map(|x| x.clone())
                .collect::<Vec<String>>()
                .join(" ");
            target_part.text = Set(text);
        };

        let target_part: Model = target_part.update(&ctx.db).await?;

        // Tantivy remove index
        let index_writer = index.read().unwrap();
        let index_id_term = Term::from_field_text(index_id, &target_part.id.to_string());
        let extracted_item = extract_part_from_search_index(&reader, &index_id_term)
            .map_err(|e| Error::Message(e.to_string()))?;

        if extracted_item.is_some() {
            index_writer.delete_term(index_id_term.clone());
        }

        // Tantivy update index
        index
            .read()
            .unwrap()
            .add_document(doc!(
                index_id => target_part.id.to_string(),
                index_text => target_part.text.clone()))
            .map_err(|e| Error::Message(e.to_string()))?;
    }

    let mut texts: Vec<String> = Vec::with_capacity(sticky_sentences.len());
    for ui_sentence in &sticky_sentences {
        let new_text = update_sentence(&ui_sentence, &original_part, &ctx).await?;
        texts.push(new_text);
    }
    let complete_text: String = texts
        .iter()
        .filter(|x| !x.is_empty())
        .map(|x| x.clone())
        .collect::<Vec<String>>()
        .join(" ");

    {
        let index_writer = index.read().unwrap();
        let index_id_term = Term::from_field_text(index_id, &id.to_string());
        let extracted_item = extract_part_from_search_index(&reader, &index_id_term)
            .map_err(|e| Error::Message(e.to_string()))?;

        if extracted_item.is_some() {
            index_writer.delete_term(index_id_term.clone());
        }
    }

    if sticky_sentences.len() == 0 {
        original_part.delete(&ctx.db).await?;
    } else {
        // Update part
        let last_sentence = sticky_sentences[sticky_sentences.len() - 1];
        let mut original_part = original_part.into_active_model();
        original_part.starts_at = Set(sticky_sentences[0].words[0].starts_at);
        original_part.ends_at = Set(last_sentence.words[last_sentence.words.len() - 1].ends_at);
        original_part.text = Set(complete_text.clone());
        original_part.part_type = Set(params.part.part_type);
        original_part.episode_speaker_id = Set(params.part.episode_speaker_id);
        let original_part = original_part.update(&ctx.db).await?;

        // Tantivy update index
        index
            .read()
            .unwrap()
            .add_document(doc!(
                    index_id => original_part.id.to_string(),
                    index_text => original_part.text.clone()))
            .map_err(|e| Error::Message(e.to_string()))?;
    }

    // Remove sentences that are not required anymore
    for sentence in original_sentences
        .iter()
        .filter(|x| !params.sentences.iter().any(|y| y.sentence.id == x.id))
    {
        let sentence = sentence.clone();
        sentence.delete(&ctx.db).await?;
    }

    index
        .write()
        .unwrap()
        .commit()
        .map_err(|e| Error::Message(e.to_string()))?;

    reader.reload().map_err(|e| Error::Message(e.to_string()))?;

    format::empty()
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/episodes/{episode_id}/parts/")
        .add("/", get(list))
        .add("/", post(add))
        .add("{id}", get(get_one))
        .add("{id}/display", get(get_display))
        .add("{id}/update", post(ui_update))
        .add("{id}", delete(remove))
        .add("{id}", put(update))
        .add("{id}", patch(update))
}

async fn find_previous_part(part: &Model, ctx: &AppContext) -> Result<Model> {
    let previous_part = Entity::find()
        .filter(Column::EpisodeId.eq(part.episode_id))
        .filter(Column::StartsAt.lt(part.starts_at))
        .order_by_desc(Column::StartsAt)
        .limit(1)
        .one(&ctx.db)
        .await?;

    if let Some(prev) = previous_part {
        return Ok(prev);
    }

    create_part(part, ctx).await
}

async fn find_next_part(part: &Model, ctx: &AppContext) -> Result<Model> {
    let previous_part = Entity::find()
        .filter(Column::EpisodeId.eq(part.episode_id))
        .filter(Column::StartsAt.gt(part.starts_at))
        .order_by_asc(Column::StartsAt)
        .limit(1)
        .one(&ctx.db)
        .await?;

    if let Some(prev) = previous_part {
        return Ok(prev);
    }

    create_part(part, ctx).await
}

async fn create_part(part: &Model, ctx: &AppContext) -> Result<Model> {
    let mut item = ActiveModel {
        ..Default::default()
    };
    item.text = Set("".into());
    item.part_type = Set(part.part_type);
    item.starts_at = Set(part.starts_at);
    item.ends_at = Set(part.starts_at);
    item.episode_speaker_id = Set(part.episode_speaker_id);
    item.episode_id = Set(part.episode_id);
    let item = item.insert(&ctx.db).await?;

    Ok(item)
}

async fn update_sentence(
    ui_sentence: &UiUpdateParamsSentence,
    target_part: &Model,
    ctx: &AppContext,
) -> Result<String> {
    // Create or fetch sentence
    let sentence = find_or_create_sentence(&ui_sentence.sentence, &target_part, &ctx).await?;
    let sentence_id = sentence.id;
    let mut sentence = sentence.into_active_model();
    let text: Vec<String> = ui_sentence
        .words
        .iter()
        .filter(|x| !x.hidden)
        .map(|x| {
            if x.overwrite.is_empty() {
                x.text.clone()
            } else {
                x.overwrite.clone()
            }
        })
        .collect();
    let new_text = text.join(" ");
    let text_len: i32 = text.len().try_into().unwrap();
    let text_len: f64 = text_len.try_into().unwrap();
    let words_per_second: f64 = if text_len < 0.1 {
        // Words per second is 0 if there are no words
        0.0
    } else {
        (ui_sentence.words[ui_sentence.words.len() - 1].ends_at - ui_sentence.words[0].starts_at)
            / text_len
    };
    sentence.part_id = Set(target_part.id);
    sentence.text = Set(new_text.clone());
    sentence.starts_at = Set(ui_sentence.words[0].starts_at);
    sentence.ends_at = Set(ui_sentence.words[ui_sentence.words.len() - 1].ends_at);
    sentence.words_per_second = Set(words_per_second);
    sentence.save(&ctx.db).await?;

    // Update words
    let word_ids: Vec<i32> = ui_sentence.words.iter().map(|x| x.id).collect();
    let words = WordsNS::Entity::find()
        .filter(WordsNS::Column::Id.is_in(word_ids))
        .all(&ctx.db)
        .await?;
    for word in words {
        let ui_word = ui_sentence.words.iter().find(|x| x.id == word.id).unwrap();
        let mut word = word.into_active_model();
        word.sentence_id = Set(sentence_id);
        word.hidden = Set(ui_word.hidden);
        word.text = Set(ui_word.text.clone());
        word.overwrite = Set(ui_word.overwrite.clone());
        word.save(&ctx.db).await?;
    }

    Ok(new_text)
}

async fn find_or_create_sentence(
    sentence: &UiUpdateParamsSentenceSentence,
    part: &Model,
    ctx: &AppContext,
) -> Result<SentencesNS::Model> {
    if sentence.id <= 0 {
        let mut item = SentencesNS::ActiveModel {
            ..Default::default()
        };
        item.text = Set("".into());
        item.starts_at = Set(sentence.starts_at);
        item.ends_at = Set(sentence.ends_at);
        item.part_id = Set(part.id);
        let item = item.insert(&ctx.db).await?;

        return Ok(item);
    }

    let item = SentencesNS::Entity::find_by_id(sentence.id)
        .one(&ctx.db)
        .await?;
    Ok(item.unwrap())
}

fn extract_part_from_search_index(
    reader: &IndexReader,
    id_term: &Term,
) -> tantivy::Result<Option<TantivyDocument>> {
    let searcher = reader.searcher();

    let term_query = TermQuery::new(id_term.clone(), IndexRecordOption::Basic);
    let top_docs = searcher.search(&term_query, &TopDocs::with_limit(1))?;

    if let Some((_score, doc_address)) = top_docs.first() {
        let doc = searcher.doc(*doc_address)?;
        Ok(Some(doc))
    } else {
        Ok(None)
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Display {
    pub part: Model,
    pub sentences: Vec<SentenceDisplay>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SentenceDisplay {
    pub sentence: SentencesNS::Model,
    pub words: Vec<WordsNS::Model>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UiUpdateParams {
    pub part: UiUpdateParamsPart,
    pub sentences: Vec<UiUpdateParamsSentence>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UiUpdateParamsPart {
    pub id: i32,
    pub text: String,
    pub starts_at: f64,
    pub part_type: i32,
    pub ends_at: f64,
    pub episode_speaker_id: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UiUpdateParamsSentence {
    pub sentence: UiUpdateParamsSentenceSentence,
    pub words: Vec<UiUpdateParamsSentenceWord>,
    pub move_sentence: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UiUpdateParamsSentenceSentence {
    pub id: i32,
    pub text: String,
    pub starts_at: f64,
    pub ends_at: f64,
    pub words_per_second: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UiUpdateParamsSentenceWord {
    pub id: i32,
    pub text: String,
    pub overwrite: String,
    pub starts_at: f64,
    pub ends_at: f64,
    pub probability: f64,
    pub hidden: bool,
}
