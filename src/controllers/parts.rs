#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use axum::debug_handler;
use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};

use crate::models::_entities::parts::{ActiveModel, Column, Entity, Model};

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

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/episodes/:episode_id/parts/")
        .add("/", get(list))
        .add("/", post(add))
        .add(":id", get(get_one))
        .add(":id", delete(remove))
        .add(":id", put(update))
        .add(":id", patch(update))
}
