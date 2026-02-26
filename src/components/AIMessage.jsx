import React from "react";
import { DatabaseOutlined, FileTextOutlined, RobotOutlined } from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import modelsData from "../models_data.json";

const AIMessage = ({ content, sources, createdAt, selectedModel }) => {
    const modelInfo = selectedModel
        ? modelsData.find(m => m.id === selectedModel)
        : null;

    return (
        <div className="ai-message-container">
            <div className="ai-header">
                <div className="ai-avatar">LI</div>
                <span className="ai-name">LodeInfo AI</span>
                <span className="ai-time">
                    {createdAt
                        ? new Date(createdAt).toLocaleTimeString([], {
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
        </div>
    );
};

export default AIMessage;
