import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MessageOutlined, PartitionOutlined, CompressOutlined, UnorderedListOutlined, TranslationOutlined, TagOutlined, RightOutlined } from "@ant-design/icons"; // Added Icons for Actions
import { message } from "antd"; // Added message
import InputBar from "../components/InputBar";
import MessageList from "../components/MessageList";
import useShortcuts from "../hooks/useShortcuts";
import { useAuth } from "../contexts/AuthContext";
import TopicModal from "../components/TopicModal"; // Added TopicModal
import "../Styles/QuickInput.css";

const API = import.meta.env.VITE_API_BASE_URL;
console.log("Current API Endpoint:", API);

/* ✅ TRUE DEFAULT MODEL */
const DEFAULT_MODEL = "gemini-3-flash-preview";
const STORAGE_KEY = "quickInputModel";

export default function QuickInput() {
    const { user } = useAuth();

    const [question, setQuestion] = useState("");
    const [conversation, setConversation] = useState([]);
    const [capturedContext, setCapturedContext] = useState(null);
    const [loading, setLoading] = useState(false);
    const [thinkingText, setThinkingText] = useState("Thinking");

    const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
    const [threads, setThreads] = useState([]);
    const [selectedThread, setSelectedThread] = useState(null);

    const [modelMode, setModelMode] = useState("fast");
    const [modelModalOpen, setModelModalOpen] = useState(false);

    /* ✅ TOPIC STATE (NEW) */
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [topicModalOpen, setTopicModalOpen] = useState(false);
    const [topicPage, setTopicPage] = useState(1);
    const [topicHasMore, setTopicHasMore] = useState(true);
    const [topicSearchQuery, setTopicSearchQuery] = useState("");
    const [topicsLoading, setTopicsLoading] = useState(false);
    const [newTopicName, setNewTopicName] = useState("");
    const [pastedText, setPastedText] = useState("");
    const [fileToUpload, setFileToUpload] = useState(null);
    const [uploading, setUploading] = useState(false);

    /* ✅ Smart Topic Dropdown state */
    const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);
    const [topicInputValue, setTopicInputValue] = useState("");
    const topicDropdownRef = useRef(null);

    /* ✅ NEW → Translation Interface State */
    const [translateOverlayOpen, setTranslateOverlayOpen] = useState(false);
    const [translateSourceText, setTranslateSourceText] = useState("");
    const [translateTargetLang, setTranslateTargetLang] = useState("English");
    const [translateSourceLang, setTranslateSourceLang] = useState("Detect Language");

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const [intent, setIntent] = useState("manual");

    // Correctly initialize intent from URL inside useEffect
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const detectedIntent = params.get("intent");
        if (detectedIntent) {
            setIntent(detectedIntent);
        }
    }, []);

    useEffect(() => {
        const fetchThreads = async () => {
            if (!user?.id) return;
            try {
                const res = await axios.get(`${API}/threads/`, {
                    params: { user_id: user.id, intent: intent } // Pass intent to filter history
                });
                setThreads(res.data);
            } catch (err) {
                console.error("Failed to fetch threads:", err);
            }
        };

        checkContext();
        fetchThreads();
        fetchTopics(1, "", true); // Fetch topics on mount
    }, [user?.id, intent]);

    /* ✅ TOPIC METHODS (NEW) */
    const fetchTopics = async (page = 1, search = "", reset = false) => {
        if (topicsLoading) return;
        setTopicsLoading(true);
        try {
            const res = await axios.get(`${API}/topics/`, {
                params: { page, search }
            });
            const newTopics = res.data.results || [];
            setTopics(prev => (reset ? newTopics : [...prev, ...newTopics]));
            setTopicHasMore(!!res.data.next);
            setTopicPage(page);
        } catch (err) {
            console.error(err);
        } finally {
            setTopicsLoading(false);
        }
    };

    const loadMoreTopics = () => {
        if (topicHasMore && !topicsLoading) {
            fetchTopics(topicPage + 1, topicSearchQuery, false);
        }
    };

    const handleTopicSearch = (query) => {
        setTopicSearchQuery(query);
        fetchTopics(1, query, true);
    };

    const handleTopicCreate = async (name) => {
        try {
            const res = await axios.post(`${API}/topics/`, { name });
            message.success("Knowledge Base topic created");
            fetchTopics(1, topicSearchQuery, true);
            return res.data;
        } catch (err) {
            console.error(err);
            message.error("Failed to create topic");
            return null;
        }
    };

    const handleDocumentUpload = async (file, topicId) => {
        if (file.isText) {
            const payload = {
                topic: topicId,
                title: (file.name || "document").toLowerCase().endsWith(".txt")
                    ? (file.name || "document")
                    : `${file.name || "document"}.txt`,
                content: file.content,
                user_id: user.id
            };
            try {
                await axios.post(`${API}/documents/`, payload);
                message.success("Text stored & embedded successfully");
                return true;
            } catch (err) {
                console.error("TEXT UPLOAD ERROR:", err.response?.data || err);
                message.error("Failed to store text");
                return false;
            }
        }
        const formData = new FormData();
        formData.append("topic", topicId);
        formData.append("title", file.name);
        formData.append("file", file);
        formData.append("user_id", user.id);
        try {
            await axios.post(`${API}/documents/`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            message.success("Document uploaded successfully");
            return true;
        } catch (err) {
            console.error(err.response?.data || err);
            message.error("Failed to upload document");
            return false;
        }
    };

    /* ✅ NEW → Separate context check that respects intent */
    const checkContext = async () => {
        if (intent !== "contextual") {
            setCapturedContext(null);
            return;
        }
        try {
            const res = await axios.get(`${API}/context/latest/`);
            if (res.data?.context) {
                setCapturedContext(res.data);
            } else {
                setCapturedContext(null);
            }
        } catch (e) {
            console.error("Failed to check context:", e);
            setCapturedContext(null);
        }
    };

    /* ✅ ADDED → Electron IPC Listener (CRITICAL) */
    useEffect(() => {
        if (!window.electronAPI?.onContextData) return;

        const unsubscribe = window.electronAPI.onContextData((payload) => {
            console.log("✅ Context data received:", payload);

            if (payload?.intent) {
                setIntent(payload.intent);
            }

            if (payload?.prefill) {
                setQuestion(payload.prefill);
            }
        });

        return unsubscribe;
    }, []);

    /* ✅ Existing model sync (unchanged) */
    useEffect(() => {
        const syncModel = () => {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (saved) {
                setSelectedModel(saved);
            } else {
                setSelectedModel(DEFAULT_MODEL);
            }
        };

        window.addEventListener("focus", syncModel);
        syncModel();

        return () => window.removeEventListener("focus", syncModel);
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, selectedModel);
    }, [selectedModel]);

    useEffect(() => {
        let interval;
        if (loading) {
            interval = setInterval(() => {
                setThinkingText(prev =>
                    prev.endsWith("...") ? prev.replace(/\.+$/, "") : prev + "."
                );
            }, 500);
        } else {
            setThinkingText("Thinking");
        }
        return () => clearInterval(interval);
    }, [loading]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversation, loading]);

    // Close topic dropdown when clicking outside
    useEffect(() => {
        if (!topicDropdownOpen) return;
        const handleClickOutside = (e) => {
            if (topicDropdownRef.current && !topicDropdownRef.current.contains(e.target)) {
                setTopicDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [topicDropdownOpen]);

    /* ✅ NEW → Sync Translation Source when Topic changes */
    useEffect(() => {
        if (translateOverlayOpen && selectedTopic) {
            const fetchTopicContent = async () => {
                try {
                    const res = await axios.get(`${API}/documents/`, {
                        params: { topic: selectedTopic.id }
                    });
                    const fullText = res.data.map(doc => doc.content).join("\n\n");
                    setTranslateSourceText(fullText);
                } catch (e) {
                    console.error("Failed to sync topic content for translation:", e);
                }
            };
            fetchTopicContent();
        }
    }, [selectedTopic, translateOverlayOpen]);

    const selectThread = async (thread) => {
        setSelectedThread(thread);
        setLoading(true);
        try {
            const res = await axios.get(`${API}/messages/`, {
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
        } catch (err) {
            console.error("Failed to fetch thread messages:", err);
        } finally {
            setLoading(false);
        }
    };

    useShortcuts({
        onNewChat: () => {
            setConversation([]);
            setQuestion("");
            setSelectedThread(null);
        },

        onChangeModel: () => {
            setModelModalOpen(true);
        },

        onTopic: () => {
            setTopicModalOpen(true);
        },
        onSearch: () => { }
    });

    /* ✅ ADDED → Safe Focus Helper */
    const focusInput = () => {
        inputRef.current?.resizableTextArea?.textArea?.focus();
    };

    /* ✅ Optional helper for contextual actions */
    const applyContextAction = async (action) => {
        if (intent !== "contextual") return;

        if (action === "summarize") {
            setThinkingText("Summarizing");
            handleAsk("Summarize this page/context.");
        }

        if (action === "takeaways") {
            setThinkingText("Getting key takeaways");
            handleAsk("Give me the key takeaways from this page/context.");
        }

        if (action === "translate") {
            setTranslateOverlayOpen(true);
            // If a topic is selected, fetch its content
            if (selectedTopic) {
                try {
                    const res = await axios.get(`${API}/documents/`, {
                        params: { topic: selectedTopic.id }
                    });
                    // Combine all document contents for that topic
                    const fullText = res.data.map(doc => doc.content).join("\n\n");
                    setTranslateSourceText(fullText);
                } catch (e) {
                    console.error("Failed to fetch topic content for translation:", e);
                }
            }
        }
    };

    const handleAsk = async (overrideQuestion = null) => {
        const finalQuestion = overrideQuestion || question;
        if (!finalQuestion.trim()) return;

        const userMessage = { type: "user", content: finalQuestion };
        setConversation(prev => [...prev, userMessage]);

        if (!overrideQuestion) {
            setQuestion("");
        }
        setLoading(true);

        try {
            const res = await axios.post(`${API}/ask/`, {
                question: finalQuestion,
                user_id: user?.id,
                thread_id: selectedThread?.id,
                topic_id: selectedTopic?.id, // Pass topic if selected
                model: selectedModel,
                mode: modelMode,
                intent: intent // Pass intent to categorize history
            });

            const aiMessage = {
                type: "ai",
                content: res.data.answer,
                sources: res.data.sources,
                model: selectedModel,
            };

            setConversation(prev => [...prev, aiMessage]);

            // If a new thread was created, refresh the sidebar threads
            if (!selectedThread?.id && res.data.thread_id) {
                const threadRes = await axios.get(`${API}/threads/${res.data.thread_id}/`);
                setSelectedThread(threadRes.data);

                // Refresh threads list
                const tRes = await axios.get(`${API}/threads/`, {
                    params: { user_id: user?.id, intent: intent } // Correctly filter the refreshed list
                });
                setThreads(tRes.data);
            }
        } catch {
            setConversation(prev => [
                ...prev,
                { type: "ai", content: "Sorry, something went wrong." },
            ]);
        } finally {
            setLoading(false);
            setThinkingText("Thinking"); // Reset to default
            checkContext(); // Use the guard-protected helper
        }
    };

    const isChatEmpty = conversation.length === 0;

    return (
        <div className="quick-input-window">
            <TopicModal
                open={topicModalOpen}
                onClose={() => setTopicModalOpen(false)}
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
                        let topicId = selectedTopic?.id;
                        if (!topicId) {
                            const createdTopic = await handleTopicCreate(newTopicName);
                            topicId = createdTopic.id;
                        }
                        const effectiveTopicName =
                            topics.find(t => t.id === topicId)?.name || newTopicName;

                        if (pastedText.trim()) {
                            await handleDocumentUpload(
                                {
                                    name: effectiveTopicName + ".txt",
                                    content: pastedText,
                                    isText: true
                                },
                                topicId
                            );
                        }
                        if (fileToUpload) {
                            await handleDocumentUpload(fileToUpload, topicId);
                        }
                        setPastedText("");
                        setFileToUpload(null);
                    } catch (e) {
                        console.error("Topic submit failed:", e);
                    } finally {
                        setUploading(false);
                    }
                }}
                allTopics={topics}
                pickedTopicId={selectedTopic?.id || null}
                setPickedTopicId={(id) => {
                    const t = topics.find(topic => topic.id === id);
                    setSelectedTopic(t || null);
                }}
                setTopic={setSelectedTopic}
                onTopicSearch={handleTopicSearch}
                onLoadMoreTopics={loadMoreTopics}
                hasMoreTopics={topicHasMore}
                loadingTopics={topicsLoading}
                isCompact={true}
            />

            {intent === "contextual" && capturedContext && (
                <div className="qi-context-bar">
                    <div className="qi-context-bar-left">
                        <span className="qi-context-bar-globe">🌐</span>
                        <span className="qi-context-bar-title-text">Talking about: <b className="qi-context-bar-title-bold">{capturedContext.title}</b></span>
                    </div>

                    <div className="qi-context-bar-right">
                        {/* ✅ Smart Topic Dropdown Button */}
                        <div ref={topicDropdownRef} className="qi-topic-dropdown-wrapper">
                            <button
                                onClick={() => {
                                    setTopicDropdownOpen(prev => !prev);
                                    setTopicInputValue("");
                                }}
                                className={`qi-topic-btn${topicDropdownOpen ? " open" : ""}`}
                            >
                                {selectedTopic ? selectedTopic.name : "Topics"}
                                <span className="qi-topic-btn-arrow">▾</span>
                            </button>

                            {topicDropdownOpen && (() => {
                                // --- Build context-derived suggestions ---
                                const rawTitle = capturedContext?.title || "";
                                // Split by common delimiters and clean up
                                const derivedSuggestions = rawTitle
                                    .split(/[-|:•]/)
                                    .map(s => s.trim())
                                    .filter(s => s.length > 2 && !/^(http|www|com|net|org)/i.test(s));

                                const searchLower = topicInputValue.toLowerCase();

                                // 1. Map suggestions to existing topics or "new" status
                                const autoSuggestedItems = derivedSuggestions.map(name => {
                                    const existing = topics.find(t => t.name.toLowerCase() === name.toLowerCase());
                                    return {
                                        name,
                                        id: existing?.id || null,
                                        isNew: !existing,
                                        type: "suggestion"
                                    };
                                });

                                // 2. Get existing topics for general search
                                const searchItems = topics
                                    .filter(t => !derivedSuggestions.some(s => s.toLowerCase() === t.name.toLowerCase()))
                                    .map(t => ({ ...t, type: "global" }));

                                // 3. Filter and Merge
                                let combined = [...autoSuggestedItems, ...searchItems];
                                if (searchLower) {
                                    combined = combined.filter(item => item.name.toLowerCase().includes(searchLower));
                                } else {
                                    // Limit to top suggestions + some global if no search
                                    combined = combined.slice(0, 15);
                                }

                                const exactMatch = combined.some(item => item.name.toLowerCase() === searchLower);
                                const canCreateCustom = searchLower.trim().length > 0 && !exactMatch;

                                return (
                                    <div className="qi-topic-dropdown">
                                        {/* Search input */}
                                        <div className="qi-topic-search-box">
                                            <input
                                                autoFocus
                                                placeholder="Search or create topic..."
                                                value={topicInputValue}
                                                onChange={e => setTopicInputValue(e.target.value)}
                                                className="qi-topic-search-input"
                                            />
                                        </div>

                                        {/* Topic list */}
                                        <div className="qi-topic-list">
                                            {!searchLower && autoSuggestedItems.length > 0 && (
                                                <div className="qi-topic-section-label">
                                                    Page Suggestions
                                                </div>
                                            )}

                                            {combined.length === 0 && !canCreateCustom && (
                                                <div className="qi-topic-empty">
                                                    No topics found
                                                </div>
                                            )}

                                            {combined.map((item, idx) => {
                                                const isSelected = selectedTopic?.id && item.id === selectedTopic.id;
                                                return (
                                                    <div
                                                        key={item.id || `suggestion-${idx}`}
                                                        onClick={async () => {
                                                            const isAlreadySelected = selectedTopic?.id && item.id === selectedTopic.id;
                                                            if (isAlreadySelected) {
                                                                setSelectedTopic(null);
                                                            } else if (item.isNew) {
                                                                const created = await handleTopicCreate(item.name);
                                                                if (created) setSelectedTopic(created);
                                                            } else {
                                                                const topicObj = topics.find(t => t.id === item.id) || item;
                                                                setSelectedTopic(topicObj);
                                                            }
                                                            setTopicDropdownOpen(false);
                                                        }}
                                                        className={`qi-topic-item${isSelected ? " selected" : ""}`}
                                                    >
                                                        <div className="qi-topic-item-inner">
                                                            <span className="qi-topic-item-icon">
                                                                {item.type === "suggestion" ? "🌐" : "●"}
                                                            </span>
                                                            <span className="qi-topic-item-name">
                                                                {item.name}
                                                            </span>
                                                        </div>
                                                        {item.isNew && (
                                                            <span className="qi-topic-create-tag">
                                                                Create
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {/* Custom Create option */}
                                            {canCreateCustom && (
                                                <div
                                                    onClick={async () => {
                                                        const created = await handleTopicCreate(topicInputValue.trim());
                                                        if (created) setSelectedTopic(created);
                                                        setTopicDropdownOpen(false);
                                                    }}
                                                    className={`qi-topic-custom-create${combined.length === 0 ? " qi-topic-custom-create-no-border" : ""}`}
                                                >
                                                    <span>+</span>
                                                    Create "{topicInputValue.trim()}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* ✅ SHIFTED → Ask Anything button moved here */}
                        <button onClick={focusInput} className="qi-ask-anything-btn">
                            <span>☀</span>
                            Ask Anything
                        </button>
                    </div>
                </div>
            )}

            {/* Active Chat (Messages) - Above InputBar */}
            {!isChatEmpty && (
                <div className="quick-chat-scroll qi-chat-scroll-wrapper">
                    <MessageList
                        ref={messagesEndRef}
                        conversation={conversation}
                        loading={loading}
                        thinkingText={thinkingText}
                        selectedModel={selectedModel}
                    />
                </div>
            )}

            {/* ✅ NEW → Simplified Translation UI */}
            {translateOverlayOpen && (
                <div className="qi-translate-overlay-outer">
                    <div className="qi-translate-overlay-card">
                        {/* Header: Target Language Selector Only */}
                        <div className="qi-translate-lang-header">
                            <div className="qi-translate-lang-label">
                                Translate to:
                            </div>
                            <select
                                value={translateTargetLang}
                                onChange={e => setTranslateTargetLang(e.target.value)}
                                className="qi-translate-lang-select"
                            >
                                <option value="English">English</option>
                                <option value="Spanish">Spanish</option>
                                <option value="French">French</option>
                                <option value="German">German</option>
                                <option value="Chinese">Chinese</option>
                                <option value="Japanese">Japanese</option>
                                <option value="Hindi">Hindi</option>
                                <option value="Gujarati">Gujarati</option>
                                <option value="Russian">Russian</option>
                                <option value="Portuguese">Portuguese</option>
                                <option value="Arabic">Arabic</option>
                            </select>
                        </div>

                        {/* Content: Single Text Area */}
                        <div className="qi-translate-textarea-wrapper">
                            <textarea
                                placeholder="Enter text or select a topic..."
                                value={translateSourceText}
                                onChange={e => setTranslateSourceText(e.target.value)}
                                className="qi-translate-textarea"
                            />
                        </div>

                        {/* Actions: Send & Close */}
                        <div className="qi-translate-actions">
                            <button
                                onClick={() => setTranslateOverlayOpen(false)}
                                className="qi-translate-cancel-btn"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (!translateSourceText.trim()) return;
                                    setThinkingText(`Translating to ${translateTargetLang}`);
                                    handleAsk(`Translate the following text to ${translateTargetLang} (auto-detect source language):\n\n${translateSourceText}`);
                                    setTranslateOverlayOpen(false);
                                }}
                                className="qi-translate-send-btn"
                            >
                                Translate & Send
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="quick-input-bottom qi-input-bottom">
                <InputBar
                    inputRef={inputRef}
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

            {/* Divider After InputBox (Only in empty contextual state) */}
            {isChatEmpty && intent === "contextual" && (
                <div className="qi-divider-wrapper">
                    <div className="qi-divider-line" />
                </div>
            )}

            {/* Vertical Action Menu */}
            {intent === "contextual" && isChatEmpty && (
                <div className="quick-vertical-actions qi-actions-outer">
                    <div
                        onClick={() => applyContextAction("summarize")}
                        className="qi-action-item"
                    >
                        <CompressOutlined className="qi-action-icon" />
                        <span>Summarize</span>
                    </div>

                    <div onClick={() => applyContextAction("takeaways")} className="qi-action-item">
                        <UnorderedListOutlined className="qi-action-icon" />
                        <span>Get key takeaways</span>
                    </div>

                    <div onClick={() => applyContextAction("translate")} className="qi-action-item">
                        <TranslationOutlined className="qi-action-icon" />
                        <span>Translate...</span>
                        <RightOutlined className="qi-action-arrow" />
                    </div>
                </div>
            )}

            {/* Divider After Actions (Only in empty contextual state) */}
            {isChatEmpty && intent === "contextual" && (
                <div className="qi-divider-wrapper-bottom">
                    <div className="qi-divider-line" />
                </div>
            )}

            {isChatEmpty && threads.length > 0 && (
                <div className="quick-chat-scroll qi-recent-scroll">
                    {/* Only show top divider if NOT contextual (if contextual, the menu has its own dividers) */}
                    {intent !== "contextual" && (
                        <div className="qi-top-divider-wrapper">
                            <div className="qi-divider-line-mb" />
                        </div>
                    )}

                    <div className="quick-recent-chats qi-recent-chats-wrapper">
                        <div className="quick-section-title qi-section-title-mb">
                            Recent Chats
                        </div>
                        <div className="quick-threads-list">
                            {threads.slice(0, 5).map((thread) => (
                                <div
                                    key={thread.id}
                                    className={`quick-thread-item qi-thread-item-nudge ${selectedThread?.id === thread.id ? "active" : ""}`}
                                    onClick={() => selectThread(thread)}
                                >
                                    <MessageOutlined />
                                    <span className="quick-thread-title">{thread.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
}