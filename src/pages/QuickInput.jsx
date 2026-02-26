import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MessageOutlined, PartitionOutlined, CompressOutlined, UnorderedListOutlined, TranslationOutlined, TagOutlined, RightOutlined } from "@ant-design/icons"; // Added Icons for Actions
import { message } from "antd"; // Added message
import InputBar from "../components/InputBar";
import MessageList from "../components/MessageList";
import useShortcuts from "../hooks/useShortcuts";
import { useAuth } from "../contexts/AuthContext";
import TopicModal from "../components/TopicModal"; // Added TopicModal

const API_BASE_URL = "http://localhost:8000/api";

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
                const res = await axios.get(`${API_BASE_URL}/threads/`, {
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
            const res = await axios.get(`${API_BASE_URL}/topics/`, {
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
            const res = await axios.post(`${API_BASE_URL}/topics/`, { name });
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
                await axios.post(`${API_BASE_URL}/documents/`, payload);
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
            await axios.post(`${API_BASE_URL}/documents/`, formData, {
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
            const res = await axios.get(`${API_BASE_URL}/context/latest/`);
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
                    const res = await axios.get(`${API_BASE_URL}/documents/`, {
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
                    const res = await axios.get(`${API_BASE_URL}/documents/`, {
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
            const res = await axios.post(`${API_BASE_URL}/ask/`, {
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
                const threadRes = await axios.get(`${API_BASE_URL}/threads/${res.data.thread_id}/`);
                setSelectedThread(threadRes.data);

                // Refresh threads list
                const tRes = await axios.get(`${API_BASE_URL}/threads/`, {
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
                <div style={{
                    padding: "8px 16px",
                    background: "rgba(33, 150, 243, 0.08)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    fontSize: "12px",
                    color: "#2196f3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between", // ✅ Align buttons to right
                    gap: "10px",
                    margin: "-16px -16px 12px -16px", // Flush with window Edges
                    borderRadius: "14px 14px 0 0"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "14px" }}>🌐</span>
                        <span style={{ letterSpacing: "0.3px" }}>Talking about: <b style={{ color: "#fff" }}>{capturedContext.title}</b></span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
                        {/* ✅ Smart Topic Dropdown Button */}
                        <div ref={topicDropdownRef} style={{ position: "relative" }}>
                            <button
                                onClick={() => {
                                    setTopicDropdownOpen(prev => !prev);
                                    setTopicInputValue("");
                                }}
                                style={{
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                    background: topicDropdownOpen ? "rgba(255,255,255,0.18)" : "rgba(255, 255, 255, 0.1)",
                                    color: "#fff",
                                    height: "30px",
                                    padding: "0 12px 0 14px",
                                    borderRadius: "15px",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px"
                                }}
                            >
                                {selectedTopic ? selectedTopic.name : "Topics"}
                                <span style={{ fontSize: "10px", opacity: 0.7, marginLeft: "2px" }}>▾</span>
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
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "36px",
                                            right: 0,
                                            width: "240px",
                                            background: "#302f2fff", // ✅ Original sidebar UI color
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: "12px",
                                            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                                            zIndex: 9999,
                                            overflow: "hidden"
                                        }}
                                    >
                                        {/* Search input */}
                                        <div style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                            <input
                                                autoFocus
                                                placeholder="Search or create topic..."
                                                value={topicInputValue}
                                                onChange={e => setTopicInputValue(e.target.value)}
                                                style={{
                                                    width: "100%",
                                                    background: "rgba(255,255,255,0.04)",
                                                    border: "1px solid rgba(255,255,255,0.08)",
                                                    borderRadius: "8px",
                                                    padding: "6px 10px",
                                                    color: "#fff",
                                                    fontSize: "13px",
                                                    outline: "none"
                                                }}
                                            />
                                        </div>

                                        {/* Topic list */}
                                        <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                                            {!searchLower && autoSuggestedItems.length > 0 && (
                                                <div style={{ padding: "10px 14px 4px 14px", fontSize: "11px", color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                    Page Suggestions
                                                </div>
                                            )}

                                            {combined.length === 0 && !canCreateCustom && (
                                                <div style={{ padding: "12px 14px", color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
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
                                                        style={{
                                                            padding: "9px 14px",
                                                            cursor: "pointer",
                                                            fontSize: "13px",
                                                            color: isSelected ? "#fff" : "rgba(255,255,255,0.85)",
                                                            background: isSelected ? "rgba(255,255,255,0.08)" : "transparent",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            gap: "8px",
                                                            transition: "background 0.15s"
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                                                        onMouseLeave={e => e.currentTarget.style.background = isSelected ? "rgba(255,255,255,0.08)" : "transparent"}
                                                    >
                                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                                                            <span style={{ fontSize: "12px", opacity: 0.5 }}>
                                                                {item.type === "suggestion" ? "🌐" : "●"}
                                                            </span>
                                                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                                {item.name}
                                                            </span>
                                                        </div>
                                                        {item.isNew && (
                                                            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.08)", padding: "1px 6px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)" }}>
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
                                                    style={{
                                                        padding: "10px 14px",
                                                        cursor: "pointer",
                                                        fontSize: "13px",
                                                        color: "#fff",
                                                        borderTop: combined.length > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        background: "rgba(255,255,255,0.03)"
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
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
                        <button
                            onClick={focusInput}
                            style={{
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                background: "rgba(255, 255, 255, 0.1)",
                                color: "#fff",
                                height: "30px",
                                padding: "0 14px",
                                borderRadius: "15px",
                                fontSize: "13px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}
                        >
                            <span>☀</span>
                            Ask Anything
                        </button>
                    </div>
                </div>
            )}

            {/* Active Chat (Messages) - Above InputBar */}
            {!isChatEmpty && (
                <div className="quick-chat-scroll" style={{ flex: 1, overflowY: "auto" }}>
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
                <div style={{
                    maxWidth: "830px",
                    margin: "0 auto 16px auto",
                    width: "100%",
                    padding: "0 16px"
                }}>
                    <div style={{
                        background: "#2f2f2f",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "16px",
                        padding: "16px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
                    }}>
                        {/* Header: Target Language Selector Only */}
                        <div style={{ marginBottom: "16px" }}>
                            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "8px", marginLeft: "4px" }}>
                                Translate to:
                            </div>
                            <select
                                value={translateTargetLang}
                                onChange={e => setTranslateTargetLang(e.target.value)}
                                style={{
                                    width: "100%",
                                    background: "#3b3b3b",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "8px",
                                    padding: "10px 12px",
                                    color: "#fff",
                                    fontSize: "13px",
                                    outline: "none",
                                    cursor: "pointer"
                                }}
                            >
                                <option style={{ background: "#3b3b3b", color: "#fff" }} value="English">English</option>
                                <option style={{ background: "#3b3b3b", color: "#fff" }} value="Spanish">Spanish</option>
                                <option style={{ background: "#3b3b3b", color: "#fff" }} value="French">French</option>
                                <option style={{ background: "#3b3b3b", color: "#fff" }} value="German">German</option>
                                <option style={{ background: "#3b3b3b", color: "#fff" }} value="Chinese">Chinese</option>
                                <option style={{ background: "#3b3b3b", color: "#fff" }} value="Japanese">Japanese</option>
                                <option style={{ background: "#3b3b3b", color: "#fff" }} value="Hindi">Hindi</option>
                                <option style={{ background: "#3b3b3b", color: "#fff" }} value="Gujarati">Gujarati</option>
                                <option style={{ background: "#3b3b3b", color: "#fff" }} value="Russian">Russian</option>
                                <option style={{ background: "#3b3b3b", color: "#fff" }} value="Portuguese">Portuguese</option>
                                <option style={{ background: "#3b3b3b", color: "#fff" }} value="Arabic">Arabic</option>
                            </select>
                        </div>

                        {/* Content: Single Text Area */}
                        <div style={{ height: "140px" }}>
                            <textarea
                                placeholder="Enter text or select a topic..."
                                value={translateSourceText}
                                onChange={e => setTranslateSourceText(e.target.value)}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    background: "rgba(255,255,255,0.03)",
                                    border: "none",
                                    borderRadius: "12px",
                                    padding: "14px",
                                    color: "#fff",
                                    fontSize: "14px",
                                    lineHeight: "1.6",
                                    resize: "none",
                                    outline: "none"
                                }}
                            />
                        </div>

                        {/* Actions: Send & Close */}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                            <button
                                onClick={() => setTranslateOverlayOpen(false)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "rgba(255,255,255,0.4)",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    padding: "0 8px"
                                }}
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
                                style={{
                                    background: "#2196f3",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "20px",
                                    padding: "8px 24px",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#42a5f5"}
                                onMouseLeave={e => e.currentTarget.style.background = "#2196f3"}
                            >
                                Translate & Send
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="quick-input-bottom" style={{ marginTop: 12, marginBottom: isChatEmpty ? 0 : 0 }}>
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
                <div style={{ maxWidth: "830px", margin: "12px auto 0 auto", width: "100%", padding: "0 16px" }}>
                    <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)" }} />
                </div>
            )}

            {/* Vertical Action Menu */}
            {intent === "contextual" && isChatEmpty && (
                <div
                    className="quick-vertical-actions"
                    style={{
                        maxWidth: "830px",
                        margin: "8px auto",
                        width: "100%",
                        padding: "0 16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px"
                    }}
                >
                    <div
                        onClick={() => applyContextAction("summarize")}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "background 0.2s",
                            color: "rgba(255, 255, 255, 0.85)",
                            fontSize: "14px"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                        <CompressOutlined style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.45)" }} />
                        <span>Summarize</span>
                    </div>

                    <div
                        onClick={() => applyContextAction("takeaways")}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "background 0.2s",
                            color: "rgba(255, 255, 255, 0.85)",
                            fontSize: "14px"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                        <UnorderedListOutlined style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.45)" }} />
                        <span>Get key takeaways</span>
                    </div>


                    <div
                        onClick={() => applyContextAction("translate")}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "background 0.2s",
                            color: "rgba(255, 255, 255, 0.85)",
                            fontSize: "14px"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                        <TranslationOutlined style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.45)" }} />
                        <span>Translate...</span>
                        <RightOutlined style={{ marginLeft: "auto", fontSize: "12px", color: "rgba(255, 255, 255, 0.25)" }} />
                    </div>
                </div>
            )}

            {/* Divider After Actions (Only in empty contextual state) */}
            {isChatEmpty && intent === "contextual" && (
                <div style={{ maxWidth: "830px", margin: "4px auto 12px auto", width: "100%", padding: "0 16px" }}>
                    <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)" }} />
                </div>
            )}

            {isChatEmpty && threads.length > 0 && (
                <div className="quick-chat-scroll" style={{ flex: 1, overflowY: "auto" }}>
                    {/* Only show top divider if NOT contextual (if contextual, the menu has its own dividers) */}
                    {intent !== "contextual" && (
                        <div style={{ maxWidth: "830px", margin: "0 auto", width: "100%", padding: "0 16px" }}>
                            <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)", marginBottom: 20 }} />
                        </div>
                    )}

                    <div
                        className="quick-recent-chats"
                        style={{
                            maxWidth: "830px",
                            margin: "0 auto",
                            width: "100%",
                            padding: "0 16px" // Match InputBar internal padding
                        }}
                    >
                        <div className="quick-section-title" style={{ marginBottom: 12, paddingLeft: 0 }}>
                            Recent Chats
                        </div>
                        <div className="quick-threads-list">
                            {threads.slice(0, 5).map((thread) => (
                                <div
                                    key={thread.id}
                                    className={`quick-thread-item ${selectedThread?.id === thread.id ? "active" : ""}`}
                                    onClick={() => selectThread(thread)}
                                    style={{ marginLeft: -4 }} // Slight nudge for icon alignment
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