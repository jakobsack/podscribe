use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(
            m,
            "words",
            &[
                ("text", ColType::String),
                ("overwrite", ColType::String),
                ("starts_at", ColType::Double),
                ("ends_at", ColType::Double),
                ("probability", ColType::Double),
                ("hidden", ColType::Boolean),
            ],
            &[("section", "")],
        )
        .await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "words").await
    }
}
