use loco_rs::schema::table_auto_tz;
use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                table_auto_tz(EpisodeSpeakers::Table)
                    .col(pk_auto(EpisodeSpeakers::Id))
                    .col(integer(EpisodeSpeakers::EpisodeId))
                    .col(integer(EpisodeSpeakers::SpeakerId))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-episode_speakers-episodes")
                            .from(EpisodeSpeakers::Table, EpisodeSpeakers::EpisodeId)
                            .to(Episodes::Table, Episodes::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-episode_speakers-speakers")
                            .from(EpisodeSpeakers::Table, EpisodeSpeakers::SpeakerId)
                            .to(Speakers::Table, Speakers::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(EpisodeSpeakers::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum EpisodeSpeakers {
    Table,
    Id,
    EpisodeId,
    SpeakerId,
    
}


#[derive(DeriveIden)]
enum Episodes {
    Table,
    Id,
}
#[derive(DeriveIden)]
enum Speakers {
    Table,
    Id,
}
