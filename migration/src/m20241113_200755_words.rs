use loco_rs::schema::table_auto_tz;
use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                table_auto_tz(Words::Table)
                    .col(pk_auto(Words::Id))
                    .col(integer(Words::SectionId))
                    .col(string(Words::Text))
                    .col(double(Words::StartsAt))
                    .col(double(Words::EndsAt))
                    .col(double(Words::Probability))
                    .col(boolean(Words::Hidden))
                    .col(boolean(Words::Manual))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-words-sections")
                            .from(Words::Table, Words::SectionId)
                            .to(Sections::Table, Sections::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Words::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Words {
    Table,
    Id,
    SectionId,
    Text,
    StartsAt,
    EndsAt,
    Probability,
    Hidden,
    Manual,
}

#[derive(DeriveIden)]
enum Sections {
    Table,
    Id,
}
