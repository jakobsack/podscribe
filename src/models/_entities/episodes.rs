//! `SeaORM` Entity, @generated by sea-orm-codegen 1.1.4

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "episodes")]
pub struct Model {
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
    #[sea_orm(primary_key)]
    pub id: i32,
    pub title: String,
    pub link: String,
    #[sea_orm(column_type = "Text")]
    pub description: String,
    pub filename: String,
    pub has_audio_file: bool,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::episode_speakers::Entity")]
    EpisodeSpeakers,
    #[sea_orm(has_many = "super::parts::Entity")]
    Parts,
}

impl Related<super::episode_speakers::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::EpisodeSpeakers.def()
    }
}

impl Related<super::parts::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Parts.def()
    }
}
