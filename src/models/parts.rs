use sea_orm::entity::prelude::*;
use super::_entities::parts::{ActiveModel, Entity};
pub type Parts = Entity;

impl ActiveModelBehavior for ActiveModel {
    // extend activemodel below (keep comment for generators)
}
