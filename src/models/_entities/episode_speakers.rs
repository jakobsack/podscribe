//! `SeaORM` Entity, @generated by sea-orm-codegen 1.1.4

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "episode_speakers")]
pub struct Model {
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
    #[sea_orm(primary_key)]
    pub id: i32,
    pub episode_id: i32,
    pub speaker_id: i32,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::episodes::Entity",
        from = "Column::EpisodeId",
        to = "super::episodes::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Episodes,
    #[sea_orm(has_many = "super::parts::Entity")]
    Parts,
    #[sea_orm(
        belongs_to = "super::speakers::Entity",
        from = "Column::SpeakerId",
        to = "super::speakers::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Speakers,
}

impl Related<super::episodes::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Episodes.def()
    }
}

impl Related<super::parts::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Parts.def()
    }
}

impl Related<super::speakers::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Speakers.def()
    }
}
