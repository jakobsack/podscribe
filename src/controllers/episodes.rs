#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use axum::debug_handler;
use loco_rs::controller::middleware;
use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::models::_entities::episode_speakers as EpisodeSpeakersNS;
use crate::models::_entities::episodes::{ActiveModel, Entity, Model};
use crate::models::_entities::parts as PartsNS;
use crate::models::_entities::sections as SectionsNS;
use crate::models::_entities::speakers as SpeakersNS;
use crate::models::_entities::words as WordsNS;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Params {
    pub title: String,
    pub link: String,
    pub description: String,
    pub has_audio_file: bool,
}

impl Params {
    fn update(&self, item: &mut ActiveModel) {
        item.title = Set(self.title.clone());
        item.link = Set(self.link.clone());
        item.description = Set(self.description.clone());
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
    _auth: middleware::auth::JWT,
    State(ctx): State<AppContext>,
    Json(params): Json<Params>,
) -> Result<Response> {
    let mut item = ActiveModel {
        ..Default::default()
    };
    params.update(&mut item);
    let item = item.insert(&ctx.db).await?;
    format::json(item)
}

#[debug_handler]
pub async fn update(
    _auth: middleware::auth::JWT,
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
pub async fn remove(
    _auth: middleware::auth::JWT,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    load_item(&ctx, id).await?.delete(&ctx.db).await?;
    format::empty()
}

#[debug_handler]
pub async fn get_one(
    _auth: middleware::auth::JWT,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    format::json(load_item(&ctx, id).await?)
}

#[debug_handler]
pub async fn get_display(
    _auth: middleware::auth::JWT,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let episode = load_item(&ctx, id).await?;
    let parts = PartsNS::Entity::find()
        .filter(PartsNS::Column::EpisodeId.eq(id))
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
    };

    format::json(output)
}

#[debug_handler]
pub async fn attach_audio(
    _auth: middleware::auth::JWT,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
    content: axum::body::Bytes,
) -> Result<Response> {
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

// TODO: auth in get. Maybe use query param?
#[debug_handler]
pub async fn get_audio(
    // _auth: middleware::auth::JWT,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let item = load_item(&ctx, id).await?;
    if !item.has_audio_file {
        return Err(Error::BadRequest("Episode has no audio file".into()));
    }

    let path = std::path::PathBuf::from("episodes").join(format!("{}.mp3", id));
    let content: Vec<u8> = ctx.storage.download(&path.as_path()).await?;
    Ok(axum::body::Bytes::from(content).into_response())
}

#[debug_handler]
pub async fn import(
    _auth: middleware::auth::JWT,
    Path(id): Path<i32>,
    State(ctx): State<AppContext>,
    Json(transcription): Json<ImportTranscription>,
) -> Result<Response> {
    // Bad request if anything already exists
    let existing_parts = PartsNS::Entity::find()
        .filter(PartsNS::Column::EpisodeId.eq(id))
        .all(&ctx.db)
        .await?;
    if existing_parts.len() != 0 {
        return Err(Error::BadRequest(String::from(
            "Import only works for b lank episodes",
        )));
    }

    // Bad request if anything already exists
    let existing_speakers = EpisodeSpeakersNS::Entity::find()
        .filter(EpisodeSpeakersNS::Column::EpisodeId.eq(id))
        .all(&ctx.db)
        .await?;
    if existing_speakers.len() != 0 {
        return Err(Error::BadRequest(String::from(
            "Import only works for b lank episodes",
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

    // Now got for the parts
    for import_part in transcription.transcription {
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

        for import_section in import_part.sections {
            let mut item = SectionsNS::ActiveModel {
                ..Default::default()
            };
            item.part_id = Set(part.id);
            item.text = Set(import_section.text.clone());
            item.starts_at = Set(import_section.start);
            item.ends_at = Set(import_section.end);
            item.words_per_second = Set(import_section.words_per_second);
            let section = item.insert(&ctx.db).await?;

            let words = import_section
                .words
                .iter()
                .map(|x| {
                    let mut item = WordsNS::ActiveModel {
                        ..Default::default()
                    };

                    item.section_id = Set(section.id);
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

    format::empty()
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/episodes/")
        .add("/", get(list))
        .add("/", post(add))
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
    pub sections: Vec<ImportSection>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ImportSection {
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
