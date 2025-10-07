
import React, { useState } from 'react';
import { User, Message } from '../pages/Index';
import cosmicBg from '@/assets/cosmic-bg.jpeg';
import ChatSidebar from './ChatSidebar';
import ChatMain from './ChatMain';
import PrivateChat from './PrivateChat';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { realTimeService } from '../utils/realTimeService';

interface ChatInterfaceProps {
  currentUser: User;
  users: User[];
  messages: Message[];
  onSendMessage: (content: string, type?: 'text' | 'image' | 'video', imageUrl?: string, recipientId?: string, replyToId?: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onReportMessage: (messageId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  isConnected: boolean;
  onUsernameClick: (userId: string) => string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentUser,
  users,
  messages,
  onSendMessage,
  onDeleteMessage,
  onReportMessage,
  onReaction,
  onLogout,
  onDeleteAccount,
  isConnected,
  onUsernameClick
}) => {
  const [activePrivateChat, setActivePrivateChat] = useState<string | null>(null);
  const [dmUsers, setDmUsers] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Ensure messages and users are always arrays
  const safeMessages = Array.isArray(messages) ? messages : [];
  const safeUsers = Array.isArray(users) ? users : [];

  const handlePrivateChat = (userId: string) => {
    setActivePrivateChat(userId);
    if (!dmUsers.includes(userId)) {
      setDmUsers(prev => [...prev, userId]);
    }
    setSidebarOpen(false);
  };

  const handleBackToMain = () => {
    setActivePrivateChat(null);
  };

  const handleUsernameClickInChat = (userId: string) => {
    if (userId !== currentUser.id) {
      handlePrivateChat(userId);
    }
  };

  // Handle private message sending with proper recipient targeting
  const handlePrivateMessageSend = (content: string, type?: 'text' | 'image' | 'video', imageUrl?: string) => {
    if (activePrivateChat) {
      onSendMessage(content, type, imageUrl, activePrivateChat);
    }
  };

  if (activePrivateChat) {
    const chatPartner = safeUsers.find(u => u.id === activePrivateChat);
    if (!chatPartner) return null;

    // Filter private messages between current user and chat partner only
    const privateMessages = safeMessages.filter(m => 
      m.isPrivate && 
      ((m.userId === currentUser.id && m.recipientId === activePrivateChat) ||
       (m.userId === activePrivateChat && m.recipientId === currentUser.id))
    );

    return (
      <PrivateChat
        currentUser={currentUser}
        chatPartner={chatPartner}
        messages={privateMessages}
        onSendMessage={handlePrivateMessageSend}
        onBack={handleBackToMain}
        onDeleteMessage={onDeleteMessage}
        onReportMessage={onReportMessage}
        onReaction={onReaction}
      />
    );
  }

  // Filter only public messages for the main chat
  const publicMessages = safeMessages.filter(m => !m.isPrivate);

  return (
    <div 
      className="min-h-screen flex relative" 
      style={{
        backgroundImage: `url(${cosmicBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      {/* Desktop Sidebar */}
      <div className="hidden md:block relative z-10">
        <ChatSidebar
          currentUser={currentUser}
          users={safeUsers}
          dmUsers={dmUsers}
          onPrivateChat={handlePrivateChat}
          onLogout={onLogout}
          onDeleteAccount={onDeleteAccount}
          isConnected={isConnected}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0 bg-black border-cyan-500/30">
          <ChatSidebar
            currentUser={currentUser}
            users={safeUsers}
            dmUsers={dmUsers}
            onPrivateChat={handlePrivateChat}
            onLogout={onLogout}
            onDeleteAccount={onDeleteAccount}
            isConnected={isConnected}
          />
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Mobile Header with Menu */}
        <div className="md:hidden bg-black/95 backdrop-blur border-b border-cyan-500/30 p-4 flex items-center gap-3 neon-border">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </Sheet>
          <div>
            <h1 className="font-semibold neon-text">SafeYou Chat</h1>
            <p className="text-sm text-cyan-300/70">
              {safeUsers.filter(u => u.isOnline).length} users online
            </p>
          </div>
        </div>

        <ChatMain
          currentUser={currentUser}
          messages={publicMessages}
          users={safeUsers}
          onSendMessage={(content, type, imageUrl) => onSendMessage(content, type, imageUrl, undefined)} // No recipient ID for public messages
          onDeleteMessage={onDeleteMessage}
          onReportMessage={onReportMessage}
          onReaction={onReaction}
          onUsernameClick={handleUsernameClickInChat}
        />
      </div>
    </div>
  );
};

export default ChatInterface;
