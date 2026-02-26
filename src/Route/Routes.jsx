import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../pages/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/LoginPage';

/* ✅ ADDED → QuickInput page */
import QuickInput from '../pages/QuickInput';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* ✅ ADDED → Popup mini chat route (no ProtectedRoute needed) */}
            <Route path="/quick-input" element={<QuickInput />} />

            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;