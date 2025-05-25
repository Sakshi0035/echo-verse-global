
import React, { useState } from 'react';
import { User, Message } from '../pages/Index';
import ChatSidebar from './ChatSidebar';
import ChatMain from './ChatMain';
import PrivateChat from './PrivateChat';

interface ChatInterfaceProps {
  currentUser: User;
  users: User[];
  messages: Message[];
  onSendMessage: (content: string, type?: 'text' | 'image' | 'video', recipientId?: string, replyToId?: string) => void;
  isConnected: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentUser,
  users,
  messages,
  onSendMessage,
  isConnected
}) => {
  const [activePrivateChat, setActivePrivateChat] = useState<string | null>(null);
  const [dmUsers, setDmUsers] = useState<string[]>([]);

  const handlePrivateChat = (userId: string) => {
    setActivePrivateChat(userId);
    if (!dmUsers.includes(userId)) {
      setDmUsers(prev => [...prev, userId]);
    }
  };

  const handleBackToMain = () => {
    setActivePrivateChat(null);
  };

  if (activePrivateChat) {
    const chatPartner = users.find(u => u.id === activePrivateChat);
    if (!chatPartner) return null;

    return (
      <PrivateChat
        currentUser={currentUser}
        chatPartner={chatPartner}
        messages={messages.filter(m => 
          m.isPrivate && 
          ((m.userId === currentUser.id && m.recipientId === activePrivateChat) ||
           (m.userId === activePrivateChat && m.recipientId === currentUser.id))
        )}
        onSendMessage={onSendMessage}
        onBack={handleBackToMain}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ChatSidebar
        currentUser={currentUser}
        users={users}
        dmUsers={dmUsers}
        onPrivateChat={handlePrivateChat}
        isConnected={isConnected}
      />
      <ChatMain
        currentUser={currentUser}
        messages={messages.filter(m => !m.isPrivate)}
        users={users}
        onSendMessage={onSendMessage}
      />
    </div>
  );
};

export default ChatInterface;
