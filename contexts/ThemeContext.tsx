import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Theme = 'default' | 'romantic' | 'ocean' | 'nature' | 'luxury';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    getThemeColors: () => {
        background: string;
        card: string;
        text: string;
        accent: string;
        gradient: string;
    };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('default');

    const getThemeColors = () => {
        switch (theme) {
            case 'romantic':
                return {
                    background: 'bg-[#1A0510]',
                    card: 'bg-[#2A0A1A]',
                    text: 'text-pink-100',
                    accent: 'text-pink-500',
                    gradient: 'from-pink-500 to-rose-500',
                };
            case 'ocean':
                return {
                    background: 'bg-[#05101A]',
                    card: 'bg-[#0A1A2A]',
                    text: 'text-blue-100',
                    accent: 'text-blue-500',
                    gradient: 'from-blue-500 to-cyan-500',
                };
            case 'nature':
                return {
                    background: 'bg-[#051A05]',
                    card: 'bg-[#0A2A0A]',
                    text: 'text-green-100',
                    accent: 'text-green-500',
                    gradient: 'from-green-500 to-emerald-500',
                };
            case 'luxury':
                return {
                    background: 'bg-[#1A1505]',
                    card: 'bg-[#2A250A]',
                    text: 'text-yellow-100',
                    accent: 'text-yellow-500',
                    gradient: 'from-yellow-500 to-amber-500',
                };
            default:
                return {
                    background: 'bg-[#121212]',
                    card: 'bg-[#1E1E1E]',
                    text: 'text-white',
                    accent: 'text-[#FF00FF]',
                    gradient: 'from-[#FF00FF] to-[#8A2BE2]',
                };
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, getThemeColors }}>
            <div className={`transition-colors duration-500 ${getThemeColors().background} min-h-screen`}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
