import React from 'react';
import { ChevronRight, Camera } from 'lucide-react';
import { User } from '../types';

interface MeViewProps {
  user: User;
}

const MeView: React.FC<MeViewProps> = ({ user }) => {
    const Row = ({ icon, label, border = true }: any) => (
    <div className={`flex items-center justify-between px-4 py-3.5 bg-white active:bg-gray-50 cursor-pointer ${border ? 'border-b border-gray-100' : ''}`}>
      <div className="flex items-center">
        <img src={icon} className="w-6 h-6 mr-4" alt="icon" />
        <span className="text-base text-gray-900">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </div>
  );

  const Separator = () => <div className="h-2 bg-[#EDEDED]" />;

  return (
    <div className="flex flex-col h-full bg-[#EDEDED] overflow-y-auto no-scrollbar pb-16">
       <div className="h-[50px] flex items-center justify-end px-4 bg-white">
         <Camera className="w-6 h-6 text-gray-800" />
      </div>

      <div className="bg-white px-6 pb-8 pt-2 flex items-center mb-2">
        <img src={user.avatar} className="w-16 h-16 rounded-[6px] mr-4" alt="Me" />
        <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
            <div className="flex items-center justify-between mt-1">
                <p className="text-gray-500 text-sm">WeChat ID: wxid_888888</p>
                <div className="flex items-center text-gray-400">
                    <img src="https://img.icons8.com/material-outlined/24/737373/qr-code.png" className="w-4 h-4 mr-2 opacity-60" alt="QR" />
                    <ChevronRight className="w-4 h-4" />
                </div>
            </div>
        </div>
      </div>

      <Separator />

      <Row icon="https://img.icons8.com/color/48/weixing.png" label="Services" border={false} />
      
      <Separator />

      <Row icon="https://img.icons8.com/fluency/48/star-half-empty.png" label="Favorites" />
      <Row icon="https://img.icons8.com/color/48/image-file.png" label="Sticker Gallery" />
      <Row icon="https://img.icons8.com/fluency/48/card-in-use.png" label="Cards & Offers" />
      <Row icon="https://img.icons8.com/color/48/happy-face.png" label="Emoticon" border={false} />

      <Separator />

      <Row icon="https://img.icons8.com/fluency/48/settings.png" label="Settings" border={false} />
    </div>
  );
};

export default MeView;