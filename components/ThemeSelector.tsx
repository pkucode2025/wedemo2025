import React from 'react';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { Check, X, Palette } from 'lucide-react';

interface ThemeSelectorProps {
    onClose: () => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onClose }) => {
    const { theme, setTheme } = useTheme();

    const themes: { id: Theme; name: string; color: string }[] = [
        { id: 'default', name: 'Dark Neon', color: 'bg-gray-900' },
        { id: 'romantic', name: 'Romantic Pink', color: 'bg-pink-900' },
        { id: 'ocean', name: 'Deep Ocean', color: 'bg-blue-900' },
        { id: 'nature', name: 'Forest Green', color: 'bg-green-900' },
        { id: 'luxury', name: 'Luxury Gold', color: 'bg-yellow-900' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1E1E1E] w-full max-w-md rounded-2xl p-6 border border-white/10 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-white" />
                        <h3 className="text-xl font-bold text-white">Choose Theme</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid gap-3">
                    {themes.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300
                                ${theme === t.id
                                    ? 'border-white bg-white/10'
                                    : 'border-white/5 hover:bg-white/5'
                                }
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full ${t.color} border border-white/20 shadow-lg`} />
                                <span className="font-medium text-white">{t.name}</span>
                            </div>
                            {theme === t.id && <Check className="w-5 h-5 text-green-400" />}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ThemeSelector;
