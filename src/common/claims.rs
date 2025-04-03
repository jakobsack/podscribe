use loco_rs::{auth::jwt::UserClaims, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Deserialize, Debug, Serialize)]
pub struct Claims {
    pub role: i32,
}

impl Claims {
    pub fn from_value(value: Value) -> Result<Self> {
        Ok(serde_json::from_value(value)?)
    }

    pub fn from_jwt(value: UserClaims) -> Result<Self> {
        let claims = match value.claims {
            Some(c) => c,
            None => return Err(loco_rs::Error::Unauthorized("Foo".into())),
        };

        Ok(serde_json::from_value(claims)?)
    }
}
