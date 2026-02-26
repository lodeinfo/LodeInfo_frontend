import React, { useState } from "react";
import { Input, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const TopicCreate = ({ onTopicCreate }) => {
    const [newTopicName, setNewTopicName] = useState("");

    const handleCreate = async () => {
        if (!newTopicName.trim()) return;

        await onTopicCreate(newTopicName.trim());
        setNewTopicName("");
    };

    return (
        <div className="topic-create-section">
            <Input
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="New topic name"
                onPressEnter={handleCreate}
                className="topic-input"
            />
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                block
            >
                Topics
            </Button>
        </div>
    );
};

export default TopicCreate;
