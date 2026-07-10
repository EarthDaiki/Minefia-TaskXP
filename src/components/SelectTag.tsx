import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Tag } from "../types/tag";
import TagDialog from "./TagDialog"
import "./SelectTag.css";

type SelectTagProps = {
    selectedTags: Tag[];
    setSelectedTags: React.Dispatch<React.SetStateAction<Tag[]>>;
};

export function SelectTag({ selectedTags, setSelectedTags}: SelectTagProps) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const availableTags = tags.filter(
        (tag) => !selectedTags.some((selectedTag) => selectedTag.id === tag.id)
    );
    useEffect(() => {
        loadTags();
        document.body.classList.add("dialog-open");
        return () => {
            document.body.classList.remove("dialog-open");
        };
    }, []);

    async function loadTags() {
        try {
            const loadedTags = await invoke<Tag[]>("get_tags");
            setTags(loadedTags);
        } catch (error) {
            console.error("Failed to load tags:", error);
        }
    }

    function addSelectedTag(addTag: Tag) {
        if (selectedTags.some((tag) => tag.id === addTag.id)) return;

        setSelectedTags([...selectedTags, addTag]);
    }

    function removeSelectedTag(removeTag: Tag) {
        setSelectedTags(
            selectedTags.filter((tag) => tag.id !== removeTag.id)
        );
    }

    return (
        <div className="tag-container">
            <div className="selected-tags-and-list">
                <div className="selected-tags-container">
                    <div className="selected-text">
                        {selectedTags.length > 0 ? (
                            selectedTags.map((tag) => (
                                <div className="selected-tag" key={tag.id}>
                                    <button onClick={() => removeSelectedTag(tag)}>
                                        {tag.name}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <span className="selected-tag">
                                
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                        className="menu-arrow"
                        aria-label={isMenuOpen ? "Close tag menu" : "Open tag menu"}
                    >
                    <svg
                        className={isMenuOpen ? "dropdown-down-icon open" : "dropdown-down-icon"}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 640 640"
                        aria-hidden="true"
                    >
                        <path d="M297.4 438.6C309.9 451.1 330.2 451.1 342.7 438.6L502.7 278.6C515.2 266.1 515.2 245.8 502.7 233.3C490.2 220.8 469.9 220.8 457.4 233.3L320 370.7L182.6 233.4C170.1 220.9 149.8 220.9 137.3 233.4C124.8 245.9 124.8 266.2 137.3 278.7L297.3 438.7z" />
                    </svg>
                    </button>
                </div>

                {isMenuOpen && (
                    <div className="tag-list">
                        {availableTags.length > 0 ? (
                            availableTags.map((tag) => (
                                <div className="tag-text" key={tag.id}>
                                    <button onClick={() => {
                                        addSelectedTag(tag)
                                    }}>
                                        {tag.name}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <span className="tag-text">
                                No Tags
                            </span>
                        )}
                    </div>
                )}
            </div>

            <button className="tag-button" onClick={() => setIsDialogOpen(true)}>
                +
            </button>
            {isDialogOpen && (
                <TagDialog
                    onSave={async () => {
                        await loadTags();
                    }}
                    onClose={() => {
                        setIsDialogOpen(false);
                    }}
                />
            )}
        </div>
    )
}