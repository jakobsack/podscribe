use loco_rs::schema::table_auto_tz;
use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                table_auto_tz(Episodes::Table)
                    .col(pk_auto(Episodes::Id))
                    .col(string(Episodes::Name))
                    .col(string(Episodes::Link))
                    .col(text(Episodes::Description))
                    .col(boolean(Episodes::HasAudioFile))
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Episodes::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Episodes {
    Table,
    Id,
    Name,
    Link,
    Description,
    HasAudioFile,
}
