import React, { useState, useRef } from 'react';
import { Image as ImageIcon, X, Upload } from 'lucide-react';
import { imageService } from '../services/imageService';

interface ImageUploaderProps {
    onImagesChange: (images: string[]) => void;
    maxImages?: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesChange, maxImages = 9 }) => {
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        if (files.length === 0) return;

        if (images.length + files.length > maxImages) {
            alert(`You can only upload up to ${maxImages} images`);
            return;
        }

        setUploading(true);
        try {
            const newImages: string[] = [];

            for (const file of files) {
                const validation = imageService.validateImage(file);
                if (!validation.valid) {
                    alert(validation.error);
                    continue;
                }

                const base64 = await imageService.resizeImage(file, 1200, 1200);
                newImages.push(base64);
            }

            const updatedImages = [...images, ...newImages];
            setImages(updatedImages);
            onImagesChange(updatedImages);
        } catch (error) {
            console.error('Error uploading images:', error);
            alert('Failed to upload images. Please try again.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeImage = (index: number) => {
        const updatedImages = images.filter((_, i) => i !== index);
        setImages(updatedImages);
        onImagesChange(updatedImages);
    };

    return (
        <div className="w-full">
            {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {images.map((img, index) => (
                        <div key={index} className="aspect-square relative group rounded-lg overflow-hidden bg-[#1E1E1E]">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 bg-black/70 rounded-full p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {images.length < maxImages && (
                <div className="bg-[#1E1E1E] p-4 rounded-xl border border-white/5">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        id="image-upload"
                    />
                    <label
                        htmlFor="image-upload"
                        className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-white/10 cursor-pointer hover:border-[#FF00FF]/50 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        {uploading ? (
                            <>
                                <Upload className="w-5 h-5 text-[#FF00FF] animate-pulse" />
                                <span className="text-white text-sm">Uploading...</span>
                            </>
                        ) : (
                            <>
                                <ImageIcon className="w-5 h-5 text-[#FF00FF]" />
                                <span className="text-white text-sm font-medium">
                                    Add Images ({images.length}/{maxImages})
                                </span>
                            </>
                        )}
                    </label>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        JPG, PNG, GIF, WebP • Max 5MB per image
                    </p>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
