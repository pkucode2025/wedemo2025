import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar } from 'lucide-react';
import { momentsApi, Moment } from '../services/momentsApi';
import { followsApi, User } from '../services/followsApi';
import { useAuth } from '../contexts/AuthContext';
import FollowButton from '../components/FollowButton';
import MomentDetailModal from '../components/MomentDetailModal';
import UserListModal from '../components/UserListModal';

interface UserProfilePageProps {
    userId: string;
    onBack: () => void;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ userId, onBack }) => {
    const { token, user: currentUser } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [moments, setMoments] = useState<Moment[]>([]);
    const [stats, setStats] = useState({ following: 0, followers: 0, moments: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);

    // Modal state
    const [showFollowModal, setShowFollowModal] = useState(false);
    const [followModalTitle, setFollowModalTitle] = useState('');
    const [followList, setFollowList] = useState<User[]>([]);

    useEffect(() => {
        if (!token) return;

        const loadProfile = async () => {
            try {
                // Load all moments and filter by userId
                const allMoments = await momentsApi.getMoments(token);
                const userMoments = allMoments.filter(m => m.user_id === userId);
                setMoments(userMoments);

                // Set user info from first moment
                if (userMoments.length > 0) {
                    setUser({
                        userId: userMoments[0].user_id,
                        username: userMoments[0].user_id,
                        displayName: userMoments[0].display_name,
                        avatar: userMoments[0].avatar_url
                    });
                }

                // Set stats (simplified for now)
                setStats({
                    following: 0,
                    followers: 0,
                    moments: userMoments.length
                });
            } catch (error) {
                console.error('Failed to load profile:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [userId, token]);

    const handleUpdateMoment = (updatedMoment: Moment) => {
        setMoments(prev => prev.map(m => m.id === updatedMoment.id ? updatedMoment : m));
        setSelectedMoment(updatedMoment);
    };

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

    if (loading) {
        return (
            <div className="w-full h-full bg-[#121212] flex items-center justify-center">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="w-full h-full bg-[#121212] flex items-center justify-center">
                <div className="text-gray-500">User not found</div>
            </div>
        );
    }

    const isOwnProfile = currentUser?.userId === userId;

    return (
        <div className="w-full h-full bg-[#121212] flex flex-col">
            {/* Header */}
            <div className="h-[60px] flex items-center justify-between px-4 border-b border-white/10 bg-[#1E1E1E]">
                <button onClick={onBack} className="text-white">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-white text-lg font-medium">Profile</h1>
                <div className="w-6" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pb-24">
                {/* Profile Header */}
                <div className="bg-[#1E1E1E] p-6 border-b border-white/10">
                    <div className="flex items-start gap-4 mb-4">
                        <img
                            src={user.avatar}
                            alt={user.displayName}
                            className="w-20 h-20 rounded-full object-cover border-2 border-[#FF00FF]"
                        />
                        <div className="flex-1">
                            <h2 className="text-white text-xl font-bold mb-1">{user.displayName}</h2>
                            <p className="text-gray-400 text-sm mb-3">@{user.username}</p>
                            {!isOwnProfile && (
                                <FollowButton userId={userId} />
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 pt-4 border-t border-white/5">
                        <div className="text-center">
                            <div className="text-white font-bold text-lg">{stats.moments}</div>
                            <div className="text-gray-400 text-xs">Posts</div>
                        </div>
                        <div
                            className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={handleShowFollowers}
                        >
                            <div className="text-white font-bold text-lg">{stats.followers}</div>
                            <div className="text-gray-400 text-xs">Followers</div>
                        </div>
                        <div
                            className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={handleShowFollowing}
                        >
                            <div className="text-white font-bold text-lg">{stats.following}</div>
                            <div className="text-gray-400 text-xs">Following</div>
                        </div>
                    </div>
                </div>

                {/* Moments Grid */}
                <div className="p-4">
                    <h3 className="text-white font-medium mb-4">Posts</h3>
                    {moments.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            <p>No posts yet</p>
                        </div>
                    ) : (
                        <div className="columns-2 gap-4 space-y-4">
                            {moments.map((item) => (
                                <div
                                    key={item.id}
                                    className="break-inside-avoid mb-4 group cursor-pointer"
                                    onClick={() => setSelectedMoment(item)}
                                >
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
                                        </div>
                                        <div className="p-3">
                                            <p className="text-gray-300 text-sm line-clamp-2">{item.content}</p>
                                            <div className="flex items-center gap-2 mt-2 text-gray-500 text-xs">
                                                <span>{item.likes?.length || 0} likes</span>
                                                <span>•</span>
                                                <span>{item.comments?.length || 0} comments</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedMoment && (
                <MomentDetailModal
                    moment={selectedMoment}
                    onClose={() => setSelectedMoment(null)}
                    onUpdate={handleUpdateMoment}
                />
            )}

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

export default UserProfilePage;
