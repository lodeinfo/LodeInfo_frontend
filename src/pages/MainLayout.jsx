import React, { useState, useEffect } from "react";
import { Layout, message, ConfigProvider, theme as antTheme } from "antd";
import axios from "axios";

import ChatInterface from "../components/ChatInterface";
import SettingsModal from "../components/SettingsModal";
import Sidebar from "../components/sidebar/Sidebar";

import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import useShortcuts from "../hooks/useShortcuts";

import "../Styles/MainLayout.css";

const { Content } = Layout;
const API_BASE_URL = "http://localhost:8000/api";

function MainLayout() {
    const { theme: currentTheme } = useTheme();
    const { logout, user } = useAuth();

    const [topics, setTopics] = useState([]);
    const [threads, setThreads] = useState([]);
    const [selectedThread, setSelectedThread] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);

    const [collapsed, setCollapsed] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [topicModalTrigger, setTopicModalTrigger] = useState(0);
    const [modelPickerTrigger, setModelPickerTrigger] = useState(0);

    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const [topicPage, setTopicPage] = useState(1);
    const [topicHasMore, setTopicHasMore] = useState(true);
    const [topicSearchQuery, setTopicSearchQuery] = useState("");
    const [topicsLoading, setTopicsLoading] = useState(false);

    useShortcuts({
        onNewChat: () => {
            setSelectedThread(null);
            setSelectedTopic(null);
            message.info("Starting new chat");
        },
        onSearch: () => {
            setCollapsed(false);

            setIsSearching(prev => {
                const next = !prev;

                if (!next) {
                    setSearchQuery("");
                    setSearchResults([]);
                }

                return next;
            });
        },

        onChangeModel: () => {
            setModelPickerTrigger(prev => prev + 1);
        },
        onTopic: () => {
            setTopicModalTrigger(prev => prev + 1);
        }
    });

    useEffect(() => {

        if (user?.id && !isSearching) {
            fetchTopics(1, "", true);
            fetchThreads();
        }
    }, [user?.id, isSearching]);

    useEffect(() => {
        if (!isSearching) {
            setSearchResults([]);
            return;
        }

        const debounce = setTimeout(async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }

            setSearchLoading(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/threads/search/`, {
                    params: { q: searchQuery, user_id: user.id }
                });
                setSearchResults(res.data);
            } catch (err) {
                console.error(err);
                message.error("Failed to search chats");
            } finally {
                setSearchLoading(false);
            }
        }, 300);

        return () => clearTimeout(debounce);
    }, [searchQuery, isSearching, user?.id]);

    const fetchTopics = async (page = 1, search = "", reset = false) => {
        if (topicsLoading) return;

        setTopicsLoading(true);
        try {
            // Add 2s artificial delay for better loading visibility
            await new Promise(resolve => setTimeout(resolve, 2000));

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

    const fetchThreads = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/threads/`, {
                params: { user_id: user.id }
            });
            setThreads(res.data);
        } catch (err) {
            console.error(err);
        }
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

    /* ✅ ONLY UPDATED FUNCTION */
    const handleDocumentUpload = async (file, topicId) => {

        /* ✅ TEXT FROM TEXTBOX */
        if (file.isText) {

            const payload = {
                topic: topicId,

                /* ✅ CRITICAL FIX — ENSURE SINGLE .txt EXTENSION */
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

        /* ✅ NORMAL FILE (unchanged) */
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


    return (
        <>
            <SettingsModal
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                onLogout={logout}
            />

            <ConfigProvider
                theme={{
                    token: {
                        fontFamily: "'Outfit', 'Inter', sans-serif",
                        colorPrimary: currentTheme === "dark" ? "#8ab4f8" : "#1a73e8",
                    },
                    algorithm: currentTheme === "dark"
                        ? antTheme.darkAlgorithm
                        : antTheme.defaultAlgorithm,
                }}
            >
                <Layout className="main-layout">
                    {/* ✅ SIDEBAR WRAPPER & OVERLAY ADDED FOR MOBILE BEHAVIOR */}
                    {!collapsed && <div className="sidebar-overlay" onClick={() => setCollapsed(true)} />}

                    <div className={`sidebar-wrapper ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
                        <Sidebar
                            collapsed={collapsed}
                            setCollapsed={setCollapsed}
                            currentTheme={currentTheme}
                            threads={threads}
                            selectedThread={selectedThread}
                            setSelectedThread={setSelectedThread}
                            selectedTopic={selectedTopic}
                            setSelectedTopic={setSelectedTopic}
                            isSearching={isSearching}
                            setIsSearching={setIsSearching}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            searchResults={searchResults}
                            searchLoading={searchLoading}
                            setSettingsOpen={setSettingsOpen}
                            setTopicModalTrigger={setTopicModalTrigger}
                            user={user}
                        />
                    </div>

                    <Layout className="inner-layout">
                        <Content className="gemini-content">
                            <ChatInterface
                                user={user}
                                thread={selectedThread}
                                topic={selectedTopic}
                                setTopic={setSelectedTopic}
                                allTopics={topics}
                                onTopicCreate={handleTopicCreate}
                                onUpload={handleDocumentUpload}
                                sidebarCollapsed={collapsed}
                                topicModalTrigger={topicModalTrigger}
                                modelPickerTrigger={modelPickerTrigger}
                                onTopicSearch={handleTopicSearch}
                                onLoadMoreTopics={loadMoreTopics}
                                hasMoreTopics={topicHasMore}
                                topicsLoading={topicsLoading}
                                onAskQuestion={async (question, threadId, topicId, model, mode) => {
                                    try {
                                        const res = await axios.post(`${API_BASE_URL}/ask/`, {
                                            thread_id: threadId || selectedThread?.id,
                                            topic_id: topicId || selectedTopic?.id,
                                            question,
                                            user_id: user.id,
                                            model,
                                            mode,
                                        });

                                        if (!threadId && !selectedThread?.id && res.data.thread_id) {
                                            await fetchThreads();
                                            const threadRes = await axios.get(
                                                `${API_BASE_URL}/threads/${res.data.thread_id}/`
                                            );
                                            setSelectedThread(threadRes.data);
                                        }

                                        return res.data;
                                    } catch (err) {
                                        console.error(err);
                                        return null;
                                    }
                                }}
                            />
                        </Content>
                    </Layout>
                </Layout>
            </ConfigProvider>
        </>
    );
}

export default MainLayout;