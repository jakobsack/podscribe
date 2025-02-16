#![allow(elided_lifetimes_in_paths)]
#![allow(clippy::wildcard_imports)]
pub use sea_orm_migration::prelude::*;
mod m20220101_000001_users;

mod m20250131_212153_episodes;
mod m20250131_212218_speakers;
mod m20250131_212242_episode_speakers;
mod m20250131_212307_parts;
mod m20250131_212332_sentences;
mod m20250131_212358_words;
mod m20250131_212844_approvals;
pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220101_000001_users::Migration),
            Box::new(m20250131_212153_episodes::Migration),
            Box::new(m20250131_212218_speakers::Migration),
            Box::new(m20250131_212242_episode_speakers::Migration),
            Box::new(m20250131_212307_parts::Migration),
            Box::new(m20250131_212332_sentences::Migration),
            Box::new(m20250131_212358_words::Migration),
            Box::new(m20250131_212844_approvals::Migration),
            // inject-above (do not remove this comment)
        ]
    }
}
