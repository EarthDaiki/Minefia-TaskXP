import { useState } from "react";
import { invoke } from "@tauri-apps/api/core"
import type { Tag } from "../types/tag";
import { TagPageId } from "../types/settingPage";
import "./TagManagementPage.css"
import "./DialogRoot.css"
import "./SettingsPageRoot.css"

type TagManagementPageProps = {
    tags: Tag[];
    onLoadTags: () => void | Promise<void>;
    onBack: () => void;
};

type TagManagementRootPageProps = {
    tags: Tag[];
    tagOption: number | "";
    isDialogOpen: boolean;
    setTagOption: (value: number | "") => void;
    setIsDialogOpen: (value: boolean) => void;
    onLoadTags: () => void | Promise<void>;
};

function TagManagementRootPage({
    tags,
    tagOption,
    isDialogOpen,
    setTagOption,
    setIsDialogOpen,
    onLoadTags,
}: TagManagementRootPageProps) {
    const [successMessage, setSuccessMessage] = useState("");
    const [errors, setErrors] = useState<string[]>([]);
    const selectedTag = tags.find((tag) => tag.id === tagOption) ?? null;

    async function handleDelete() {
        const newErrors = []
        if (tagOption === "") {
            newErrors.push("tag option is not selected.");
        } else {
            try {
                await invoke("delete_tag",{
                    tagId: tagOption
                });
                setSuccessMessage("Tag deleted successfully.")
            } catch (error) {
                newErrors.push(String(error));
            }
        }
        await onLoadTags();
        setIsDialogOpen(false);
        if (newErrors.length !== 0) {
            setErrors(newErrors);
            return;
        }
        setErrors([]);
    }
    function handleCancel() {
        setIsDialogOpen(false);
        setErrors([]);
    }
    return (
        <div className="root-container">
            <h2 className="page-title">Delete Tag</h2>
            <div className="form-container">
                <div className="input-container">
                    <div className="container">
                        <label htmlFor="tag-select">Tag Name</label>
                        <select
                            id="tag-select"
                            value={tagOption}
                            onChange={(e) => {
                                setTagOption(e.target.value === "" ? "" : Number(e.target.value))
                            }}
                        >
                            <option value="">Select tag</option>
                            {tags.map((tag) => (
                                <option key={tag.id} value={tag.id}>
                                    {tag.name}
                                </option>
                            ))}
                        </select>
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
                    className="tag-delete-button"
                    disabled={tagOption === ""}
                    onClick={() => setIsDialogOpen(true)}
                >
                    Delete
                </button>
            </div>
            {isDialogOpen ? (
                <div className="overlay">
                    <div className="dialog">
                        <h2>Are you sure you want to delete "{selectedTag?.name}"?</h2>
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

function TagManagementPage({tags, onLoadTags, onBack}: TagManagementPageProps) {
    const [tagOption, setTagOption] = useState<number | "">("");
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const [selectedTagPage, setSelectedTagPage] = useState<TagPageId>("root");

    function goBack() {
        if (selectedTagPage !== "root") {
            setSelectedTagPage("root");
            return;
        }

        onBack();
    }

    function renderPage() {
        switch (selectedTagPage) {
            case "root":
                return (
                    <TagManagementRootPage 
                        tags={tags}
                        tagOption={tagOption}
                        isDialogOpen={isDialogOpen}
                        setTagOption={setTagOption}
                        setIsDialogOpen={setIsDialogOpen}
                        onLoadTags={onLoadTags}
                    />
                );
            default:
                return null;
        }
    }

    return (
        <div className="tag-management-page">
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

export default TagManagementPage;