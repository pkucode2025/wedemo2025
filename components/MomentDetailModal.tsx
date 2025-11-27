import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, MessageCircle, Send, Star, Image as ImageIcon, Mic } from 'lucide-react';
import { Moment, momentsApi } from '../services/momentsApi';
import { useAuth } from '../contexts/AuthContext';
import FollowButton from './FollowButton';
import { uploadService } from '../services/uploadService';
import VoiceRecorder from './VoiceRecorder';

interface MomentDetailModalProps {
    moment: Moment;
    onClose: () => void;
    onUpdate: (updatedMoment: Moment) => void;
}

const MomentDetailModal: React.FC<MomentDetailModalProps> = ({ moment, onClose, onUpdate }) => {
    const { user, token } = useAuth();
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [localMoment, setLocalMoment] = useState<Moment>(moment);
    const [isFavorited, setIsFavorited] = useState(false);
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isLiked = user ? localMoment.likes?.includes(user.userId) : false;

    useEffect(() => {
        // Check if favorited (you could add an API call here)
        setIsFavorited(false);
    }, [moment.id]);

    const handleLike = async () => {
        if (!token) return;
        try {
            const data = await momentsApi.toggleLike(localMoment.id, token);
            setLocalMoment(prev => ({ ...prev, likes: data.likes }));
            onUpdate({ ...localMoment, likes: data.likes });
        } catch (error) {
            console.error('Failed to like:', error);
        }
    };

    const handleFavorite = async () => {
        if (!token) return;
        try {
            const data = await momentsApi.toggleFavorite(localMoment.id, token);
            setIsFavorited(data.favorited);
        } catch (error) {
            console.error('Failed to favorite:', error);
        }
    };

    const handleComment = async (content: string = commentText, type: 'text' | 'image' | 'voice' = 'text') => {
        if ((!content.trim() && type === 'text') || !token) return;
        setSubmitting(true);
        try {
            const data = await momentsApi.addComment(localMoment.id, content, token, type);
            const updatedComments = [...(localMoment.comments || []), data.comment];
            setLocalMoment(prev => ({ ...prev, comments: updatedComments }));
            onUpdate({ ...localMoment, comments: updatedComments });
            if (type === 'text') setCommentText('');
        } catch (error) {
            console.error('Failed to comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;

        try {
            const url = await uploadService.uploadFile(file, token);
            await handleComment(url, 'image');
        } catch (error) {
            console.error('Image upload failed:', error);
            alert('Failed to upload image');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleVoiceRecorded = async (file: File) => {
        if (!token) return;
        try {
            const url = await uploadService.uploadFile(file, token);
            await handleComment(url, 'voice');
            setShowVoiceRecorder(false);
        } catch (error) {
            console.error('Voice upload failed:', error);
            alert('Failed to upload voice comment');
        }
    };

    const renderCommentContent = (comment: any) => {
        switch (comment.type) {
            case 'image':
                return (
                    <img
                        src={comment.content}
                        alt="Comment image"
                        className="max-w-[150px] max-h-[150px] rounded-lg object-cover cursor-pointer hover:opacity-90 mt-1"
                        onClick={() => window.open(comment.content, '_blank')}
                    />
                );
            case 'voice':
                return (
                    <div className="flex items-center gap-2 mt-1">
                        <audio controls src={comment.content} className="h-8 max-w-[200px]" />
                    </div>
                );
            default:
                return <p className="text-gray-300 text-sm">{comment.content}</p>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1E1E1E] w-full max-w-md max-h-[90vh] rounded-2xl flex flex-col overflow-hidden border border-white/10 shadow-2xl relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {/* Images */}
                    {localMoment.images && localMoment.images.length > 0 && (
                        <div className="w-full">
                            {localMoment.images.length === 1 ? (
                                <img src={localMoment.images[0]} alt="" className="w-full max-h-[400px] object-cover" />
                            ) : (
                                <div className={`grid gap-1 ${localMoment.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                                    {localMoment.images.map((img, i) => (
                                        <img key={i} src={img} alt="" className="w-full h-48 object-cover" />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Post Info */}
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <img src={localMoment.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                <div>
                                    <h3 className="text-white font-medium">{localMoment.display_name}</h3>
                                    <span className="text-xs text-gray-500">{new Date(localMoment.created_at).toLocaleString()}</span>
                                </div>
                            </div>
                            <FollowButton userId={localMoment.user_id} />
                        </div>

                        <p className="text-gray-200 text-[15px] leading-relaxed mb-6 whitespace-pre-wrap">
                            {localMoment.content}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-6 border-t border-white/5 pt-4 mb-4">
                            <button
                                onClick={handleLike}
                                className={`flex items-center gap-2 transition-colors ${isLiked ? 'text-[#FF00FF]' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Heart className={`w-5 h-5 ${isLiked ? 'fill-[#FF00FF]' : ''}`} />
                                <span className="text-sm font-medium">{localMoment.likes?.length || 0}</span>
                            </button>
                            <div className="flex items-center gap-2 text-gray-400">
                                <MessageCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">{localMoment.comments?.length || 0}</span>
                            </div>
                            <button
                                onClick={handleFavorite}
                                className={`flex items-center gap-2 transition-colors ${isFavorited ? 'text-yellow-500' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Star className={`w-5 h-5 ${isFavorited ? 'fill-yellow-500' : ''}`} />
                            </button>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-4">
                            {localMoment.comments?.map((comment, idx) => (
                                <div key={idx} className="flex gap-3">
                                    <img
                                        src={comment.user?.avatar || 'https://picsum.photos/50'}
                                        alt=""
                                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                    />
                                    <div className="flex-1 bg-[#2A2A2A] rounded-xl rounded-tl-none p-3">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="text-[#FF00FF] text-xs font-bold">{comment.user?.displayName || 'User'}</span>
                                            <span className="text-[10px] text-gray-600">{new Date(comment.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                        {renderCommentContent(comment)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Comment Input */}
                <div className="p-4 bg-[#1E1E1E] border-t border-white/10">
                    <div className="flex gap-2 items-end">
                        {/* Media Buttons */}
                        <div className="flex items-center pb-2 gap-1">
                            <button
                                onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                                className={`p-2 rounded-full transition-colors ${showVoiceRecorder ? 'text-[#FF00FF] bg-white/10' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 rounded-full text-gray-400 hover:text-white transition-colors"
                            >
                                <ImageIcon className="w-5 h-5" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </div>

                        {showVoiceRecorder ? (
                            <div className="flex-1 flex items-center justify-center h-[42px] bg-[#2A2A2A] rounded-full px-4">
                                <VoiceRecorder
                                    token={token || ''}
                                    onRecordComplete={handleVoiceRecorded}
                                />
                                <button
                                    onClick={() => setShowVoiceRecorder(false)}
                                    className="ml-4 p-1 rounded-full bg-gray-700 hover:bg-gray-600 text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 bg-[#2A2A2A] text-white px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#FF00FF]"
                                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                            />
                        )}

                        {!showVoiceRecorder && (
                            <button
                                onClick={() => handleComment()}
                                disabled={!commentText.trim() || submitting}
                                className={`p-2.5 rounded-full transition-colors ${commentText.trim() ? 'bg-[#FF00FF] text-white' : 'bg-[#2A2A2A] text-gray-500'
                                    }`}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MomentDetailModal;
