import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import { momentsApi, Moment } from '../services/momentsApi';
import { useAuth } from '../contexts/AuthContext';
import MomentDetailModal from '../components/MomentDetailModal';

interface FavoritesMomentsPageProps {
    onBack: () => void;
}

const FavoritesMomentsPage: React.FC<FavoritesMomentsPageProps> = ({ onBack }) => {
    const { token } = useAuth();
    const [moments, setMoments] = useState<Moment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);

    useEffect(() => {
        if (!token) return;
        const loadFavorites = async () => {
            try {
                const data = await momentsApi.getFavorites(token);
                setMoments(data);
            } catch (error) {
                console.error('Failed to load favorites:', error);
            } finally {
                setLoading(false);
            }
        };
        loadFavorites();
    }, [token]);

    const handleUpdateMoment = (updatedMoment: Moment) => {
        setMoments(prev => prev.map(m => m.id === updatedMoment.id ? updatedMoment : m));
        setSelectedMoment(updatedMoment);
    };

    return (
        <div className="w-full h-full bg-[#121212] flex flex-col">
            {/* Header */}
            <div className="h-[60px] flex items-center justify-between px-4 border-b border-white/10 bg-[#1E1E1E]">
                <button onClick={onBack} className="text-white">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-white text-lg font-medium">Favorites</h1>
                <div className="w-6" /> {/* Spacer */}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-24">
                {loading ? (
                    <div className="flex justify-center py-20 text-gray-500">Loading...</div>
                ) : moments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <Star className="w-16 h-16 mb-4 opacity-30" />
                        <p>No favorites yet</p>
                        <p className="text-sm mt-2">Save posts you love to see them here</p>
                    </div>
                ) : (
                    <div className="columns-2 gap-4 space-y-4">
                        {moments.map((item) => (
                            <div key={item.id} className="break-inside-avoid mb-4 group cursor-pointer" onClick={() => setSelectedMoment(item)}>
                                <div className="bg-[#1E1E1E] rounded-2xl overflow-hidden border border-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,0,255,0.15)]">
                                    <div className="relative">
                                        {item.images && item.images.length > 0 ? (
                                            <img
                                                src={item.images[0]}
                                                alt=""
                                                className="w-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-32 bg-gradient-to-br from-[#2A2A2A] to-[#1E1E1E] flex items-center justify-center p-4">
                                                <p className="text-gray-400 text-xs line-clamp-3">{item.content}</p>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>

                                    <div className="p-3">
                                        <h3 className="font-medium text-sm text-gray-200 mb-2 line-clamp-2 group-hover:text-[#FF00FF] transition-colors">
                                            {item.content || 'Untitled'}
                                        </h3>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <img src={item.avatar_url} className="w-5 h-5 rounded-full bg-gray-700 object-cover" alt="" />
                                                <span className="text-xs text-gray-400 truncate max-w-[60px]">{item.display_name}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-yellow-500">
                                                <Star className="w-3 h-3 fill-yellow-500" />
                                                <span className="text-xs">{item.likes?.length || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedMoment && (
                <MomentDetailModal
                    moment={selectedMoment}
                    onClose={() => setSelectedMoment(null)}
                    onUpdate={handleUpdateMoment}
                />
            )}
        </div>
    );
};

export default FavoritesMomentsPage;
