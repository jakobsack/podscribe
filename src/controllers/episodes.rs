#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use axum::extract::Query;
use axum::{debug_handler, Extension};
use loco_rs::controller::middleware;
use loco_rs::prelude::*;
use sea_orm::QueryOrder;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use tantivy::collector::TopDocs;
use tantivy::query::QueryParser;
use tantivy::schema::Value;
use tantivy::{doc, Score, TantivyDocument};

use crate::common::check_auth;
use crate::initializers::tantivy_search::TantivyContainer;
use crate::models::_entities::approvals as ApprovalsNS;
use crate::models::_entities::episode_speakers as EpisodeSpeakersNS;
use crate::models::_entities::episodes::{ActiveModel, Column, Entity, Model};
use crate::models::_entities::parts as PartsNS;
use crate::models::_entities::sentences as SentencesNS;
use crate::models::_entities::speakers as SpeakersNS;
use crate::models::_entities::words as WordsNS;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Params {
    pub external_id: Option<String>,
    pub title: String,
    pub link: String,
    pub description: String,
    pub published_at: Option<chrono::DateTime<chrono::FixedOffset>>,
    pub filename: String,
    pub has_audio_file: bool,
}

impl Params {
    fn update(&self, item: &mut ActiveModel) {
        item.external_id = Set(self.external_id.clone());
        item.title = Set(self.title.clone());
        item.link = Set(self.link.clone());
        item.description = Set(self.description.clone());
        item.published_at = Set(self.published_at.clone());
        item.filename = Set(self.filename.clone());
        item.has_audio_file = Set(self.has_audio_file.clone());
    }
}

async fn load_item(ctx: &AppContext, id: i32) -> Result<Model> {
    let item = Entity::find_by_id(id).one(&ctx.db).await?;
    item.ok_or_else(|| Error::NotFound)
}

#[debug_handler]
pub async fn list(_auth: middleware::auth::JWT, State(ctx): State<AppContext>) -> Result<Response> {
    format::json(Entity::find().all(&ctx.db).await?)
}

#[debug_handler]
pub async fn add(
    auth: middleware::auth::JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<Params>,
) -> Result<Response> {
    check_auth::check_admin(auth.claims)?;
    let mut item = ActiveModel {
        ..Default::default()
    };
    params.update(&mut item);
    let item = item.insert(&ctx.db).await?;
    format::json(item)
}

#[debug_handler]
pub async fn update(
    auth: middleware::auth::JWT,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
    Json(params): Json<Params>,
) -> Result<Response> {
    check_auth::check_admin(auth.claims)?;
    let item = load_item(&ctx, id).await?;
    let mut item = item.into_active_model();
    params.update(&mut item);
    let item = item.update(&ctx.db).await?;
    format::json(item)
}

#[debug_handler]
pub async fn remove(
    auth: middleware::auth::JWT,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    check_auth::check_admin(auth.claims)?;
    load_item(&ctx, id).await?.delete(&ctx.db).await?;
    format::empty()
}

#[debug_handler]
pub async fn get_one(
    auth: middleware::auth::JWT,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    check_auth::check_reader(auth.claims)?;
    format::json(load_item(&ctx, id).await?)
}

#[debug_handler]
pub async fn get_display(
    auth: middleware::auth::JWT,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    check_auth::check_reader(auth.claims)?;
    let episode = load_item(&ctx, id).await?;
    let parts = PartsNS::Entity::find()
        .filter(PartsNS::Column::EpisodeId.eq(id))
        .order_by_asc(PartsNS::Column::StartsAt)
        .all(&ctx.db)
        .await?;

    let part_ids: Vec<i32> = parts.iter().map(|x| x.id).collect();

    let approvals = ApprovalsNS::Entity::find()
        .filter(ApprovalsNS::Column::PartId.is_in(part_ids))
        .all(&ctx.db)
        .await?;

    let episode_speakers = EpisodeSpeakersNS::Entity::find()
        .filter(EpisodeSpeakersNS::Column::EpisodeId.eq(id))
        .all(&ctx.db)
        .await?;

    let speakers = SpeakersNS::Entity::find().all(&ctx.db).await?;

    let output = Display {
        episode,
        parts,
        episode_speakers,
        speakers,
        approvals,
    };

    format::json(output)
}

#[debug_handler]
pub async fn attach_audio(
    auth: middleware::auth::JWT,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
    content: axum::body::Bytes,
) -> Result<Response> {
    check_auth::check_admin(auth.claims)?;
    let item = load_item(&ctx, id).await?;
    let path = std::path::PathBuf::from("episodes").join(format!("{}.mp3", id));
    ctx.storage
        .as_ref()
        .upload(path.as_path(), &content)
        .await?;

    let mut item = item.into_active_model();
    item.has_audio_file = Set(true);
    let item = item.update(&ctx.db).await?;

    format::json(item)
}

#[debug_handler]
pub async fn get_audio(
    auth: middleware::auth::JWT,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    check_auth::check_contributor(auth.claims)?;
    let item = load_item(&ctx, id).await?;
    if !item.has_audio_file {
        return Err(Error::BadRequest("Episode has no audio file".into()));
    }

    let path = std::path::PathBuf::from("episodes").join(format!("{}.mp3", id));
    let content: Vec<u8> = ctx.storage.download(&path.as_path()).await?;
    Ok(axum::body::Bytes::from(content).into_response())
}

#[debug_handler]
pub async fn search(
    auth: middleware::auth::JWT,
    Extension(tantivy): Extension<TantivyContainer>,
    State(ctx): State<AppContext>,
    search: Query<SearchQueryParams>,
) -> Result<Response> {
    check_auth::check_reader(auth.claims)?;
    let searcher = tantivy.reader.searcher();

    let schema = tantivy.schema;
    let index_id = schema.get_field("id").unwrap();
    let index_text = schema.get_field("text").unwrap();

    let query_parser = QueryParser::for_index(&tantivy.index, vec![index_text]);
    let query = query_parser
        .parse_query(&search.query)
        .map_err(|e| Error::Message(e.to_string()))?;

    let top_docs = searcher
        .search(&query, &TopDocs::with_limit(50))
        .map_err(|e| Error::Message(e.to_string()))?;

    let mut search_results: Vec<SearchDocument> = vec![];
    let mut part_ids: Vec<i32> = vec![];
    for (score, doc_address) in top_docs {
        let retrieved_doc: TantivyDocument = searcher
            .doc(doc_address)
            .map_err(|e| Error::Message(e.to_string()))?;
        let id_str = retrieved_doc
            .get_first(index_id)
            .unwrap()
            .as_value()
            .as_str()
            .unwrap();
        let id: i32 = id_str.parse().unwrap();
        part_ids.push(id);
        search_results.push(SearchDocument { id, score });
    }

    let approvals = ApprovalsNS::Entity::find()
        .filter(ApprovalsNS::Column::PartId.is_in(part_ids.clone()))
        .all(&ctx.db)
        .await?;

    let parts = PartsNS::Entity::find()
        .filter(PartsNS::Column::Id.is_in(part_ids))
        .all(&ctx.db)
        .await?;

    let episode_ids: Vec<i32> = parts
        .iter()
        .map(|x| x.episode_id)
        .collect::<HashSet<_>>()
        .into_iter()
        .collect();
    let episodes = Entity::find()
        .filter(Column::Id.is_in(episode_ids))
        .all(&ctx.db)
        .await?;

    let search_result = SearchResult {
        search_results,
        episodes,
        parts,
        approvals,
    };

    format::json(search_result)
}

#[debug_handler]
pub async fn import(
    auth: middleware::auth::JWT,
    Extension(tantivy): Extension<TantivyContainer>,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
    Json(transcription): Json<ImportTranscription>,
) -> Result<Response> {
    check_auth::check_admin(auth.claims)?;
    // Bad request if anything already exists
    let existing_parts = PartsNS::Entity::find()
        .filter(PartsNS::Column::EpisodeId.eq(id))
        .all(&ctx.db)
        .await?;
    if existing_parts.len() != 0 {
        return Err(Error::BadRequest(String::from(
            "Import only works for blank episodes",
        )));
    }

    // Bad request if anything already exists
    let existing_speakers = EpisodeSpeakersNS::Entity::find()
        .filter(EpisodeSpeakersNS::Column::EpisodeId.eq(id))
        .all(&ctx.db)
        .await?;
    if existing_speakers.len() != 0 {
        return Err(Error::BadRequest(String::from(
            "Import only works for blank episodes",
        )));
    }

    // All new. Start with speakers.
    let mut speaker_map = transcription
        .transcription
        .iter()
        .map(|x| (x.speaker.clone(), 0))
        .collect::<HashMap<_, _>>();

    let speaker_names = speaker_map.keys().map(|x| x.clone()).collect::<Vec<_>>();

    let existing_speakers = SpeakersNS::Entity::find()
        .filter(SpeakersNS::Column::Name.is_in(speaker_names))
        .all(&ctx.db)
        .await?;

    for speaker in existing_speakers {
        speaker_map
            .entry(speaker.name)
            .and_modify(|s| *s = speaker.id);
    }

    // Now all speakers that do not yet exist have id "0"
    for speaker_entry in speaker_map.iter_mut().filter(|x| *x.1 == 0) {
        let mut item = SpeakersNS::ActiveModel {
            ..Default::default()
        };
        item.name = Set(speaker_entry.0.clone());
        let item = item.insert(&ctx.db).await?;
        *(speaker_entry.1) = item.id;
    }

    // Now assign all speakers to episode speakers
    let mut episode_speaker_map = HashMap::<String, i32>::new();
    for speaker_entry in speaker_map {
        let mut item = EpisodeSpeakersNS::ActiveModel {
            ..Default::default()
        };
        item.episode_id = Set(id);
        item.speaker_id = Set(speaker_entry.1);
        let item = item.insert(&ctx.db).await?;
        episode_speaker_map.insert(speaker_entry.0.clone(), item.id);
    }

    // Prepare indexer
    let index = tantivy.writer.clone();
    let schema = tantivy.schema;
    let index_id = schema.get_field("id").unwrap();
    let index_text = schema.get_field("text").unwrap();

    // Now got for the parts
    for import_part in transcription.transcription {
        if import_part.text.is_empty() {
            continue;
        }

        let mut item = PartsNS::ActiveModel {
            ..Default::default()
        };
        item.episode_speaker_id = Set(*episode_speaker_map.get(&import_part.speaker).unwrap());
        item.episode_id = Set(id);
        item.text = Set(import_part.text.clone());
        item.part_type = Set(0);
        item.starts_at = Set(import_part.start);
        item.ends_at = Set(import_part.end);
        let part = item.insert(&ctx.db).await?;

        index
            .read()
            .unwrap()
            .add_document(doc!(
                index_id => part.id.to_string(),
                index_text => part.text.clone()))
            .map_err(|e| Error::Message(e.to_string()))?;

        for import_sentence in import_part.sentences {
            if import_sentence.text.is_empty() {
                continue;
            }

            let mut item = SentencesNS::ActiveModel {
                ..Default::default()
            };
            item.part_id = Set(part.id);
            item.text = Set(import_sentence.text.clone());
            item.starts_at = Set(import_sentence.start);
            item.ends_at = Set(import_sentence.end);
            item.words_per_second = Set(import_sentence.words_per_second);
            let sentence = item.insert(&ctx.db).await?;

            let words = import_sentence
                .words
                .iter()
                .map(|x| {
                    let mut item = WordsNS::ActiveModel {
                        ..Default::default()
                    };

                    item.sentence_id = Set(sentence.id);
                    item.hidden = Set(false);
                    item.overwrite = Set("".into());
                    item.text = Set(x.text.clone());
                    item.probability = Set(x.probability);
                    item.starts_at = Set(x.start);
                    item.ends_at = Set(x.end);
                    item
                })
                .collect::<Vec<WordsNS::ActiveModel>>();

            WordsNS::Entity::insert_many(words)
                .on_empty_do_nothing()
                .exec(&ctx.db)
                .await?;
        }
    }

    index
        .write()
        .unwrap()
        .commit()
        .map_err(|e| Error::Message(e.to_string()))?;

    format::empty()
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/episodes/")
        .add("/", get(list))
        .add("/", post(add))
        .add("/search", get(search))
        .add("{id}", get(get_one))
        .add("{id}", post(import))
        .add("{id}/display", get(get_display))
        .add("{id}/audio", get(get_audio))
        .add("{id}/audio", post(attach_audio))
        .add("{id}", delete(remove))
        .add("{id}", put(update))
        .add("{id}", patch(update))
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Display {
    pub episode: Model,
    pub parts: Vec<PartsNS::Model>,
    pub episode_speakers: Vec<EpisodeSpeakersNS::Model>,
    pub speakers: Vec<SpeakersNS::Model>,
    pub approvals: Vec<ApprovalsNS::Model>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ImportTranscription {
    pub transcription: Vec<ImportPart>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ImportPart {
    pub start: f64,
    pub end: f64,
    pub speaker: String,
    pub text: String,
    pub sentences: Vec<ImportSentence>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ImportSentence {
    pub text: String,
    pub words: Vec<ImportWord>,
    pub start: f64,
    pub end: f64,
    pub words_per_second: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ImportWord {
    pub text: String,
    pub start: f64,
    pub end: f64,
    pub probability: f64,
}

#[derive(Deserialize)]
pub struct SearchQueryParams {
    query: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SearchDocument {
    pub id: i32,
    pub score: Score,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub search_results: Vec<SearchDocument>,
    pub episodes: Vec<Model>,
    pub parts: Vec<PartsNS::Model>,
    pub approvals: Vec<ApprovalsNS::Model>,
}
