#![allow(elided_lifetimes_in_paths)]
#![allow(clippy::wildcard_imports)]
pub use sea_orm_migration::prelude::*;

mod m20220101_000001_users;

mod m20241113_200410_episodes;
mod m20241113_200452_speakers;
mod m20241113_200537_episode_speakers;
mod m20241113_200622_parts;
mod m20241113_200708_sections;
mod m20241113_200755_tokens;
mod m20241113_201125_approvals;
pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            // inject-below (do not remove this comment)
            Box::new(m20241113_201125_approvals::Migration),
            Box::new(m20241113_200755_tokens::Migration),
            Box::new(m20241113_200708_sections::Migration),
            Box::new(m20241113_200622_parts::Migration),
            Box::new(m20241113_200537_episode_speakers::Migration),
            Box::new(m20241113_200452_speakers::Migration),
            Box::new(m20241113_200410_episodes::Migration),
            Box::new(m20220101_000001_users::Migration),
            // inject-above (do not remove this comment)
        ]
    }
}