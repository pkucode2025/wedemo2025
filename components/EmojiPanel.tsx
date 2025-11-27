import React from 'react';

interface EmojiPanelProps {
    onSelect: (emoji: string) => void;
}

const EMOJIS = [
    '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊',
    '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '😚', '🙂', '🤗',
    '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥',
    '😮', '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝',
    '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁',
    '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩',
    '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '😡',
    '😠', '🤬', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😇', '🤠',
    '🤡', '🥳', '🥴', '🥺', '🤥', '🤫', '🤭', '🧐', '🤓', '😈',
    '👿', '👹', '👺', '💀', '👻', '👽', '🤖', '💩', '😺', '😸',
    '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👍', '👎', '👊',
    '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '👈', '👉',
    '👆', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤙', '💪',
    '🙏', '🤝', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔'
];

const EmojiPanel: React.FC<EmojiPanelProps> = ({ onSelect }) => {
    return (
        <div className="h-[200px] overflow-y-auto bg-[#EDEDED] p-2 grid grid-cols-8 gap-2 border-t border-gray-300">
            {EMOJIS.map((emoji, index) => (
                <button
                    key={index}
                    onClick={() => onSelect(emoji)}
                    className="text-2xl hover:bg-gray-200 rounded p-1 transition-colors"
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
};

export default EmojiPanel;
