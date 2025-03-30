#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use axum::debug_handler;
use loco_rs::controller::middleware;
use loco_rs::prelude::*;
use sea_orm::QueryOrder;
use serde::{Deserialize, Serialize};

use crate::common::check_auth::check_admin;
use crate::models::_entities::parts as PartsNS;
use crate::models::_entities::sentences as SentencesNS;
use crate::models::_entities::words::{ActiveModel, Column, Entity, Model};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Params {
    pub text: String,
    pub overwrite: String,
    pub starts_at: f64,
    pub ends_at: f64,
    pub probability: f64,
    pub hidden: bool,
}

impl Params {
    fn update(&self, item: &mut ActiveModel) {
        item.text = Set(self.text.clone());
        item.overwrite = Set(self.overwrite.clone());
        item.starts_at = Set(self.starts_at.clone());
        item.ends_at = Set(self.ends_at.clone());
        item.probability = Set(self.probability.clone());
        item.hidden = Set(self.hidden.clone());
    }
}

async fn load_item(ctx: &AppContext, id: i32) -> Result<Model> {
    let item = Entity::find_by_id(id).one(&ctx.db).await?;
    item.ok_or_else(|| Error::NotFound)
}

#[debug_handler]
pub async fn list(
    auth: middleware::auth::JWTWithUser<crate::models::users::Model>,
    Path((_episode_id, _part_id, sentence_id)): Path<(i32, i32, i32)>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    check_admin(&auth.user)?;
    format::json(
        Entity::find()
            .filter(Column::SentenceId.eq(sentence_id))
            .all(&ctx.db)
            .await?,
    )
}

#[debug_handler]
pub async fn add(
    auth: middleware::auth::JWTWithUser<crate::models::users::Model>,
    Path((_episode_id, part_id, sentence_id)): Path<(i32, i32, i32)>,
    State(ctx): State<AppContext>,
    Json(params): Json<Params>,
) -> Result<Response> {
    check_admin(&auth.user)?;
    let mut item = ActiveModel {
        ..Default::default()
    };
    params.update(&mut item);
    item.sentence_id = Set(sentence_id);
    let item = item.insert(&ctx.db).await?;

    update_sentence_and_part(&ctx, part_id, sentence_id).await?;

    format::json(item)
}

#[debug_handler]
pub async fn update(
    auth: middleware::auth::JWTWithUser<crate::models::users::Model>,
    Path((_episode_id, part_id, sentence_id, id)): Path<(i32, i32, i32, i32)>,
    State(ctx): State<AppContext>,
    Json(params): Json<Params>,
) -> Result<Response> {
    check_admin(&auth.user)?;
    let item = load_item(&ctx, id).await?;
    if item.sentence_id != sentence_id {
        return Err(Error::NotFound);
    }
    let mut item = item.into_active_model();
    params.update(&mut item);
    let item = item.update(&ctx.db).await?;

    update_sentence_and_part(&ctx, part_id, sentence_id).await?;

    format::json(item)
}

#[debug_handler]
pub async fn remove(
    auth: middleware::auth::JWTWithUser<crate::models::users::Model>,
    Path((_episode_id, _part_id, _sentence_id, id)): Path<(i32, i32, i32, i32)>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    check_admin(&auth.user)?;
    load_item(&ctx, id).await?.delete(&ctx.db).await?;
    format::empty()
}

#[debug_handler]
pub async fn get_one(
    auth: middleware::auth::JWTWithUser<crate::models::users::Model>,
    Path((_episode_id, _part_id, _sentence_id, id)): Path<(i32, i32, i32, i32)>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    check_admin(&auth.user)?;
    format::json(load_item(&ctx, id).await?)
}

// TODO: Move into model?
async fn update_sentence_and_part(ctx: &AppContext, part_id: i32, sentence_id: i32) -> Result<()> {
    let sentence = SentencesNS::Entity::find_by_id(sentence_id)
        .one(&ctx.db)
        .await?
        .unwrap();

    let words = Entity::find()
        .filter(Column::SentenceId.eq(sentence_id))
        .order_by_asc(Column::StartsAt)
        .all(&ctx.db)
        .await?;

    let text = words
        .iter()
        .filter(|x| !x.hidden)
        .map(|x| {
            if !x.overwrite.is_empty() {
                x.overwrite.clone()
            } else {
                x.text.clone()
            }
        })
        .collect::<Vec<String>>()
        .join(" ");
    let mut active_sentence = sentence.into_active_model();
    active_sentence.text = Set(text);
    active_sentence.save(&ctx.db).await?;

    let part = PartsNS::Entity::find_by_id(part_id)
        .one(&ctx.db)
        .await?
        .unwrap();

    let sentences = SentencesNS::Entity::find()
        .filter(SentencesNS::Column::PartId.eq(part_id))
        .order_by_asc(SentencesNS::Column::StartsAt)
        .all(&ctx.db)
        .await?;

    // Now update the sentence text and then the
    let text = sentences
        .iter()
        .map(|x| x.text.clone())
        .collect::<Vec<String>>()
        .join(" ");
    let mut active_part = part.into_active_model();
    active_part.text = Set(text);
    active_part.save(&ctx.db).await?;

    Ok(())
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/episodes/{episode_id}/parts/{part_id}/sentences/{sentence_id}/words/")
        .add("/", get(list))
        .add("/", post(add))
        .add("{id}", get(get_one))
        .add("{id}", delete(remove))
        .add("{id}", put(update))
        .add("{id}", patch(update))
}
