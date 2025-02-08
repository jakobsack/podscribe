use std::fs;
use std::sync::{Arc, RwLock};

use async_trait::async_trait;
use axum::{Extension, Router as AxumRouter};
use loco_rs::prelude::*;
use tantivy::{doc, Index, IndexWriter, ReloadPolicy};
use tantivy::{schema::*, IndexReader};

pub struct TantivySearchInitializer;

#[async_trait]
impl Initializer for TantivySearchInitializer {
    fn name(&self) -> String {
        "tantivy_search".to_string()
    }

    async fn after_routes(&self, router: AxumRouter, ctx: &AppContext) -> Result<AxumRouter> {
        let tantivy_search_config = ctx
            .config
            .initializers
            .clone()
            .ok_or_else(|| Error::Message("initializers config not configured".to_string()))?;

        let tantivy_search_value =
            tantivy_search_config.get("tantivy_search").ok_or_else(|| {
                Error::Message("tantivy search not configured as initializer".to_string())
            })?;

        let tantivy_search: TantivySearchConfig =
            serde_json::from_value(tantivy_search_value.clone())
                .map_err(|e| Error::Message(e.to_string()))?;

        let index_path = &tantivy_search.index_path;
        fs::create_dir_all(index_path)?;

        let mut schema_builder = Schema::builder();
        schema_builder.add_text_field("id", STRING | STORED);
        schema_builder.add_text_field("text", TEXT);

        let schema = schema_builder.build();
        let dir = tantivy::directory::MmapDirectory::open(&index_path)
            .map_err(|e| Error::Message(e.to_string()))?;
        let index = Index::open_or_create(dir, schema.clone())
            .map_err(|e| Error::Message(e.to_string()))?;

        let reader = index
            .reader_builder()
            .reload_policy(ReloadPolicy::OnCommitWithDelay)
            .try_into()
            .map_err(|e| Error::Message(e.to_string()))?;

        let writer: Arc<RwLock<IndexWriter>> = Arc::new(RwLock::new(
            index
                .writer(50_000_000)
                .map_err(|e| Error::Message(e.to_string()))?,
        ));

        let tantivy_container = TantivyContainer {
            schema,
            index,
            reader,
            writer,
        };

        Ok(router.layer(Extension(tantivy_container)))
    }
}

#[derive(Debug, Clone, serde::Deserialize)]
struct TantivySearchConfig {
    index_path: String,
}

#[derive(Clone)]
pub struct TantivyContainer {
    pub schema: Schema,
    pub index: Index,
    pub reader: IndexReader,
    pub writer: Arc<RwLock<IndexWriter>>,
}
