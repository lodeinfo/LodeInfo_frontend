import React from "react";
import TopicCreate from "./TopicCreate";
import TopicList from "./TopicList";
import "../Styles/TopicManager.css";

const TopicManager = ({ topics, onTopicCreate, onTopicSelect }) => {
    return (
        <div>
            <TopicCreate onTopicCreate={onTopicCreate} />
            <TopicList
                topics={topics}
                onTopicSelect={onTopicSelect}
            />
        </div>
    );
};

export default TopicManager;
