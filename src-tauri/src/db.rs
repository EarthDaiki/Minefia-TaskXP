use rusqlite::{Connection, params};
use std::{sync::{Mutex, MutexGuard, OnceLock}};
use chrono::{Local, NaiveDateTime, NaiveDate, TimeZone};

static DB: OnceLock<Mutex<Connection>> = OnceLock::new();

use serde::{Serialize};
use tauri::{Manager};

use crate::keychain::{delete_key, save_key};

#[derive(Serialize, Debug)]
pub struct Tag {
    id: i64,
    name: String,
}

#[derive(Serialize, Debug)]
pub struct Task {
    id: i64,
    title: String,
    description: Option<String>,
    due_at: Option<i64>,
    due_has_time: bool,
    started_at: Option<i64>,
    priority: i64,
    difficulty: i64,
    estimated_minutes: Option<i64>,
    actual_minutes: Option<i64>,
    completed: i64,
    created_at: i64,
    updated_at: i64,
    completed_at: Option<i64>,
    tags: Vec<Tag>
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct OpenAIApiKeyName {
    id: i64,
    name: String,
    main_key: i64
}


pub fn init_db(app: &tauri::AppHandle) -> Result<(), String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    let db_path = app_dir.join("taskxp.db");
    println!("db path: {}", db_path.display());

    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute("PRAGMA foreign_keys = ON", []).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
            )",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,

            due_at INTEGER,
            due_has_time INTEGER NOT NULL DEFAULT 0 CHECK (due_has_time IN (0, 1)),
            started_at INTEGER,

            priority INTEGER NOT NULL DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
            difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),

            estimated_minutes INTEGER CHECK (estimated_minutes IS NULL OR estimated_minutes >= 0),
            actual_minutes INTEGER CHECK (actual_minutes IS NULL OR actual_minutes >= 0),

            completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
            created_at INTEGER NOT NULL DEFAULT (unixepoch()),
            updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
            completed_at INTEGER,

            CHECK (
                (completed = 0 AND completed_at IS NULL)
                OR
                (completed = 1 AND completed_at IS NOT NULL)
            )
        )",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
    "CREATE TABLE IF NOT EXISTS task_tags (
        task_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,

        PRIMARY KEY (task_id, tag_id),

        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        )",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
    "CREATE TABLE IF NOT EXISTS openai_key_names (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            main_key INTEGER NOT NULL DEFAULT 0 CHECK (main_key IN (0, 1))
        )",
        [],
    ).map_err(|e| e.to_string())?;

    DB.set(Mutex::new(conn)).map_err(|_| "Database is already initialized.")?;

    Ok(())
}

fn get_conn() -> Result<MutexGuard<'static, Connection>, String> {
    let conn = DB.get()
        .ok_or("Database is not initialized.")?
        .lock()
        .map_err(|e| e.to_string())?;

    Ok(conn)
}

#[tauri::command]
pub fn add_tag(name: String) -> Result<(), String> {
    let trimmed_name = name.trim();
    if trimmed_name.is_empty() {
        return Err("Tag name is required.".to_string());
    }

    let conn = get_conn()?;
    conn.execute(
        "INSERT INTO tags (name) VALUES (?1)", 
        params![trimmed_name]
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn delete_tag(tag_id: i64) -> Result<(), String> {
    let conn = get_conn()?;
    let changed = conn
        .execute(
            "DELETE FROM tags WHERE id = ?1", 
            params![tag_id]
        )
        .map_err(|e| e.to_string())?;

    if changed == 0 {
        return Err("Tag not found.".to_string());
    }
    Ok(())
}

#[tauri::command]
pub fn get_tags() -> Result<Vec<Tag>, String> {
    let conn = get_conn()?;
    let mut stmt = conn
        .prepare("SELECT id, name FROM tags ORDER BY id")
        .map_err(|e| e.to_string())?;
    let tag_rows = stmt.query_map([], |row| {
        Ok(Tag {
            id: row.get(0)?,
            name: row.get(1)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut tags = Vec::new();
    for tag in tag_rows {
        tags.push(tag.map_err(|e| e.to_string())?);
    }

    Ok(tags)
}

pub fn get_tag_names() -> Result<Vec<String>, String> {
    let conn = get_conn()?;
    let mut stmt = conn
        .prepare("SELECT name FROM tags ORDER BY id")
        .map_err(|e| e.to_string())?;
    let tag_rows = stmt
        .query_map([], |row| {
            row.get::<_, String>(0)
        })
        .map_err(|e| e.to_string())?;

    let mut tag_names = Vec::new();
    for tag_name in tag_rows {
        tag_names.push(tag_name.map_err(|e| e.to_string())?);
    }

    Ok(tag_names)
}

#[tauri::command]
pub fn get_tags_for_task(conn: &Connection, task_id: i64) -> Result<Vec<Tag>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT
                tags.id,
                tags.name
            FROM task_tags
            JOIN tags ON tags.id = task_tags.tag_id
            WHERE task_tags.task_id = ?1
            ORDER BY tags.id"
        )
        .map_err(|e| e.to_string())?;

    let tag_rows = stmt
        .query_map([task_id], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?
            })
        })
        .map_err(|e| e.to_string())?;

    let mut tags = Vec::new();
    for tag in tag_rows {
        tags.push(tag.map_err(|e| e.to_string())?);
    }

    Ok(tags)
}

#[tauri::command]
pub fn add_task(
    title: String,
    description: Option<String>,
    priority: i64,
    difficulty: i64,
    due_at: Option<String>,
    due_has_time: bool,
    estimated_minutes: Option<i64>,
    selected_tag_ids: Vec<i64>
) -> Result<(), String> {
    let trimmed_title = title.trim();
    if trimmed_title.is_empty() {
        return Err("Title is required.".to_string());
    }

    let trimmed_description = description
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

    if priority < 1 || priority > 5 {
        return Err("Priority must be between 1 and 5.".to_string());
    }

    if difficulty < 1 || difficulty > 5 {
        return Err("Difficulty must be between 1 and 5.".to_string());
    }

    let due_at_unix: Option<i64> = match due_at {
        Some(value)=> {
            let value = value.trim();
            if value.is_empty() {
                None
            } else {
                if due_has_time {
                    match NaiveDateTime::parse_from_str(value, "%Y-%m-%dT%H:%M") {
                        Ok(datetime) => {
                            match Local.from_local_datetime(&datetime).single() {
                                Some(local_datetime) => Some(local_datetime.timestamp()),
                                None => return Err("Invalid due date format.".to_string()),
                            }
                        }
                        Err(_) => return Err("Invalid due date format.".to_string()),
                    }
                }
                else {
                    match NaiveDate::parse_from_str(value, "%Y-%m-%d") {
                        Ok(date) => {
                            let datetime = date
                                .and_hms_opt(23, 59, 59)
                                .ok_or("Invalid due date format.".to_string())?;
                            match Local.from_local_datetime(&datetime).single() {
                                Some(local_datetime) => Some(local_datetime.timestamp()),
                                None => return Err("Invalid due date format.".to_string()),
                            }
                        }
                        Err(_) => return Err("Invalid due date format.".to_string()),
                    }
                }
            }
        }
        None => None,
    };

    if let Some(minutes) = estimated_minutes {
        if minutes < 0 {
            return Err("Estimated minutes must be 0 or greater.".to_string());
        }
    }

    let mut conn = get_conn()?;

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    tx.execute(
        "INSERT INTO tasks (
            title,
            description,
            due_at,
            due_has_time,
            priority,
            difficulty,
            estimated_minutes
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            trimmed_title,
            trimmed_description,
            due_at_unix,
            due_has_time,
            priority,
            difficulty,
            estimated_minutes,
        ],
    )
    .map_err(|e| e.to_string())?;

    let task_id = tx.last_insert_rowid();

    for tag_id in selected_tag_ids {
        tx.execute(
            "INSERT INTO task_tags (
                task_id,
                tag_id
            ) VALUES (?1, ?2)",
            [task_id, tag_id]
        ).map_err(|e| e.to_string())?;
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}


#[tauri::command]
pub fn delete_task(task_id: i64) -> Result<(), String> {
    let conn = get_conn()?;
    let changed = conn
        .execute(
            "DELETE FROM tasks WHERE id = ?1", 
            params![task_id]
        )
        .map_err(|e| e.to_string())?;

    if changed == 0 {
        return Err("Task not found.".to_string());
    }
    Ok(())
}

#[tauri::command]
pub fn get_tasks() -> Result<Vec<Task>, String> {
    let conn = get_conn()?;
    let mut stmt = conn
        .prepare(
            "SELECT
                id,
                title,
                description,
                due_at,
                due_has_time,
                started_at,
                priority,
                difficulty,
                estimated_minutes,
                actual_minutes,
                completed,
                created_at,
                updated_at,
                completed_at
            FROM tasks
            ORDER BY id"
        )
        .map_err(|e| e.to_string())?;

    let task_rows = stmt
        .query_map([], |row| {
            Ok(Task {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                due_at: row.get(3)?,
                due_has_time: row.get(4)?,
                started_at: row.get(5)?,
                priority: row.get(6)?,
                difficulty: row.get(7)?,
                estimated_minutes: row.get(8)?,
                actual_minutes: row.get(9)?,
                completed: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
                completed_at: row.get(13)?,
                tags: Vec::new(),
            })
        })
        .map_err(|e| e.to_string())?;

    let mut tasks = Vec::new();
    for task in task_rows {
        let mut task = task.map_err(|e| e.to_string())?;
        task.tags = get_tags_for_task(&conn, task.id)?;
        tasks.push(task);
    }
    Ok(tasks)
}

#[tauri::command]
pub fn complete_task(task_id: i64) -> Result<(), String>{
    let conn = get_conn()?;

    let changed = conn
        .execute(
            "UPDATE tasks
            SET
                completed = 1,
                completed_at = unixepoch(),
                actual_minutes = CASE
                    WHEN started_at IS NULL THEN actual_minutes
                    ELSE (unixepoch() - started_at) / 60
                END,
                updated_at = unixepoch()
            WHERE id = ?1",
            params![task_id]
        )
        .map_err(|e| e.to_string())?;
    
    if changed == 0 {
        return Err("Task not found.".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn uncomplete_task(task_id: i64) -> Result<(), String> {
    let conn = get_conn()?;

    let changed = conn
        .execute(
        "UPDATE tasks
            SET
                completed = 0,
                completed_at = NULL,
                updated_at = unixepoch()
            WHERE id = ?1",
            params![task_id],
        )
        .map_err(|e| e.to_string())?;

    if changed == 0 {
        return Err("Task not found".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn update_task(
    task_id: i64, 
    field: String, 
    string_value: Option<String>,
    number_value: Option<i64>,
    bool_value: Option<bool>,
    tag_ids: Option<Vec<i64>>
)-> Result<(), String> {
    let mut conn = get_conn()?;

    match field.as_str() {
        "title" => { 
            let title = string_value.ok_or("Title is required.".to_string())?;
            let trimmed_title = title.trim();

            if trimmed_title.is_empty() {
                return Err("Title is required".to_string());
            }

            let changed = conn
                .execute(
                    "UPDATE tasks
                    SET
                        title = ?1,
                        updated_at = unixepoch()
                    WHERE id = ?2", 
                    params![trimmed_title, task_id]
                )
                .map_err(|e| e.to_string())?;

            if changed == 0 {
                return Err("Task not found".to_string());
            }
        }
        "description" => {
            let description = string_value
                .map(|value| value.trim().to_string())
                .filter(|value| !value.is_empty());
            let changed = conn
                .execute(
                    "UPDATE tasks
                    SET
                        description = ?1,
                        updated_at = unixepoch()
                    WHERE id = ?2", 
                    params![description, task_id]
                )
                .map_err(|e| e.to_string())?;

            if changed == 0 {
                return Err("Task not found".to_string());
            }
        }
        "priority" => {
            let priority = number_value
                .ok_or("Priority value is required.".to_string())?;
            if priority < 1 || priority > 5 {
                return Err("Priority must be between 1 and 5.".to_string());
            }
            let changed = conn
                .execute(
                    "UPDATE tasks
                    SET
                        priority = ?1,
                        updated_at = unixepoch()
                    WHERE id = ?2", 
                    params![priority, task_id]
                )
                .map_err(|e| e.to_string())?;

            if changed == 0 {
                return Err("Task not found".to_string());
            }
        }
        "difficulty" => {
            let difficulty = number_value
                .ok_or("Difficulty value is required.".to_string())?;
            if difficulty < 1 || difficulty > 5 {
                return Err("Difficulty must be between 1 and 5.".to_string());
            }
            let changed = conn
                .execute(
                    "UPDATE tasks
                    SET
                        difficulty = ?1,
                        updated_at = unixepoch()
                    WHERE id = ?2", 
                    params![difficulty, task_id]
                )
                .map_err(|e| e.to_string())?;

            if changed == 0 {
                return Err("Task not found".to_string());
            }
        }
        "due_at" => {
            let bool_value = bool_value
                .ok_or("Has Time bool is required.".to_string())?;
            let due_at = string_value
                .map(|value| value.trim().to_string())
                .filter(|value| !value.is_empty());
            let due_at_unix: Option<i64> = match due_at {
                Some(value) => {
                    if bool_value {
                        match NaiveDateTime::parse_from_str(&value, "%Y-%m-%dT%H:%M") {
                            Ok(datetime) => {
                                match Local.from_local_datetime(&datetime).single() {
                                    Some(local_datetime) => Some(local_datetime.timestamp()),
                                    None => return Err("Invalid due date format.".to_string()),
                                }
                            }
                            Err(_) => return Err("Invalid due date format.".to_string()),
                        }
                    } else {
                        match NaiveDate::parse_from_str(&value, "%Y-%m-%d") {
                            Ok(date) => {
                                let datetime = date
                                    .and_hms_opt(23, 59, 59)
                                    .ok_or("Invalid due date format.".to_string())?;

                                match Local.from_local_datetime(&datetime).single() {
                                    Some(local_datetime) => Some(local_datetime.timestamp()),
                                    None => return Err("Invalid due date format.".to_string()),
                                }
                            }
                            Err(_) => return Err("Invalid due date format.".to_string()),
                        }
                    }
                }
                None => None,
            };
            let changed = conn
                .execute(
                    "UPDATE tasks
                    SET
                        due_at = ?1,
                        due_has_time = ?2,
                        updated_at = unixepoch()
                    WHERE id = ?3", 
                    params![due_at_unix, bool_value, task_id]
                )
                .map_err(|e| e.to_string())?;

            if changed == 0 {
                return Err("Task not found".to_string());
            }
        }
        "estimated_minutes" => {
            if let Some(minutes) = number_value {
                if minutes < 0 {
                    return Err("Estimated minutes must be 0 or greater.".to_string());
                }
            }

            let changed = conn
                .execute(
                    "UPDATE tasks
                    SET
                        estimated_minutes = ?1,
                        updated_at = unixepoch()
                    WHERE id = ?2", 
                    params![number_value, task_id]
                )
                .map_err(|e| e.to_string())?;

            if changed == 0 {
                return Err("Task not found".to_string());
            }
        }
        "tags" => {
            let tag_ids = tag_ids.unwrap_or_default();
            let tx = conn
                .transaction()
                .map_err(|e| e.to_string())?;

            let exist: i64 = tx
                .query_row(
                    "SELECT COUNT(*) FROM tasks WHERE id = ?1",
                    params![task_id],
                    |row| row.get(0),
                )
                .map_err(|e| e.to_string())?;

            if exist == 0 {
                return Err("Task not found".to_string());
            }

            tx.execute(
                "DELETE FROM task_tags WHERE task_id = ?1",
                params![task_id]
            )
            .map_err(|e| e.to_string())?;

            for tag_id in tag_ids {
                tx.execute(
                    "INSERT INTO task_tags (
                        task_id,
                        tag_id
                    ) VALUES (?1, ?2)",
                    params![task_id, tag_id],
                )
                .map_err(|e| e.to_string())?;
            }

            tx.execute(
                "UPDATE tasks
                SET 
                    updated_at = unixepoch()
                WHERE id = ?1", 
                params![task_id],
            )
            .map_err(|e| e.to_string())?;

            tx.commit().map_err(|e| e.to_string())?;
        }
        _ => return Err("Invalid field.".to_string()),
    }

    Ok(())
}

#[tauri::command]
pub fn start_task(task_id: i64) -> Result<(), String> {
    let conn = get_conn()?;

    let changed = conn
        .execute(
        "UPDATE tasks
            SET
                started_at = unixepoch(),
                updated_at = unixepoch()
            WHERE id = ?1",
            params![task_id],
        )
        .map_err(|e| e.to_string())?;

    if changed == 0 {
        return Err("Task not found".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn reset_start_task(task_id: i64) -> Result<(), String> {
    let conn = get_conn()?;

    let changed = conn
        .execute(
        "UPDATE tasks
            SET
                started_at = NULL,
                actual_minutes = NULL,
                updated_at = unixepoch()
            WHERE id = ?1",
            params![task_id],
        )
        .map_err(|e| e.to_string())?;

    if changed == 0 {
        return Err("Task not found".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn add_openai_key_name(name: String, key: String) -> Result<(), String> {
    let conn = get_conn()?;

    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM openai_key_names",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let main_key: i64 = if count == 0 {1} else {0};

    conn
        .execute(
        "INSERT INTO openai_key_names (
            name,
            main_key
        ) VALUES (?1, ?2)",
        params![
            name,
            main_key
        ],
        )
        .map_err(|e| e.to_string())?;

    save_key(name, key).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn set_main_openai_key_name(id: i64) -> Result<(), String> {
    let mut conn = get_conn()?;

    let tx = conn
        .transaction()
        .map_err(|e| e.to_string())?;

    let changed: i64 = tx
        .query_row(
            "SELECT COUNT(*) FROM openai_key_names WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if changed == 0 {
        return Err("OpenAI key name not found.".to_string());
    }

    let changed = tx
        .execute(
            "UPDATE openai_key_names
            SET
                main_key = 0",
            params![]
        )
        .map_err(|e| e.to_string())?;

    if changed == 0 {
        return Err("Could not set main_key".to_string());
    }

    let changed = tx
        .execute(
            "UPDATE openai_key_names
            SET
                main_key = 1
            WHERE id = ?1", 
            params![id]
        )
        .map_err(|e| e.to_string())?;

    if changed == 0 {
        return Err("Could not set main_key".to_string());
    }

    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_main_openai_key_name() -> Result<String, String> {
    let conn = get_conn()?;

    let name = conn
        .query_row(
        "SELECT name FROM openai_key_names WHERE main_key = 1 LIMIT 1",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    Ok(name)
}

#[tauri::command]
pub fn get_openai_key_names() -> Result<Vec<OpenAIApiKeyName>, String> {
    let conn: MutexGuard<'_, Connection> = get_conn()?;
    let mut stmt = conn
        .prepare("SELECT id, name, main_key FROM openai_key_names ORDER BY id")
        .map_err(|e| e.to_string())?;
    let key_rows = stmt.query_map([], |row| {
        Ok(OpenAIApiKeyName {
            id: row.get(0)?,
            name: row.get(1)?,
            main_key: row.get(2)?
        })
    }).map_err(|e| e.to_string())?;

    let mut keys = Vec::new();
    for key in key_rows {
        keys.push(key.map_err(|e| e.to_string())?);
    }

    Ok(keys)
}

#[tauri::command]
pub fn delete_openai_key_name(id: i64) -> Result<(), String> {
    let conn = get_conn()?;
    let name: String = conn
        .query_row(
            "SELECT name FROM openai_key_names WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )
        .map_err(|_| "OpenAI key name not found.".to_string())?;
    let changed = conn
        .execute(
            "DELETE FROM openai_key_names WHERE id = ?1", 
            params![id]
        )
        .map_err(|e| e.to_string())?;

    if changed == 0 {
        return Err("OpenAI key name not found.".to_string());
    }
    delete_key(&name).map_err(|e| e.to_string())?;
    Ok(())
}