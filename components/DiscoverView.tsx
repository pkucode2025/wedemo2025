import React from 'react';
import GlobalRefreshButton from './GlobalRefreshButton';
import { Heart } from 'lucide-react';

interface DiscoverViewProps {
  onRefresh?: () => Promise<void>;
  onMomentsClick: () => void;
}

const DiscoverView: React.FC<DiscoverViewProps> = ({ onRefresh }) => {
  // Mock data for masonry layout
  const feedItems = Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    image: `https://picsum.photos/400/${300 + (i % 3) * 100}?random=${i}`,
    title: ['Neon City Vibes 🌃', 'Cyberpunk Aesthetic 🤖', 'Late Night Coding 💻', 'Future is Now 🚀', 'Digital Dreams 🔮'][i % 5],
    user: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'][i % 5],
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
    likes: 120 + i * 15
  }));

  return (
    <div className="flex flex-col h-full bg-[#121212] text-white">
      {/* Header */}
      <div className="h-[60px] flex items-center justify-between px-6 bg-transparent z-20 relative">
        <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-[#FF00FF] to-[#8A2BE2]">
          Explore
        </span>
        {onRefresh && <GlobalRefreshButton onRefresh={onRefresh} />}
      </div>

      {/* Masonry Grid Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 no-scrollbar">
        <div className="columns-2 gap-4 space-y-4">
          {feedItems.map((item) => (
            <div key={item.id} className="break-inside-avoid mb-4 group cursor-pointer">
              <div className="bg-[#1E1E1E] rounded-2xl overflow-hidden border border-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,0,255,0.15)]">
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="p-3">
                  <h3 className="font-medium text-sm text-gray-200 mb-2 line-clamp-2 group-hover:text-[#FF00FF] transition-colors">
                    {item.title}
                  </h3>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <img src={item.avatar} className="w-5 h-5 rounded-full bg-gray-700" alt="" />
                      <span className="text-xs text-gray-400">{item.user}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Heart className="w-3 h-3 group-hover:text-[#FF00FF] group-hover:fill-[#FF00FF] transition-colors" />
                      <span className="text-xs">{item.likes}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiscoverView;
