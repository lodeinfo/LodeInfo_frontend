import React, { useState } from "react";
import { CopyOutlined, CheckOutlined, EditOutlined } from "@ant-design/icons";
import { Input } from "antd";
import "../Styles/UserMessage.css";

const { TextArea } = Input;

const UserMessage = ({ content, index, onEdit }) => {
    const [hovered, setHovered] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(content);

    const handleCopy = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(content).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleStartEdit = (e) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditContent(content);
    };

    const handleSaveEdit = () => {
        if (editContent.trim() && editContent !== content) {
            onEdit(index, editContent);
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditContent(content);
    };

    return (
        <div
            className={`chat-bubble-user user-message-container ${isEditing ? "editing-mode" : ""}`}
            onMouseEnter={() => !isEditing && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {isEditing ? (
                <TextArea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onPressEnter={(e) => {
                        if (!e.shiftKey) {
                            e.preventDefault();
                            handleSaveEdit();
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") handleCancelEdit();
                    }}
                    autoSize={{ minRows: 1, maxRows: 6 }}
                    className="user-edit-textarea"
                    autoFocus
                    onBlur={handleCancelEdit}
                />
            ) : (
                <>
                    {content}
                    {hovered && (
                        <div className="user-message-actions">
                            <button
                                onClick={handleCopy}
                                title="Copy message"
                                className={`user-message-action-btn ${copied ? "copied" : ""}`}
                            >
                                {copied ? <CheckOutlined /> : <CopyOutlined />}
                            </button>
                            <button
                                onClick={handleStartEdit}
                                title="Edit prompt"
                                className="user-message-action-btn"
                            >
                                <EditOutlined />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default UserMessage;
