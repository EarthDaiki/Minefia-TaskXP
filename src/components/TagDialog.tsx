import { useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import "./dialogRoot.css"
import "./TagDialog.css"

type tagDialogProps = {
    onSave: () => void
    onClose: () => void
}

function TagDialog({onSave, onClose}: tagDialogProps) {
    const [tagName, setTagName] = useState("");
    async function handleSave() {
        // save tagName
        if (tagName.trim() === "") {
            console.error("tagName is empty");
        } else {
            try {
                await invoke("add_tag",{
                    name: tagName.trim()
                });
                onSave();
                console.log("save tag");
            } catch (error) {
                console.error(String(error));
            }
        }
        onClose();
    }

    function handleCancel() {
        onClose();
    }

    return (
        <div className="overlay">
            <div className="dialog">
                <label htmlFor="name">Tag Name</label>
                <input 
                    className="tagName" 
                    id="name" 
                    value={tagName} 
                    onChange={(e) => setTagName(e.target.value)}
                />
                <div className="buttonContainer">
                    <button onClick={handleSave}>Save</button>
                    <button onClick={handleCancel}>Cancel</button>
                </div>
            </div>
        </div>
    )
}

export default TagDialog;