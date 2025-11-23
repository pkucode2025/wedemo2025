import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import { Message } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { fetchMessages, sendMessageToBackend } from '../services/chatApi';
import { useAuth } from '../contexts/AuthContext';
import GlobalRefreshButton from './GlobalRefreshButton';

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
  onChatDetails: () => void;
}

// 格式化消息时间
const formatMessageTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  }

  if (diffMs < 7 * 24 * 60 * 60 * 1000) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${days[date.getDay()]} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  }

  return `${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
};

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, partner, onBack, onSendMessage, onChatDetails }) => {
  const { user, token } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const msgs = await fetchMessages(chatId, token || undefined);
      setLocalMessages(msgs);
    } catch (error) {
      console.error('[ChatWindow] Error loading messages:', error);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [chatId, token]);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 100) + 'px';
    }
  }, [inputText]);

  const handleSend = async () => {
    if (!inputText.trim() || !user || !token) return;

    const userMessageContent = inputText;
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = '40px';

    const tempMessage: Message = {
      id: 'temp_' + Date.now(),
      senderId: user.userId,
      content: userMessageContent,
      timestamp: Date.now(),
      type: 'text',
    };
    setLocalMessages(prev => [...prev, tempMessage]);

    try {
      await sendMessageToBackend(chatId, userMessageContent, user.userId, token);
      onSendMessage(chatId, userMessageContent, 'me');
      await loadMessages();

      if (partner.isAi) {
        setIsTyping(true);
        const history = localMessages.map(m => ({
          role: m.senderId === user.userId ? 'user' as const : 'model' as const,
          parts: [{ text: m.content }]
        }));
        history.push({ role: 'user', parts: [{ text: userMessageContent }] });

        const response = await sendMessageToGemini(history, userMessageContent);
        setIsTyping(false);

        await sendMessageToBackend(chatId, response, partner.userId, token);
        await loadMessages();
        onSendMessage(chatId, response, 'partner');
      }
    } catch (error) {
      console.error('[ChatWindow] Error sending message:', error);
      setLocalMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#EDEDED] relative">
      {/* Top Bar */}
      <div className="h-[50px] bg-[#EDEDED] border-b border-gray-300 flex items-center px-3 relative flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-0 text-black z-10 absolute left-3 top-1/2 -translate-y-1/2"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2} />
          <span className="text-[16px] font-normal">微信</span>
        </button>

        <div className="text-[17px] font-medium text-black absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[200px] truncate">
          {partner.name}
        </div>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
          <GlobalRefreshButton onRefresh={loadMessages} />
          <button className="p-1" onClick={onChatDetails}>
            <div className="w-6 h-6" /> {/* Placeholder to keep layout if needed, or remove */}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-[#EDEDED]">
        {localMessages.map((msg) => {
          const isMe = msg.senderId === user?.userId;

          return (
            <div key={msg.id}>
              <div className="text-center text-[12px] text-gray-400 my-2">
                {formatMessageTime(msg.timestamp)}
              </div>

              <div className={`flex mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <img
                    src={partner.avatar}
                    alt="Partner"
                    className="w-10 h-10 rounded-md mr-2 flex-shrink-0 object-cover"
                  />
                )}

                <div
                  className={`relative max-w-[65%] px-3 py-2 rounded-md text-[16px] leading-[1.4] break-words shadow-sm
                    ${isMe ? 'bg-[#95EC69] text-black' : 'bg-white text-black'}
                  `}
                >
                  <div className={`absolute top-3 w-0 h-0 border-[6px] border-transparent 
                    ${isMe ? 'border-l-[#95EC69] -right-[12px]' : 'border-r-white -left-[12px]'}
                  `} />
                  {msg.content}
                </div>

                {isMe && user && (
                  <img
                    src={user.avatar}
                    alt="Me"
                    className="w-10 h-10 rounded-md ml-2 flex-shrink-0 object-cover"
                  />
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#F5F5F5] border-t border-gray-300 flex flex-col flex-shrink-0">
        <div className="p-2 flex items-end gap-2">
          <div className="flex-1 bg-white rounded-md px-3 py-2 flex items-center min-h-[40px] max-h-[100px]">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="消息"
              rows={1}
              className="w-full bg-transparent outline-none text-[16px] resize-none overflow-y-auto placeholder-gray-400"
              style={{ height: '40px', maxHeight: '100px', lineHeight: '22px' }}
            />
          </div>

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
    </div>
  );
};

export default ChatWindow;