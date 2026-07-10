mod db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    db::init_db().expect("Failed to initialize database");
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            db::get_tags,
            db::add_tag,
            db::delete_tag,
            db::add_task,
            db::get_tasks,
            db::complete_task,
            db::uncomplete_task,
            db::update_task,
            db::start_task,
            db::reset_start_task,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
