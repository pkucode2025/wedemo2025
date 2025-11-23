import React, { useState } from 'react';
import { ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { momentsApi } from '../services/momentsApi';

interface CreateMomentPageProps {
    onBack: () => void;
    onPostCreated: () => void;
}

const CreateMomentPage: React.FC<CreateMomentPageProps> = ({ onBack, onPostCreated }) => {
    const { token } = useAuth();
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [posting, setPosting] = useState(false);

    const handleAddImage = () => {
        if (imageUrl.trim()) {
            setImages([...images, imageUrl.trim()]);
            setImageUrl('');
        }
    };

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
            <div className="flex-1 p-4">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full h-32 bg-transparent text-white text-lg placeholder-gray-500 resize-none focus:outline-none mb-4"
                />

                {/* Image Preview Grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {images.map((img, index) => (
                        <div key={index} className="aspect-square relative group rounded-lg overflow-hidden bg-[#1E1E1E]">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button
                                onClick={() => setImages(images.filter((_, i) => i !== index))}
                                className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add Image Input (Simple URL for now) */}
                <div className="bg-[#1E1E1E] p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="w-5 h-5 text-[#FF00FF]" />
                        <span className="text-white font-medium">Add Image</span>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="Paste image URL here..."
                            className="flex-1 bg-[#2A2A2A] text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF00FF]"
                        />
                        <button
                            onClick={handleAddImage}
                            disabled={!imageUrl.trim()}
                            className="px-3 py-2 bg-[#2A2A2A] text-white rounded-lg text-sm hover:bg-[#333]"
                        >
                            Add
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Tip: Use Unsplash or other image URLs.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CreateMomentPage;
