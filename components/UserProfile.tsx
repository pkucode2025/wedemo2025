import React from 'react';
import { ChevronLeft, MessageSquare, Video, MoreHorizontal } from 'lucide-react';

interface Partner {
    userId: string;
    name: string;
    avatar: string;
}

interface UserProfileProps {
    partner: Partner;
    onBack: () => void;
    onSendMessage: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ partner, onBack, onSendMessage }) => {
    const InfoRow = ({ label, value }: { label: string, value: string }) => (
        <div className="flex py-4 border-b border-gray-100 last:border-0">
            <span className="w-20 text-[16px] text-gray-900">{label}</span>
            <span className="text-[16px] text-gray-500">{value}</span>
        </div>
    );

    return (
        <div className="absolute inset-0 z-50 bg-white flex flex-col">
            {/* Header */}
            <div className="h-[50px] bg-white flex items-center px-3 justify-between flex-shrink-0">
                <button onClick={onBack} className="flex items-center text-black">
                    <ChevronLeft className="w-6 h-6" strokeWidth={2} />
                </button>
                <button>
                    <MoreHorizontal className="w-6 h-6 text-black" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-white">
                {/* Basic Info */}
                <div className="px-6 py-4 flex items-start mb-6">
                    <img
                        src={partner.avatar}
                        className="w-16 h-16 rounded-md object-cover mr-5"
                        alt={partner.name}
                    />
                    <div className="flex-1">
                        <h2 className="text-[22px] font-medium text-black mb-1 flex items-center">
                            {partner.name}
                            {/* Gender Icon placeholder */}
                        </h2>
                        <p className="text-[14px] text-gray-500">微信号: {partner.userId}</p>
                        <p className="text-[14px] text-gray-500 mt-1">地区: 中国</p>
                    </div>
                </div>

                <div className="h-2 bg-[#EDEDED]" />

                {/* Details */}
                <div className="px-6">
                    <div className="py-4 border-b border-gray-100 flex justify-between items-center active:bg-gray-50 cursor-pointer">
                        <span className="text-[16px] text-gray-900">朋友圈</span>
                        <div className="flex items-center">
                            {/* Placeholder for recent moment images */}
                            <div className="w-2 h-2 border-t-2 border-r-2 border-gray-300 rotate-45" />
                        </div>
                    </div>
                    <div className="py-4 border-b border-gray-100 flex justify-between items-center active:bg-gray-50 cursor-pointer">
                        <span className="text-[16px] text-gray-900">更多信息</span>
                        <div className="w-2 h-2 border-t-2 border-r-2 border-gray-300 rotate-45" />
                    </div>
                </div>

                <div className="h-2 bg-[#EDEDED]" />

                {/* Actions */}
                <div className="px-6 py-6 space-y-3">
                    <button
                        onClick={onSendMessage}
                        className="w-full py-3 bg-[#EDEDED] text-[#576B95] text-[17px] font-medium rounded-md flex items-center justify-center active:bg-gray-200"
                    >
                        <MessageSquare className="w-5 h-5 mr-2" />
                        发消息
                    </button>
                    <button className="w-full py-3 bg-[#EDEDED] text-[#576B95] text-[17px] font-medium rounded-md flex items-center justify-center active:bg-gray-200">
                        <Video className="w-5 h-5 mr-2" />
                        音视频通话
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
