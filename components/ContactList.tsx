import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Tag } from 'lucide-react';
import { friendsApi } from '../services/friendsApi';
import { useAuth } from '../contexts/AuthContext';
import GlobalRefreshButton from './GlobalRefreshButton';
import GlobalRefreshButton from './GlobalRefreshButton';

interface Friend {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
}

interface ContactListProps {
  onSelectUser: (user: Friend) => void;
  onAddFriend: () => void;
  onNewFriends: () => void;
  onRefresh?: () => Promise<void>;
}

const ContactList: React.FC<ContactListProps> = ({ onSelectUser, onAddFriend, onNewFriends, onRefresh }) => {
  const { token } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFriends = async () => {
    if (!token) return;

    try {
      const data = await friendsApi.getFriends(token);
      setFriends(data.friends || []);
    } catch (error) {
      console.error('[ContactList] Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  const filteredFriends = friends;

  const groupByLetter = (friends: Friend[]) => {
    const grouped: Record<string, Friend[]> = {};

    friends.forEach(friend => {
      const firstLetter = friend.displayName.charAt(0).toUpperCase();
      const key = /^[A-Z]/.test(firstLetter) ? firstLetter : '#';

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(friend);
    });

    const sortedKeys = Object.keys(grouped).sort();
    if (sortedKeys[0] === '#') {
      sortedKeys.shift();
      sortedKeys.push('#');
    }

    const sortedGrouped: Record<string, Friend[]> = {};
    sortedKeys.forEach(key => {
      sortedGrouped[key] = grouped[key].sort((a, b) => a.displayName.localeCompare(b.displayName));
    });

    return sortedGrouped;
  };

  const grouped = groupByLetter(filteredFriends);

  const ActionRow = ({ color, icon: Icon, label, onClick }: any) => (
    <div
      onClick={onClick}
      className="flex items-center px-4 py-3 bg-white border-b border-gray-200/50 active:bg-gray-100 cursor-pointer transition-colors"
    >
      <div className={`w-10 h-10 rounded-md ${color} flex items-center justify-center mr-3 flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <span className="text-[17px]">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#EDEDED] overflow-hidden">
      {/* Header */}
      <div className="h-[50px] flex items-center justify-between px-4 bg-[#EDEDED] border-b border-gray-300/30 flex-shrink-0 z-20 relative">
        <span className="font-medium text-lg">通讯录</span>
        <div className="flex items-center space-x-3">
          {onRefresh && <GlobalRefreshButton onRefresh={onRefresh} />}
          <button onClick={onAddFriend}>
            <UserPlus className="w-6 h-6 text-black" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto z-0">
        {/* Action Rows */}
        <div className="mb-2">
          <ActionRow color="bg-[#07C160]" icon={Users} label="群聊" />
          <ActionRow color="bg-[#2782D7]" icon={Tag} label="标签" />
          <ActionRow color="bg-[#576B95]" icon={Users} label="公众号" />
        </div>

        {/* Contact Count */}
        {!loading && (
          <div className="px-4 py-2 text-sm text-gray-500 bg-[#EDEDED]">
            {searchTerm ? `搜索结果 (${filteredFriends.length})` : `我的好友 (${friends.length})`}
          </div>
        )}

        {/* Grouped Contacts */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            加载中...
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p>{searchTerm ? '无搜索结果' : '还没有好友'}</p>
            {!searchTerm && (
              <button
                onClick={onAddFriend}
                className="mt-4 px-6 py-2 bg-[#07C160] text-white rounded-md"
              >
                添加好友
              </button>
            )}
          </div>
        ) : (
          Object.entries(grouped).map(([letter, contacts]) => (
            <div key={letter}>
              <div className="px-4 py-1.5 text-[13px] font-medium text-gray-500 bg-[#EDEDED] sticky top-0 z-10">
                {letter}
              </div>

              {contacts.map(friend => (
                <div
                  key={friend.userId}
                  onClick={() => onSelectUser(friend)}
                  className="flex items-center px-4 py-3 bg-white border-b border-gray-200/50 active:bg-gray-100 cursor-pointer transition-colors"
                >
                  <img
                    src={friend.avatar}
                    className="w-10 h-10 rounded-md mr-3 flex-shrink-0 object-cover"
                    alt={friend.displayName}
                  />
                  <span className="text-[17px] font-medium text-gray-900">{friend.displayName}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContactList;
