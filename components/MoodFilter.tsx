import React from 'react';
import { useMood, Mood } from '../contexts/MoodContext';
import { Heart, CloudRain, Zap, Coffee, Moon, X } from 'lucide-react';

interface MoodFilterProps {
    onClose: () => void;
}

const MoodFilter: React.FC<MoodFilterProps> = ({ onClose }) => {
    const { mood, setMood } = useMood();

    const moods: { id: Mood; icon: any; label: string; color: string }[] = [
        { id: 'default', icon: X, label: 'None', color: 'bg-gray-500' },
        { id: 'romantic', icon: Heart, label: 'Romantic', color: 'bg-pink-500' },
        { id: 'melancholy', icon: CloudRain, label: 'Melancholy', color: 'bg-blue-500' },
        { id: 'energetic', icon: Zap, label: 'Energetic', color: 'bg-yellow-500' },
        { id: 'calm', icon: Coffee, label: 'Calm', color: 'bg-teal-500' },
        { id: 'mysterious', icon: Moon, label: 'Mysterious', color: 'bg-purple-600' },
    ];

    return (
        <div className="bg-[#1E1E1E] rounded-2xl p-6 border border-white/10 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Select Mood</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {moods.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => setMood(m.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 ${mood === m.id
                            ? `border-white bg-white/10 scale-105`
                            : 'border-white/5 bg-[#2A2A2A] hover:bg-[#333333]'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-full ${m.color} flex items-center justify-center mb-2 shadow-lg`}>
                            <m.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className={`text-sm font-medium ${mood === m.id ? 'text-white' : 'text-gray-400'}`}>
                            {m.label}
                        </span>
                    </button>
                ))}
            </div>

            <div className="mt-6 text-center">
                <p className="text-gray-500 text-xs">
                    Selecting a mood will apply a subtle atmospheric filter to the entire application.
                </p>
            </div>
        </div>
    );
};

export default MoodFilter;
