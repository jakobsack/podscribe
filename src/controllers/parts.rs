#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use axum::debug_handler;
use loco_rs::prelude::*;
use sea_orm::{QueryOrder, QuerySelect};
use serde::{Deserialize, Serialize};

use crate::models::_entities::parts::{ActiveModel, Column, Entity, Model};
use crate::models::_entities::sections as SectionsNS;
use crate::models::_entities::words as WordsNS;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Params {
    pub text: String,
    pub starts_at: f64,
    pub ends_at: f64,
    pub episode_speaker_id: i32,
}

impl Params {
    fn update(&self, item: &mut ActiveModel) {
        item.text = Set(self.text.clone());
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
pub async fn list(State(ctx): State<AppContext>, Path(episode_id): Path<i32>) -> Result<Response> {
    format::json(
        Entity::find()
            .filter(Column::EpisodeId.eq(episode_id))
            .all(&ctx.db)
            .await?,
    )
}

#[debug_handler]
pub async fn add(
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
    format::json(item)
}

#[debug_handler]
pub async fn update(
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
    Path((_episode_id, id)): Path<(i32, i32)>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    load_item(&ctx, id).await?.delete(&ctx.db).await?;
    format::empty()
}

#[debug_handler]
pub async fn get_one(
    Path((_episode_id, id)): Path<(i32, i32)>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    format::json(load_item(&ctx, id).await?)
}

#[debug_handler]
pub async fn get_display(
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
    Path((episode_id, id)): Path<(i32, i32)>,
    State(ctx): State<AppContext>,
    Json(params): Json<UiUpdateParams>,
) -> Result<Response> {
    // First make the function word. Do not yet optimize.
    let original_part = load_item(&ctx, id).await?;

    // First we work on sections that move
    for ui_section in params.sections.iter().filter(|x| x.move_section.is_some()) {
        let target_part = match ui_section.move_section.as_deref() {
            Some("up") => find_previous_part(&original_part, &ctx).await?,
            Some("upnew") => create_part(&original_part, &ctx).await?,
            Some("downnew") => create_part(&original_part, &ctx).await?,
            Some("down") => find_next_part(&original_part, &ctx).await?,
            _ => panic!("Unexpected data"),
        };

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
        section.part_id = Set(target_part.id);
        section.text = Set(text.join(" "));
        section.starts_at = Set(ui_section.words[0].starts_at);
        section.ends_at = Set(ui_section.words[ui_section.words.len() - 1].ends_at);
        section.save(&ctx.db).await?;

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

        // Update part
        // Save time
        // Save text
        // Change to ActiveModel
        // Update times
        // Update text
        // Save part
    }

    for ui_section in params.sections.iter().filter(|x| x.move_section.is_none()) {
        let section = find_or_create_section(&ui_section.section, &original_part, &ctx).await?;
        // set text
        // set times
        // save section

        // Update words

        // Update part
        // Save time
        // Save text
        // Change to ActiveModel
        // Update times
        // Update text
    }

    // Save part

    format::empty()
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/episodes/:episode_id/parts/")
        .add("/", get(list))
        .add("/", post(add))
        .add(":id", get(get_one))
        .add(":id/display", get(get_display))
        .add(":id/update", post(ui_update))
        .add(":id", delete(remove))
        .add(":id", put(update))
        .add(":id", patch(update))
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
