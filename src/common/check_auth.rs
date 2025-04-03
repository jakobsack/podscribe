use crate::models::users::Model;
use loco_rs::prelude::*;

pub fn check_admin(user: &Model) -> Result<()> {
    if user.role >= 3 {
        return Ok(());
    }
    Err(Error::Unauthorized("Unauthorized".into()))
}

pub fn check_contributor(user: &Model) -> Result<()> {
    if user.role >= 2 {
        return Ok(());
    }
    Err(Error::Unauthorized("Unauthorized".into()))
}

pub fn check_reader(user: &Model) -> Result<()> {
    if user.role >= 1 {
        return Ok(());
    }
    Err(Error::Unauthorized("Unauthorized".into()))
}
