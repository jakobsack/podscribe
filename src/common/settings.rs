use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};

// put this in src/common/settings.rs
#[derive(Serialize, Deserialize, Default, Debug)]
pub struct Settings {
    pub from_address: Option<String>,
    pub website_url: Option<String>,
}

impl Settings {
    pub fn from_json(value: &serde_json::Value) -> Result<Self> {
        Ok(serde_json::from_value(value.clone())?)
    }
}
