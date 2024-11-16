use sea_orm::entity::prelude::*;
use super::_entities::episode_speakers::{ActiveModel, Entity};
pub type EpisodeSpeakers = Entity;

impl ActiveModelBehavior for ActiveModel {
    // extend activemodel below (keep comment for generators)
}
