import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder = '搜索' }) => {
    return (
        <div
            className="bg-white rounded-md flex items-center px-3 h-9 relative z-10"
            onClick={() => console.log('Search container clicked')}
        >
            <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => {
                    console.log('Search input changed:', e.target.value);
                    onChange(e.target.value);
                }}
                onClick={(e) => {
                    console.log('Search input clicked');
                    e.stopPropagation();
                }}
                className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400 bg-transparent min-w-0"
                style={{ WebkitAppearance: 'none' }}
            />
        </div>
    );
};

export default SearchInput;
