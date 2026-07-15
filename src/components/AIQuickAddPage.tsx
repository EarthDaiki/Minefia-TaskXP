import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import TaskDialog from "./TaskDialog";
import { Tag, SuggestedTag } from "../types/tag";

import "./AIQuickAddPage.css"

type AiTaskDraft = {
    title: string;
    description: string | null;
    due_at: string | null;
    due_has_time: boolean;
    priority: number;
    difficulty: number;
    estimated_minutes: number | null;
    tags: string[];
    suggested_tags: string[];
};

type QuickAddTaskPageProps = {
    tags: Tag[];
    onLoadTasks: () => void | Promise<void>;
    onLoadTags: () => void | Promise<void>;
    onAddApiKey: () => void;
};

function QuickAddTaskPage({tags, onLoadTasks, onLoadTags, onAddApiKey}: QuickAddTaskPageProps) {
    const [prompt, setPrompt] = useState("");
    const [mainApiKeyName, setMainApiKeyName] = useState<string | null>(null);
    const [response, setResponse] = useState<AiTaskDraft | null>(null);
    const [errors, setErrors] = useState<string[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [allTags, setAllTags] = useState<Tag[]>([]);

    useEffect(() => {
        getApiMainKey();
        loadTags();
    }, []);

    async function askAi() {
        const newErrors = [];
        if (mainApiKeyName === null) {
            newErrors.push("API KEY required.")
        }
        const trimmedPrompt = prompt.trim();
        if (trimmedPrompt === "") {
            newErrors.push("Prompt required.");
        }

        if (newErrors.length !== 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);
        setErrors([]);

        try {
            const result = await invoke<AiTaskDraft>("fetch_data", {
                "prompt": trimmedPrompt,
            });
            setResponse(result);
        } catch (error) {
            setErrors([String(error)]);
        } finally {
            setIsLoading(false);
        }
    }

    async function getApiMainKey() {
        const keyName = await invoke<string>("get_main_openai_key_name", {});
        setMainApiKeyName(keyName);
    }

    async function loadTags() {
        const tags = await invoke<Tag[]>("get_tags");
        setAllTags(tags);
    }

    function renderAiResponse() {
        if (response === null) {
            return null;
        }
        const initialTags = allTags.filter((tag) =>
            response.tags.includes(tag.name)
        );
        const suggestedTags: SuggestedTag[] = response.suggested_tags.map((tagName) => ({
            tempId: `suggested-${tagName}`,
            name: tagName,
        }));
        return (
            <TaskDialog
                initialDraft={{
                    title: response.title,
                    description: response.description,
                    priority: response.priority,
                    difficulty: response.difficulty,
                    due_at: response.due_at,
                    due_has_time: response.due_has_time,
                    estimated_minutes: response.estimated_minutes,
                    tags: initialTags,
                    suggestedTags: suggestedTags,
                }}
                tags={tags}
                onLoadTags={onLoadTags}
                onSave={async () => {
                    await onLoadTasks();
                    setResponse(null);
                    setPrompt("");
                }}
                onClose={() => setResponse(null)}
            />
        );
    }

    return (
        <div className="root-container">
            <h2 className="page-title">Quick Add Task</h2>
            <p>API KEY:
                {mainApiKeyName !== null ? (
                    <span className="emphasized-text">{mainApiKeyName}</span>
                ) : (
                    <button
                        className="add-api-key-btn"
                        onClick={onAddApiKey}
                    >
                        Add API Key
                    </button>
                )}
            </p>
            <div className="form-container">
                <div className="input-container">
                    <label
                        className="input-label"
                        htmlFor="prompt"
                    >
                        Prompt
                    </label>
                    <textarea
                        id="prompt"
                        className="prompt"
                        placeholder="Enter a prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                    {errors.length > 0 && (
                        <div className="error-message-container">
                            {errors.map((error, index) => (
                                <p key={index}>{error}</p>
                            ))}
                        </div>
                    )}
                    <button
                        className="ask-ai-btn"
                        onClick={askAi}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            "Thinking..."
                        ) : (
                            "Ask AI Agent"
                        )}
                    </button>
                </div>
            </div>
            {renderAiResponse()}
        </div>
    );
}

export default QuickAddTaskPage;