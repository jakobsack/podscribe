#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use axum::debug_handler;
use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};

use crate::models::_entities::episode_speakers as EpisodeSpeakersNS;
use crate::models::_entities::episodes::{ActiveModel, Entity, Model};
use crate::models::_entities::parts as PartsNS;
use crate::models::_entities::speakers as SpeakersNS;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Params {
    pub name: String,
    pub link: String,
    pub description: String,
}

impl Params {
    fn update(&self, item: &mut ActiveModel) {
        item.name = Set(self.name.clone());
        item.link = Set(self.link.clone());
        item.description = Set(self.description.clone());
    }
}

async fn load_item(ctx: &AppContext, id: i32) -> Result<Model> {
    let item = Entity::find_by_id(id).one(&ctx.db).await?;
    item.ok_or_else(|| Error::NotFound)
}

#[debug_handler]
pub async fn list(State(ctx): State<AppContext>) -> Result<Response> {
    format::json(Entity::find().all(&ctx.db).await?)
}

#[debug_handler]
pub async fn add(State(ctx): State<AppContext>, Json(params): Json<Params>) -> Result<Response> {
    let mut item = ActiveModel {
        ..Default::default()
    };
    params.update(&mut item);
    let item = item.insert(&ctx.db).await?;
    format::json(item)
}

#[debug_handler]
pub async fn update(
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
    Json(params): Json<Params>,
) -> Result<Response> {
    let item = load_item(&ctx, id).await?;
    let mut item = item.into_active_model();
    params.update(&mut item);
    let item = item.update(&ctx.db).await?;
    format::json(item)
}

#[debug_handler]
pub async fn remove(Path(id): Path<i32>, State(ctx): State<AppContext>) -> Result<Response> {
    load_item(&ctx, id).await?.delete(&ctx.db).await?;
    format::empty()
}

#[debug_handler]
pub async fn get_one(Path(id): Path<i32>, State(ctx): State<AppContext>) -> Result<Response> {
    format::json(load_item(&ctx, id).await?)
}

#[debug_handler]
pub async fn get_display(Path(id): Path<i32>, State(ctx): State<AppContext>) -> Result<Response> {
    let episode = load_item(&ctx, id).await?;
    let parts = PartsNS::Entity::find()
        .filter(PartsNS::Column::EpisodeId.eq(id))
        .all(&ctx.db)
        .await?;

    let episode_speakers = EpisodeSpeakersNS::Entity::find()
        .filter(EpisodeSpeakersNS::Column::EpisodeId.eq(id))
        .all(&ctx.db)
        .await?;

    let speaker_ids: Vec<i32> = episode_speakers.iter().map(|f| f.speaker_id).collect();

    let speakers = SpeakersNS::Entity::find()
        .filter(SpeakersNS::Column::Id.is_in(speaker_ids))
        .all(&ctx.db)
        .await?;

    let output = Display {
        episode,
        parts,
        episode_speakers,
        speakers,
    };

    format::json(output)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/episodes/")
        .add("/", get(list))
        .add("/", post(add))
        .add(":id", get(get_one))
        .add(":id/display", get(get_display))
        .add(":id", delete(remove))
        .add(":id", put(update))
        .add(":id", patch(update))
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Display {
    pub episode: Model,
    pub parts: Vec<PartsNS::Model>,
    pub episode_speakers: Vec<EpisodeSpeakersNS::Model>,
    pub speakers: Vec<SpeakersNS::Model>,
}
