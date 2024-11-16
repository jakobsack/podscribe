use loco_rs::schema::table_auto_tz;
use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                table_auto_tz(Approvals::Table)
                    .primary_key(
                        Index::create()
                            .name("idx-approvals-refs-pk")
                            .table(Approvals::Table)
                            .col(Approvals::SectionId)
                            .col(Approvals::UserId)
                            ,
                    )
                    .col(integer(Approvals::SectionId))
                    .col(integer(Approvals::UserId))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-approvals-sections")
                            .from(Approvals::Table, Approvals::SectionId)
                            .to(Sections::Table, Sections::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-approvals-users")
                            .from(Approvals::Table, Approvals::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Approvals::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Approvals {
    Table,
    SectionId,
    UserId,
    
}


#[derive(DeriveIden)]
enum Sections {
    Table,
    Id,
}
#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}
