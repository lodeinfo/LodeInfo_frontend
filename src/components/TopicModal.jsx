import React, { useEffect, useState, useRef } from "react";
import { Modal, Input, Button, Upload, Space, Divider, Card, Row, Col, Skeleton } from "antd";
import { CloudUploadOutlined, CheckOutlined, SearchOutlined } from "@ant-design/icons";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const TopicModal = ({
    open,
    onClose,
    newTopicName,
    setNewTopicName,
    fileToUpload,
    setFileToUpload,
    uploading,
    onSubmit,
    allTopics,
    pickedTopicId,
    setPickedTopicId,
    setTopic,
    onTopicSearch,
    onLoadMoreTopics,
    hasMoreTopics,
    pastedText,
    setPastedText,
    loadingTopics,
    isCompact = false
}) => {

    const [documents, setDocuments] = useState([]);

    /* ✅ VIEWER STATE (ADDED) */
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerDocument, setViewerDocument] = useState(null);

    const openViewer = (doc) => {
        setViewerDocument(doc);
        setViewerOpen(true);
    };

    const scrollRef = useRef(null);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        // Check if user is near the bottom (within 20px)
        if (scrollHeight - scrollTop <= clientHeight + 20) {
            if (hasMoreTopics && !loadingTopics) {
                onLoadMoreTopics();
            }
        }
    };

    /* ✅ FETCH DOCUMENTS WHEN TOPIC CHANGES */
    useEffect(() => {
        if (!pickedTopicId) {
            setDocuments([]);
            return;
        }

        const fetchDocs = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/documents/`, {
                    params: { topic: pickedTopicId }
                });

                setDocuments(res.data || []);
            } catch (e) {
                console.error("Failed to load documents", e);
            }
        };

        fetchDocs();
    }, [pickedTopicId]);

    /* ✅ AUTO-LOAD IF NOT SCROLLABLE */
    useEffect(() => {
        if (open && hasMoreTopics && !loadingTopics && allTopics.length > 0) {
            const timer = setTimeout(() => {
                const el = scrollRef.current;
                if (el && el.scrollHeight <= el.clientHeight) {
                    onLoadMoreTopics();
                }
            }, 500); // Wait for cards to render
            return () => clearTimeout(timer);
        }
    }, [open, allTopics.length, hasMoreTopics, loadingTopics]);

    const selectedTopic = allTopics?.find(t => t.id === pickedTopicId);

    return (
        <>
            {/* ✅ READ ONLY VIEWER MODAL (ADDED) */}
            <Modal
                title={viewerDocument?.title || viewerDocument?.file_name || "Document"}
                open={viewerOpen}
                footer={null}
                onCancel={() => setViewerOpen(false)}
                width={700}
            >
                <Input.TextArea
                    value={viewerDocument?.content || ""}
                    readOnly
                    autoSize={{ minRows: 12, maxRows: 24 }}
                />
            </Modal>

            <Modal
                title="Topics"
                open={open}
                onCancel={() => {
                    onClose();
                    setFileToUpload(null);
                    setPastedText("");
                }}
                footer={null}
                width={isCompact ? 480 : 600}
                centered={isCompact}
            >
                <div className="modal-section" style={isCompact ? { marginBottom: 12 } : {}}>
                    <div className="modal-section-title" style={isCompact ? { marginBottom: 6 } : {}}>
                        {selectedTopic ? "Selected Topic" : "Create New Topic"}
                    </div>

                    <Space.Compact style={{ width: '100%' }}>
                        <Input
                            placeholder="Enter topic name"
                            value={newTopicName}
                            onChange={(e) => setNewTopicName(e.target.value)}
                            className="modal-input-flex"
                        />

                        <Upload
                            beforeUpload={(file) => {
                                setFileToUpload(file);
                                return false;
                            }}
                            showUploadList={false}
                            accept=".txt,.pdf,.md"
                        >
                            <Button icon={<CloudUploadOutlined />}>
                                {fileToUpload
                                    ? fileToUpload.name.substring(0, 15) + "..."
                                    : "File"}
                            </Button>
                        </Upload>

                        <Button
                            type="primary"
                            onClick={onSubmit}
                            loading={uploading}
                            disabled={!newTopicName.trim()}
                        >
                            {selectedTopic ? "Update" : "Create"}
                        </Button>
                    </Space.Compact>

                    {fileToUpload && (
                        <div className="modal-file-selected">
                            Selected: {fileToUpload.name}
                            <Button type="link" size="small" onClick={() => setFileToUpload(null)}>
                                Remove
                            </Button>
                        </div>
                    )}
                </div>

                <div className="modal-section" style={isCompact ? { marginTop: 8, marginBottom: 12 } : { marginTop: 16 }}>
                    <div className="modal-section-title" style={isCompact ? { marginBottom: 6 } : {}}>Add Your Text</div>
                    <Input.TextArea
                        placeholder="Paste or write text here..."
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        autoSize={isCompact ? { minRows: 1, maxRows: 3 } : { minRows: 3, maxRows: 6 }}
                    />
                </div>

                {/* ✅ NEW: SHOW DOCUMENTS OF SELECTED TOPIC */}
                {documents.length > 0 && (
                    <div className="modal-section" style={isCompact ? { marginBottom: 12 } : {}}>
                        <div className="modal-section-title" style={isCompact ? { marginBottom: 4 } : {}}>Topic Documents</div>

                        {documents.map(doc => (
                            <div
                                key={doc.id}
                                onClick={() => openViewer(doc)}   // ✅ ONLY CHANGE
                                style={{
                                    padding: "6px 10px",
                                    borderRadius: 6,
                                    cursor: "pointer",
                                    transition: "background 0.15s ease, transform 0.1s ease",
                                    userSelect: "none"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "rgba(0,0,0,0.05)";
                                    e.currentTarget.style.transform = "translateX(2px)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "transparent";
                                    e.currentTarget.style.transform = "translateX(0px)";
                                }}
                            >
                                📄 {doc.file_name || doc.title}
                            </div>
                        ))}
                    </div>
                )}

                <Divider className="modal-divider" style={isCompact ? { margin: '8px 0' } : {}} />

                <div style={isCompact ? { marginBottom: 0 } : {}}>
                    <div className="modal-section-title" style={isCompact ? { marginBottom: 6 } : {}}>Existing Topics</div>

                    <Input
                        placeholder="Search topics..."
                        prefix={<SearchOutlined />}
                        onChange={(e) => onTopicSearch(e.target.value)}
                        className="modal-search-input"
                        style={isCompact ? { marginBottom: 8 } : {}}
                        allowClear
                    />

                    <div
                        className="modal-topics-scroll"
                        style={isCompact ? { maxHeight: '100px' } : {}}
                        ref={scrollRef}
                        onScroll={handleScroll}
                    >
                        <Row gutter={[12, 12]}>
                            {allTopics.map((t) => (
                                <Col span={12} key={t.id}>
                                    <Card
                                        size="small"
                                        className={
                                            pickedTopicId === t.id
                                                ? "modal-topic-card-selected"
                                                : "modal-topic-card"
                                        }
                                    >
                                        <span className="modal-topic-name">{t.name}</span>

                                        <Button
                                            type={pickedTopicId === t.id ? "primary" : "default"}
                                            size="small"
                                            icon={pickedTopicId === t.id ? <CheckOutlined /> : null}
                                            onClick={() => {
                                                if (pickedTopicId === t.id) {
                                                    setPickedTopicId(null);
                                                    setTopic(null);
                                                    setNewTopicName("");
                                                } else {
                                                    setPickedTopicId(t.id);
                                                    setTopic(t);
                                                    setNewTopicName(t.name);
                                                }
                                            }}
                                        >
                                            {pickedTopicId === t.id ? "Selected" : "Select"}
                                        </Button>
                                    </Card>
                                </Col>
                            ))}

                            {loadingTopics && (
                                <>
                                    {[...Array(4)].map((_, i) => (
                                        <Col span={12} key={`skeleton-${i}`}>
                                            <Card size="small" className="modal-topic-card">
                                                <Skeleton.Input active size="small" style={{ width: 100 }} />
                                                <Skeleton.Button active size="small" shape="round" style={{ width: 60 }} />
                                            </Card>
                                        </Col>
                                    ))}
                                </>
                            )}
                        </Row>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default TopicModal;
