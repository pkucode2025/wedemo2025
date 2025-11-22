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
  console.log('[ChatWindow] Component mounted');
  console.log('[ChatWindow] chatId:', chatId);
  console.log('[ChatWindow] partner:', partner);
  console.log('[ChatWindow] partner.name:', partner?.name);
  console.log('[ChatWindow] partner.avatar:', partner?.avatar);

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
    console.log(`[ChatWindow] useEffect triggered for chatId: ${chatId}`);
    const loadMessages = async () => {
      try {
        const msgs = await fetchMessages(chatId);
        console.log(`[ChatWindow] Successfully fetched ${msgs.length} messages`);
        setLocalMessages(msgs);
      } catch (error) {
        console.error('[ChatWindow] Error loading messages:', error);
      }
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

  const handleBackClick = () => {
    console.log('[ChatWindow] Back button clicked');
    onBack();
  };

  console.log('[ChatWindow] Rendering with partner name:', partner?.name);

  return (
    <div className="w-full h-full flex flex-col bg-[#EDEDED]">
      {/* Top Bar */}
      <div className="h-[50px] bg-[#EDEDED] border-b border-gray-300 flex items-center px-3 relative flex-shrink-0">
        {/* 返回按钮 - 左侧 */}
        <button
          onClick={handleBackClick}
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

        {/* 标题 - 居中 */}
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
          {partner?.name || 'Unknown'}
        </div>

        {/* 更多按钮 - 右侧 */}
        <button
          className="p-1"
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          <MoreHorizontal className="w-6 h-6 text-black" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-[#EDEDED]">
        {localMessages.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">暂无消息</div>
        ) : (
          localMessages.map((msg) => {
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
            className="bg-[#07C160] text-white px-4 py-2 rounded-md text-[16px] font-medium min-w-[60px] h-[40px]"
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