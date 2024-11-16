use sea_orm::entity::prelude::*;
use super::_entities::sections::{ActiveModel, Entity};
pub type Sections = Entity;

impl ActiveModelBehavior for ActiveModel {
    // extend activemodel below (keep comment for generators)
}
