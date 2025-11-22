import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Tab, ChatSession } from './types';
import { fetchChats } from './services/chatApi';
import BottomNav from './components/BottomNav';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import ContactList from './components/ContactList';
import DiscoverView from './components/DiscoverView';
import MeView from './components/MeView';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AddFriendPage from './pages/AddFriendPage';

type AuthPage = 'login' | 'register' | 'reset';

const MainApp: React.FC = () => {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const [authPage, setAuthPage] = useState<AuthPage>('login');

  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHATS);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (isAuthenticated && token) {
      loadChats();
    }
  }, [isAuthenticated, token]);

  const loadChats = async () => {
    if (!token) return;

    try {
      const chats = await fetchChats(token);
      console.log('[App] Loaded chats:', chats);
      const sessions: ChatSession[] = chats.map((chat: any) => ({
        id: chat.id,
        partnerId: chat.partnerId,
        lastMessage: chat.lastMessage,
        lastMessageTime: chat.lastMessageTime,
        unreadCount: chat.unreadCount || 0,
      }));
      setSessions(sessions);
      setLoading(false);
    } catch (error) {
      console.error('[App] Error loading chats:', error);
      setLoading(false);
    }
  };

  const unreadTotal = sessions.reduce((acc, session) => acc + session.unreadCount, 0);

  const refreshChatList = async () => {
    if (!token) return;
    const chats = await fetchChats(token);
    const sessions: ChatSession[] = chats.map((chat: any) => ({
      id: chat.id,
      partnerId: chat.partnerId,
      lastMessage: chat.lastMessage,
      lastMessageTime: chat.lastMessageTime,
      unreadCount: chat.unreadCount || 0,
    }));
    setSessions(sessions);
  };

  const handleSendMessage = (chatId: string, text: string, sender: 'me' | 'partner') => {
    setSessions(prev => prev.map(session => {
      if (session.id === chatId) {
        return {
          ...session,
          lastMessage: text,
          lastMessageTime: Date.now(),
          unreadCount: sender === 'partner' ? session.unreadCount + 1 : 0
        };
      }
      return session;
    }));
    setTimeout(() => refreshChatList(), 500);
  };

  const handleSelectChat = (sessionId: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, unreadCount: 0 } : s));
    setSelectedChatId(sessionId);
  };

  const handleSelectContact = (contactUser: any) => {
    // 创建或打开与该用户的聊天
    const chatId = `c_${contactUser.userId}`;

    // 检查是否已有聊天
    const existingSession = sessions.find(s => s.id === chatId);

    if (existingSession) {
      handleSelectChat(chatId);
    } else {
      // 创建新会话
      const newSession: ChatSession = {
        id: chatId,
        partnerId: contactUser.userId,
        lastMessage: '',
        lastMessageTime: Date.now(),
        unreadCount: 0
      };
      setSessions([newSession, ...sessions]);
      setSelectedChatId(chatId);
    }
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
        return <ChatList sessions={sessions} users={[]} onSelectChat={handleSelectChat} />;
      case Tab.CONTACTS:
        return (
          <ContactList
            onSelectUser={handleSelectContact}
            onAddFriend={() => setShowAddFriend(true)}
          />
        );
      case Tab.DISCOVER:
        return <DiscoverView />;
      case Tab.ME:
        return user ? <MeView user={{
          id: user.userId,
          name: user.displayName,
          avatar: user.avatar
        }} /> : null;
      default:
        return null;
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-gray-600 text-lg">加载中...</div>
      </div>
    );
  }

  // Show auth pages if not authenticated
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

  // 获取聊天对象信息
  let partner = null;
  if (selectedSession) {
    partner = {
      id: selectedSession.partnerId,
      name: selectedSession.partnerId, // 临时使用ID，实际应该从用户表获取
      avatar: 'https://picsum.photos/id/64/200/200',
      isAi: false
    };
  }

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="flex-1 overflow-hidden relative">
        {renderContent()}

        {/* Add Friend Page */}
        {showAddFriend && (
          <AddFriendPage
            onClose={() => setShowAddFriend(false)}
            onFriendAdded={() => {
              // 刷新好友列表
              setShowAddFriend(false);
            }}
          />
        )}

        {/* Chat Window */}
        {selectedChatId && partner && (
          <div className="absolute inset-0 z-50 bg-white">
            <ChatWindow
              chatId={selectedChatId}
              partner={partner}
              messages={[]}
              onBack={() => {
                setSelectedChatId(null);
                refreshChatList();
              }}
              onSendMessage={handleSendMessage}
            />
          </div>
        )}
      </div>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
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