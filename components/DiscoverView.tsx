import React from 'react';
import GlobalRefreshButton from './GlobalRefreshButton';

interface DiscoverViewProps {
  onRefresh?: () => Promise<void>;
}

const DiscoverView: React.FC<DiscoverViewProps> = ({ onRefresh }) => {
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
          <DiscoverItem label="朋友圈" />
        </div>

        <div className="bg-white mt-2">
          <DiscoverItem label="视频号" />
          <DiscoverItem label="直播" />
        </div>

        <div className="bg-white mt-2">
          <DiscoverItem label="扫一扫" />
          <DiscoverItem label="摇一摇" />
        </div>

        <div className="bg-white mt-2">
          <DiscoverItem label="看一看" />
          <DiscoverItem label="搜一搜" />
        </div>

        <div className="bg-white mt-2">
          <DiscoverItem label="小程序" />
        </div>
      </div>
    </div>
  );
};

const DiscoverItem: React.FC<{ label: string }> = ({ label }) => (
  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between active:bg-gray-50 cursor-pointer">
    <span className="text-[17px]">{label}</span>
    <div className="w-2 h-2 rounded-full bg-gray-300" />
  </div>
);

export default DiscoverView;
