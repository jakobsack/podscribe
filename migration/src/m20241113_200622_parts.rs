use loco_rs::schema::table_auto_tz;
use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                table_auto_tz(Parts::Table)
                    .col(pk_auto(Parts::Id))
                    .col(integer(Parts::EpisodeId))
                    .col(integer(Parts::EpisodeSpeakerId))
                    .col(text(Parts::Text))
                    .col(double(Parts::StartsAt))
                    .col(double(Parts::EndsAt))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-parts-episodes")
                            .from(Parts::Table, Parts::EpisodeId)
                            .to(Episodes::Table, Episodes::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-parts-episode_speakers")
                            .from(Parts::Table, Parts::EpisodeSpeakerId)
                            .to(EpisodeSpeakers::Table, EpisodeSpeakers::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Parts::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Parts {
    Table,
    Id,
    EpisodeId,
    EpisodeSpeakerId,
    Text,
    StartsAt,
    EndsAt,
    
}


#[derive(DeriveIden)]
enum Episodes {
    Table,
    Id,
}
#[derive(DeriveIden)]
enum EpisodeSpeakers {
    Table,
    Id,
}
