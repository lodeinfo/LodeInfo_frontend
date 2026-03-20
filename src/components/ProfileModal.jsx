import React, { useState, useEffect, useRef } from 'react';
import { CameraOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Modal, Input, Button, message, Dropdown } from 'antd';
import '../Styles/MainLayout.css';

function ProfileModal({ open, onClose, user, onSave }) {
    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (open && user) {
            setDisplayName(user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '');
            // Show only the email prefix (username part) as requested
            const emailPrefix = user.email ? user.email.split('@')[0] : '';
            setUsername(user.username || emailPrefix);
            setProfileImage(user.profile_picture || null);
        }
    }, [open, user]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleSave = () => {
        if (onSave) {
            onSave({ displayName, username, profileImage });
        }
        message.success('Profile updated successfully');
        onClose();
    };

    const removeImage = (e) => {
        // Handle both standard events and Ant Design menu clicks
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        } else if (e && e.domEvent && typeof e.domEvent.stopPropagation === 'function') {
            e.domEvent.stopPropagation();
        }

        setProfileImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const photoMenuItems = [
        {
            key: 'change',
            label: 'Change photo',
            icon: <EditOutlined />,
            onClick: triggerFileInput
        },
        {
            key: 'remove',
            label: 'Remove photo',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: removeImage
        }
    ];

    return (
        <Modal
            title={null}
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            width={400}
            className="profile-edit-modal"
            closable={false}
            styles={{
                content: {
                    backgroundColor: 'color-mix(in srgb, var(--bg-primary) 70%, transparent)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    color: 'var(--text-primary)',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                }
            }}
        >
            <div className="profile-modal-content">
                <div className="profile-modal-header">
                    <h2 className="profile-modal-title">Edit profile</h2>
                </div>

                <div className="profile-avatar-container">
                    <div className="avatar-wrapper">
                        <div className="large-avatar" onClick={!profileImage ? triggerFileInput : undefined}>
                            {profileImage ? (
                                <img src={profileImage} alt="Profile" className="profile-preview-img" />
                            ) : (
                                displayName.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>
                        {profileImage ? (
                            <Dropdown menu={{ items: photoMenuItems }} trigger={['click']} placement="bottomRight">
                                <div className="avatar-upload-icon">
                                    <CameraOutlined />
                                </div>
                            </Dropdown>
                        ) : (
                            <div className="avatar-upload-icon" onClick={triggerFileInput}>
                                <CameraOutlined />
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>

                <div className="profile-form-group">
                    <label className="profile-input-label">Display name</label>
                    <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your name"
                        className="profile-input-field"
                    />
                </div>

                <div className="profile-form-group">
                    <label className="profile-input-label">Username</label>
                    <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        className="profile-input-field"
                    />
                </div>

                <p className="profile-disclaimer">
                    Your profile helps people recognize you.
                </p>

                <div className="profile-modal-footer">
                    <Button
                        onClick={onClose}
                        className="profile-cancel-btn"
                        shape="round"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        type="primary"
                        className="profile-save-btn"
                        shape="round"
                    >
                        Save
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

export default ProfileModal;
