import React from "react";
import { Flex } from "antd";
import TopicCard from "./TopicCard";

const TopicList = ({ topics, onTopicSelect }) => {
    return (
        <Flex vertical gap="middle" className="topics-list">
            {topics.map((topic) => (
                <TopicCard
                    key={topic.id || topic.name}
                    topic={topic}
                    onSelect={onTopicSelect}
                />
            ))}
        </Flex>
    );
};

export default TopicList;
