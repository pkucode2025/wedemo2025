import React from 'react';
import { Home, Grid, MessageCircle, User, Heart } from 'lucide-react';
import { Tab } from '../types';

interface TopNavProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
    unreadTotal: number;
}

const TopNav: React.FC<TopNavProps> = ({ activeTab, onTabChange, unreadTotal }) => {
    const getIconColor = (tab: Tab) => activeTab === tab ? 'text-[#FF00FF]' : 'text-gray-400';
    const getBgColor = (tab: Tab) => activeTab === tab ? 'bg-[#FF00FF]/10' : 'bg-transparent';

    return (
        <div className="h-[70px] w-full bg-[#1E1E1E]/90 backdrop-blur-md border-b border-white/10 flex items-center justify-around px-4 z-50 shadow-lg">
            <button
                onClick={() => onTabChange(Tab.CHATS)}
                className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-300 hover:bg-white/5 ${getBgColor(Tab.CHATS)}`}
            >
                <div className="relative">
                    <MessageCircle
                        className={`${getIconColor(Tab.CHATS)} w-6 h-6 transition-all duration-300`}
                        strokeWidth={activeTab === Tab.CHATS ? 2.5 : 1.5}
                    />
                    {unreadTotal > 0 && (
                        <span className="absolute -top-2 -right-2 bg-[#FF00FF] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-[0_0_10px_#FF00FF]">
                            {unreadTotal > 99 ? '99+' : unreadTotal}
                        </span>
                    )}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${getIconColor(Tab.CHATS)}`}>Chats</span>
            </button>

            <button
                onClick={() => onTabChange(Tab.CONTACTS)}
                className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-300 hover:bg-white/5 ${getBgColor(Tab.CONTACTS)}`}
            >
                <Grid
                    className={`${getIconColor(Tab.CONTACTS)} w-6 h-6 transition-all duration-300`}
                    strokeWidth={activeTab === Tab.CONTACTS ? 2.5 : 1.5}
                />
                <span className={`text-[10px] mt-1 font-medium ${getIconColor(Tab.CONTACTS)}`}>Contacts</span>
            </button>

            <button
                onClick={() => onTabChange(Tab.DISCOVER)}
                className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-300 hover:bg-white/5 ${getBgColor(Tab.DISCOVER)}`}
            >
                <Home
                    className={`${getIconColor(Tab.DISCOVER)} w-6 h-6 transition-all duration-300`}
                    strokeWidth={activeTab === Tab.DISCOVER ? 2.5 : 1.5}
                />
                <span className={`text-[10px] mt-1 font-medium ${getIconColor(Tab.DISCOVER)}`}>Explore</span>
            </button>

            <button
                onClick={() => onTabChange(Tab.ROMANTIC)}
                className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-300 hover:bg-white/5 ${getBgColor(Tab.ROMANTIC)}`}
            >
                <Heart
                    className={`${getIconColor(Tab.ROMANTIC)} w-6 h-6 transition-all duration-300`}
                    strokeWidth={activeTab === Tab.ROMANTIC ? 2.5 : 1.5}
                    fill={activeTab === Tab.ROMANTIC ? 'currentColor' : 'none'}
                />
                <span className={`text-[10px] mt-1 font-medium ${getIconColor(Tab.ROMANTIC)}`}>Romantic</span>
            </button>

            <button
                onClick={() => onTabChange(Tab.ME)}
                className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-300 hover:bg-white/5 ${getBgColor(Tab.ME)}`}
            >
                <User
                    className={`${getIconColor(Tab.ME)} w-6 h-6 transition-all duration-300`}
                    strokeWidth={activeTab === Tab.ME ? 2.5 : 1.5}
                />
                <span className={`text-[10px] mt-1 font-medium ${getIconColor(Tab.ME)}`}>Me</span>
            </button>
        </div>
    );
};

export default TopNav;
