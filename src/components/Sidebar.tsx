import { useState } from "react";
import type { View } from "../types/view"
import { sidebarSections } from "../types/view"
import { sidebarSectionId } from "../types/view";
import "./sidebar.css"
import type { SidebarInfo } from "../types/sidebarInfo"
import type { Tag } from "../types/tag"

type SidebarProps = {
    currentView: View;
    onSelectView: (view: View) => void;
    selectedTagId: number | null;
    onSelectTagId: (tag_id: number) => void;
    info: SidebarInfo;
    tags: Tag[];
    tagTaskCounts: Map<number, number>;
}

function Sidebar({currentView, onSelectView, selectedTagId, onSelectTagId, info, tags, tagTaskCounts}: SidebarProps) {
    const [isAccordionOpen, setIsAccordionOpen] = useState<Record<sidebarSectionId, boolean>>({
        tasks: true,
        ai: true,
        tags: true,
        settings: true,
    });

    function toggleSection(sectionId: sidebarSectionId) {
        setIsAccordionOpen((prev) => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }));
    }

    return(
        <aside className="sidebar">
            <nav className="sidebar-nav">
                <section className="sidebar-section">
                    {sidebarSections.map((section) => (
                        <div key={section.label}>
                            <div className="sidebar-label-container">
                                <button 
                                    type="button" 
                                    className="accordion-btn" 
                                    onClick={() => toggleSection(section.id)}
                                    aria-label={
                                        isAccordionOpen[section.id]
                                            ? `Close ${section.label} section`
                                            : `Open ${section.label} section`
                                    }
                                >
                                    <h2>{section.label}</h2>
                                    <svg
                                        className={isAccordionOpen[section.id] ? "dropdown-right-icon open" : "dropdown-right-icon"}
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 640 640"
                                        aria-hidden="true"
                                    >
                                        <path d="M439.1 297.4C451.6 309.9 451.6 330.2 439.1 342.7L279.1 502.7C266.6 515.2 246.3 515.2 233.8 502.7C221.3 490.2 221.3 469.9 233.8 457.4L371.2 320L233.9 182.6C221.4 170.1 221.4 149.8 233.9 137.3C246.4 124.8 266.7 124.8 279.2 137.3L439.2 297.3z"/>
                                    </svg>
                                </button>
                            </div>
                            {section.id === "tags" ? (
                                tags.map((tag) => (
                                    <div className={`sidebar-section-item ${isAccordionOpen[section.id] ? "open" : "closed"}`}>
                                        <button
                                            key={tag.id}
                                            type="button"
                                            className={currentView === "tag" && selectedTagId === tag.id ? "active" : ""}
                                            onClick={() => {
                                                onSelectTagId(tag.id);
                                            }}
                                        >
                                            <span className="sidebar-label">{tag.name}</span>

                                            <span className="sidebar-item-meta">
                                            <span className="sidebar-count">{tagTaskCounts.get(tag.id) ?? 0}</span>
                                            </span>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                section.items.map((item) => (
                                    <div className={`sidebar-section-item ${isAccordionOpen[section.id] ? "open" : "closed"}`}>
                                        <button
                                            key={item.value}
                                            type="button"
                                            className={currentView === item.value ? "active" : ""}
                                            onClick={() => onSelectView(item.value)}
                                        >
                                            <span className="sidebar-label">{item.label}</span>
                                            <span className="sidebar-item-meta">
                                            {item.showNotification && info[item.value]?.hasNotification && (
                                                <span className="sidebar-dot" />
                                            )}

                                            {item.showCount && typeof info[item.value]?.count === "number" && (
                                                <span className="sidebar-count">{info[item.value]?.count}</span>
                                            )}
                                            </span>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    ))}
                </section>
            </nav>
        </aside>
    );
}

export default Sidebar;