import React, { useState, useEffect } from 'react';
import GlobalRefreshButton from './GlobalRefreshButton';
import { Heart, Plus } from 'lucide-react';
import { momentsApi, Moment } from '../services/momentsApi';
import { useAuth } from '../contexts/AuthContext';
import MomentDetailModal from './MomentDetailModal';
import FollowButton from './FollowButton';

interface DiscoverViewProps {
  onRefresh?: () => Promise<void>;
  onCreatePost: () => void;
}

const DiscoverView: React.FC<DiscoverViewProps> = ({ onRefresh, onCreatePost }) => {
  const { token } = useAuth();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);

  const loadMoments = async () => {
    if (!token) return;
    try {
      const data = await momentsApi.getMoments(token);
      setMoments(data);
    } catch (error) {
      console.error('Failed to load moments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMoments();
  }, [token]);

  const handleRefresh = async () => {
    setLoading(true);
    await loadMoments();
    if (onRefresh) await onRefresh();
  };

  const handleUpdateMoment = (updatedMoment: Moment) => {
    setMoments(prev => prev.map(m => m.id === updatedMoment.id ? updatedMoment : m));
    setSelectedMoment(updatedMoment);
  };

  return (
    <div className="flex flex-col h-full bg-[#121212] text-white relative">
      {/* Header */}
      <div className="h-[60px] flex items-center justify-between px-6 bg-transparent z-20 relative">
        <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-[#FF00FF] to-[#8A2BE2]">
          Explore
        </span>
        <div className="flex items-center gap-4">
          <GlobalRefreshButton onRefresh={handleRefresh} />
        </div>
      </div>

      {/* Masonry Grid Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 no-scrollbar">
        {loading ? (
          <div className="flex justify-center py-20 text-gray-500">Loading moments...</div>
        ) : moments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <p>No posts yet.</p>
            <p className="text-sm mt-2">Be the first to share!</p>
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
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[#FF00FF]">
                          <Heart className="w-3 h-3" />
                          <span className="text-xs">{item.likes?.length || 0}</span>
                        </div>
                        <FollowButton userId={item.user_id} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={onCreatePost}
        className="absolute bottom-24 right-6 w-14 h-14 bg-[#FF00FF] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,0,255,0.4)] hover:scale-110 transition-transform z-30"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

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

export default DiscoverView;
