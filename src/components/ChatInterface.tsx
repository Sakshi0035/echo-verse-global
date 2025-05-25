
import React, { useState } from 'react';
import { User, Message } from '../pages/Index';
import ChatSidebar from './ChatSidebar';
import ChatMain from './ChatMain';
import PrivateChat from './PrivateChat';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handlePrivateChat = (userId: string) => {
    setActivePrivateChat(userId);
    if (!dmUsers.includes(userId)) {
      setDmUsers(prev => [...prev, userId]);
    }
    setSidebarOpen(false); // Close sidebar on mobile after selection
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
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <ChatSidebar
          currentUser={currentUser}
          users={users}
          dmUsers={dmUsers}
          onPrivateChat={handlePrivateChat}
          isConnected={isConnected}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <ChatSidebar
            currentUser={currentUser}
            users={users}
            dmUsers={dmUsers}
            onPrivateChat={handlePrivateChat}
            isConnected={isConnected}
          />
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header with Menu */}
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center gap-3">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </Sheet>
          <div>
            <h1 className="font-semibold">Echo Verse</h1>
            <p className="text-sm text-gray-500">
              {users.filter(u => u.isOnline).length} users online
            </p>
          </div>
        </div>

        <ChatMain
          currentUser={currentUser}
          messages={messages.filter(m => !m.isPrivate)}
          users={users}
          onSendMessage={onSendMessage}
        />
      </div>
    </div>
  );
};

export default ChatInterface;
