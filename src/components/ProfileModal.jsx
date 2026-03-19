import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, Button, message } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import '../Styles/MainLayout.css';

function ProfileModal({ open, onClose, user }) {
    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (open && user) {
            setDisplayName(user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '');
            setUsername(user.email || '');
            setProfileImage(user.profile_picture || null); // Theoretical user property
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
        // Placeholder for save logic
        message.success('Profile updated successfully (placeholder)');
        onClose();
    };

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
        >
            <div className="profile-modal-content">
                <div className="profile-modal-header">
                    <h2 className="profile-modal-title">Edit profile</h2>
                </div>

                <div className="profile-avatar-container">
                    <div className="large-avatar" onClick={triggerFileInput} style={{ cursor: 'pointer' }}>
                        {profileImage ? (
                            <img src={profileImage} alt="Profile" className="profile-preview-img" />
                        ) : (
                            displayName.charAt(0).toUpperCase() || 'U'
                        )}
                        <div className="avatar-upload-icon">
                            <CameraOutlined />
                        </div>
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
