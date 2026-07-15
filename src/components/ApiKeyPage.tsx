import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

import { settingsApiKeysSections, ApiKeyPageId } from "../types/settingPage";

import "./SettingsPageRoot.css";
import "./ApiKeyPage.css";

type OpenAiKeyName = {
    id: number;
    name: string;
    mainKey: number;
};

type ApiKeyPageProps = {
    initialPage: ApiKeyPageId;
    onBack: () => void;
    onReset: () => void;
}

type ApiKeyAddPageProps = {
    keyName: string;
    apiKey: string;
    errors: string[];
    successMessage: string;
    setKeyName: (value: string) => void;
    setApiKey: (value: string) => void;
    handleClick: () => void;
};

type ApiKeyDeletePageProps = {
    keyNames: OpenAiKeyName[];
    onLoadKeys: () => void | Promise<void>;
};

type ApiKeyRootPageProps = {
    keyNames: OpenAiKeyName[];
    selectedKeyId: number | null;
    setSelectedApiKeyPage: (value: ApiKeyPageId) => void;
    onLoadKeyNames: () => void | Promise<void>;
};

function ApiKeyDeletePage({keyNames, onLoadKeys}: ApiKeyDeletePageProps) {
    const [selectedKeyNameId, setSelectedKeyNameId] = useState<number | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const selectedKey = keyNames.find((key) => key.id === selectedKeyNameId) ?? null;

    async function handleDelete() {
        if (selectedKeyNameId === null) {
            console.error("Key name is not selected");
            return;
        } else {
            try {
                await invoke("delete_openai_key_name",{
                    id: selectedKeyNameId
                });
            } catch (error) {
                console.error(String(error));
            }
        }
        setIsDialogOpen(false);
        await onLoadKeys();
    }

    function handleCancel() {
        setIsDialogOpen(false);
    }

    return (
        <div className="root-container">
            <h2 className="page-title">Delete API Key</h2>
            <div className="form-container">
                <div className="input-container">
                    <div className="container">
                        <label htmlFor="tag-select">API Key Name</label>
                        <select
                            id="tag-select"
                            value={selectedKeyNameId ?? ""}
                            onChange={(e) => {
                                setSelectedKeyNameId(e.target.value === "" ? null : Number(e.target.value))
                            }}
                        >
                            <option value="">Select API key</option>
                            {keyNames.map((keyName) => (
                                <option key={keyName.id} value={keyName.id}>
                                    {keyName.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <button
                    className="tag-delete-button"
                    disabled={selectedKeyNameId === null}
                    onClick={() => setIsDialogOpen(true)}
                >
                    Delete
                </button>
            </div>
            {isDialogOpen ? (
                <div className="overlay">
                    <div className="dialog">
                        <h2>Are you sure you want to delete "{selectedKey?.name}"?</h2>
                        <div className="button-container">
                            <button onClick={handleDelete}>
                                Delete
                            </button>
                            <button onClick={handleCancel}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                </div>
            )}
        </div>
    );
}

function ApiKeyAddPage({
    keyName,
    apiKey,
    errors,
    successMessage,
    setKeyName,
    setApiKey,
    handleClick,
}: ApiKeyAddPageProps) {
    return (
        <div className="form-container">
            <div className="input-container">
                <div className="container">
                    <label htmlFor="key-name">Identifier Name</label>
                    <input
                        id="key-name"
                        type="text"
                        value={keyName}
                        placeholder="Enter a name"
                        onChange={(e) => setKeyName(e.target.value)}
                    />
                </div>
                <div className="container">
                    <label htmlFor="api-key">API KEY</label>
                    <input 
                        id="api-key"
                        type="text"
                        value={apiKey}
                        placeholder="Enter an API KEY"
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                </div>
            </div>
            {errors.length > 0 && (
                <div className="error-message-container">
                    {errors.map((error, index) => (
                        <p key={index}>{error}</p>
                    ))}
                </div>
            )}
            {successMessage !== "" && (
                <div className="success-message-container">
                    <p>{successMessage}</p>
                </div>
            )}
            
            <button
                type="button"
                onClick={handleClick}
            >
                Save
            </button>
        </div>
    );
}

function ApiKeyRootPage({
    keyNames,
    selectedKeyId,
    setSelectedApiKeyPage,
    onLoadKeyNames
}: ApiKeyRootPageProps) {
    async function handleSelectMainKey(id: number) {
        await invoke("set_main_openai_key_name", {
            id: id,
        });

        await onLoadKeyNames();
    }
    return (
        <div className="root-container">
            {keyNames.length > 0 && (
                <div className="api-key-select-field">
                    <label>Your API Key</label>
                    <select
                        value={selectedKeyId ?? ""}
                        onChange={(e) => handleSelectMainKey(Number(e.target.value))}
                    >
                        {keyNames.map((key) => (
                            <option key={key.id} value={key.id}>{key.name}</option>
                        ))}
                    </select>
                </div>
            )}
            {settingsApiKeysSections.map((section) => (
                <section 
                    className="nav-section"
                    key={section.id}
                >
                    {section.items.map((item) => (
                        <button 
                            className="nav-btn"
                            key={item.id}
                            onClick={() => setSelectedApiKeyPage(item.id)}
                        >
                            {item.label}
                        </button>
                    ))}
                </section>
            ))}
        </div>
    );
}

function ApiKeyPage({ initialPage, onBack, onReset }: ApiKeyPageProps) {
    const [keyName, setKeyName] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [errors, setErrors] = useState<string[]>([]);
    const [keyNames, setKeyNames] = useState<OpenAiKeyName[]>([]);
    const [selectedKeyId, setSelectedKeyId] = useState<number | null>(null);
    const [successMessage, setSuccessMessage] = useState("");

    const [selectedApiKeyPage, setSelectedApiKeyPage] = useState<ApiKeyPageId>(initialPage);

    useEffect(() => {
        getOpenAiKeyNames();
        onReset();
    }, []);

    function goBack() {
        if (selectedApiKeyPage !== "root") {
            setSelectedApiKeyPage("root");
            return;
        }

        onBack();
    }

    async function getOpenAiKeyNames() {
        try {
            const keys = await invoke<OpenAiKeyName[]>("get_openai_key_names");

            setKeyNames(keys);

            const mainKey = keys.find((key) => key.mainKey === 1);
            setSelectedKeyId(mainKey?.id ?? null);
        } catch (error) {
            setErrors([String(error)]);
        }
    }

    async function saveKey() {
        const name = keyName.trim();
        const key = apiKey.trim();

        await invoke("add_openai_key_name", {
            "name": name,
            "key": key,
        });
        
        await getOpenAiKeyNames();
    }

    async function handleClick() {
        const newErrors: string[] = [];
        const name = keyName.trim();
        const key = apiKey.trim();
        if (name === "") {
            newErrors.push("Identifier name is required.");
        }

        if (key === "") {
            newErrors.push("API key is required.");
        }

        const saveName = keyNames.find((keyName) => keyName.name === name);
        if (saveName) {
            newErrors.push("Key name is already existed.")
        }

        if (newErrors.length !== 0) {
            setErrors(newErrors);
            return;
        }

        setErrors([]);

        try {
            await saveKey();
            setSuccessMessage("API key saved successfully.");
            setKeyName("");
            setApiKey("");
        } catch (error) {
            setSuccessMessage("");
            setErrors([String(error)]);
        }
    }

    function renderPage() {
        switch(selectedApiKeyPage) {
            case "root":
                return (
                    <ApiKeyRootPage 
                        keyNames={keyNames}
                        selectedKeyId={selectedKeyId}
                        setSelectedApiKeyPage={setSelectedApiKeyPage}
                        onLoadKeyNames={getOpenAiKeyNames}
                    />
                );
            case "add_api_key":
                return (
                    <ApiKeyAddPage
                        keyName={keyName}
                        apiKey={apiKey}
                        errors={errors}
                        successMessage={successMessage}
                        setKeyName={setKeyName}
                        setApiKey={setApiKey}
                        handleClick={handleClick}
                    />
                );
            case "delete_api_key":
                return (
                    <ApiKeyDeletePage 
                        keyNames={keyNames}
                        onLoadKeys={getOpenAiKeyNames}
                    />
                );
            default:
                return null;
        }
    }

    return (
        <div className="api-key-page">
            <button 
                className="back-btn"
                type="button" 
                onClick={goBack}
            >
                Back
            </button>
            {renderPage()}
        </div>
    );
}

export default ApiKeyPage;