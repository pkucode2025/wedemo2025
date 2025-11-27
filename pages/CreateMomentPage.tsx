import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { momentsApi } from '../services/momentsApi';
import ImageUploader from '../components/ImageUploader';

interface CreateMomentPageProps {
    onBack: () => void;
    onPostCreated: () => void;
}

const CreateMomentPage: React.FC<CreateMomentPageProps> = ({ onBack, onPostCreated }) => {
    const { token } = useAuth();
    const [content, setContent] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [posting, setPosting] = useState(false);

    const handlePost = async () => {
        if ((!content.trim() && images.length === 0) || !token) return;
        setPosting(true);
        try {
            await momentsApi.createMoment(content, images, token);
            onPostCreated();
        } catch (error) {
            console.error('Failed to post moment:', error);
            alert('Failed to post');
        } finally {
            setPosting(false);
        }
    };

    return (
        <div className="w-full h-full bg-[#121212] flex flex-col">
            {/* Header */}
            <div className="h-[60px] flex items-center justify-between px-4 border-b border-white/10 bg-[#1E1E1E]">
                <button onClick={onBack} className="text-white">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-white text-lg font-medium">New Post</h1>
                <button
                    onClick={handlePost}
                    disabled={posting || (!content.trim() && images.length === 0)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${posting || (!content.trim() && images.length === 0)
                            ? 'bg-gray-700 text-gray-400'
                            : 'bg-[#FF00FF] text-white hover:bg-[#D900D9]'
                        }`}
                >
                    {posting ? 'Posting...' : 'Post'}
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 pb-24">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full h-32 bg-transparent text-white text-lg placeholder-gray-500 resize-none focus:outline-none mb-6"
                />

                {/* Image Uploader */}
                <ImageUploader
                    onImagesChange={setImages}
                    maxImages={9}
                />
            </div>
        </div>
    );
};

export default CreateMomentPage;
