import React, { useState } from "react";
import { CopyOutlined, CheckOutlined, EditOutlined, SendOutlined, CloseOutlined } from "@ant-design/icons";
import { Input, Button, Space } from "antd";
import "../Styles/UserMessage.css";

const UserMessage = ({ content, index, onEdit, onUpdate }) => {
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(content);

    // Ensure editContent is synced if content prop changes
    React.useEffect(() => {
        setEditContent(content);
    }, [content]);

    const handleCopy = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(content).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleUpdate = () => {
        if (editContent.trim() && editContent !== content) {
            onUpdate(index, editContent);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditContent(content);
        setIsEditing(false);
    };

    return (
        <div className={`user-message-container ${isEditing ? 'editing-mode' : ''}`}>
            <div className={`chat-bubble-user ${isEditing ? 'bubble-editing' : ''}`}>
                {isEditing ? (
                    <div className="edit-container">
                        <Input.TextArea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            autoSize={{ minRows: 1, maxRows: 10 }}
                            className="edit-textarea"
                            variant="borderless"
                        />
                        <div className="edit-actions-footer">
                            <Space size="small">
                                <Button 
                                    size="small" 
                                    type="text" 
                                    icon={<CloseOutlined />} 
                                    onClick={handleCancel}
                                    className="edit-cancel-btn"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    size="small" 
                                    type="primary" 
                                    icon={<SendOutlined />} 
                                    onClick={handleUpdate}
                                    className="edit-send-btn"
                                >
                                    Send
                                </Button>
                            </Space>
                        </div>
                    </div>
                ) : (
                    content
                )}
            </div>
            {!isEditing && (
                <div className="user-actions-row">
                    <div onClick={handleCopy} title="Copy message" style={{ cursor: "pointer" }}>
                        {copied ? <CheckOutlined style={{ color: "#4caf50" }} /> : <CopyOutlined />}
                    </div>
                    <div onClick={() => setIsEditing(true)} title="Edit prompt" style={{ cursor: "pointer" }}>
                        <EditOutlined />
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMessage;
