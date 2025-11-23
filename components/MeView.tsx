import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { Settings, Heart, Star, LogOut, Edit3, UserCheck, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GlobalRefreshButton from './GlobalRefreshButton';
import { followsApi } from '../services/followsApi';
import UserListModal from './UserListModal';

interface MeViewProps {
  user: User;
  onRefresh?: () => Promise<void>;
  onEditProfile?: () => void;
  onMyLikesClick?: () => void;
  onFavoritesClick?: () => void;
}


const MeView: React.FC<MeViewProps> = ({ user, onRefresh, onEditProfile, onMyLikesClick, onFavoritesClick }) => {
  const { token, logout } = useAuth();
  const [stats, setStats] = useState<{ followingCount: number; followersCount: number; likesCount: number; favoritesCount: number } | null>(null);

  // Modal state
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalTitle, setFollowModalTitle] = useState('');
  const [followList, setFollowList] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          console.error('Failed to fetch me stats');
        }
      } catch (e) {
        console.error('Error fetching me stats', e);
      }
    };
    fetchStats();
  }, [token]);

  const handleShowFollowing = async () => {
    if (!token) return;
    try {
      const list = await followsApi.getFollowing(token);
      setFollowList(list);
      setFollowModalTitle('Following');
      setShowFollowModal(true);
    } catch (error) {
      console.error('Failed to load following:', error);
    }
  };

  const handleShowFollowers = async () => {
    if (!token) return;
    try {
      const list = await followsApi.getFollowers(token);
      setFollowList(list);
      setFollowModalTitle('Followers');
      setShowFollowModal(true);
    } catch (error) {
      console.error('Failed to load followers:', error);
    }
  };

  const following = stats?.followingCount ?? 0;
  const followers = stats?.followersCount ?? 0;
  const likes = stats?.likesCount ?? 0;
  const favorites = stats?.favoritesCount ?? 0;

  return (
    <div className="flex flex-col h-full bg-[#121212] text-white">
      {/* Header Image */}
      <div className="h-[200px] w-full relative">
        <img
          src="https://picsum.photos/800/400?grayscale&blur=2"
          className="w-full h-full object-cover opacity-60"
          alt="Cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#121212]" />

        {/* Top Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          {onRefresh && <GlobalRefreshButton onRefresh={onRefresh} />}
          <button className="p-2 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-white/10">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-6 -mt-16 relative z-10">
        <div className="flex justify-between items-end mb-4">
          <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-[#FF00FF] to-[#8A2BE2] shadow-[0_0_20px_rgba(255,0,255,0.3)]">
            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover border-4 border-[#121212]" />
          </div>
          <button
            onClick={onEditProfile}
            className="px-4 py-2 rounded-full bg-[#1E1E1E] border border-white/10 text-sm font-medium hover:bg-[#2A2A2A] hover:border-[#FF00FF]/50 transition-all flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
        <p className="text-gray-400 text-sm mb-6">@{user.id} • Digital Nomad • Cyberpunk Enthusiast</p>

        {/* Stats */}
        <div className="flex gap-8 mb-8">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{following}</div>
            <div className="text-xs text-gray-500">Following</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{followers}</div>
            <div className="text-xs text-gray-500">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{likes}</div>
            <div className="text-xs text-gray-500">Likes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{favorites}</div>
            <div className="text-xs text-gray-500">Favorites</div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          {/* Removed Close Friends */}
          <MenuItem icon={UserCheck} label="Following" count={String(following)} onClick={handleShowFollowing} />
          <MenuItem icon={Users} label="Followers" count={String(followers)} onClick={handleShowFollowers} />
          <MenuItem icon={Heart} label="My Likes" count={String(likes)} onClick={onMyLikesClick} />
          <MenuItem icon={Star} label="Favorites" count={String(favorites)} onClick={onFavoritesClick} />

          <button
            onClick={logout}
            className="w-full mt-8 p-4 rounded-2xl bg-[#1E1E1E] border border-red-500/20 text-red-500 flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </div>

      {showFollowModal && (
        <UserListModal
          title={followModalTitle}
          users={followList}
          onClose={() => setShowFollowModal(false)}
        />
      )}
    </div>
  );
};


const MenuItem: React.FC<{ icon: any; label: string; count?: string; onClick?: () => void }> = ({ icon: Icon, label, count, onClick }) => (
  <div
    onClick={onClick}
    className="flex items-center justify-between p-4 rounded-2xl bg-[#1E1E1E] border border-white/5 cursor-pointer hover:bg-[#252525] transition-colors group"
  >
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-[#2A2A2A] text-gray-400 group-hover:text-[#FF00FF] transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <span className="font-medium">{label}</span>
    </div>
    {count && <span className="text-sm text-gray-500">{count}</span>}
  </div>
);

export default MeView;
