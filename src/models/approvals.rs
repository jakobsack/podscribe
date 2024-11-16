use sea_orm::entity::prelude::*;
use super::_entities::approvals::{ActiveModel, Entity};
pub type Approvals = Entity;

impl ActiveModelBehavior for ActiveModel {
    // extend activemodel below (keep comment for generators)
}
