import React, { useEffect } from "react";
import { Button, Card, Typography, Space, Divider, ConfigProvider, theme as antTheme } from "antd";
import {
    GoogleOutlined,
    GithubOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/lodeinfo.icns";
import "../Styles/Login.css";

const { Title, Text } = Typography;

const LoginPage = () => {
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (isLoggedIn) {
            const from = location.state?.from?.pathname || "/";
            navigate(from, { replace: true });
        }
    }, [isLoggedIn, navigate, location]);

    const handleLogin = (provider) => {
        const backendUrl = `${import.meta.env.VITE_API_BASE_URL}/auth/login/`;
        const query = provider ? `?provider=${provider}` : "";
        window.location.href = `${backendUrl}${query}`;
    };

    return (
        /* Wrap in a local light ConfigProvider to override app-level dark algorithm */
        <ConfigProvider
            theme={{
                algorithm: antTheme.defaultAlgorithm,
                token: {
                    colorBgContainer: '#ffffff',
                    colorBgElevated: '#ffffff',
                    colorText: '#1f1f1f',
                    colorTextSecondary: '#444746',
                    colorBorder: '#e0e0e0',
                    colorPrimary: '#1a73e8',
                },
            }}
        >
            <div className="login-container">
                <Card className="login-card" variant="borderless">
                    <div className="login-header">
                        <div className="login-logo-container">
                            <img src={logo} alt="LodeInfo Logo" className="login-logo-img" />
                            <span className="login-brand-name">LodeInfo</span>
                        </div>
                        <Title level={2} className="login-heading">Welcome back</Title>
                        <Text className="login-subheading">Sign in to continue</Text>
                    </div>

                    <Space orientation="vertical" size="middle" style={{ width: "100%", marginTop: 24 }}>
                        <Button
                            type="primary"
                            size="large"
                            block
                            className="login-btn-primary"
                            onClick={() => handleLogin()}
                        >
                            Continue with Email
                        </Button>

                        <Divider plain className="login-divider">OR</Divider>

                        <Space orientation="vertical" style={{ width: "100%" }} size="small">
                            <Button
                                block
                                size="large"
                                icon={<GoogleOutlined />}
                                className="login-social-btn"
                                onClick={() => handleLogin("GoogleOAuth")}
                            >
                                Continue with Google
                            </Button>
                            <Button
                                block
                                size="large"
                                icon={<GithubOutlined />}
                                className="login-social-btn"
                                onClick={() => handleLogin("GitHubOAuth")}
                            >
                                Continue with GitHub
                            </Button>
                        </Space>
                    </Space>

                    <div className="login-footer">
                        <Text className="login-footer-text">
                            By continuing, you agree to our <a href="#">Terms</a> and <a href="#">Privacy</a>
                        </Text>
                    </div>
                </Card>
            </div>
        </ConfigProvider>
    );
};

export default LoginPage;
