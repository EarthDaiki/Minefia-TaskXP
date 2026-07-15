mod db;
mod open_ai;
mod keychain;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            db::init_db(app.handle()).map_err(|e| format!("Failed to initialize database: {}", e))?;
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            db::get_tags,
            db::add_tag,
            db::delete_tag,
            db::add_task,
            db::get_tasks,
            db::delete_task,
            db::complete_task,
            db::uncomplete_task,
            db::update_task,
            db::start_task,
            db::reset_start_task,
            db::add_openai_key_name,
            db::get_openai_key_names,
            db::get_main_openai_key_name,
            db::set_main_openai_key_name,
            db::delete_openai_key_name,
            keychain::save_key,
            keychain::get_key,
            keychain::delete_key,
            open_ai::fetch_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
