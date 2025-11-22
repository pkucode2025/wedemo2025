import React from 'react';
import { ChevronRight } from 'lucide-react';

const DiscoverView: React.FC = () => {
  const Row = ({ icon, label, border = true, extra }: any) => (
    <div className="flex items-center justify-between px-4 py-3 bg-white active:bg-gray-50 cursor-pointer">
      <div className="flex items-center">
        <img src={icon} className="w-6 h-6 mr-4" alt="icon" />
        <span className="text-base text-gray-900">{label}</span>
      </div>
      <div className="flex items-center">
          {extra}
          <ChevronRight className="w-5 h-5 text-gray-400 ml-2" />
      </div>
    </div>
  );

  const Separator = () => <div className="h-2 bg-[#EDEDED]" />;

  return (
    <div className="flex flex-col h-full bg-[#EDEDED] overflow-y-auto no-scrollbar pb-16">
       <div className="h-[50px] flex items-center justify-center bg-[#EDEDED] sticky top-0 z-10">
        <span className="font-medium text-lg">Discover</span>
      </div>

      <Row 
        icon="https://img.icons8.com/color/48/camera-lens.png" 
        label="Moments" 
        extra={<div className="w-2 h-2 bg-red-500 rounded-full"></div>}
      />
      
      <Separator />
      
      <div className="border-b border-gray-100">
        <Row icon="https://img.icons8.com/fluency/48/qr-code.png" label="Scan" />
      </div>
      <Row icon="https://img.icons8.com/color/48/shake-phone.png" label="Shake" />

      <Separator />
      
      <div className="border-b border-gray-100">
        <Row icon="https://img.icons8.com/color/48/news.png" label="Top Stories" />
      </div>
      <Row icon="https://img.icons8.com/color/48/search--v1.png" label="Search" />

      <Separator />

      <Row icon="https://img.icons8.com/fluency/48/people-working-together.png" label="Channels" />
    </div>
  );
};

export default DiscoverView;