use std::path::Path;

use freerun_desktop::{asset_path_for_url, build_upstream_url, mime_for_path};

#[test]
fn maps_root_and_spa_routes_to_index_html() {
    assert_eq!(
        asset_path_for_url("/").as_deref(),
        Some(Path::new("index.html"))
    );
    assert_eq!(
        asset_path_for_url("/club?tab=myTask").as_deref(),
        Some(Path::new("index.html"))
    );
}

#[test]
fn rejects_path_traversal_in_static_routes() {
    assert!(asset_path_for_url("/../README.md").is_none());
    assert!(asset_path_for_url("/assets/%2e%2e/secret.txt").is_none());
}

#[test]
fn maps_assets_and_mime_types() {
    assert_eq!(
        asset_path_for_url("/assets/js/index.js").as_deref(),
        Some(Path::new("assets/js/index.js"))
    );
    assert_eq!(
        mime_for_path(Path::new("assets/js/index.js")),
        "text/javascript; charset=utf-8"
    );
    assert_eq!(
        mime_for_path(Path::new("assets/css/index.css")),
        "text/css; charset=utf-8"
    );
}

#[test]
fn builds_devproxy_upstream_url() {
    assert_eq!(
        build_upstream_url("/devproxy/auth/login/password", ""),
        "https://run-lb.tanmasports.com/v1/auth/login/password"
    );
    assert_eq!(
        build_upstream_url("/devproxy/clubactivity/list", "page=1"),
        "https://run-lb.tanmasports.com/v1/clubactivity/list?page=1"
    );
}
