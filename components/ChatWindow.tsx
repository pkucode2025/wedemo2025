import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MoreHorizontal, Smile, Plus } from 'lucide-react';
import { Message, User } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { CURRENT_USER } from '../constants';
import { fetchMessages, sendMessageToBackend } from '../services/api';

interface ChatWindowProps {
  chatId: string;
  partner: User;
  messages: Message[];
  onBack: () => void;
  onSendMessage: (chatId: string, text: string, sender: 'me' | 'partner') => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, partner, onBack, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages on load
  useEffect(() => {
    console.log(`[ChatWindow] Loading messages for chatId: ${chatId}`);
    const loadMessages = async () => {
      const msgs = await fetchMessages(chatId);
      console.log(`[ChatWindow] Fetched ${msgs.length} messages`);
      setLocalMessages(msgs);
    };
    loadMessages();
  }, [chatId]);

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
    if (!inputText.trim()) return;

    const userMessageContent = inputText;
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = '40px';

    // Optimistic update
    const tempMessage: Message = {
      id: Date.now().toString(),
      senderId: CURRENT_USER.id,
      content: userMessageContent,
      timestamp: Date.now(),
      type: 'text',
    };
    setLocalMessages(prev => [...prev, tempMessage]);
    onSendMessage(chatId, userMessageContent, 'me');

    // Send to backend
    await sendMessageToBackend(chatId, userMessageContent, CURRENT_USER.id);

    // AI Integration
    if (partner.isAi) {
      setIsTyping(true);
      const history = localMessages.map(m => ({
        role: m.senderId === CURRENT_USER.id ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }]
      }));
      history.push({ role: 'user', parts: [{ text: userMessageContent }] });

      const response = await sendMessageToGemini(history, userMessageContent);
      setIsTyping(false);

      const aiMsg = await sendMessageToBackend(chatId, response, partner.id);
      if (aiMsg) {
        setLocalMessages(prev => [...prev, aiMsg]);
        onSendMessage(chatId, response, 'partner');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#EDEDED]">
      {/* Top Bar */}
      <div className="h-[50px] flex-shrink-0 flex items-center justify-between px-3 bg-[#EDEDED] border-b border-gray-300/30">
        <button
          onClick={onBack}
          className="flex items-center text-black active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-7 h-7" />
          <span className="text-[17px] -ml-1">微信</span>
        </button>
        <span className="font-medium text-[17px] truncate max-w-[200px] absolute left-1/2 transform -translate-x-1/2">
          {partner.name}
        </span>
        <button className="p-2 active:opacity-70 transition-opacity">
          <MoreHorizontal className="w-6 h-6 text-black" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3" style={{ paddingBottom: '10px' }}>
        {localMessages.map((msg) => {
          const isMe = msg.senderId === CURRENT_USER.id;
          return (
            <div key={msg.id} className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && (
                <img
                  src={partner.avatar}
                  alt="Partner"
                  className="w-10 h-10 rounded-md mr-2 flex-shrink-0 object-cover"
                />
              )}

              <div className={`relative max-w-[65%] px-3 py-2 rounded-md text-[16px] leading-[1.4] break-words shadow-sm
                ${isMe ? 'bg-[#95EC69] text-black' : 'bg-white text-black'}
              `}>
                {/* Triangle */}
                <div className={`absolute top-3 w-0 h-0 border-[6px] border-transparent 
                  ${isMe ? 'border-l-[#95EC69] -right-[12px]' : 'border-r-white -left-[12px]'}
                `} />
                {msg.content}
              </div>

              {isMe && (
                <img
                  src={CURRENT_USER.avatar}
                  alt="Me"
                  className="w-10 h-10 rounded-md ml-2 flex-shrink-0 object-cover"
                />
              )}
            </div>
          );
        })}

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
      <div className="bg-[#F5F5F5] border-t border-gray-300/50 p-2 flex items-end gap-2 flex-shrink-0">
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

        <button className="p-2.5 text-gray-600 active:opacity-70 transition-opacity">
          <Smile className="w-6 h-6" />
        </button>

        {inputText.trim().length > 0 ? (
          <button
            onClick={handleSend}
            className="bg-[#07C160] text-white px-5 py-2 rounded-md text-[16px] font-medium h-[44px] active:bg-[#06AD56] transition-colors"
          >
            发送
          </button>
        ) : (
          <button className="p-2.5 text-gray-600 active:opacity-70 transition-opacity">
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;