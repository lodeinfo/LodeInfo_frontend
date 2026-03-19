import React, { createContext, useContext, useState, useEffect } from "react";
import message from "antd/es/message";
import Spin from "antd/es/spin";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);

    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        const params = new URLSearchParams(window.location.search);

        // Handle logout success - clear local storage immediately
        if (params.get("logout") === "success") {
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("userDetails");
            localStorage.removeItem("authTokens");
            return false;
        }

        const saved = localStorage.getItem("isLoggedIn") === "true";
        const urlLoginSuccess = params.get("login") === "success";
        const encodedAuthData = params.get("auth_data");

        if (urlLoginSuccess) {
            if (encodedAuthData) {
                try {
                    const decodedData = JSON.parse(atob(encodedAuthData));

                    localStorage.setItem("userDetails", JSON.stringify(decodedData.user));

                    // Store tokens and session ID
                    const tokens = {
                        access_token: decodedData.access_token,
                        refresh_token: decodedData.refresh_token,
                    };
                    localStorage.setItem("authTokens", JSON.stringify(tokens));
                } catch (e) {
                    console.error("Failed to decode auth data:", e);
                }
            }

            if (!saved) {
                localStorage.setItem("isLoggedIn", "true");
                return true;
            }
        }
        return saved;
    });

    const getPersistentUser = (userData) => {
        if (!userData || !userData.email) return userData;
        const persistentPics = JSON.parse(localStorage.getItem("persistent_profile_pics") || "{}");
        const cachedPic = persistentPics[userData.email];
        if (cachedPic && !userData.profile_picture) {
            return { ...userData, profile_picture: cachedPic };
        }
        return userData;
    };

    const [user, setUser] = useState(() => {
        const rawUser = JSON.parse(localStorage.getItem("userDetails") || "null");
        return getPersistentUser(rawUser);
    });

    useEffect(() => {
        const checkToken = async () => {
            // If not logged in, we don't need to verify, stop loading
            if (!isLoggedIn) {
                setIsLoading(false);
                return;
            }

            const authTokens = JSON.parse(localStorage.getItem("authTokens") || "{}");
            const token = authTokens.access_token;

            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const API = import.meta.env.VITE_API_BASE_URL;
                console.log("Verify API Endpoint:", API);
                const response = await fetch(`${API}/auth/verify/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ token }),
                });

                const data = await response.json();

                if (!data.valid) {
                    console.warn("Token expired or invalid:", data.error);
                    message.warning("Your session has expired. Please log in again.");
                    logout();
                }
            } catch (error) {
                console.error("Token verification failed:", error);
            } finally {
                // Check complete, allow rendering
                setIsLoading(false);
            }
        };
        checkToken();
    }, [isLoggedIn]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const hasLoginSuccess = params.get("login") === "success";
        const hasLogoutSuccess = params.get("logout") === "success";

        if (hasLoginSuccess || hasLogoutSuccess) {
            // Clear URL params immediately
            const url = new URL(window.location);
            url.searchParams.delete("login");
            url.searchParams.delete("logout");
            url.searchParams.delete("auth_data");
            url.searchParams.delete("user_data");
            window.history.replaceState({}, document.title, url.pathname);

            if (hasLoginSuccess) {
                message.success("Logged in successfully");
                const rawUser = JSON.parse(localStorage.getItem("userDetails") || "null");
                setUser(getPersistentUser(rawUser));
            } else if (hasLogoutSuccess) {
                message.success("Logged out successfully");
                setUser(null);
            }
        }
    }, [isLoggedIn]);

    const login = (userData) => {
        setIsLoggedIn(true);
        const persistentUser = getPersistentUser(userData);
        setUser(persistentUser);
        localStorage.setItem("isLoggedIn", "true");
        if (persistentUser) {
            localStorage.setItem("userDetails", JSON.stringify(persistentUser));
        }
    };

    const logout = () => {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userDetails");
        localStorage.removeItem("authTokens");
        const API = import.meta.env.VITE_API_BASE_URL;
        window.location.href = `${API}/auth/logout/`;
    };

    const updateUser = (updatedData) => {
        setUser(prev => {
            const newUser = { ...prev, ...updatedData };
            localStorage.setItem("userDetails", JSON.stringify(newUser));
            
            // Persist profile picture if provided
            if (updatedData.profile_picture && prev?.email) {
                const persistentPics = JSON.parse(localStorage.getItem("persistent_profile_pics") || "{}");
                persistentPics[prev.email] = updatedData.profile_picture;
                localStorage.setItem("persistent_profile_pics", JSON.stringify(persistentPics));
            } else if (updatedData.profile_picture === null && prev?.email) {
                // Handle removal
                const persistentPics = JSON.parse(localStorage.getItem("persistent_profile_pics") || "{}");
                delete persistentPics[prev.email];
                localStorage.setItem("persistent_profile_pics", JSON.stringify(persistentPics));
            }
            
            return newUser;
        });
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
                <Spin size="large" tip="Verifying session..." />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
