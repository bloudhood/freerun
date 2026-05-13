#![cfg_attr(
    all(target_os = "windows", not(debug_assertions)),
    windows_subsystem = "windows"
)]

use std::{env, error::Error, path::PathBuf, thread, time::Duration};

use freerun_desktop::start_local_server;
use tao::{
    dpi::LogicalSize,
    event::{Event, WindowEvent},
    event_loop::{ControlFlow, EventLoop},
    window::{Icon, WindowBuilder},
};
use wry::{NewWindowResponse, WebViewBuilder};

const WINDOW_ICON_RGBA: &[u8] = include_bytes!("../assets/app-icon-64.rgba");

fn main() -> Result<(), Box<dyn Error + Send + Sync>> {
    let asset_root = find_asset_root()?;
    let local_server = start_local_server(asset_root)?;

    if env::args().any(|arg| arg == "--server-only") {
        println!("{}", local_server.url);
        loop {
            thread::sleep(Duration::from_secs(3600));
        }
    }

    let event_loop = EventLoop::new();
    let window = WindowBuilder::new()
        .with_title("Freerun")
        .with_window_icon(Some(load_window_icon()?))
        .with_inner_size(LogicalSize::new(430.0, 820.0))
        .with_min_inner_size(LogicalSize::new(360.0, 640.0))
        .build(&event_loop)?;

    let _webview = WebViewBuilder::new()
        .with_url(&local_server.url)
        .with_user_agent("FreerunDesktop/0.1 WebView2")
        .with_new_window_req_handler(|url, _features| {
            let _ = open_external_url(&url);
            NewWindowResponse::Deny
        })
        .build(&window)?;

    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;
        if let Event::WindowEvent {
            event: WindowEvent::CloseRequested,
            ..
        } = event
        {
            *control_flow = ControlFlow::Exit;
        }
    });
}

fn load_window_icon() -> Result<Icon, Box<dyn Error + Send + Sync>> {
    Ok(Icon::from_rgba(WINDOW_ICON_RGBA.to_vec(), 64, 64)?)
}

#[cfg(target_os = "windows")]
fn open_external_url(url: &str) -> Result<(), Box<dyn Error + Send + Sync>> {
    use std::{ffi::OsStr, os::windows::ffi::OsStrExt, ptr};
    use windows_sys::Win32::UI::Shell::ShellExecuteW;

    fn wide_null(value: &str) -> Vec<u16> {
        OsStr::new(value).encode_wide().chain(Some(0)).collect()
    }

    let operation = wide_null("open");
    let target = wide_null(url);
    let result = unsafe {
        ShellExecuteW(
            ptr::null_mut(),
            operation.as_ptr(),
            target.as_ptr(),
            ptr::null(),
            ptr::null(),
            1,
        )
    };

    if result as isize <= 32 {
        return Err(format!("failed to open external URL: {url}").into());
    }

    Ok(())
}

#[cfg(target_os = "macos")]
fn open_external_url(url: &str) -> Result<(), Box<dyn Error + Send + Sync>> {
    std::process::Command::new("open").arg(url).spawn()?;
    Ok(())
}

#[cfg(all(unix, not(target_os = "macos")))]
fn open_external_url(url: &str) -> Result<(), Box<dyn Error + Send + Sync>> {
    std::process::Command::new("xdg-open").arg(url).spawn()?;
    Ok(())
}

fn find_asset_root() -> Result<PathBuf, Box<dyn Error + Send + Sync>> {
    let exe_dir = env::current_exe()?
        .parent()
        .ok_or("failed to resolve executable directory")?
        .to_path_buf();
    let portable_assets = exe_dir.join("app-dist");
    if portable_assets.join("index.html").is_file() {
        return Ok(portable_assets);
    }

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    if exe_dir.starts_with(&manifest_dir) {
        let dev_assets = manifest_dir.join("../app/dist");
        if dev_assets.join("index.html").is_file() {
            return Ok(dev_assets);
        }
    }

    Ok(PathBuf::new())
}
