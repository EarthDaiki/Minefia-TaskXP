use reqwest::Client;
use serde_json::json;
use serde::{Deserialize, Serialize};

use crate::{db::{self, get_tag_names}, keychain::get_key};

#[derive(Debug, Serialize, Deserialize)]
pub struct AiTaskDraft {
    title: String,
    description: Option<String>,
    due_at: Option<String>,
    due_has_time: bool,
    priority: i64,
    difficulty: i64,
    estimated_minutes: Option<i64>,
    tags: Vec<String>,
    suggested_tags: Vec<String>,
}

#[tauri::command]
pub async fn fetch_data(prompt: String) -> Result<AiTaskDraft, String> {
    let client = Client::new();
    let name = db::get_main_openai_key_name().map_err(|e| e.to_string())?;
    let api_key = get_key(name)
        .map_err(|e| e.to_string())?
        .ok_or("API key not found.".to_string())?;
    let tag_names = get_tag_names()
        .map_err(|e| e.to_string())?;
    let response = client
        .post("https://api.openai.com/v1/responses")
        .bearer_auth(api_key)
        .json(&json!({
            "model": "gpt-5-mini",
            "input": [
                {
                    "role": "system",
                    "content": 
                    "
                        You convert natural language into a task draft. Return only data that matches the schema.
                        For tags, use only existing tags from the available tag list.
                        If useful tags are not in the available tag list, put them in suggested_tags.
                        Do not put suggested tags in tags.
                        due_has_time must be true only when due_at includes a specific time.
                    "
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "task_draft",
                    "strict": true,
                    "schema": {
                        "type": "object",
                        "additionalProperties": false,
                        "properties": {
                            "title": {
                                "type": "string"
                            },
                            "description": {
                                "type": ["string", "null"]
                            },
                            "due_at": {
                                "type": ["string", "null"],
                                "description": "Due date. Use YYYY-MM-DD when only a date is specified. Use YYYY-MM-DDTHH:MM when both date and time are specified. Use null when no due date is mentioned."
                            },
                            "due_has_time": {
                                "type": "boolean",
                                "description": "True only when due_at includes a specific time, such as YYYY-MM-DDTHH:MM. False when due_at is null or only a date like YYYY-MM-DD."
                            },
                            "priority": {
                                "type": "integer",
                                "minimum": 1,
                                "maximum": 5
                            },
                            "difficulty": {
                                "type": "integer",
                                "minimum": 1,
                                "maximum": 5
                            },
                            "estimated_minutes": {
                                "type": ["integer", "null"],
                                "minimum": 0
                            },
                            "tags": {
                                "type": "array",
                                "description": "Existing tags that match the task. Use only tags from the available tag list. If none match, return an empty array.",
                                "items": {
                                    "type": "string",
                                    "enum": tag_names
                                }
                            },
                            "suggested_tags": {
                                "type": "array",
                                "description": "New tag suggestions that are not in the available tag list. Use this only when no existing tag matches well.",
                                "items": {
                                    "type": "string"
                                }
                            }
                        },
                        "required": [
                            "title",
                            "description",
                            "due_at",
                            "due_has_time",
                            "priority",
                            "difficulty",
                            "estimated_minutes",
                            "tags",
                            "suggested_tags"
                        ]
                    }
                }
            }
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|e| e.to_string())?;

    if !status.is_success() {
        let error_json: serde_json::Value = match serde_json::from_str(&body) {
            Ok(value) => value,
            Err(_) => return Err(body),
        };
        let message = error_json
            .get("error")
            .and_then(|error| error.get("message"))
            .and_then(|message| message.as_str())
            .unwrap_or(&body);
        return Err(message.to_string());
    }
    Ok(parse_fetch_data(body)?)
}

fn parse_fetch_data(body: String) -> Result<AiTaskDraft, String> {
    let response_json: serde_json::Value = serde_json::from_str(&body)
        .map_err(|e| e.to_string())?;

    let output_text = response_json["output"]
        .as_array()
        .and_then(|outputs| {
            outputs.iter().find_map(|item| {
                if item["type"].as_str()? != "message" {
                    return None;
                }

                item["content"]
                    .as_array()?
                    .iter()
                    .find_map(|content| {
                        if content["type"].as_str()? != "output_text" {
                            return None;
                        }

                        content["text"].as_str()
                    })
            })
        })
        .ok_or("AI response text not found.".to_string())?;

    let draft: AiTaskDraft = serde_json::from_str(output_text)
        .map_err(|e| e.to_string())?;

    Ok(draft)
}