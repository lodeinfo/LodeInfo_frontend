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
            document.documentElement.setAttribute('data-theme', savedTheme);
            return savedTheme;
        }

        document.documentElement.setAttribute('data-theme', 'light');
        return 'light'; // Default to light theme
    });

    useEffect(() => {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
        // Save to localStorage
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    useEffect(() => {
        const matcher = window.matchMedia('(prefers-color-scheme: dark)');

        // Update favicon dynamically based on SYSTEM theme
        const updateFavicon = () => {
            const isSystemDark = matcher.matches;
            const link = document.querySelector("link[rel~='icon']");
            if (!link) return;

            const img = new Image();
            img.src = '/lodeinfo.icns';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 32;
                canvas.height = 32;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 32, 32);

                const imageData = ctx.getImageData(0, 0, 32, 32);
                const data = imageData.data;
                const r = isSystemDark ? 255 : 0;
                const g = isSystemDark ? 255 : 0;
                const b = isSystemDark ? 255 : 0;

                for (let i = 0; i < data.length; i += 4) {
                    // If pixel has some opacity, force it to theme color
                    if (data[i + 3] > 20) {
                        data[i] = r;
                        data[i + 1] = g;
                        data[i + 2] = b;
                    }
                }
                ctx.putImageData(imageData, 0, 0);
                link.href = canvas.toDataURL('image/png');
            };
        };

        updateFavicon();
        matcher.addEventListener('change', updateFavicon);
        return () => matcher.removeEventListener('change', updateFavicon);
    }, []);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
