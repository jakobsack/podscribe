use loco_rs::schema::table_auto_tz;
use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                table_auto_tz(Sections::Table)
                    .col(pk_auto(Sections::Id))
                    .col(integer(Sections::PartId))
                    .col(text(Sections::Text))
                    .col(double(Sections::StartsAt))
                    .col(double(Sections::EndsAt))
                    .col(double(Sections::WordsPerSecond))
                    .col(boolean(Sections::Corrected))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-sections-parts")
                            .from(Sections::Table, Sections::PartId)
                            .to(Parts::Table, Parts::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Sections::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Sections {
    Table,
    Id,
    PartId,
    Text,
    StartsAt,
    EndsAt,
    WordsPerSecond,
    Corrected,
    
}


#[derive(DeriveIden)]
enum Parts {
    Table,
    Id,
}
