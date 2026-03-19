import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Check localStorage first
        const savedTheme = localStorage.getItem('app-theme');
        if (savedTheme) {
            return savedTheme;
        }
        
        // Fall back to system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        
        return 'light';
    });

    useEffect(() => {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
        // Save to localStorage
        localStorage.setItem('app-theme', theme);

        // Update favicon dynamically
        const updateFavicon = () => {
            const link = document.querySelector("link[rel~='icon']");
            if (!link) return;

            if (theme === 'dark') {
                const img = new Image();
                img.src = '/LodeInfo.ico';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 32;
                    canvas.height = 32;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, 32, 32);
                    
                    const imageData = ctx.getImageData(0, 0, 32, 32);
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        // If pixel has some opacity, make it white
                        if (data[i + 3] > 20) {
                            data[i] = 255;     // R
                            data[i + 1] = 255; // G
                            data[i + 2] = 255; // B
                        }
                    }
                    ctx.putImageData(imageData, 0, 0);
                    link.href = canvas.toDataURL('image/png');
                };
            } else {
                link.href = '/LodeInfo.ico';
            }
        };
        updateFavicon();
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
