import React from "react";
import logo from "../../assets/LodeInfo.ico";
import { Button, Input } from "antd";
import {
    MenuOutlined,
    PlusOutlined,
    SearchOutlined,
    FolderAddOutlined,
    CloseOutlined,
    LoadingOutlined
} from "@ant-design/icons";

function SidebarTop({
    collapsed,
    setCollapsed,
    currentTheme,
    setSelectedThread,
    setSelectedTopic,
    isSearching,
    setIsSearching,
    searchQuery,
    setSearchQuery,
    setSearchResults,
    searchLoading,
    setTopicModalTrigger
}) {
    return (
        <div className="sidebar-top-section">
            <div
                className={`sidebar-branding-wrapper ${collapsed ? 'branding-collapsed' : 'branding-expanded'}`}
            >
                <div className="sidebar-logo-container">
                    <img
                        src={logo}
                        alt="Logo"
                        className="sidebar-custom-logo logo-visible"
                    />
                    {!collapsed && (
                        <span className="logo-text logo-text-expanded">
                            LodeInfo
                        </span>
                    )}
                </div>

                <Button
                    type="text"
                    shape="circle"
                    icon={<MenuOutlined />}
                    onClick={() => setCollapsed(!collapsed)}
                    className="menu-toggle-btn"
                />
            </div>

            <div
                className={`gemini-menu-item menu-item-base ${collapsed ? 'menu-item-collapsed' : 'menu-item-expanded'} new-chat-btn-dark`}
                onClick={() => {
                    setSelectedThread(null);
                    setSelectedTopic(null);
                }}
            >
                <PlusOutlined className="menu-item-icon" />
                {!collapsed && <span className="menu-item-text">New Chat</span>}
            </div>

            <div
                className={`gemini-menu-item menu-item-base ${collapsed ? 'menu-item-collapsed' : 'menu-item-expanded'}`}
                onClick={() => {
                    if (isSearching) {
                        setIsSearching(false);
                        setSearchQuery("");
                        setSearchResults([]);
                    } else {
                        setIsSearching(true);
                    }
                }}
            >
                {isSearching && !collapsed ? (
                    <div className="search-container">
                        <SearchOutlined className="menu-item-icon-small search-icon-secondary" />
                        <Input
                            placeholder="Search..."
                            variant="borderless"
                            autoFocus
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={currentTheme === 'dark' ? 'search-input-dark' : 'search-input-light'}
                            onClick={(e) => e.stopPropagation()}
                        />
                        {searchLoading ? (
                            <LoadingOutlined spin />
                        ) : (
                            <CloseOutlined
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsSearching(false);
                                    setSearchQuery("");
                                }}
                                className="search-close-icon"
                            />
                        )}
                    </div>
                ) : (
                    <>
                        <SearchOutlined className="menu-item-icon-small" />
                        {!collapsed && <span className="menu-item-text">Search Chats</span>}
                    </>
                )}
            </div>

            <div
                className={`gemini-menu-item menu-item-base ${collapsed ? 'menu-item-collapsed menu-item-topics-collapsed' : 'menu-item-expanded menu-item-topics-expanded'}`}
                onClick={() => setTopicModalTrigger(prev => prev + 1)}
            >
                <FolderAddOutlined className="menu-item-icon" />
                {!collapsed && (
                    <span className="menu-item-text">
                        Topics
                    </span>
                )}
            </div>
        </div>
    );
}

export default SidebarTop;