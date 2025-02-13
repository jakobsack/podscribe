#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use axum::{
    debug_handler,
    http::{header, StatusCode, Uri},
    response::Html,
};
use loco_rs::prelude::*;
use rust_embed::Embed;

static INDEX_HTML: &str = "index.html";

#[debug_handler]
async fn static_handler(State(_ctx): State<AppContext>, uri: Uri) -> impl IntoResponse {
    let path = uri.path().trim_start_matches('/');

    if path.is_empty() || path == INDEX_HTML {
        return index_html().await;
    }

    match Assets::get(path) {
        Some(content) => {
            let mime = mime_guess::from_path(path).first_or_octet_stream();

            ([(header::CONTENT_TYPE, mime.as_ref())], content.data).into_response()
        }
        None => {
            if path.contains('.') {
                return not_found().await;
            }

            index_html().await
        }
    }
}

async fn index_html() -> Response {
    match Assets::get(INDEX_HTML) {
        Some(content) => Html(content.data).into_response(),
        None => not_found().await,
    }
}

async fn not_found() -> Response {
    (StatusCode::NOT_FOUND, "404").into_response()
}

pub fn routes() -> Routes {
    Routes::new()
        .add("/", get(static_handler))
        .add("{*file}", get(static_handler))
}

#[derive(Embed)]
#[folder = "frontend/dist/"]
struct Assets;
