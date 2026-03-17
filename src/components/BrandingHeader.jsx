import React from "react";
import logo from "../assets/LodeInfo (3).ico";

const BrandingHeader = () => {
    return (
        <div className="branding-header">
            {/* ✅ Added the logo image to match the sidebar style */}
            <img
                src={logo}
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