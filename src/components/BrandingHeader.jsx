import React from "react";

const BrandingHeader = () => {
    return (
        <div className="branding-header">
            {/* ✅ Added the logo image to match the sidebar style */}
            <img
                src="/LodeInfo.ico"
                alt="Logo"
                className="branding-logo-img"
            />
            {/* ✅ Wrapped the text in a span for better styling control */}
            <span className="branding-text">
                LodeInfo
            </span>
        </div>
    );
};

export default BrandingHeader;