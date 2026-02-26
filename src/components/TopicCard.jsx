import React from "react";
import { Card, Tag } from "antd";

const TopicCard = ({ topic, onSelect }) => {
    return (
        <Card
            hoverable
            className="topic-card"
            onClick={() => onSelect(topic)}
        >
            <div className="topic-card-content">
                <span className="topic-name">{topic.name}</span>
                <Tag color="blue">
                    {topic.documents_count || 0} docs
                </Tag>
            </div>

            <div className="topic-date">
                Created:{" "}
                {new Date(topic.created_at).toLocaleDateString()}
            </div>
        </Card>
    );
};

export default TopicCard;
