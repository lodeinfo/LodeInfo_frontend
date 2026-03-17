import React, { forwardRef } from "react";
import { Flex } from "antd";
import UserMessage from "./UserMessage";
import AIMessage from "./AIMessage";
import LoadingMessage from "./LoadingMessage";

const MessageList = forwardRef(
    ({ conversation, loading, thinkingText, selectedModel, selectedTopic, onEditMessage }, ref) => {
        return (
            <div className="messages-wrapper">
                <Flex vertical gap="large">
                    {conversation.map((msg, index) => (
                        <div
                            key={index}
                            className={`message-row ${msg.type === "user"
                                ? "message-row-user"
                                : "message-row-ai"
                                }`}
                        >
                            {msg.type === "user" ? (
                                <UserMessage
                                    content={msg.content}
                                    index={index}
                                    onEdit={onEditMessage}
                                />
                            ) : (
                                <AIMessage
                                    content={msg.content}
                                    sources={msg.sources}
                                    createdAt={msg.created_at}
                                    selectedModel={msg.model}
                                />
                            )}
                        </div>
                    ))}

                    {loading && (
                        <LoadingMessage
                            thinkingText={thinkingText}
                            selectedModel={selectedModel}
                            isKnowledgeBase={!!selectedTopic}
                        />
                    )}
                </Flex>
                <div ref={ref} />
            </div>
        );
    }
);

MessageList.displayName = "MessageList";
export default MessageList;
