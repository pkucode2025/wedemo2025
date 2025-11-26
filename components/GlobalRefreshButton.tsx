import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface GlobalRefreshButtonProps {
    onRefresh: () => Promise<void>;
    className?: string;
}

const GlobalRefreshButton: React.FC<GlobalRefreshButtonProps> = ({ onRefresh, className = '' }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            await onRefresh();
        } finally {
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    return (
        <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-1.5 hover:bg-white/10 rounded-full transition-colors ${className}`}
            title="刷新"
        >
            <RefreshCw className={`w-5 h-5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
    );
};

export default GlobalRefreshButton;
