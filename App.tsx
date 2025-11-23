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

  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHATS);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [partners, setPartners] = useState<Record<string, PartnerInfo>>({});
  const [loading, setLoading] = useState(true);

  // 加载聊天列表
  const loadChatsAndPartners = async () => {
    if (!token) return;

    try {
      const chats = await fetchChats(token);

      const sessions: ChatSession[] = chats.map((chat: any) => ({
        id: chat.id,
        partnerId: chat.partnerId,
        lastMessage: chat.lastMessage,
        lastMessageTime: chat.lastMessageTime,
        unreadCount: chat.unreadCount || 0,
      }));

      const partnerMap: Record<string, PartnerInfo> = {};

      chats.forEach((chat: any) => {
        if (chat.partnerId && chat.partnerName) {
          partnerMap[chat.partnerId] = {
            userId: chat.partnerId,
            name: chat.partnerName,
            avatar: chat.partnerAvatar || 'https://picsum.photos/id/64/200/200'
          };
        }
      });

      setPartners(partnerMap);
      setSessions(sessions);
      setLoading(false);
    } catch (error) {
      console.error('[App] ❌ Error loading chats:', error);
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
    setSelectedChatId(sessionId);
  };

  // 点击联系人 -> 直接开始聊天
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
            onAddFriend={() => { }} // Disabled
            onNewFriends={() => { }} // Disabled
            onRefresh={refreshChatList}
          />
        );
      case Tab.DISCOVER:
        return <DiscoverView
          onRefresh={refreshChatList}
          onMomentsClick={() => { }} // Disabled
        />;
      case Tab.ME:
        return user ? <MeView
          user={{
            id: user.userId,
            name: user.displayName,
            avatar: user.avatar
          }}
          onRefresh={refreshChatList}
          onEditProfile={() => { }} // Disabled
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

  const selectedSession = sessions.find(s => s.id === selectedChatId);

  const partner = selectedSession && partners[selectedSession.partnerId] ? {
    userId: partners[selectedSession.partnerId].userId,
    name: partners[selectedSession.partnerId].name,
    avatar: partners[selectedSession.partnerId].avatar,
    isAi: false
  } : null;

  return (
    <div className="w-full h-full flex flex-col bg-white relative">
      <div className="flex-1 overflow-hidden relative">
        {renderContent()}

        {/* Chat Window - Layer 50 */}
        {selectedChatId && partner && (
          <div className="absolute inset-0 z-[50] bg-white">
            <ChatWindow
              chatId={selectedChatId}
              partner={partner}
              onBack={() => {
                setSelectedChatId(null);
                refreshChatList();
              }}
              onSendMessage={handleSendMessage}
              onChatDetails={() => { }} // Disabled
            />
          </div>
        )}
      </div>

      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedChatId(null);
          if (tab === Tab.CHATS) refreshChatList();
        }}
        unreadTotal={unreadTotal}
      />
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