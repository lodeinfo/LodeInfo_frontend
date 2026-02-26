import React from "react";

function SidebarBottom({ collapsed, currentTheme, user, setSettingsOpen }) {
    return (
        <div className="user-profile-section">
            <div
                className={`gemini-menu-item ${collapsed ? 'user-profile-card-collapsed' : 'user-profile-card-expanded'} ${currentTheme === 'dark' ? 'profile-card-bg-dark' : 'profile-card-bg-light'}`}
                onClick={() => setSettingsOpen(true)}
            >
                <div className="user-avatar">
                    {user?.first_name
                        ? `${user.first_name.charAt(0).toUpperCase()}${user.last_name.charAt(0).toUpperCase()}`
                        : (user?.email ? user.email.charAt(0).toUpperCase() : 'U')}
                </div>

                {!collapsed && (
                    <div className="user-name-container">
                        <span className="user-name-text">
                            {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'User'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SidebarBottom;
