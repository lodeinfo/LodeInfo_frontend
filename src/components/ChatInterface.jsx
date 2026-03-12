import React, { useState, useRef, useEffect } from "react";
import { message } from "antd";
import axios from "axios";
import modelsData from "../models_data.json";
import "../Styles/ChatInterface.css";

import InputBar from "./InputBar";
import TopicModal from "./TopicModal";
import WelcomeScreen from "./WelcomeScreen";
import MessageList from "./MessageList";
import BrandingHeader from "./BrandingHeader";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ChatInterface = ({
    user,
    thread,
    topic,
    setTopic,
    allTopics,
    onTopicCreate,
    onUpload,
    sidebarCollapsed,
    onAskQuestion,
    topicModalTrigger,
    modelPickerTrigger,
    onTopicSearch,
    onLoadMoreTopics,
    hasMoreTopics,
    topicsLoading
}) => {
    const [question, setQuestion] = useState("");
    const [conversation, setConversation] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [pickedTopicId, setPickedTopicId] = useState(thread?.topic || topic?.id || null);
    const [thinkingText, setThinkingText] = useState("Thinking");
    const [modalOpen, setModalOpen] = useState(false);
    const [newTopicName, setNewTopicName] = useState("");
    const [pastedText, setPastedText] = useState("");
    const [selectedModel, setSelectedModel] = useState(modelsData[5].id);
    const [modelMode, setModelMode] = useState("fast");
    const [fileToUpload, setFileToUpload] = useState(null);
    const [modelModalOpen, setModelModalOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const lastThreadIdRef = useRef(null);

    useEffect(() => {
        let interval;
        if (loading) {
            interval = setInterval(() => {
                setThinkingText((prev) => {
                    if (prev === "Thinking...") return "Thinking";
                    return prev + ".";
                });
            }, 500);
        } else {
            setThinkingText("Thinking");
        }
        return () => clearInterval(interval);
    }, [loading]);

    useEffect(() => {
        setPickedTopicId(thread?.topic || topic?.id || null);
    }, [thread, topic]);

    useEffect(() => {
        if (topicModalTrigger > 0) {
            setModalOpen(prev => !prev);
        }
    }, [topicModalTrigger]);

    useEffect(() => {
        if (modelPickerTrigger > 0) {
            setModelModalOpen(prev => !prev);
        }
    }, [modelPickerTrigger]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (thread?.id && thread.id !== lastThreadIdRef.current) {
                lastThreadIdRef.current = thread.id;
                try {
                    const res = await axios.get(`${API_BASE_URL}/messages/`, {
                        params: { thread_id: thread.id }
                    });

                    const history = [];
                    res.data.forEach(msg => {
                        history.push({
                            type: "user",
                            content: msg.question,
                            created_at: msg.created_at
                        });
                        history.push({
                            type: "ai",
                            content: msg.answer,
                            sources: msg.sources,
                            created_at: msg.created_at,
                            model: msg.model
                        });
                    });
                    setConversation(history);
                } catch (error) {
                    console.error("Failed to fetch history:", error);
                }
            } else if (!thread) {
                if (lastThreadIdRef.current !== null) {
                    setConversation([]);
                    lastThreadIdRef.current = null;
                }
            }
        };

        fetchHistory();
    }, [thread, selectedModel]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversation, loading]);

    const handleAsk = async () => {
        if (!question.trim()) return;

        const userMessage = { type: "user", content: question };
        setConversation((prev) => [...prev, userMessage]);
        setLoading(true);
        const currentQuestion = question;
        setQuestion("");

        try {
            const response = await onAskQuestion(
                currentQuestion,
                thread?.id,
                pickedTopicId,
                selectedModel,
                modelMode
            );

            if (response) {
                const aiMessage = {
                    type: "ai",
                    content: response.answer,
                    sources: response.sources,
                    model: selectedModel
                };
                setConversation((prev) => [...prev, aiMessage]);
            } else {
                setConversation((prev) => [
                    ...prev,
                    { type: "ai", content: "Sorry, I encountered an error." },
                ]);
            }
        } catch (e) {
            setConversation((prev) => [
                ...prev,
                { type: "ai", content: "Sorry, I encountered an error." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const isChatEmpty = conversation.length === 0;

    return (
        <div className="chat-interface-container">
            <TopicModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                newTopicName={newTopicName}
                setNewTopicName={setNewTopicName}
                pastedText={pastedText}
                setPastedText={setPastedText}
                fileToUpload={fileToUpload}
                setFileToUpload={setFileToUpload}
                uploading={uploading}
                onSubmit={async () => {
                    if (!newTopicName.trim()) return;
                    try {
                        setUploading(true);
                        let topicId = pickedTopicId;
                        if (!topicId) {
                            const createdTopic = await onTopicCreate(newTopicName);
                            topicId = createdTopic.id;
                        }
                        const effectiveTopicName =
                            allTopics.find(t => t.id === topicId)?.name || newTopicName;

                        if (pastedText.trim()) {
                            await onUpload(
                                {
                                    name: effectiveTopicName + ".txt",
                                    content: pastedText,
                                    isText: true
                                },
                                topicId
                            );
                        }
                        if (fileToUpload) {
                            await onUpload(fileToUpload, topicId);
                        }
                        setPastedText("");
                        setFileToUpload(null);
                    } catch (e) {
                        console.error("Topic submit failed:", e);
                    } finally {
                        setUploading(false);
                    }
                }}
                allTopics={allTopics}
                pickedTopicId={pickedTopicId}
                setPickedTopicId={setPickedTopicId}
                setTopic={setTopic}
                onTopicSearch={onTopicSearch}
                onLoadMoreTopics={onLoadMoreTopics}
                hasMoreTopics={hasMoreTopics}
                loadingTopics={topicsLoading}
            />

            {/* ✅ Branding Header positioned relative to container */}
            {sidebarCollapsed && <BrandingHeader />}

            <div className="chat-scroll-area">
                <div
                    className={`chat-content-wrapper ${!thread && isChatEmpty
                        ? "chat-content-wrapper-empty"
                        : "chat-content-wrapper-filled"
                        }`}
                >
                    {!thread && isChatEmpty ? (
                        <WelcomeScreen
                            user={user}
                            question={question}
                            setQuestion={setQuestion}
                            handleAsk={handleAsk}
                            handleFileUpload={() => { }}
                            selectedModel={selectedModel}
                            setSelectedModel={setSelectedModel}
                            modelMode={modelMode}
                            setModelMode={setModelMode}
                            modelModalOpen={modelModalOpen}
                            setModelModalOpen={setModelModalOpen}
                        />
                    ) : (
                        <MessageList
                            ref={messagesEndRef}
                            conversation={conversation}
                            loading={loading}
                            thinkingText={thinkingText}
                            selectedModel={selectedModel}
                            selectedTopic={topic}
                        />
                    )}
                </div>
            </div>

            {!isChatEmpty && (
                <div className="bottom-input-wrapper">
                    <InputBar
                        question={question}
                        setQuestion={setQuestion}
                        handleAsk={handleAsk}
                        selectedModel={selectedModel}
                        setSelectedModel={setSelectedModel}
                        modelMode={modelMode}
                        setModelMode={setModelMode}
                        modelModalOpen={modelModalOpen}
                        setModelModalOpen={setModelModalOpen}
                    />
                </div>
            )}
        </div>
    );
};

export default ChatInterface;