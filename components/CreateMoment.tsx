import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { momentsApi } from '../services/momentsApi';

interface CreateMomentProps {
    onClose: () => void;
    onSuccess: () => void;
}

const CreateMoment: React.FC<CreateMomentProps> = ({ onClose, onSuccess }) => {
    const { token } = useAuth();
    const [content, setContent] = useState('');
    const [posting, setPosting] = useState(false);

    const handlePost = async () => {
        if (!content.trim() || !token) return;

        setPosting(true);
        try {
            await momentsApi.createMoment(content, token);
            onSuccess();
        } catch (error) {
            console.error('Failed to post moment:', error);
            alert('发布失败，请重试');
        } finally {
            setPosting(false);
        }
    };

    return (
        <div className="absolute inset-0 z-50 bg-white flex flex-col">
            {/* Header */}
            <div className="h-[50px] bg-[#EDEDED] border-b border-gray-300 flex items-center px-3 justify-between flex-shrink-0">
                <button onClick={onClose} className="text-[16px] text-black">
                    取消
                </button>
                <button
                    onClick={handlePost}
                    disabled={!content.trim() || posting}
                    className={`px-4 py-1.5 rounded-md text-white text-[15px] font-medium ${content.trim() && !posting ? 'bg-[#07C160]' : 'bg-gray-300'
                        }`}
                >
                    {posting ? '发表中...' : '发表'}
                </button>
            </div>

            {/* Input Area */}
            <div className="p-4 flex-1">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="这一刻的想法..."
                    className="w-full h-[150px] text-[17px] outline-none resize-none placeholder-gray-400"
                    autoFocus
                />
            </div>
        </div>
    );
};

export default CreateMoment;
