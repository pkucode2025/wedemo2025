import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MoreHorizontal, Smile, Plus, RefreshCw } from 'lucide-react';
import { Message } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { fetchMessages, sendMessageToBackend } from '../services/chatApi';
import { useAuth } from '../contexts/AuthContext';

interface Partner {
  userId: string;
  name: string;
  avatar: string;
  isAi?: boolean;
}

interface ChatWindowProps {
  chatId: string;
  partner: Partner;
  onBack: () => void;
  onSendMessage: (chatId: string, text: string, sender: 'me' | 'partner') => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, partner, onBack, onSendMessage }) => {
  const { user, token } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef<number>(0);

  console.log('[ChatWindow] Component mounted - chatId:', chatId, 'partner:', partner.name);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 加载消息
  const loadMessages = async () => {
    try {
      const msgs = await fetchMessages(chatId, token || undefined);

      // 检查是否有新消息
      if (msgs.length > lastMessageCountRef.current) {
        console.log(`[ChatWindow] 📬 New messages: ${msgs.length - lastMessageCountRef.current}`);
      }

      lastMessageCountRef.current = msgs.length;
      setLocalMessages(msgs);
    } catch (error) {
      console.error('[ChatWindow] Error loading messages:', error);
    }
  };

  // 手动刷新
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadMessages();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // 初始加载消息
  useEffect(() => {
    console.log(`[ChatWindow] Initial load for chatId: ${chatId}`);
    loadMessages();
  }, [chatId, token]);

  // 优化的轮询：仅在页面可见且窗口活跃时轮询，间隔增加到15秒
  useEffect(() => {
    // 检查页面可见性
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[ChatWindow] 🌙 Page hidden, stopping polling');
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else {
        console.log('[ChatWindow] ☀️ Page visible, resuming polling');
        startPolling();
      }
    };

    const startPolling = () => {
      // 清除旧的轮询
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      // 设置新的轮询（15秒间隔 - 减少50%请求）
      pollingIntervalRef.current = setInterval(() => {
        if (!document.hidden) {
          console.log('[ChatWindow] 🔄 Polling for new messages...');
          loadMessages();
        }
      }, 15000); // 15秒
    };

    // 初始启动轮询
    if (!document.hidden) {
      startPolling();
    }

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 清理函数
    return () => {
      if (pollingIntervalRef.current) {
        console.log('[ChatWindow] 🛑 Clearing polling interval');
        clearInterval(pollingIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [chatId, token]);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 100) + 'px';
    }
  }, [inputText]);

  const handleSend = async () => {
    if (!inputText.trim() || !user || !token) {
      console.warn('[ChatWindow] Cannot send: missing input or user');
      return;
    }

    const userMessageContent = inputText;
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = '40px';

    console.log(`[ChatWindow] Sending message to ${partner.name}: "${userMessageContent}"`);

    // 立即显示消息（乐观更新）
    const tempMessage: Message = {
      id: 'temp_' + Date.now(),
      senderId: user.userId,
      content: userMessageContent,
      timestamp: Date.now(),
      type: 'text',
    };
    setLocalMessages(prev => [...prev, tempMessage]);

    try {
      // 发送到后端
      const savedMessage = await sendMessageToBackend(chatId, userMessageContent, user.userId, token);
      console.log('[ChatWindow] Message saved to database:', savedMessage);

      // 通知父组件更新聊天列表
      onSendMessage(chatId, userMessageContent, 'me');

      // 立即重新加载消息以获取准确的数据
      await loadMessages();

      // AI Integration
      if (partner.isAi) {
        setIsTyping(true);
        const history = localMessages.map(m => ({
          role: m.senderId === user.userId ? 'user' as const : 'model' as const,
          parts: [{ text: m.content }]
        }));
        history.push({ role: 'user', parts: [{ text: userMessageContent }] });

        const response = await sendMessageToGemini(history, userMessageContent);
        setIsTyping(false);

        const aiMsg = await sendMessageToBackend(chatId, response, partner.userId, token);
        if (aiMsg) {
          await loadMessages();
          onSendMessage(chatId, response, 'partner');
        }
      }
    } catch (error) {
      console.error('[ChatWindow] Error sending message:', error);
      // 移除临时消息
      setLocalMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#EDEDED]">
      {/* Top Bar */}
      <div className="h-[50px] bg-[#EDEDED] border-b border-gray-300 flex items-center px-3 relative flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-0 text-black z-10"
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2} />
          <span className="text-[16px] font-normal">微信</span>
        </button>

        <div
          className="text-[17px] font-medium text-black"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {partner.name}
        </div>

        <div
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            gap: '8px'
          }}
        >
          {/* 手动刷新按钮 */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="刷新消息"
          >
            <RefreshCw className={`w-5 h-5 text-black ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button className="p-1">
            <MoreHorizontal className="w-6 h-6 text-black" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-[#EDEDED]">
        {localMessages.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">开始聊天吧！</div>
        ) : (
          localMessages.map((msg, index) => {
            const isMe = msg.senderId === user?.userId;
            const showAvatar = index === 0 || localMessages[index - 1].senderId !== msg.senderId;

            return (
              <div key={msg.id} className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && showAvatar && (
                  <img
                    src={partner.avatar}
                    alt="Partner"
                    className="w-10 h-10 rounded-md mr-2 flex-shrink-0 object-cover"
                  />
                )}
                {!isMe && !showAvatar && <div className="w-10 mr-2" />}

                <div className={`relative max-w-[65%] px-3 py-2 rounded-md text-[16px] leading-[1.4] break-words shadow-sm
                  ${isMe ? 'bg-[#95EC69] text-black' : 'bg-white text-black'}
                `}>
                  {showAvatar && (
                    <div className={`absolute top-3 w-0 h-0 border-[6px] border-transparent 
                      ${isMe ? 'border-l-[#95EC69] -right-[12px]' : 'border-r-white -left-[12px]'}
                    `} />
                  )}
                  {msg.content}
                </div>

                {isMe && showAvatar && user && (
                  <img
                    src={user.avatar}
                    alt="Me"
                    className="w-10 h-10 rounded-md ml-2 flex-shrink-0 object-cover"
                  />
                )}
                {isMe && !showAvatar && <div className="w-10 ml-2" />}
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex mb-3 justify-start">
            <img
              src={partner.avatar}
              alt="Partner"
              className="w-10 h-10 rounded-md mr-2 flex-shrink-0"
            />
            <div className="bg-white px-4 py-3 rounded-md shadow-sm flex items-center space-x-1.5">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#F5F5F5] border-t border-gray-300 p-2 flex items-end gap-2 flex-shrink-0">
        <div className="flex-1 bg-white rounded-md px-3 py-2 flex items-center min-h-[40px] max-h-[100px]">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="消息"
            rows={1}
            className="w-full bg-transparent outline-none text-[16px] resize-none overflow-y-auto placeholder-gray-400"
            style={{ height: '40px', maxHeight: '100px', lineHeight: '22px' }}
          />
        </div>

        <button className="p-2 text-gray-600">
          <Smile className="w-6 h-6" />
        </button>

        {inputText.trim().length > 0 ? (
          <button
            onClick={handleSend}
            className="bg-[#07C160] text-white px-4 py-2 rounded-md text-[16px] font-medium min-w-[60px] h-[40px] active:bg-[#06AD56] transition-colors"
          >
            发送
          </button>
        ) : (
          <button className="p-2 text-gray-600">
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;