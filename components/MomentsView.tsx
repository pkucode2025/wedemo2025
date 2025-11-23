import React, { useState, useEffect } from 'react';
import { ChevronLeft, Camera, MessageSquare, Heart, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { momentsApi, Moment } from '../services/momentsApi';
import GlobalRefreshButton from './GlobalRefreshButton';

interface MomentsViewProps {
    onBack: () => void;
    onCreateMoment: () => void;
    onRefresh?: () => Promise<void>;
}

const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60 * 1000) return '刚刚';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const MomentsView: React.FC<MomentsViewProps> = ({ onBack, onCreateMoment, onRefresh }) => {
    const { user, token } = useAuth();
    const [moments, setMoments] = useState<Moment[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentInput, setCommentInput] = useState<{ momentId: number, content: string } | null>(null);

    const loadMoments = async () => {
        if (!token) return;
        try {
            const data = await momentsApi.getMoments(token);
            setMoments(data.moments);
        } catch (error) {
            console.error('Failed to load moments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMoments();
    }, []);

    const handleRefresh = async () => {
        await loadMoments();
        if (onRefresh) await onRefresh();
    };

    const handleLike = async (momentId: number) => {
        if (!token) return;
        try {
            const result = await momentsApi.likeMoment(momentId, token);
            setMoments(prev => prev.map(m =>
                m.id === momentId ? { ...m, likes: result.likes } : m
            ));
        } catch (error) {
            console.error('Failed to like:', error);
        }
    };

    const handleComment = async () => {
        if (!token || !commentInput || !commentInput.content.trim()) return;
        try {
            const result = await momentsApi.commentMoment(commentInput.momentId, commentInput.content, token);
            setMoments(prev => prev.map(m =>
                m.id === commentInput.momentId ? { ...m, comments: result.comments } : m
            ));
            setCommentInput(null);
        } catch (error) {
            console.error('Failed to comment:', error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="h-[50px] bg-[#EDEDED] border-b border-gray-300 flex items-center px-3 justify-between flex-shrink-0 z-10">
                <button onClick={onBack} className="flex items-center text-black">
                    <ChevronLeft className="w-6 h-6" strokeWidth={2} />
                    <span className="text-[16px]">发现</span>
                </button>
                <span className="text-[17px] font-medium">朋友圈</span>
                <div className="flex items-center gap-3">
                    <GlobalRefreshButton onRefresh={handleRefresh} />
                    <button onClick={onCreateMoment}>
                        <Camera className="w-6 h-6 text-black" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Cover Image */}
                <div className="relative h-[300px] bg-gray-800 mb-10">
                    <img
                        src="https://picsum.photos/id/1018/800/600"
                        className="w-full h-full object-cover opacity-80"
                        alt="Cover"
                    />
                    {/* User Info */}
                    <div className="absolute bottom-[-30px] right-4 flex items-end">
                        <span className="text-white font-medium text-lg mr-3 mb-8 shadow-sm">{user?.displayName}</span>
                        <img
                            src={user?.avatar}
                            className="w-[70px] h-[70px] rounded-md border-2 border-white bg-white object-cover"
                            alt="Avatar"
                        />
                    </div>
                </div>

                {/* Moments List */}
                <div className="px-4 pb-10 space-y-8">
                    {moments.map(moment => {
                        const hasLiked = moment.likes?.includes(user?.userId || '');

                        return (
                            <div key={moment.id} className="flex gap-3 border-b border-gray-100 pb-6 last:border-0">
                                <img
                                    src={moment.avatar_url}
                                    className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                                    alt="Avatar"
                                />
                                <div className="flex-1">
                                    <h3 className="text-[#576B95] font-medium text-[16px] mb-1">{moment.display_name}</h3>
                                    <p className="text-[16px] text-gray-900 mb-2 leading-relaxed">{moment.content}</p>

                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-gray-400">{formatTime(moment.created_at)}</span>
                                        <div className="flex items-center gap-4 bg-[#F7F7F7] px-2 py-1 rounded">
                                            <button
                                                onClick={() => handleLike(moment.id)}
                                                className="p-1 flex items-center gap-1"
                                            >
                                                <Heart className={`w-4 h-4 ${hasLiked ? 'text-red-500 fill-current' : 'text-[#576B95]'}`} />
                                                {moment.likes?.length > 0 && <span className="text-xs text-[#576B95]">{moment.likes.length}</span>}
                                            </button>
                                            <button
                                                onClick={() => setCommentInput({ momentId: moment.id, content: '' })}
                                                className="p-1 flex items-center gap-1"
                                            >
                                                <MessageSquare className="w-4 h-4 text-[#576B95]" />
                                                {moment.comments?.length > 0 && <span className="text-xs text-[#576B95]">{moment.comments.length}</span>}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Likes & Comments Area */}
                                    {(moment.likes?.length > 0 || moment.comments?.length > 0) && (
                                        <div className="bg-[#F7F7F7] mt-2 rounded p-2">
                                            {/* Likes */}
                                            {moment.likes?.length > 0 && (
                                                <div className="flex items-center text-[#576B95] text-[14px] mb-1 border-b border-gray-200/50 pb-1">
                                                    <Heart className="w-3 h-3 mr-1" />
                                                    {moment.likes.length} 人觉得很赞
                                                </div>
                                            )}

                                            {/* Comments */}
                                            {moment.comments?.map((comment, idx) => (
                                                <div key={idx} className="text-[14px] leading-tight mb-1">
                                                    <span className="text-[#576B95] font-medium">{comment.displayName}: </span>
                                                    <span className="text-gray-800">{comment.content}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Comment Input */}
                                    {commentInput?.momentId === moment.id && (
                                        <div className="mt-2 flex gap-2">
                                            <input
                                                type="text"
                                                value={commentInput.content}
                                                onChange={(e) => setCommentInput({ ...commentInput, content: e.target.value })}
                                                placeholder="评论..."
                                                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-[#07C160]"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleComment();
                                                }}
                                            />
                                            <button
                                                onClick={handleComment}
                                                className="bg-[#07C160] text-white px-3 py-1 rounded text-sm"
                                            >
                                                发送
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {moments.length === 0 && !loading && (
                        <div className="text-center text-gray-400 py-10">
                            暂无朋友圈，快去发布第一条吧！
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MomentsView;
