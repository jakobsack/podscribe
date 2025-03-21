use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(
            m,
            "parts",
            &[
                ("text", ColType::Text),
                ("part_type", ColType::Integer),
                ("starts_at", ColType::Double),
                ("ends_at", ColType::Double),
            ],
            &[("episode", ""), ("episode_speaker", "")],
        )
        .await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "parts").await
    }
}
