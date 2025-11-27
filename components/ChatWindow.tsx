import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Send, MoreVertical, Image as ImageIcon, Mic, X, Star, Gift } from 'lucide-react';
import { Message } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { fetchMessages, sendMessageToBackend } from '../services/chatApi';
import { useAuth } from '../contexts/AuthContext';
import GlobalRefreshButton from './GlobalRefreshButton';
import { uploadService } from '../services/uploadService';
import VoiceRecorder from './VoiceRecorder';

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

const formatMessageTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, partner, onBack, onSendMessage, onChatDetails }) => {
  const { user, token } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const msgs = await fetchMessages(chatId, token || undefined);
      if (Array.isArray(msgs)) {
        setLocalMessages(msgs);
      } else {
        console.error('[ChatWindow] fetchMessages returned non-array:', msgs);
        setLocalMessages([]);
      }
    } catch (error) {
      console.error('[ChatWindow] Error loading messages:', error);
      setLocalMessages([]);
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

  const handleSend = async (content: string = inputText, type: 'text' | 'image' | 'voice' = 'text') => {
    if ((!content.trim() && type === 'text') || !user || !token) return;

    if (type === 'text') {
      setInputText('');
      if (textareaRef.current) textareaRef.current.style.height = '40px';
    }

    const tempMessage: Message = {
      id: 'temp_' + Date.now(),
      senderId: user.userId,
      content: content,
      timestamp: Date.now(),
      type: type as any,
    };
    setLocalMessages(prev => [...prev, tempMessage]);

    try {
      await sendMessageToBackend(chatId, content, user.userId, token, type);
      onSendMessage(chatId, content, 'me');
      await loadMessages(); // Reload to get real ID and confirmed state

      if (partner.isAi && type === 'text') {
        setIsTyping(true);
        const history = localMessages.filter(m => m.type === 'text').map(m => ({
          role: m.senderId === user.userId ? 'user' as const : 'model' as const,
          parts: [{ text: m.content }]
        }));
        history.push({ role: 'user', parts: [{ text: content }] });

        const response = await sendMessageToGemini(history, content);
        setIsTyping(false);

        await sendMessageToBackend(chatId, response, partner.userId, token);
        await loadMessages();
        onSendMessage(chatId, response, 'partner');
      }
    } catch (error) {
      console.error('[ChatWindow] Error sending message:', error);
      setLocalMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      alert('Failed to send message');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    try {
      const url = await uploadService.uploadFile(file, token);
      await handleSend(url, 'image');
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleVoiceRecorded = async (file: File) => {
    if (!token) return;
    try {
      const url = await uploadService.uploadFile(file, token);
      await handleSend(url, 'voice');
      setShowVoiceRecorder(false);
    } catch (error) {
      console.error('Voice upload failed:', error);
      alert('Failed to upload voice message');
    }
  };

  const renderMessageContent = (msg: Message) => {
    switch (msg.type) {
      case 'image':
        return (
          <img
            src={msg.content}
            alt="Image message"
            className="max-w-[200px] max-h-[300px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(msg.content, '_blank')}
          />
        );
      case 'voice':
        return (
          <div className="flex items-center gap-2 min-w-[100px]">
            <audio controls src={msg.content} className="h-8 max-w-[200px]" />
          </div>
        );
      case 'star':
        return (
          <div className="flex items-center gap-2 text-yellow-300">
            <Star className="w-5 h-5 fill-yellow-300 animate-pulse" />
            <span className="italic font-serif">{msg.content}</span>
          </div>
        );
      case 'gift':
        return (
          <div className="flex items-center gap-3 bg-pink-500/10 p-2 rounded-lg border border-pink-500/30 min-w-[150px]">
            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
              <Gift className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <p className="font-bold text-pink-200 text-sm">Sent a Gift</p>
              <p className="text-white text-xs">{msg.content}</p>
            </div>
          </div>
        );
      default:
        return msg.content;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#121212] relative">
      {/* Modern Header */}
      <div className="h-[70px] bg-[#121212]/90 backdrop-blur-md border-b border-white/5 flex items-center px-4 pt-2 relative flex-shrink-0 z-20">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex items-center ml-2">
          <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#FF00FF] to-[#8A2BE2]">
            <img src={partner.avatar} className="w-full h-full rounded-full object-cover border-2 border-[#121212]" alt="" />
          </div>
          <div className="ml-3">
            <h3 className="text-white font-bold text-[16px]">{partner.name}</h3>
            <span className="text-[#FF00FF] text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF00FF] animate-pulse"></span>
              Online
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <GlobalRefreshButton onRefresh={loadMessages} />
          <button className="p-2 rounded-full hover:bg-white/10 text-white">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#121212] no-scrollbar">
        {localMessages.map((msg) => {
          const isMe = msg.senderId === user?.userId;
          const isGroupChat = chatId.startsWith('group_');

          return (
            <div key={msg.id} className={`flex mb-6 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && (
                <img
                  src={msg.senderAvatar || partner.avatar}
                  alt="Sender"
                  className="w-8 h-8 rounded-full mr-3 self-end mb-1 object-cover border border-white/10"
                />
              )}

              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                {/* Show sender name in group chat if not me */}
                {!isMe && isGroupChat && (
                  <span className="text-[10px] text-gray-400 mb-1 ml-1 font-medium">
                    {msg.senderName || msg.senderId}
                  </span>
                )}
                <div
                  className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-lg backdrop-blur-sm overflow-hidden
                    ${isMe
                      ? 'bg-gradient-to-br from-[#FF00FF] to-[#8A2BE2] text-white rounded-br-none'
                      : 'bg-[#2A2A2A] text-gray-200 rounded-bl-none border border-white/5'}
                  `}
                >
                  {renderMessageContent(msg)}
                </div>
                <span className="text-[10px] text-gray-600 mt-1 px-1">
                  {formatMessageTime(msg.timestamp)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#121212] flex-shrink-0">
        <div className="flex items-end gap-3 bg-[#1E1E1E] p-2 rounded-[24px] border border-white/10 shadow-lg relative">

          {/* Media Buttons */}
          <div className="flex items-center pb-2 pl-1 gap-1">
            <button
              onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
              className={`p-2 rounded-full transition-colors ${showVoiceRecorder ? 'text-[#FF00FF] bg-white/10' : 'text-gray-400 hover:text-white'}`}
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>

          {showVoiceRecorder ? (
            <div className="flex-1 flex items-center justify-center h-[40px] bg-[#2A2A2A] rounded-xl px-4">
              <VoiceRecorder
                token={token || ''}
                onRecordComplete={handleVoiceRecorded}
              />
              <button
                onClick={() => setShowVoiceRecorder(false)}
                className="ml-4 p-1 rounded-full bg-gray-700 hover:bg-gray-600 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
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
              placeholder="Type a message..."
              rows={1}
              className="flex-1 bg-transparent outline-none text-white text-[15px] resize-none overflow-y-auto placeholder-gray-600 px-3 py-2 max-h-[100px]"
              style={{ height: '40px', lineHeight: '20px' }}
            />
          )}

          {!showVoiceRecorder && (
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim()}
              className={`p-2.5 rounded-full transition-all duration-300 ${inputText.trim()
                ? 'bg-[#FF00FF] text-white shadow-[0_0_10px_#FF00FF] hover:scale-105'
                : 'bg-[#2A2A2A] text-gray-500'
                }`}
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;