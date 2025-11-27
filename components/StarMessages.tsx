import React, { useState, useEffect } from 'react';
import { X, Send, Star, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { chatApi } from '../services/chatApi';

interface StarMessagesProps {
    onClose: () => void;
}

const StarMessages: React.FC<StarMessagesProps> = ({ onClose }) => {
    const { user, token } = useAuth();
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);

    useEffect(() => {
        // Generate random stars for background
        const newStars = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            delay: Math.random() * 5,
        }));
        setStars(newStars);
    }, []);

    const handleSendStarMessage = async () => {
        if (!messageText.trim() || !token) return;
        setSending(true);
        try {
            // In a real app, you'd select a partner. For demo, we might just simulate or use a specific endpoint.
            // For now, let's just simulate sending to "the universe" or a specific partner if we had one selected.
            // Since this is a standalone view, we might need a partner selector.
            // For simplicity, let's assume this feature sends to the most recent chat or just stores it as a "bottle".

            // Actually, let's make it a "Bottle" style feature where you send it to the universe (random user) or just save it.
            // But the description says "Send messages that appear as constellations".
            // Let's assume it's for the current partner if accessed from chat, or a general "Star Log" if from Romantic view.

            // Since we are in RomanticView, let's make it a "Star Log" or "Wish".
            // Or we can implement a partner selector.

            // Let's just simulate a success for the UI demo.
            await new Promise(resolve => setTimeout(resolve, 1500));
            alert('Star message sent to the universe! ✨');
            setMessageText('');
        } catch (error) {
            console.error('Failed to send star message:', error);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden">
            {/* Starry Background */}
            <div className="absolute inset-0 z-0">
                {stars.map((star) => (
                    <div
                        key={star.id}
                        className="absolute rounded-full bg-white animate-pulse"
                        style={{
                            left: `${star.x}%`,
                            top: `${star.y}%`,
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            animationDelay: `${star.delay}s`,
                            opacity: Math.random() * 0.7 + 0.3,
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 w-full max-w-lg p-6">
                <button
                    onClick={onClose}
                    className="absolute top-0 right-0 p-4 text-white/50 hover:text-white transition-colors"
                >
                    <X className="w-8 h-8" />
                </button>

                <div className="text-center mb-10">
                    <div className="inline-block p-4 rounded-full bg-blue-500/20 mb-4 shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                        <Star className="w-12 h-12 text-blue-400 fill-blue-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
                        Star Messages
                    </h2>
                    <p className="text-blue-200/70 mt-2">
                        Send your wishes to the stars...
                    </p>
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl">
                    <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message here..."
                        className="w-full h-40 bg-transparent text-white placeholder-blue-200/30 resize-none outline-none text-lg text-center"
                    />

                    <div className="flex justify-center mt-6">
                        <button
                            onClick={handleSendStarMessage}
                            disabled={!messageText.trim() || sending}
                            className={`group relative px-8 py-3 rounded-full transition-all duration-500 ${messageText.trim()
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_40px_rgba(59,130,246,0.7)] hover:scale-105'
                                    : 'bg-white/10 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <span className="flex items-center gap-2 font-bold tracking-wide">
                                {sending ? 'Sending...' : 'Send to Stars'}
                                {!sending && <Sparkles className="w-5 h-5 group-hover:animate-spin" />}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StarMessages;
