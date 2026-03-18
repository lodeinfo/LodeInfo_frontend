import React, { useState } from "react";
import { DatabaseOutlined, FileTextOutlined, RobotOutlined, CopyOutlined, CheckOutlined, LikeOutlined, DislikeOutlined, ReloadOutlined } from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import modelsData from "../models_data.json";

const AIMessage = ({ content, sources, createdAt, selectedModel, onFeedback, onRedo, messageId }) => {
    const modelInfo = selectedModel
        ? modelsData.find(m => m.id === selectedModel)
        : null;

    const [hovered, setHovered] = useState(false);
    const [copied, setCopied] = useState(false);
    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div
            className="ai-message-container"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ position: "relative" }}
        >
            <div className="ai-header">
                <div className="ai-avatar">LI</div>
                <span className="ai-name">LodeInfo AI</span>
                <span className="ai-time">
                    {createdAt
                        ? new Date(createdAt).toLocaleString([], {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })
                        : "Just now"}
                </span>
            </div>

            <div className="chat-card-ai">
                <div className="ai-content">
                    <div className="ai-content-icon">
                        {/* Only show folder/file icon if it's strictly a Knowledge Base response */}
                        {sources && sources.some(s => s.document_id !== 'browser_context_id') ? (
                            <FileTextOutlined
                                className="accent-icon"
                                title="Answered from knowledge base"
                            />
                        ) : modelInfo ? (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                            >
                                <img
                                    src={modelInfo.icon}
                                    width="18"
                                    height="18"
                                    alt={modelInfo.name}
                                />
                                <span
                                    style={{
                                        fontSize: "12px",
                                        opacity: 0.7,
                                    }}
                                >
                                    {modelInfo.name}
                                </span>
                            </div>
                        ) : (
                            <RobotOutlined className="accent-icon" />
                        )}
                    </div>

                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>

                {/* Only show source tags footer if strictly Knowledge Base sources exist */}
                {sources && sources.some(s => s.document_id !== 'browser_context_id') && (
                    <div className="ai-sources-wrapper">
                        <div className="ai-sources-flex">
                            {[...new Set(sources.filter(s => s.document_id !== 'browser_context_id').map(s => s.source))].map(
                                (source, i) => (
                                    <div key={i} className="source-tag">
                                        <DatabaseOutlined />
                                        {source}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Feedback & Actions Row */}
            <div className="ai-actions-row" style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginTop: "18px",
                paddingLeft: "38px", // Matches avatar/content alignment
                color: "#9ca3af", // Neutral grey
                fontSize: "15px",
                opacity: 0.8
            }}>
                <LikeOutlined 
                    onClick={() => {
                        setLiked(!liked);
                        setDisliked(false);
                        if (onFeedback) onFeedback(messageId, 'like');
                    }}
                    style={{ cursor: "pointer", color: liked ? "#1677ff" : "inherit", transition: "all 0.2s" }}
                    className="feedback-icon"
                    title="Like"
                />
                <DislikeOutlined 
                    onClick={() => {
                        setDisliked(!disliked);
                        setLiked(false);
                        if (onFeedback) onFeedback(messageId, 'dislike');
                    }}
                    style={{ cursor: "pointer", color: disliked ? "#ff4d4f" : "inherit", transition: "all 0.2s" }}
                    className="feedback-icon"
                    title="Dislike"
                />
                <ReloadOutlined 
                    onClick={onRedo}
                    style={{ cursor: "pointer", transition: "all 0.2s" }}
                    className="feedback-icon"
                    title="Try again"
                />
                <div onClick={handleCopy} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }} title="Copy">
                    {copied ? <CheckOutlined style={{ color: "#4caf50", fontSize: "14px" }} /> : <CopyOutlined style={{ fontSize: "15px" }} />}
                </div>
            </div>

        </div>
    );
};

export default AIMessage;
