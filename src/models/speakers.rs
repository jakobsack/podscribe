use sea_orm::entity::prelude::*;
use super::_entities::speakers::{ActiveModel, Entity};
pub type Speakers = Entity;

impl ActiveModelBehavior for ActiveModel {
    // extend activemodel below (keep comment for generators)
}
