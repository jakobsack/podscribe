use loco_rs::schema::table_auto_tz;
use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                table_auto_tz(Speakers::Table)
                    .col(pk_auto(Speakers::Id))
                    .col(string(Speakers::Name))
                    .col(text_null(Speakers::Description))
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Speakers::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Speakers {
    Table,
    Id,
    Name,
    Description,
    
}


