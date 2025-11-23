import React, { useState } from 'react';
import GlobalRefreshButton from './GlobalRefreshButton';
import { ChevronRight } from 'lucide-react';

interface DiscoverViewProps {
  onRefresh?: () => Promise<void>;
  onMomentsClick: () => void;
}

const DiscoverView: React.FC<DiscoverViewProps> = ({ onRefresh, onMomentsClick }) => {
  return (
    <div className="flex flex-col h-full bg-[#EDEDED]">
      {/* Header */}
      <div className="h-[50px] flex items-center justify-between px-4 bg-[#EDEDED] border-b border-gray-300/30 flex-shrink-0">
        <span className="font-medium text-lg">发现</span>
        {onRefresh && <GlobalRefreshButton onRefresh={onRefresh} />}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white mt-2">
          {/* Moments removed */}
        </div>

        <div className="bg-white mt-2">
          <DiscoverItem label="视频号" icon="video" />
          <DiscoverItem label="直播" icon="live" />
        </div>

        <div className="bg-white mt-2">
          <DiscoverItem label="扫一扫" icon="scan" />
          <DiscoverItem label="摇一摇" icon="shake" />
        </div>

        <div className="bg-white mt-2">
          <DiscoverItem label="看一看" icon="look" />
          <DiscoverItem label="搜一搜" icon="search" />
        </div>

        <div className="bg-white mt-2">
          <DiscoverItem label="小程序" icon="mini" />
        </div>
      </div>
    </div>
  );
};

const DiscoverItem: React.FC<{ label: string, icon?: string, onClick?: () => void, hasBadge?: boolean }> = ({ label, icon, onClick, hasBadge }) => (
  <div
    onClick={onClick}
    className="px-4 py-3 border-b border-gray-100 flex items-center justify-between active:bg-gray-50 cursor-pointer"
  >
    <div className="flex items-center">
      {/* Icon placeholder */}
      <div className="w-6 h-6 mr-3 flex items-center justify-center">
        {/* Simple colored block as icon placeholder if no image */}
        <div className={`w-5 h-5 ${label === '朋友圈' ? 'rounded-full border-2 border-gray-300' : ''}`}>
          {label === '朋友圈' && <img src="https://picsum.photos/id/10/50/50" className="w-full h-full rounded-full opacity-80" />}
        </div>
      </div>
      <span className="text-[17px]">{label}</span>
    </div>
    <div className="flex items-center">
      {hasBadge && <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />}
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </div>
  </div>
);

export default DiscoverView;
