import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Tab, ChatSession } from './types';
import { fetchChats, markChatAsRead } from './services/chatApi';
import BottomNav from './components/BottomNav';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import ContactList from './components/ContactList';
import DiscoverView from './components/DiscoverView';
import MeView from './components/MeView';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CreateMomentPage from './pages/CreateMomentPage';
import LikedMomentsPage from './pages/LikedMomentsPage';
import FavoritesMomentsPage from './pages/FavoritesMomentsPage';
import UserProfilePage from './pages/UserProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import CreateGroupModal from './components/CreateGroupModal';
import AddFriendPage from './pages/AddFriendPage';
import NewFriendsPage from './components/NewFriendsPage';
import EditProfilePage from './pages/EditProfilePage';
type AuthPage = 'login' | 'register' | 'reset';

interface PartnerInfo {
  userId: string;
  name: string;
  avatar: string;
}

// 生成两个用户之间的chat_id（确保顺序一致）
function generateChatId(userId1: string, userId2: string): string {
  const [user1, user2] = [userId1, userId2].sort();
  return `chat_${user1}_${user2}`;
}

const MainApp: React.FC = () => {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const [authPage, setAuthPage] = useState<AuthPage>('login');
  const path = window.location.pathname;

  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHATS);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const [currentPartner, setCurrentPartner] = useState<PartnerInfo | null>(null);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [partners, setPartners] = useState<Record<string, PartnerInfo>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateMoment, setShowCreateMoment] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showNewFriends, setShowNewFriends] = useState(false);
  const [showLikedMoments, setShowLikedMoments] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // 加载聊天列表
  const loadChatsAndPartners = async () => {
    if (!token) return;

    try {
      const [chats, groupsRes] = await Promise.all([
        fetchChats(token),
        fetch('/api/groups', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json())
      ]);

      const sessions: ChatSession[] = [];
      const partnerMap: Record<string, PartnerInfo> = {};

      // Process 1-on-1 chats
      if (Array.isArray(chats)) {
        chats.forEach((chat: any) => {
          sessions.push({
            id: chat.id,
            partnerId: chat.partnerId,
            lastMessage: chat.lastMessage,
            lastMessageTime: chat.lastMessageTime,
            unreadCount: chat.unreadCount || 0,
          });

          if (chat.partnerId && chat.partnerName) {
            partnerMap[chat.partnerId] = {
              userId: chat.partnerId,
              name: chat.partnerName,
              avatar: chat.partnerAvatar || 'https://picsum.photos/id/64/200/200'
            };
          }
        });
      }

      // Process groups
      if (groupsRes && groupsRes.groups) {
        groupsRes.groups.forEach((group: any) => {
          sessions.push({
            id: group.id, // group_xxx
            partnerId: group.id, // Use group ID as partner ID for display lookup
            lastMessage: 'Group created', // TODO: Fetch real last message
            lastMessageTime: new Date(group.joinedAt).getTime(),
            unreadCount: 0,
          });

          partnerMap[group.id] = {
            userId: group.id,
            name: group.name,
            avatar: group.avatar || 'https://picsum.photos/id/10/200/200'
          };
        });
      }

      setPartners(partnerMap);
      setSessions(sessions);
      setLoading(false);
    } catch (error) {
      console.error('[App] ❌ Error loading chats:', error);
      setSessions([]);
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    // Auto-initialize database tables
    fetch('/api/setup').catch(err => console.error('DB Setup failed:', err));

    if (isAuthenticated && token) {
      loadChatsAndPartners();
    }
  }, [isAuthenticated, token]);

  const unreadTotal = sessions.reduce((acc, session) => acc + session.unreadCount, 0);

  const refreshChatList = async () => {
    await loadChatsAndPartners();
  };

  const handleSendMessage = (chatId: string, text: string, sender: 'me' | 'partner') => {
    // 立即更新本地状态
    setSessions(prev => {
      const exists = prev.find(s => s.id === chatId);
      if (exists) {
        return prev.map(session => {
          if (session.id === chatId) {
            return {
              ...session,
              lastMessage: text,
              lastMessageTime: Date.now(),
              unreadCount: sender === 'partner' ? session.unreadCount + 1 : 0
            };
          }
          return session;
        });
      }
      return prev;
    });

    // 延迟刷新以获取准确数据
    setTimeout(() => {
      refreshChatList();
    }, 2000);
  };

  const handleSelectChat = async (sessionId: string) => {
    // 标记为已读
    if (token) {
      await markChatAsRead(sessionId, token);
    }

    // 清除未读数
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, unreadCount: 0 } : s));

    // Find partner for this session
    const session = sessions.find(s => s.id === sessionId);
    if (session && partners[session.partnerId]) {
      setCurrentPartner(partners[session.partnerId]);
    }

    setSelectedChatId(sessionId);
  };

  // 点击联系人 -> 直接开始聊天
  const handleCreateGroup = async (name: string, memberIds: string[]) => {
    if (!token) return;
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, memberIds })
      });

      if (res.ok) {
        setShowCreateGroup(false);
        loadChatsAndPartners(); // Refresh list
      } else {
        alert('Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleSelectContact = (contactUser: any) => {
    handleStartChat({
      userId: contactUser.userId,
      name: contactUser.displayName,
      avatar: contactUser.avatar
    });
  };

  // 开始聊天
  const handleStartChat = async (partner: PartnerInfo) => {
    if (!token || !user) return;

    // Switch to chat tab
    setActiveTab(Tab.CHATS);

    // 生成chatId
    const chatId = generateChatId(user.userId, partner.userId);

    // 添加partner信息
    setPartners(prev => ({
      ...prev,
      [partner.userId]: partner
    }));

    // Set current partner immediately to avoid race condition
    setCurrentPartner(partner);

    // 检查是否已有聊天
    let existingSession = sessions.find(s => s.id === chatId);

    if (!existingSession) {
      // 创建新会话
      const newSession: ChatSession = {
        id: chatId,
        partnerId: partner.userId,
        lastMessage: '发起聊天...',
        lastMessageTime: Date.now(),
        unreadCount: 0
      };
      setSessions(prev => [newSession, ...prev]);
      existingSession = newSession;
    }

    // 打开聊天窗口
    setSelectedChatId(existingSession.id);
  };

  const renderContent = () => {
    if (showCreateGroup) {
      return (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreate={handleCreateGroup}
        />
      );
    }

    if (showAddFriend) {
      return <AddFriendPage onBack={() => setShowAddFriend(false)} />;
    }

    if (showNewFriends) {
      return <NewFriendsPage onClose={() => setShowNewFriends(false)} />;
    }

    if (showCreateMoment) {
      return (
        <CreateMomentPage
          onBack={() => setShowCreateMoment(false)}
          onPostCreated={() => {
            setShowCreateMoment(false);
          }}
        />
      );
    }

    if (showLikedMoments) {
      return <LikedMomentsPage onBack={() => setShowLikedMoments(false)} />;
    }

    if (showFavorites) {
      return <FavoritesMomentsPage onBack={() => setShowFavorites(false)} />;
    }

    if (showEditProfile) {
      return <EditProfilePage onClose={() => setShowEditProfile(false)} />;
    }

    if (path === '/admin/login') {
      return <AdminLoginPage />;
    }

    if (path === '/admin') {
      return <AdminDashboard />;
    }

    if (path.startsWith('/profile/') && selectedUserId) {
      return <UserProfilePage userId={selectedUserId} onBack={() => { setShowUserProfile(false); setSelectedUserId(null); }} />;
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center h-full bg-[#EDEDED]">
          <div className="text-gray-500">加载中...</div>
        </div>
      );
    }

    switch (activeTab) {
      case Tab.CHATS:
        return <ChatList sessions={sessions} partners={partners} onSelectChat={handleSelectChat} onRefresh={refreshChatList} />;
      case Tab.CONTACTS:
        return (
          <ContactList
            onSelectUser={handleSelectContact}
            onAddFriend={() => setShowAddFriend(true)}
            onNewFriends={() => setShowNewFriends(true)}
            onGroupClick={() => setShowCreateGroup(true)}
            onRefresh={refreshChatList}
          />
        );
      case Tab.DISCOVER:
        return <DiscoverView
          onRefresh={refreshChatList}
          onMomentsClick={() => { }} // Disabled
          onCreatePost={() => setShowCreateMoment(true)}
        />;
      case Tab.ME:
        return user ? <MeView
          user={{
            id: user.userId,
            name: user.displayName,
            avatar: user.avatar
          }}
          onRefresh={refreshChatList}
          onEditProfile={() => setShowEditProfile(true)}
          onMyLikesClick={() => setShowLikedMoments(true)}
          onFavoritesClick={() => setShowFavorites(true)}
        /> : null;
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-gray-600 text-lg">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    switch (authPage) {
      case 'register':
        return <RegisterPage onSwitchToLogin={() => setAuthPage('login')} />;
      case 'reset':
        return <ResetPasswordPage onBack={() => setAuthPage('login')} />;
      default:
        return (
          <LoginPage
            onSwitchToRegister={() => setAuthPage('register')}
            onSwitchToReset={() => setAuthPage('reset')}
          />
        );
    }
  }

  // Use explicit currentPartner state if available, otherwise fallback to derivation
  const activePartner = currentPartner || (selectedChatId && sessions.find(s => s.id === selectedChatId)
    ? partners[sessions.find(s => s.id === selectedChatId)!.partnerId]
    : null);

  return (
    <div className="w-full h-full flex flex-col bg-[#121212] relative">
      <div className="flex-1 overflow-hidden relative">
        {renderContent()}

        {/* Chat Window - Layer 50 */}
        {selectedChatId && activePartner && (
          <div className="absolute inset-0 z-[50] bg-[#121212]">
            <ChatWindow
              chatId={selectedChatId}
              partner={{
                ...activePartner,
                isAi: false
              }}
              onBack={() => {
                setSelectedChatId(null);
                setCurrentPartner(null);
                refreshChatList();
              }}
              onSendMessage={handleSendMessage}
              onChatDetails={() => { }} // Disabled
            />
          </div>
        )}
      </div>

      {!selectedChatId && path !== '/admin' && path !== '/admin/login' && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSelectedChatId(null);
            if (tab === Tab.CHATS) refreshChatList();
          }}
          unreadTotal={unreadTotal}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;