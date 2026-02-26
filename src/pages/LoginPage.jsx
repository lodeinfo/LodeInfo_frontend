import React, { useEffect } from "react";
import { Button, Card, Typography, Space, Divider } from "antd";
import {
    GoogleOutlined,
    GithubOutlined,
    ArrowRightOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
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
        const backendUrl = "http://localhost:8000/api/auth/login/";
        const query = provider ? `?provider=${provider}` : "";
        window.location.href = `${backendUrl}${query}`;
    };

    return (
        <div className="login-container">
            <div className="login-background">
                <div className="gradient-sphere sphere-1"></div>
                <div className="gradient-sphere sphere-2"></div>
            </div>

            <Card className="login-card" variant="borderless">
                <div className="login-header">
                    <div className="logo-placeholder">
                        <div className="logo-inner"></div>
                    </div>
                    <Title
                        level={2}
                        className="login-heading"
                    >
                        Welcome to LodeInfo
                    </Title>
                    <Text className="login-subheading">
                        Sign in to continue your secure experience
                    </Text>
                </div>

                <Space
                    orientation="vertical"
                    size="middle"
                    style={{ width: "100%", marginTop: 32 }}
                >
                    <Button
                        type="primary"
                        size="large"
                        block
                        icon={<ArrowRightOutlined />}
                        className="login-btn email-btn"
                        onClick={() => handleLogin()}
                        style={{
                            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                            border: "none",
                        }}
                    >
                        Continue with Email + Password
                    </Button>

                    <Divider plain style={{ margin: "24px 0" }}>
                        OR CONTINUE WITH
                    </Divider>

                    <Space
                        style={{ width: "100%", justifyContent: "center" }}
                        size="middle"
                    >
                        <Button
                            shape="circle"
                            size="large"
                            className="login-btn social-btn"
                            icon={<GoogleOutlined />}
                            onClick={() => handleLogin("GoogleOAuth")}
                        />
                        <Button
                            shape="circle"
                            size="large"
                            className="login-btn social-btn"
                            icon={<GithubOutlined />}
                            onClick={() => handleLogin("GitHubOAuth")}
                        />
                    </Space>
                </Space>

                <div className="login-footer">
                    <Text className="login-footer-text">
                        By continuing, you agree to our <a href="#">Terms of Service</a> and{" "}
                        <a href="#">Privacy Policy</a>
                    </Text>
                </div>
            </Card>
        </div>
    );
};

export default LoginPage;
