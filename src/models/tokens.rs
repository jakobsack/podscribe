use sea_orm::entity::prelude::*;
use super::_entities::tokens::{ActiveModel, Entity};
pub type Tokens = Entity;

impl ActiveModelBehavior for ActiveModel {
    // extend activemodel below (keep comment for generators)
}
