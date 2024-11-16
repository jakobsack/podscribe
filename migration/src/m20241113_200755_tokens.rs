use loco_rs::schema::table_auto_tz;
use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                table_auto_tz(Tokens::Table)
                    .col(pk_auto(Tokens::Id))
                    .col(integer(Tokens::SectionId))
                    .col(string(Tokens::Text))
                    .col(double(Tokens::StartsAt))
                    .col(double(Tokens::EndsAt))
                    .col(double(Tokens::Probability))
                    .col(boolean(Tokens::Hidden))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-tokens-sections")
                            .from(Tokens::Table, Tokens::SectionId)
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
            .drop_table(Table::drop().table(Tokens::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Tokens {
    Table,
    Id,
    SectionId,
    Text,
    StartsAt,
    EndsAt,
    Probability,
    Hidden,
    
}


#[derive(DeriveIden)]
enum Sections {
    Table,
    Id,
}
