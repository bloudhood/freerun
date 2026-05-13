use std::{
    error::Error,
    fs,
    io::Read,
    path::{Component, Path, PathBuf},
    thread,
    time::Duration,
};

use include_dir::{Dir, include_dir};
use percent_encoding::percent_decode_str;
use tiny_http::{Header, Method, Request, Response, Server, StatusCode};
use ureq::{Agent, RequestBuilder};

const UPSTREAM_BASE: &str = "https://run-lb.tanmasports.com/v1";
const _DESKTOP_ASSET_STAMP: Option<&str> = option_env!("FREERUN_DESKTOP_ASSET_STAMP");
static EMBEDDED_APP_DIST: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/../app/dist");

pub struct LocalServer {
    pub url: String,
    _thread: thread::JoinHandle<()>,
}

pub fn asset_path_for_url(url: &str) -> Option<PathBuf> {
    let path = url.split(['?', '#']).next().unwrap_or("/");
    let decoded = percent_decode_str(path).decode_utf8().ok()?;
    let relative = decoded.trim_start_matches('/');

    if relative.is_empty() || Path::new(relative).extension().is_none() {
        return Some(PathBuf::from("index.html"));
    }

    let candidate = Path::new(relative);
    if candidate
        .components()
        .any(|component| !matches!(component, Component::Normal(_) | Component::CurDir))
    {
        return None;
    }

    Some(candidate.to_path_buf())
}

pub fn mime_for_path(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_ascii_lowercase()
        .as_str()
    {
        "html" => "text/html; charset=utf-8",
        "js" => "text/javascript; charset=utf-8",
        "css" => "text/css; charset=utf-8",
        "json" => "application/json; charset=utf-8",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "ico" => "image/x-icon",
        "woff2" => "font/woff2",
        "woff" => "font/woff",
        "ttf" => "font/ttf",
        "eot" => "application/vnd.ms-fontobject",
        _ => "application/octet-stream",
    }
}

pub fn build_upstream_url(path: &str, query: &str) -> String {
    let suffix = path.strip_prefix("/devproxy").unwrap_or(path);
    let suffix = if suffix.is_empty() { "/" } else { suffix };
    let mut url = format!("{UPSTREAM_BASE}{suffix}");
    if !query.is_empty() {
        url.push('?');
        url.push_str(query);
    }
    url
}

pub fn start_local_server(
    asset_root: PathBuf,
) -> Result<LocalServer, Box<dyn Error + Send + Sync>> {
    let server = Server::http("127.0.0.1:0")?;
    let addr = server
        .server_addr()
        .to_ip()
        .ok_or("local server did not bind to an IP address")?;
    let url = format!("http://127.0.0.1:{}/", addr.port());

    let thread = thread::spawn(move || {
        let agent: Agent = Agent::config_builder()
            .http_status_as_error(false)
            .timeout_global(Some(Duration::from_secs(20)))
            .build()
            .into();

        for request in server.incoming_requests() {
            handle_request(request, &asset_root, &agent);
        }
    });

    Ok(LocalServer {
        url,
        _thread: thread,
    })
}

fn handle_request(mut request: Request, asset_root: &Path, agent: &Agent) {
    let method = request.method().clone();
    let raw_url = request.url().to_string();
    let (path, query) = split_url(&raw_url);

    let response = if method == Method::Options {
        data_response(StatusCode(204), Vec::new(), "text/plain; charset=utf-8")
    } else if path == "/devproxy/health" {
        json_response(
            StatusCode(200),
            br#"{"status":"ok","mode":"desktop"}"#.to_vec(),
        )
    } else if path.starts_with("/devproxy") {
        proxy_request(&mut request, agent, path, query)
    } else {
        static_response(asset_root, &raw_url)
    };

    let _ = request.respond(with_cors(response));
}

fn split_url(url: &str) -> (&str, &str) {
    if let Some((path, query)) = url.split_once('?') {
        return (path, query);
    }
    (url, "")
}

fn static_response(asset_root: &Path, url: &str) -> Response<std::io::Cursor<Vec<u8>>> {
    let Some(relative) = asset_path_for_url(url) else {
        return text_response(StatusCode(403), "Forbidden");
    };

    if !asset_root.as_os_str().is_empty() {
        let full_path = asset_root.join(&relative);
        if let Ok(bytes) = fs::read(&full_path) {
            return data_response(StatusCode(200), bytes, mime_for_path(&relative));
        }
    }

    let embedded_path = relative.to_string_lossy().replace('\\', "/");
    match EMBEDDED_APP_DIST.get_file(&embedded_path) {
        Some(file) => data_response(
            StatusCode(200),
            file.contents().to_vec(),
            mime_for_path(&relative),
        ),
        None if relative != Path::new("index.html") => text_response(StatusCode(404), "Not found"),
        None => text_response(StatusCode(500), "Desktop assets are missing"),
    }
}

fn proxy_request(
    request: &mut Request,
    agent: &Agent,
    path: &str,
    query: &str,
) -> Response<std::io::Cursor<Vec<u8>>> {
    let mut body = Vec::new();
    if !matches!(request.method(), Method::Get | Method::Head) {
        let _ = request.as_reader().read_to_end(&mut body);
    }

    let upstream_url = build_upstream_url(path, query);
    let result = match request.method() {
        Method::Get => apply_forward_headers(agent.get(&upstream_url), request).call(),
        Method::Head => apply_forward_headers(agent.head(&upstream_url), request).call(),
        Method::Post => {
            apply_forward_headers(agent.post(&upstream_url), request).send(body.as_slice())
        }
        Method::Put => {
            apply_forward_headers(agent.put(&upstream_url), request).send(body.as_slice())
        }
        Method::Delete => {
            if body.is_empty() {
                apply_forward_headers(agent.delete(&upstream_url), request).call()
            } else {
                apply_forward_headers(agent.delete(&upstream_url).force_send_body(), request)
                    .send(body.as_slice())
            }
        }
        _ => {
            return json_response(
                StatusCode(405),
                br#"{"error":"method is not supported"}"#.to_vec(),
            );
        }
    };

    match result {
        Ok(mut upstream) => {
            let status = StatusCode(upstream.status().as_u16());
            let content_type = upstream
                .headers()
                .get("content-type")
                .and_then(|value| value.to_str().ok())
                .unwrap_or("application/json; charset=utf-8")
                .to_string();
            match upstream.body_mut().read_to_vec() {
                Ok(bytes) => data_response(status, bytes, &content_type),
                Err(error) => json_response(
                    StatusCode(502),
                    format!(r#"{{"error":"{}"}}"#, escape_json(&error.to_string())).into_bytes(),
                ),
            }
        }
        Err(error) => json_response(
            StatusCode(502),
            format!(r#"{{"error":"{}"}}"#, escape_json(&error.to_string())).into_bytes(),
        ),
    }
}

fn apply_forward_headers<B>(
    mut builder: RequestBuilder<B>,
    request: &Request,
) -> RequestBuilder<B> {
    builder = builder
        .header("User-Agent", "okhttp/3.12.1")
        .header("Accept", "application/json");

    for header in request.headers() {
        let name = header.field.as_str().as_str();
        if should_forward_header(name) {
            builder = builder.header(name, header.value.as_str());
        }
    }

    builder
}

fn should_forward_header(name: &str) -> bool {
    matches!(
        name.to_ascii_lowercase().as_str(),
        "content-type" | "appkey" | "sign" | "token" | "authorization" | "x-proxy-token"
    )
}

fn with_cors<R: Read>(response: Response<R>) -> Response<R> {
    response
        .with_header(header("Access-Control-Allow-Origin", "*"))
        .with_header(header(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, HEAD, OPTIONS",
        ))
        .with_header(header(
            "Access-Control-Allow-Headers",
            "Content-Type, appKey, sign, token, Authorization, X-Proxy-Token",
        ))
}

fn data_response(
    status: StatusCode,
    bytes: Vec<u8>,
    content_type: &str,
) -> Response<std::io::Cursor<Vec<u8>>> {
    Response::from_data(bytes)
        .with_status_code(status)
        .with_header(header("Content-Type", content_type))
}

fn json_response(status: StatusCode, bytes: Vec<u8>) -> Response<std::io::Cursor<Vec<u8>>> {
    data_response(status, bytes, "application/json; charset=utf-8")
}

fn text_response(status: StatusCode, text: &str) -> Response<std::io::Cursor<Vec<u8>>> {
    data_response(
        status,
        text.as_bytes().to_vec(),
        "text/plain; charset=utf-8",
    )
}

fn header(name: &str, value: &str) -> Header {
    Header::from_bytes(name.as_bytes(), value.as_bytes()).expect("valid static header")
}

fn escape_json(value: &str) -> String {
    value
        .replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('\n', "\\n")
        .replace('\r', "\\r")
}
