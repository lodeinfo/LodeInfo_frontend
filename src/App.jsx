import React from "react";
import AppRoutes from "./Route/Routes";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import "./App.css";

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <AppRoutes />
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;
