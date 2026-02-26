import React from "react";
import { MessageOutlined } from "@ant-design/icons";

function SidebarMiddle({
    collapsed,
    isSearching,
    searchQuery,
    searchResults,
    threads,
    selectedThread,
    setSelectedThread
}) {
    return (
        <div className="recent-chats-scroll">
            {!collapsed && (
                <>
                    <div className="gemini-section-title">Recent Chats</div>
                    <div>
                        {(isSearching && searchQuery ? searchResults : threads).map((thread) => (
                            <div
                                key={thread.id}
                                className={`gemini-menu-item thread-item ${selectedThread?.id === thread.id ? "active" : ""}`}
                                onClick={() => setSelectedThread(thread)}
                                title={thread.title}
                            >
                                <MessageOutlined />
                                <span className="menu-item-text-ellipsis">
                                    {thread.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default SidebarMiddle;
