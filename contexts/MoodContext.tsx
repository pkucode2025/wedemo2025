import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Mood = 'default' | 'romantic' | 'melancholy' | 'energetic' | 'calm' | 'mysterious';

interface MoodContextType {
    mood: Mood;
    setMood: (mood: Mood) => void;
    getMoodColor: () => string;
    getMoodGradient: () => string;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export const MoodProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mood, setMood] = useState<Mood>('default');

    const getMoodColor = () => {
        switch (mood) {
            case 'romantic': return '#FF00FF';
            case 'melancholy': return '#4A90E2';
            case 'energetic': return '#FFD700';
            case 'calm': return '#50E3C2';
            case 'mysterious': return '#9013FE';
            default: return '#FFFFFF';
        }
    };

    const getMoodGradient = () => {
        switch (mood) {
            case 'romantic': return 'from-pink-500/20 to-purple-500/20';
            case 'melancholy': return 'from-blue-500/20 to-gray-500/20';
            case 'energetic': return 'from-yellow-500/20 to-orange-500/20';
            case 'calm': return 'from-teal-500/20 to-green-500/20';
            case 'mysterious': return 'from-indigo-500/20 to-purple-900/20';
            default: return '';
        }
    };

    return (
        <MoodContext.Provider value={{ mood, setMood, getMoodColor, getMoodGradient }}>
            {children}
            {/* Global Mood Overlay */}
            <div className={`fixed inset-0 pointer-events-none z-[9999] transition-colors duration-1000 bg-gradient-to-br ${getMoodGradient()}`} />
        </MoodContext.Provider>
    );
};

export const useMood = () => {
    const context = useContext(MoodContext);
    if (context === undefined) {
        throw new Error('useMood must be used within a MoodProvider');
    }
    return context;
};
