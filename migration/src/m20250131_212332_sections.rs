use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(
            m,
            "sections",
            &[
                ("text", ColType::Text),
                ("starts_at", ColType::Double),
                ("ends_at", ColType::Double),
                ("words_per_second", ColType::Double),
            ],
            &[("part", "")],
        )
        .await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "sections").await
    }
}
