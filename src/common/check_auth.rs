use loco_rs::auth::jwt::UserClaims;
use loco_rs::prelude::*;

use crate::common::claims::Claims;

pub fn check_admin(auth: UserClaims) -> Result<()> {
    let claims = Claims::from_jwt(auth)?;
    if claims.role < 3 {
        return Err(Error::Unauthorized("Unauthorized".into()));
    }
    Ok(())
}

pub fn check_contributor(auth: UserClaims) -> Result<()> {
    let claims = Claims::from_jwt(auth)?;
    if claims.role < 2 {
        return Err(Error::Unauthorized("Unauthorized".into()));
    }
    Ok(())
}

pub fn check_reader(auth: UserClaims) -> Result<()> {
    let claims = Claims::from_jwt(auth)?;
    if claims.role < 1 {
        return Err(Error::Unauthorized("Unauthorized".into()));
    }
    Ok(())
}
