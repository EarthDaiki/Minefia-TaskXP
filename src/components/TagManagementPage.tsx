import { useState } from "react";
import { invoke } from "@tauri-apps/api/core"
import type { Tag } from "../types/tag";
import "./TagManagementPage.css"
import "./DialogRoot.css"

type TagManagementPageProps = {
    tags: Tag[];
    onLoadTags: () => void | Promise<void>;
};

function TagManagementPage({tags, onLoadTags}: TagManagementPageProps) {
    const [tagOption, setTagOption] = useState<number | "">("");
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    async function handleDelete() {
        if (tagOption === "") {
            console.error("tag option is not selected");

        } else {
            try {
                console.log("delete");
                await invoke("delete_tag",{
                    tagId: tagOption
                });
            } catch (error) {
                console.error(String(error));
            }
        }
        await onLoadTags();
        setIsDialogOpen(false);
    }
    function handleCancel() {
        setIsDialogOpen(false);
    }
    return (
        <div className="tag-management-container">
            <h2>Delete Tag</h2>
            <select
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
            <button
                className="tag-delete-button"
                disabled={tagOption === ""}
                onClick={() => setIsDialogOpen(true)}
            >
                Delete
            </button>
            {isDialogOpen ? (
                <div className="overlay">
                    <div className="dialog">
                        <h2>Are you sure you want to delete this tag?</h2>
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

export default TagManagementPage;