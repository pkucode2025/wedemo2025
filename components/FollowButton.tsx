import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { followsApi } from '../services/followsApi';
import { useAuth } from '../contexts/AuthContext';

interface FollowButtonProps {
    userId: string;
    initialFollowing?: boolean;
    onFollowChange?: (isFollowing: boolean) => void;
}

const FollowButton: React.FC<FollowButtonProps> = ({
    userId,
    initialFollowing = false,
    onFollowChange
}) => {
    const { token, user } = useAuth();
    const [isFollowing, setIsFollowing] = useState(initialFollowing);
    const [loading, setLoading] = useState(false);

    // Don't show follow button for own profile
    if (user?.userId === userId) {
        return null;
    }

    useEffect(() => {
        if (!token) return;

        // Check follow status on mount
        const checkStatus = async () => {
            try {
                const status = await followsApi.checkFollowing(userId, token);
                setIsFollowing(status);
            } catch (error) {
                console.error('Failed to check follow status:', error);
            }
        };

        checkStatus();
    }, [userId, token]);

    const handleToggleFollow = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering parent click events

        if (!token || loading) return;

        setLoading(true);
        try {
            if (isFollowing) {
                await followsApi.unfollowUser(userId, token);
                setIsFollowing(false);
                onFollowChange?.(false);
            } else {
                await followsApi.followUser(userId, token);
                setIsFollowing(true);
                onFollowChange?.(true);
            }
        } catch (error) {
            console.error('Failed to toggle follow:', error);
            alert('Failed to update follow status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggleFollow}
            disabled={loading}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${isFollowing
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-[#FF00FF] text-white hover:bg-[#D900D9]'
                } ${loading ? 'opacity-50 cursor-wait' : ''}`}
        >
            {isFollowing ? (
                <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Following</span>
                </>
            ) : (
                <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Follow</span>
                </>
            )}
        </button>
    );
};

export default FollowButton;
