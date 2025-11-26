import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Tag, Search, UserCheck, UserCircle2 } from 'lucide-react';
import { friendsApi } from '../services/friendsApi';
import { useAuth } from '../contexts/AuthContext';
import GlobalRefreshButton from './GlobalRefreshButton';
import { followsApi, User as FollowUser } from '../services/followsApi';

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
  onGroupClick: () => void;
  onRefresh?: () => Promise<void>;
}

const ContactList: React.FC<ContactListProps> = ({ onSelectUser, onAddFriend, onNewFriends, onGroupClick, onRefresh }) => {
  const { token } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [activeTab, setActiveTab] = useState<'friends' | 'followers' | 'following'>('friends');
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
    const loadAll = async () => {
      setLoading(true);
      try {
        await loadFriends();
        if (token) {
          const [followersList, followingList] = await Promise.all([
            followsApi.getFollowers(token),
            followsApi.getFollowing(token)
          ]);
          setFollowers(followersList || []);
          setFollowing(followingList || []);
        }
      } catch (e) {
        console.error('[ContactList] Error loading contacts:', e);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [token]);

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
      className="flex items-center px-4 py-4 bg-[#1E1E1E] rounded-2xl mb-2 cursor-pointer transition-all duration-300 hover:bg-[#252525] border border-white/5 hover:border-[#FF00FF]/30"
    >
      <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center mr-4 shadow-lg`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-[16px] text-white font-medium">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#121212] text-white">
      {/* Header */}
      <div className="h-[80px] flex items-end justify-between px-6 pb-4 bg-transparent flex-shrink-0 z-20 relative">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF00FF] to-[#8A2BE2]">
          Contacts
        </h1>
        <div className="flex items-center space-x-4 mb-1">
          {onRefresh && <GlobalRefreshButton onRefresh={onRefresh} />}
          <div
            onClick={onAddFriend}
            className="w-10 h-10 rounded-full bg-[#1E1E1E] flex items-center justify-center border border-white/10 shadow-lg cursor-pointer hover:bg-[#2A2A2A] transition-colors"
          >
            <UserPlus className="w-5 h-5 text-[#FF00FF]" />
          </div>
        </div>
      </div>

      {/* Search Bar Placeholder */}
      <div className="px-6 py-2 mb-2">
        <div className="w-full h-10 bg-[#1E1E1E] rounded-xl flex items-center px-1 border border-white/5">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 h-8 mx-1 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${activeTab === 'friends'
              ? 'bg-[#FF00FF] text-white'
              : 'bg-transparent text-gray-400 hover:bg-white/5'
              }`}
          >
            <Users className="w-3 h-3" />
            Friends
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 h-8 mx-1 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${activeTab === 'followers'
              ? 'bg-[#FF00FF] text-white'
              : 'bg-transparent text-gray-400 hover:bg-white/5'
              }`}
          >
            <UserCircle2 className="w-3 h-3" />
            Followers
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 h-8 mx-1 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${activeTab === 'following'
              ? 'bg-[#FF00FF] text-white'
              : 'bg-transparent text-gray-400 hover:bg-white/5'
              }`}
          >
            <UserCheck className="w-3 h-3" />
            Following
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 no-scrollbar">
        {/* Action Rows */}
        <div className="mb-4 space-y-2">
          <ActionRow color="bg-gradient-to-br from-blue-400 to-blue-600" icon={Tag} label="New Friends" onClick={onNewFriends} />
          <ActionRow color="bg-gradient-to-br from-green-400 to-green-600" icon={Users} label="Groups" onClick={onGroupClick} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            Loading...
          </div>
        ) : (
          <>
            {/* Friends */}
            {activeTab === 'friends' && (
              <>
                <div className="px-2 py-2 text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
                  My Friends ({friends.length})
                </div>
                {Object.keys(grouped).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <p>No friends yet</p>
                  </div>
                ) : (
                  Object.entries(grouped).map(([letter, contacts]) => (
                    <div key={letter} className="mb-6">
                      <div className="px-2 py-1.5 text-sm font-bold text-[#FF00FF] sticky top-0 z-10 bg-[#121212]/90 backdrop-blur-sm mb-2">
                        {letter}
                      </div>

                      <div className="space-y-2">
                        {contacts.map(friend => (
                          <div
                            key={friend.userId}
                            onClick={() => onSelectUser(friend)}
                            className="flex items-center p-3 bg-[#1E1E1E] rounded-2xl cursor-pointer transition-all duration-300 hover:bg-[#252525] hover:scale-[1.01] border border-white/5 hover:border-[#FF00FF]/30"
                          >
                            <div className="relative">
                              <img
                                src={friend.avatar}
                                className="w-12 h-12 rounded-full mr-4 flex-shrink-0 object-cover border-2 border-[#121212]"
                                alt={friend.displayName}
                              />
                              <div className="absolute bottom-0 right-4 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1E1E1E]"></div>
                            </div>
                            <span className="text-[16px] font-medium text-white">{friend.displayName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Followers */}
            {activeTab === 'followers' && (
              <>
                <div className="px-2 py-2 text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
                  Followers ({followers.length})
                </div>
                {followers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <p>No followers yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {followers.map(user => (
                      <div
                        key={user.userId}
                        className="flex items-center p-3 bg-[#1E1E1E] rounded-2xl border border-white/5"
                      >
                        <img
                          src={user.avatar}
                          className="w-12 h-12 rounded-full mr-4 flex-shrink-0 object-cover border-2 border-[#121212]"
                          alt={user.displayName}
                        />
                        <div className="flex flex-col">
                          <span className="text-[16px] font-medium text-white">{user.displayName}</span>
                          <span className="text-xs text-gray-500">@{user.username}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Following */}
            {activeTab === 'following' && (
              <>
                <div className="px-2 py-2 text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
                  Following ({following.length})
                </div>
                {following.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <p>Not following anyone yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {following.map(user => (
                      <div
                        key={user.userId}
                        className="flex items-center p-3 bg-[#1E1E1E] rounded-2xl border border-white/5"
                      >
                        <img
                          src={user.avatar}
                          className="w-12 h-12 rounded-full mr-4 flex-shrink-0 object-cover border-2 border-[#121212]"
                          alt={user.displayName}
                        />
                        <div className="flex flex-col">
                          <span className="text-[16px] font-medium text-white">{user.displayName}</span>
                          <span className="text-xs text-gray-500">@{user.username}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ContactList;
