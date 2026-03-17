import React from "react";
import { Input, Button, Flex, Select } from "antd";
import { SendOutlined, ThunderboltOutlined, BulbOutlined, RocketOutlined } from "@ant-design/icons";
import modelsData from "../models_data.json";

const { TextArea } = Input;

const InputBar = ({
    inputRef,
    question,
    setQuestion,
    handleAsk,
    selectedModel,
    setSelectedModel,
    modelMode,
    setModelMode,
    modelModalOpen,    // Use this prop instead of local state
    setModelModalOpen, // Use this prop to update state
    compact = false    // New prop for smaller styling
}) => {
    return (
        <div className={`input-bar-wrapper ${compact ? 'compact-wrapper' : ''}`}>
            <div className={`gemini-input-container input-bar-container ${compact ? 'compact' : ''}`}>
                {/* Top: Text Area */}
                <TextArea
                    ref={inputRef}
                    className="gemini-input input-textarea"
                    placeholder="Ask me anything"
                    autoSize={{ minRows: 1, maxRows: 6 }}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onPressEnter={(e) => {
                        if (!e.shiftKey) {
                            e.preventDefault();
                            handleAsk();
                        }
                    }}
                    variant="borderless"
                />

                {/* Bottom: Tools & Actions */}
                <Flex justify="space-between" align="center" className="input-bottom-row">
                    <Flex gap="small" align="center">
                        <Select
                            value={modelMode}
                            onChange={setModelMode}
                            variant="borderless"
                            popupMatchSelectWidth={false}
                            options={[
                                {
                                    value: 'fast',
                                    label: (
                                        <Flex gap="small" align="center">
                                            <ThunderboltOutlined />
                                            <span>Fast</span>
                                        </Flex>
                                    )
                                },
                                {
                                    value: 'thinking',
                                    label: (
                                        <Flex gap="small" align="center">
                                            <BulbOutlined />
                                            <span>Thinking</span>
                                        </Flex>
                                    )
                                },
                                {
                                    value: 'deepthinking',
                                    label: (
                                        <Flex gap="small" align="center">
                                            <RocketOutlined />
                                            <span>Deepthinking</span>
                                        </Flex>
                                    )
                                }
                            ]}
                        />
                    </Flex>

                    <Flex gap="small">
                        <div className="input-divider" />
                        <Select
                            open={modelModalOpen} // Controlled by parent state
                            onOpenChange={(visible) => setModelModalOpen(visible)}
                            value={selectedModel}
                            onChange={(val) => {
                                setSelectedModel(val);
                                setModelModalOpen(false);
                            }}
                            variant="borderless"
                            popupMatchSelectWidth={false}
                            options={modelsData.map(m => ({
                                value: m.id,
                                label: (
                                    <Flex gap="small" align="center">
                                        <img src={m.icon} width="16" height="16" alt={m.name} />
                                        <span>{m.name}</span>
                                    </Flex>
                                )
                            }))}
                        />
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<SendOutlined />}
                            onClick={handleAsk}
                            disabled={question.trim() == ""}
                        />
                    </Flex>
                </Flex>
            </div>

            <div className="input-disclaimer">
                LodeInfo may display inaccurate info, including about people, so
                double-check its responses.
            </div>
        </div>
    );
};

export default InputBar;