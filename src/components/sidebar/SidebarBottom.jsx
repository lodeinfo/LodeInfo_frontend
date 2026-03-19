import React from "react";
import { Dropdown } from "antd";
import { 
    LogoutOutlined, 
    SunOutlined, 
    MoonOutlined,
    UserOutlined
} from "@ant-design/icons";
import { useTheme } from "../../contexts/ThemeContext";

function SidebarBottom({ collapsed, user, setSettingsOpen, setProfileOpen, logout }) {
    const { theme, toggleTheme } = useTheme();

    const menuItems = [
        {
            key: 'profile',
            label: 'Profile',
            icon: <UserOutlined />,
            onClick: () => setProfileOpen(true),
            className: 'dropdown-menu-item'
        },
        { type: 'divider' },
        {
            key: 'theme',
            label: (
                <div className="theme-menu-content">
                    <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
            ),
            icon: theme === 'light' ? <MoonOutlined /> : <SunOutlined />,
            onClick: toggleTheme,
            className: 'dropdown-menu-item'
        },
        { type: 'divider' },
        {
            key: 'logout',
            label: 'Log out',
            icon: <LogoutOutlined />,
            onClick: logout,
            className: 'dropdown-menu-item logout-item'
        },
    ];

    return (
        <div className="user-profile-section">
            <Dropdown
                menu={{ items: menuItems }}
                trigger={['click']}
                placement="topRight"
                overlayClassName="chatgpt-profile-dropdown"
            >
                <div
                    className={`gemini-menu-item ${collapsed ? 'user-profile-card-collapsed' : 'user-profile-card-expanded'} ${theme === 'dark' ? 'profile-card-bg-dark' : 'profile-card-bg-light'}`}
                >
                    <div className="user-avatar">
                        {user?.profile_picture ? (
                            <img src={user.profile_picture} alt="Avatar" className="avatar-img" />
                        ) : (
                            user?.first_name
                                ? `${user.first_name.charAt(0).toUpperCase()}${user.last_name.charAt(0).toUpperCase()}`
                                : (user?.email ? user.email.charAt(0).toUpperCase() : 'U')
                        )}
                    </div>

                    {!collapsed && (
                        <div className="user-name-container">
                            <span className="user-name-text">
                                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'User'}
                            </span>
                        </div>
                    )}
                </div>
            </Dropdown>
        </div>
    );
}

export default SidebarBottom;
