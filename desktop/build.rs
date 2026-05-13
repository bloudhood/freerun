#[cfg(windows)]
fn main() {
    let mut resource = winresource::WindowsResource::new();
    resource.set_icon("../app/public/app-icon.ico");
    resource.set("FileDescription", "Freerun");
    resource.set("ProductName", "Freerun");
    resource.compile().expect("failed to compile Windows resources");
}

#[cfg(not(windows))]
fn main() {}
