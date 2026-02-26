import React from 'react';
import { Modal, Switch, Flex, Button, Divider } from 'antd';
import { MoonOutlined, SunOutlined, LogoutOutlined } from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';
import '../Styles/SettingsModal.css';

const SettingsModal = ({ open, onClose, onLogout }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <Modal
            title="Settings"
            open={open}
            onCancel={onClose}
            footer={null}
            width={400}
        >
            <Flex vertical gap="middle" className="settings-modal-content">
                <Flex justify="space-between" align="center">
                    <Flex align="center" gap="small">
                        {theme === 'dark' ? <MoonOutlined /> : <SunOutlined />}
                        <span>Theme</span>
                    </Flex>
                    <Flex align="center" gap="small">
                        <span className="settings-theme-label">
                            {theme === 'light' ? 'Light' : 'Dark'}
                        </span>
                        <Switch
                            checked={theme === 'dark'}
                            onChange={toggleTheme}
                            checkedChildren={<MoonOutlined />}
                            unCheckedChildren={<SunOutlined />}
                        />
                    </Flex>
                </Flex>

                <Divider className="settings-divider" />

                <Button
                    danger
                    icon={<LogoutOutlined />}
                    onClick={() => {
                        onClose();
                        onLogout && onLogout();
                    }}
                    block
                >
                    Log out
                </Button>
            </Flex>
        </Modal>
    );
};

export default SettingsModal;
