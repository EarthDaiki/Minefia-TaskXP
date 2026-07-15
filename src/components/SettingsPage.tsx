import { useState } from "react";
import ApiKeyPage from "./ApiKeyPage";
import { settingsRootSections, SettingsPageId, ApiKeyPageId } from "../types/settingPage";
import TagManagementPage from "./TagManagementPage";
import { Tag } from "../types/tag";

import "./SettingsPageRoot.css";

type SettingPageProps = {
    tags: Tag[];
    initialPage: SettingsPageId;
    initialApiKeyPage: ApiKeyPageId;
    onLoadTags: () => void | Promise<void>;
    onReset:() => void;
}

function SettingsPage({tags, initialPage, initialApiKeyPage, onLoadTags, onReset}: SettingPageProps) {
    const [selectedPage, setSelectedPage] = useState<SettingsPageId>(initialPage);

    function SettingRootPage() {
        return (
            <div className="root-container">
                <h2 className="page-title">Settings</h2>
                {settingsRootSections.map((section) => (
                    <section
                        className="nav-section"
                        key={section.id}
                    >
                        {section.label !== null && (
                            <span className="nav-section-label">{section.label}</span>
                        )}
                        {section.items.map((item) => (
                            <button
                                className="nav-button"
                                type="button"
                                onClick={() => setSelectedPage(item.id)}
                                key={item.id}
                            >
                                {item.label}
                            </button>
                        ))}
                    </section>
                ))}
            </div>
        );
    }

    function renderPage() {
        switch (selectedPage) {
            case "root":
                return <SettingRootPage />
            case "api_keys":
                return <ApiKeyPage initialPage={initialApiKeyPage} onBack={() => setSelectedPage("root")} onReset={onReset}/>
            case "tag":
                return <TagManagementPage tags={tags} onLoadTags={onLoadTags} onBack={() => setSelectedPage("root")}/>
            default:
                return null;
        }
    }
    return (
        <div className="settings-page">
            {renderPage()}
        </div>
    );
}

export default SettingsPage;