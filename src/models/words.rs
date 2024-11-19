use super::_entities::words::{ActiveModel, Entity};
use sea_orm::entity::prelude::*;
pub type Words = Entity;

impl ActiveModelBehavior for ActiveModel {
    // extend activemodel below (keep comment for generators)
}
