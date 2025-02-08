#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use axum::{debug_handler, Extension};
use loco_rs::controller::middleware;
use loco_rs::prelude::*;
use sea_orm::{QueryOrder, QuerySelect};
use serde::{Deserialize, Serialize};
use tantivy::doc;

use crate::extensions::tantivy_search::TantivyContainer;
use crate::models::_entities::parts::{ActiveModel, Column, Entity, Model};
use crate::models::_entities::sections as SectionsNS;
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

    let sections = SectionsNS::Entity::find()
        .filter(SectionsNS::Column::PartId.eq(id))
        .all(&ctx.db)
        .await?;

    let section_ids: Vec<i32> = sections.iter().map(|s| s.id).collect();

    let words = WordsNS::Entity::find()
        .filter(WordsNS::Column::SectionId.is_in(section_ids))
        .all(&ctx.db)
        .await?;

    let display_sections: Vec<SectionDisplay> = sections
        .iter()
        .map(|s| SectionDisplay {
            section: s.clone(),
            words: words
                .iter()
                .filter(|w| w.section_id == s.id)
                .map(|w| w.clone())
                .collect(),
        })
        .collect();

    let output = Display {
        part,
        sections: display_sections,
    };

    format::json(output)
}

#[debug_handler]
pub async fn ui_update(
    _auth: middleware::auth::JWT,
    Path((episode_id, id)): Path<(i32, i32)>,
    State(ctx): State<AppContext>,
    Json(params): Json<UiUpdateParams>,
) -> Result<Response> {
    // First make the function word. Do not yet optimize.
    let original_part = load_item(&ctx, id).await?;
    if original_part.episode_id != episode_id {
        return Err(Error::NotFound);
    }

    let original_sections = SectionsNS::Entity::find()
        .filter(SectionsNS::Column::PartId.eq(original_part.id))
        .all(&ctx.db)
        .await?;

    let original_section_ids: Vec<i32> = original_sections.iter().map(|s| s.id).collect();

    let original_words = WordsNS::Entity::find()
        .filter(WordsNS::Column::SectionId.is_in(original_section_ids))
        .all(&ctx.db)
        .await?;

    // Sanity check: all words in list
    let ui_words: Vec<UiUpdateParamsSectionWord> = params
        .sections
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

    // Sanity check: no duplicate section ids
    if !params.sections.iter().all(|x| {
        params
            .sections
            .iter()
            .filter(|y| y.section.id == x.section.id)
            .count()
            == 1
    }) {
        return Err(Error::BadRequest(String::from(
            "Not all section ids are unique",
        )));
    }

    // Sanity check: all section ids > 0 loaded
    if !params
        .sections
        .iter()
        .filter(|x| x.section.id > 0)
        .all(|x| original_sections.iter().any(|y| y.id == x.section.id))
    {
        return Err(Error::BadRequest(String::from(
            "Not all sections were loaded",
        )));
    }

    // Sanity check: No empty sections
    if !params.sections.iter().all(|x| x.words.len() > 0) {
        return Err(Error::BadRequest(String::from(
            "Not all sections contain words",
        )));
    }

    let moved_sections: Vec<&UiUpdateParamsSection> = params
        .sections
        .iter()
        .filter(|x| x.move_section.is_some())
        .collect();
    let sticky_sections: Vec<&UiUpdateParamsSection> = params
        .sections
        .iter()
        .filter(|x| x.move_section.is_none())
        .collect();

    // First we work on sections that move
    for ui_section in moved_sections {
        let target_part = match ui_section.move_section.as_deref() {
            Some("up") => find_previous_part(&original_part, &ctx).await?,
            Some("upnew") => create_part(&original_part, &ctx).await?,
            Some("downnew") => create_part(&original_part, &ctx).await?,
            Some("down") => find_next_part(&original_part, &ctx).await?,
            _ => panic!("Unexpected data"),
        };

        let new_text = update_section(&ui_section, &target_part, &ctx).await?;

        // Update part
        let old_starts_at = target_part.starts_at;
        let old_ends_at = target_part.ends_at;
        let old_text = target_part.text.clone();

        let mut target_part = target_part.into_active_model();
        if old_starts_at == old_ends_at {
            // We just created this part
            target_part.starts_at = Set(ui_section.words[0].starts_at);
            target_part.ends_at = Set(ui_section.words[ui_section.words.len()].ends_at);
            target_part.text = Set(new_text)
        } else if ui_section.move_section.as_deref() == Some("up") {
            // We are appending to the previous
            target_part.ends_at = Set(ui_section.words[ui_section.words.len()].ends_at);
            target_part.text = Set(format!("{} {}", old_text, new_text));
        } else {
            // We are appending to the previous
            target_part.starts_at = Set(ui_section.words[0].starts_at);
            target_part.text = Set(format!("{} {}", new_text, old_text));
        };

        target_part.save(&ctx.db).await?;
    }

    let mut complete_text: String = String::new();
    for ui_section in &sticky_sections {
        let new_text = update_section(&ui_section, &original_part, &ctx).await?;
        complete_text.push_str(" ");
        complete_text.push_str(&new_text);
    }

    if sticky_sections.len() == 0 {
        original_part.delete(&ctx.db).await?;
    } else {
        // Update part
        let last_section = sticky_sections[sticky_sections.len() - 1];
        let mut original_part = original_part.into_active_model();
        original_part.starts_at = Set(sticky_sections[0].words[0].starts_at);
        original_part.ends_at = Set(last_section.words[last_section.words.len() - 1].ends_at);
        original_part.text = Set(complete_text.clone());
        original_part.save(&ctx.db).await?;
    }

    // Remove sections that are not required anymore
    for section in original_sections
        .iter()
        .filter(|x| !params.sections.iter().any(|y| y.section.id == x.id))
    {
        let section = section.clone();
        section.delete(&ctx.db).await?;
    }

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
    item.starts_at = Set(part.starts_at);
    item.ends_at = Set(part.starts_at);
    item.episode_speaker_id = Set(part.episode_speaker_id);
    item.episode_id = Set(part.episode_id);
    let item = item.insert(&ctx.db).await?;

    Ok(item)
}

async fn update_section(
    ui_section: &UiUpdateParamsSection,
    target_part: &Model,
    ctx: &AppContext,
) -> Result<String> {
    // Create or fetch section
    let section = find_or_create_section(&ui_section.section, &target_part, &ctx).await?;
    let section_id = section.id;
    let mut section = section.into_active_model();
    let text: Vec<String> = ui_section
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
    let words_per_second: f64 = (ui_section.words[ui_section.words.len() - 1].ends_at
        - ui_section.words[0].starts_at)
        / text_len;
    section.part_id = Set(target_part.id);
    section.text = Set(new_text.clone());
    section.starts_at = Set(ui_section.words[0].starts_at);
    section.ends_at = Set(ui_section.words[ui_section.words.len() - 1].ends_at);
    section.words_per_second = Set(words_per_second);
    section.save(&ctx.db).await?;

    // Update words
    let word_ids: Vec<i32> = ui_section.words.iter().map(|x| x.id).collect();
    let words = WordsNS::Entity::find()
        .filter(WordsNS::Column::Id.is_in(word_ids))
        .all(&ctx.db)
        .await?;
    for word in words {
        let ui_word = ui_section.words.iter().find(|x| x.id == word.id).unwrap();
        let mut word = word.into_active_model();
        word.section_id = Set(section_id);
        word.hidden = Set(ui_word.hidden);
        word.text = Set(ui_word.text.clone());
        word.overwrite = Set(ui_word.overwrite.clone());
        word.save(&ctx.db).await?;
    }

    Ok(new_text)
}

async fn find_or_create_section(
    section: &UiUpdateParamsSectionSection,
    part: &Model,
    ctx: &AppContext,
) -> Result<SectionsNS::Model> {
    if section.id <= 0 {
        let mut item = SectionsNS::ActiveModel {
            ..Default::default()
        };
        item.text = Set("".into());
        item.starts_at = Set(section.starts_at);
        item.ends_at = Set(section.ends_at);
        item.part_id = Set(part.id);
        let item = item.insert(&ctx.db).await?;

        return Ok(item);
    }

    let item = SectionsNS::Entity::find_by_id(section.id)
        .one(&ctx.db)
        .await?;
    Ok(item.unwrap())
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Display {
    pub part: Model,
    pub sections: Vec<SectionDisplay>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SectionDisplay {
    pub section: SectionsNS::Model,
    pub words: Vec<WordsNS::Model>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UiUpdateParams {
    pub part: UiUpdateParamsPart,
    pub sections: Vec<UiUpdateParamsSection>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UiUpdateParamsPart {
    pub id: i32,
    pub text: String,
    pub starts_at: f64,
    pub ends_at: f64,
    pub episode_speaker_id: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UiUpdateParamsSection {
    pub section: UiUpdateParamsSectionSection,
    pub words: Vec<UiUpdateParamsSectionWord>,
    pub move_section: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UiUpdateParamsSectionSection {
    pub id: i32,
    pub text: String,
    pub starts_at: f64,
    pub ends_at: f64,
    pub words_per_second: f64,
    pub corrected: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UiUpdateParamsSectionWord {
    pub id: i32,
    pub text: String,
    pub overwrite: String,
    pub starts_at: f64,
    pub ends_at: f64,
    pub probability: f64,
    pub hidden: bool,
}
