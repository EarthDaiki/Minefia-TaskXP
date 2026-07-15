use keyring::v1::{Entry, Error};

const SERVICE_NAME: &str = "minefia-taskxp";

fn key_entry(name: &str) -> Result<Entry, String> {
    Entry::new(SERVICE_NAME, name)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_key(name: String, key: String) -> Result<(), String> {
    let key = key.trim();
    if key.is_empty() {
        return Err("Key is empty".to_string());
    }
    let entry = key_entry(&name)?;

    entry
        .set_password(key)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_key(name: String) -> Result<Option<String>, String> {
    let entry = key_entry(&name)?;
    match entry.get_password() {
        Ok(key) => Ok(Some(key)),
        Err(Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn delete_key(name: &str) -> Result<(), String> {
    let entry = key_entry(name)?;
    match entry.delete_credential() {
        Ok(_) => Ok(()),
        Err(Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}