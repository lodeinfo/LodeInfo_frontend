import React, { useEffect, useState, useRef } from "react";
import { Modal, Input, Button, Upload, Space, Divider, Card, Row, Col, Skeleton } from "antd";
import { CloudUploadOutlined, CheckOutlined, SearchOutlined } from "@ant-design/icons";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;

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
    const textAreaRef = useRef(null);

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
                const res = await axios.get(`${API}/documents/`, {
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
                title={null} // Custom header
                open={open}
                onCancel={() => {
                    onClose();
                    setFileToUpload(null);
                    setPastedText("");
                }}
                footer={null}
                width={isCompact ? 480 : 640}
                centered={isCompact}
                style={{ top: 20 }} // Bring it up a bit
            >
                <div className="modal-notebook-heading" style={{ margin: '0 0 20px' }}>
                    <div className="modal-notebook-title" style={{ fontSize: 20 }}>Create Topics for</div>
                    <div className="modal-notebook-subtitle" style={{ fontSize: 20 }}>your documents</div>
                </div>

                <div className="modal-section" style={{ marginBottom: 14 }}>
                    <Input
                        placeholder="Topic Name (e.g., Project X)"
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        className="modal-input-compact"
                        size="middle"
                    />
                </div>

                <div className="modal-section" style={{ marginBottom: 14 }}>
                    <div className="modal-drop-zone" style={{ padding: '24px 16px' }}>
                        <div className="modal-drop-text" style={{ fontSize: 14, marginBottom: 14 }}>or drop your files here</div>

                        <div className="modal-action-pills">
                            <Upload
                                beforeUpload={(file) => {
                                    setFileToUpload(file);
                                    return false;
                                }}
                                showUploadList={false}
                                accept=".txt,.pdf,.md"
                            >
                                <div className="modal-action-pill">
                                    <CloudUploadOutlined style={{ fontSize: 16 }} />
                                    <span>Files</span>
                                </div>
                            </Upload>

                            <div
                                className="modal-action-pill"
                                onClick={() => textAreaRef.current?.focus()}
                            >
                                <CheckOutlined style={{ fontSize: 16 }} />
                                <span>Text</span>
                            </div>

                            <Button
                                type="primary"
                                shape="round"
                                size="large"
                                onClick={onSubmit}
                                loading={uploading}
                                disabled={!newTopicName.trim()}
                                style={{
                                    marginLeft: 12,
                                    height: 40,
                                    padding: '0 24px',
                                    fontSize: 14,
                                    fontWeight: 500,
                                    borderRadius: 20
                                }}
                            >
                                {selectedTopic ? "Update Source" : "Create Topic"}
                            </Button>
                        </div>

                        {fileToUpload && (
                            <div className="modal-file-selected" style={{ marginTop: 8, padding: '2px 10px', fontSize: 11 }}>
                                <strong>{fileToUpload.name}</strong>
                                <Button type="link" size="small" onClick={() => setFileToUpload(null)} danger style={{ padding: '0 4px', fontSize: 11 }}>
                                    ✕
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-section" style={{ marginBottom: 12 }}>
                    <div className="modal-section-title" style={{ marginBottom: 4, fontSize: 11 }}>Add Content</div>
                    <Input.TextArea
                        ref={textAreaRef}
                        placeholder="Paste text here..."
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        style={{ borderRadius: 8, padding: '8px 10px', fontSize: 13 }}
                    />
                </div>

                {documents.length > 0 && (
                    <div className="modal-section" style={{ marginBottom: 12 }}>
                        <div className="modal-section-title" style={{ textAlign: 'left', marginBottom: 4, fontSize: 11 }}>Topic Documents</div>
                        <div style={{ background: 'var(--bg-sources)', padding: 6, borderRadius: 10, maxHeight: 80, overflowY: 'auto' }}>
                            {documents.map(doc => (
                                <div
                                    key={doc.id}
                                    onClick={() => openViewer(doc)}
                                    className="modal-doc-item"
                                    style={{ padding: '4px 8px', fontSize: 12 }}
                                >
                                    📄 {doc.file_name || doc.title}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <Divider className="modal-divider" style={{ margin: '12px 0' }} />

                <div className="modal-section" style={{ marginBottom: 0 }}>
                    <div className="modal-section-title" style={{ textAlign: 'left', marginBottom: 8, fontSize: 11 }}>Existing Topics</div>

                    <Input
                        placeholder="Search library..."
                        prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                        onChange={(e) => onTopicSearch(e.target.value)}
                        className="modal-search-input"
                        size="small"
                        style={{ borderRadius: 8, marginBottom: 12 }}
                        allowClear
                    />

                    <div
                        className="modal-topics-scroll"
                        style={{ maxHeight: isCompact ? '120px' : '180px', overflowX: 'hidden' }}
                        ref={scrollRef}
                        onScroll={handleScroll}
                    >
                        <Row gutter={[8, 8]}>
                            {allTopics.map((t) => (
                                <Col span={12} key={t.id}>
                                    <div
                                        className={
                                            pickedTopicId === t.id
                                                ? "modal-topic-card-selected"
                                                : "modal-topic-card"
                                        }
                                        style={{ padding: '8px 12px' }}
                                    >
                                        <span className="modal-topic-name" style={{ fontSize: 13, fontWeight: 500 }}>{t.name}</span>
                                        <Button
                                            type={pickedTopicId === t.id ? "primary" : "default"}
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
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
                                            style={{ borderRadius: 6, fontSize: 12 }}
                                        >
                                            {pickedTopicId === t.id ? "Selected" : "Select"}
                                        </Button>
                                    </div>
                                </Col>
                            ))}

                            {loadingTopics && (
                                <>
                                    {[...Array(4)].map((_, i) => (
                                        <Col span={12} key={`skeleton-${i}`}>
                                            <div className="modal-topic-card" style={{ padding: '12px 16px' }}>
                                                <Skeleton.Input active size="small" style={{ width: 100 }} />
                                            </div>
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
