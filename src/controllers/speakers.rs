#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use axum::debug_handler;
use loco_rs::controller::middleware;
use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};

use crate::{
    common::check_auth,
    models::_entities::speakers::{ActiveModel, Entity, Model},
};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Params {
    pub name: String,
    pub description: Option<String>,
}

impl Params {
    fn update(&self, item: &mut ActiveModel) {
        item.name = Set(self.name.clone());
        item.description = Set(self.description.clone());
    }
}

async fn load_item(ctx: &AppContext, id: i32) -> Result<Model> {
    let item = Entity::find_by_id(id).one(&ctx.db).await?;
    item.ok_or_else(|| Error::NotFound)
}

#[debug_handler]
pub async fn list(
    auth: middleware::auth::JWTWithUser<crate::models::users::Model>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    check_auth::check_reader(&auth.user)?;
    format::json(Entity::find().all(&ctx.db).await?)
}

#[debug_handler]
pub async fn add(
    auth: middleware::auth::JWTWithUser<crate::models::users::Model>,
    State(ctx): State<AppContext>,
    Json(params): Json<Params>,
) -> Result<Response> {
    check_auth::check_contributor(&auth.user)?;
    let mut item = ActiveModel {
        ..Default::default()
    };
    params.update(&mut item);
    let item = item.insert(&ctx.db).await?;
    format::json(item)
}

#[debug_handler]
pub async fn update(
    auth: middleware::auth::JWTWithUser<crate::models::users::Model>,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
    Json(params): Json<Params>,
) -> Result<Response> {
    check_auth::check_contributor(&auth.user)?;
    let item = load_item(&ctx, id).await?;
    let mut item = item.into_active_model();
    params.update(&mut item);
    let item = item.update(&ctx.db).await?;
    format::json(item)
}

#[debug_handler]
pub async fn remove(
    auth: middleware::auth::JWTWithUser<crate::models::users::Model>,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    check_auth::check_admin(&auth.user)?;
    load_item(&ctx, id).await?.delete(&ctx.db).await?;
    format::empty()
}

#[debug_handler]
pub async fn get_one(
    auth: middleware::auth::JWTWithUser<crate::models::users::Model>,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    check_auth::check_reader(&auth.user)?;
    format::json(load_item(&ctx, id).await?)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/speakers/")
        .add("/", get(list))
        .add("/", post(add))
        .add("{id}", get(get_one))
        .add("{id}", delete(remove))
        .add("{id}", put(update))
        .add("{id}", patch(update))
}
