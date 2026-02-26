import React from "react";
import { Flex } from "antd";
import { RobotOutlined, FileTextOutlined } from "@ant-design/icons";
import modelsData from "../models_data.json";

const LoadingMessage = ({ thinkingText, selectedModel, isKnowledgeBase = false }) => {
    const modelIcon = modelsData.find(
        m => m.id === selectedModel
    )?.icon;

    return (
        <div className="message-row message-row-ai">
            <div className="ai-header">
                <div className="ai-avatar">LI</div>
                <span className="ai-name">LodeInfo AI</span>
            </div>

            <div className="chat-card-ai loading-card">
                <Flex gap="small" align="center">
                    {isKnowledgeBase ? (
                        <RobotOutlined />
                    ) : modelIcon ? (
                        <img
                            src={modelIcon}
                            width="18"
                            height="18"
                            alt="model"
                        />
                    ) : (
                        <RobotOutlined />
                    )}


                    <span className="loading-text">{thinkingText}</span>
                </Flex>
            </div>
        </div>
    );
};

export default LoadingMessage;
