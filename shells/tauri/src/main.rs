//
// Hide the console window on Windows.
//
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::collections::HashMap;
use std::net::TcpListener;
use std::path::PathBuf;
use tauri::api::process::{Command, CommandEvent};
use tauri::{Manager, WindowEvent, CustomMenuItem, Submenu, Menu, MenuItem};

//
// Checks if the specified port is available.
//
// https://github.com/rust-lang-nursery/rust-cookbook/issues/500
//
fn port_is_available(port: u16) -> bool {
    match TcpListener::bind(("127.0.0.1", port)) {
        Ok(_) => true,
        Err(_) => false,
    }
}

//
// Gets an unused port.
//
fn get_available_port() -> Option<u16> {
    (40000..65535).find(|port| port_is_available(*port))
}

//
// The port number allocated for the evaluation engine.
// This probably wouldn't be global except the frontend needs to call
// the command below to get the port.
//
static mut eval_engine_server_port: u16 = 0;

//
// Set to true when the application is shutting down.
//
static mut application_shutdown: bool = false;

#[tauri::command]
fn get_eval_engine_server_port() -> u16 {
    unsafe { 
        return eval_engine_server_port;
    }
}

fn start_eval_engine(resources_path: PathBuf) {
    let server_path = resources_path.join("evaluation-engine/build/index.js");
    println!("Spawning evaluation engine: {}", server_path.display());

    let npm_cmd = if cfg!(target_os = "windows") {
        "node/npm.cmd"
    } else {
        "node/npm"
    };

    // https://docs.rs/tauri/latest/tauri/api/process/struct.Command.html
    // https://doc.rust-lang.org/std/process/struct.Command.html#
    let output = Command::new(npm_cmd)
        .args(["--version"])
        .output()
        .expect("Failed to run npm.");
    println!("{}", output.stdout);

    let mut envs: HashMap<String, String> = HashMap::new();
    unsafe {
        envs.insert("PORT".to_string(), eval_engine_server_port.to_string());
    }

    let node_path = resources_path.join("node/node").into_os_string().into_string().unwrap();
    let (mut rx, _) = Command::new(node_path)
        .envs(envs)
        .args([ server_path.into_os_string().into_string().unwrap() ])
        .spawn()
        .expect("Failed to spawn node.");

    tauri::async_runtime::spawn(async move {
        // read events such as stdout
        while let Some(event) = rx.recv().await {
            //todo: This could be pattern matched.
            if let CommandEvent::Stdout(line) = event.clone() {
                println!("{}", line);
            }
            if let CommandEvent::Stderr(line) = event.clone() {
                println!("{}", line);
            }
        }

        println!("Evaluation engine terminated.");

        unsafe {
            if (!application_shutdown) {
                println!("Restarting evaluation engine.");

                start_eval_engine(resources_path);
            }
        }

    });
}

// the payload type must implement `Serialize` and `Clone`.
#[derive(Clone, serde::Serialize)]
struct MenuInvokePayload {
  menu_item: String,
}

fn main() {
    unsafe {
        eval_engine_server_port = get_available_port()
            .expect("Failed to find an unused port to run the evaluation engine server.");
        print!(
            "Allocated port for eval engine server: {}",
            eval_engine_server_port
        );
    }

    let new = CustomMenuItem::new("new".to_string(), "New");
    let open = CustomMenuItem::new("open".to_string(), "Open");
    let save = CustomMenuItem::new("save".to_string(), "Save");
    let save_as = CustomMenuItem::new("saveAs".to_string(), "Save As");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let submenu = Submenu::new("File", 
        Menu::new()
            .add_item(new)
            .add_item(open)
            .add_item(save)
            .add_item(save_as)
            .add_item(quit)
    );
    let menu = Menu::new()
        //   .add_native_item(MenuItem::Copy)
        //   .add_item(CustomMenuItem::new("hide", "Hide"))
      .add_submenu(submenu);

    tauri::Builder::default()
        .menu(menu)
        .invoke_handler(tauri::generate_handler![get_eval_engine_server_port])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }

            let resources_path = app
                .path_resolver()
                .resolve_resource("resources")
                .expect("Expected to get resources path.");
            println!("{}", resources_path.display());
            start_eval_engine(resources_path);

            Ok(())
        })
        .on_window_event(move |event| 
            match event.event() {
                WindowEvent::Destroyed => {
                    println!("Window closed");

                    unsafe {
                        application_shutdown = true;
                    }
                }
                _ => {}
            }
        )
        .on_menu_event(|event| {
            event.window().emit("menu-invoke", 
                MenuInvokePayload {
                    menu_item: event.menu_item_id().into(),
                }
            ).unwrap();
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
