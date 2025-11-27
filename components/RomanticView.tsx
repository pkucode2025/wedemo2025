import React, { useState } from 'react';
import { Sparkles, Star, Clock, BookOpen, Palette, Gift } from 'lucide-react';

interface RomanticViewProps {
    onRefresh?: () => Promise<void>;
}

const RomanticView: React.FC<RomanticViewProps> = ({ onRefresh }) => {
    const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

    const features = [
        {
            id: 'mood',
            icon: Palette,
            title: 'Mood Filters',
            description: 'Express your emotions with beautiful atmosphere filters',
            color: 'from-purple-400 to-pink-400',
            coming: false,
        },
        {
            id: 'stars',
            icon: Star,
            title: 'Star Messages',
            description: 'Send messages that appear as constellations',
            color: 'from-blue-400 to-cyan-400',
            coming: false,
        },
        {
            id: 'capsules',
            icon: Clock,
            title: 'Memory Capsules',
            description: 'Create time capsules to unlock on special dates',
            color: 'from-orange-400 to-red-400',
            coming: false,
        },
        {
            id: 'poetry',
            icon: BookOpen,
            title: 'Poetry Library',
            description: 'Explore and share romantic poetry',
            color: 'from-green-400 to-emerald-400',
            coming: false,
        },
        {
            id: 'themes',
            icon: Sparkles,
            title: 'Aesthetic Themes',
            description: 'Customize your experience with romantic themes',
            color: 'from-violet-400 to-purple-400',
            coming: false,
        },
        {
            id: 'gifts',
            icon: Gift,
            title: 'Digital Gifts',
            description: 'Send virtual flowers, stars, and romantic gifts',
            color: 'from-rose-400 to-pink-400',
            coming: false,
        },
    ];

    return (
        <div className="flex flex-col h-full bg-[#121212] text-white overflow-hidden">
            {/* Header */}
            <div className="h-[80px] flex items-end justify-between px-6 pb-4 bg-transparent flex-shrink-0 z-20 relative">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF00FF] to-[#8A2BE2]">
                    Romantic
                </h1>
                <div className="flex items-center space-x-4 mb-1">
                    {/* Space for future action buttons */}
                </div>
            </div>

            {/* Subtitle */}
            <div className="px-6 pb-4">
                <p className="text-gray-400 text-sm">
                    ✨ Express your feelings with beautiful romantic features
                </p>
            </div>

            {/* Features Grid */}
            <div className="flex-1 overflow-y-auto px-6 pb-24 no-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                    {features.map((feature) => (
                        <div
                            key={feature.id}
                            onClick={() => setSelectedFeature(feature.id)}
                            className="bg-[#1E1E1E] rounded-2xl p-5 border border-white/5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-[#FF00FF]/30 hover:shadow-[0_0_20px_rgba(255,0,255,0.1)] relative overflow-hidden group"
                        >
                            {/* Background Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

                            {/* Content */}
                            <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 shadow-lg`}>
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>

                                <h3 className="text-white font-bold text-base mb-1 group-hover:text-[#FF00FF] transition-colors">
                                    {feature.title}
                                </h3>

                                <p className="text-gray-400 text-xs leading-relaxed">
                                    {feature.description}
                                </p>

                                {feature.coming && (
                                    <div className="mt-3 inline-block px-2 py-1 bg-[#FF00FF]/20 rounded-full">
                                        <span className="text-[#FF00FF] text-[10px] font-medium">Coming Soon</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Welcome Message */}
                <div className="mt-8 bg-gradient-to-br from-[#1E1E1E] to-[#2A1E2A] rounded-2xl p-6 border border-[#FF00FF]/20">
                    <h3 className="text-xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#FF00FF] to-[#8A2BE2]">
                        Welcome to Romantic Features! 💕
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                        Explore our collection of romantic and artistic features designed for expressing emotions and creating beautiful memories.
                        Each feature offers unique ways to connect and share your feelings with loved ones.
                    </p>
                </div>

                {/* Placeholder for selected feature detail */}
                {selectedFeature && (
                    <div className="mt-4 bg-[#1E1E1E] rounded-2xl p-6 border border-[#FF00FF]/30">
                        <p className="text-gray-400 text-sm text-center">
                            Feature details coming soon... Click to explore {features.find(f => f.id === selectedFeature)?.title}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RomanticView;
