import React from "react";

const UserMessage = ({ content }) => {
    return (
        <div className="chat-bubble-user">
            {content}
        </div>
    );
};

export default UserMessage;
