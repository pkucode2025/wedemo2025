import React, { useState } from 'react';
import { X, BookOpen, Share2, Copy, RefreshCw } from 'lucide-react';

interface PoetryLibraryProps {
    onClose: () => void;
}

const poems = [
    {
        title: "She Walks in Beauty",
        author: "Lord Byron",
        content: `She walks in beauty, like the night
Of cloudless climes and starry skies;
And all that's best of dark and bright
Meet in her aspect and her eyes;`
    },
    {
        title: "How Do I Love Thee?",
        author: "Elizabeth Barrett Browning",
        content: `How do I love thee? Let me count the ways.
I love thee to the depth and breadth and height
My soul can reach, when feeling out of sight
For the ends of being and ideal grace.`
    },
    {
        title: "A Red, Red Rose",
        author: "Robert Burns",
        content: `O my Luve is like a red, red rose
That’s newly sprung in June;
O my Luve is like the melody
That’s sweetly played in tune.`
    },
    {
        title: "I Carry Your Heart With Me",
        author: "E.E. Cummings",
        content: `i carry your heart with me(i carry it in
my heart)i am never without it(anywhere
i go you go,my dear;and whatever is done
by only me is your doing,my darling)`
    },
    {
        title: "Annabel Lee",
        author: "Edgar Allan Poe",
        content: `It was many and many a year ago,
In a kingdom by the sea,
That a maiden there lived whom you may know
By the name of Annabel Lee;`
    }
];

const PoetryLibrary: React.FC<PoetryLibraryProps> = ({ onClose }) => {
    const [selectedPoem, setSelectedPoem] = useState(poems[0]);

    const handleCopy = () => {
        navigator.clipboard.writeText(`${selectedPoem.title} by ${selectedPoem.author}\n\n${selectedPoem.content}`);
        alert('Poem copied to clipboard!');
    };

    const handleRandom = () => {
        const randomPoem = poems[Math.floor(Math.random() * poems.length)];
        setSelectedPoem(randomPoem);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="bg-[#1E1E1E] w-full max-w-2xl h-[600px] rounded-2xl flex border border-white/10 shadow-2xl relative overflow-hidden">
                {/* Sidebar List */}
                <div className="w-1/3 border-r border-white/10 bg-[#121212] flex flex-col">
                    <div className="p-4 border-b border-white/10 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-green-400" />
                        <h2 className="font-bold text-white">Library</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {poems.map((poem, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedPoem(poem)}
                                className={`w-full text-left p-4 border-b border-white/5 transition-colors hover:bg-white/5
                                    ${selectedPoem.title === poem.title ? 'bg-white/10 border-l-2 border-l-green-400' : ''}
                                `}
                            >
                                <h3 className="text-sm font-bold text-white truncate">{poem.title}</h3>
                                <p className="text-xs text-gray-500 truncate">{poem.author}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col relative bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex-1 p-8 flex flex-col justify-center items-center text-center overflow-y-auto">
                        <h2 className="text-2xl font-serif font-bold text-white mb-2">{selectedPoem.title}</h2>
                        <p className="text-green-400 text-sm mb-8 font-serif italic">- {selectedPoem.author} -</p>

                        <div className="prose prose-invert max-w-none">
                            <p className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-gray-200">
                                {selectedPoem.content}
                            </p>
                        </div>
                    </div>

                    <div className="p-4 border-t border-white/10 flex justify-center gap-4 bg-[#1E1E1E]">
                        <button
                            onClick={handleRandom}
                            className="flex items-center gap-2 px-4 py-2 bg-[#2A2A2A] text-white rounded-full hover:bg-[#333333] transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Random
                        </button>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-4 py-2 bg-[#2A2A2A] text-white rounded-full hover:bg-[#333333] transition-colors"
                        >
                            <Copy className="w-4 h-4" />
                            Copy
                        </button>
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full hover:opacity-90 transition-opacity"
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PoetryLibrary;
