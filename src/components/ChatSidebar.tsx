
import React from 'react';
import { User } from '../pages/Index';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { LogOut } from 'lucide-react';

interface ChatSidebarProps {
  currentUser: User;
  users: User[];
  dmUsers: string[];
  onPrivateChat: (userId: string) => void;
  onLogout: () => void;
  isConnected: boolean;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  currentUser,
  users,
  dmUsers,
  onPrivateChat,
  onLogout,
  isConnected
}) => {
  const otherUsers = users.filter(u => u.id !== currentUser.id);
  const dmUsersList = users.filter(u => dmUsers.includes(u.id));

  return (
    <div className="w-80 bg-gray-900 border-r border-blue-500/30 flex flex-col neon-border">
      {/* Header */}
      <div className="p-4 border-b border-blue-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg neon-text">SafeYou Chat</h2>
            <div className="flex items-center gap-2 text-sm text-blue-300/70">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 shadow-glow-green' : 'bg-red-500'}`} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 text-sm">
          <span className="font-medium text-blue-300">{currentUser.username}</span>
          <Badge variant="secondary" className="ml-2 bg-blue-500/20 text-blue-300 border-blue-500/50">You</Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* DM Section */}
        {dmUsersList.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-blue-300/70 mb-3">Direct Messages</h3>
            <div className="space-y-2">
              {dmUsersList.map(user => (
                <Button
                  key={user.id}
                  variant="ghost"
                  className="w-full justify-start p-2 h-auto hover:bg-blue-500/20 text-blue-200"
                  onClick={() => onPrivateChat(user.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-glow-blue">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${user.isOnline ? 'bg-green-400 shadow-glow-green' : 'bg-gray-400'}`} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm text-blue-200">{user.username}</div>
                      <div className="text-xs text-blue-300/70">
                        {user.isOnline ? 'Online' : 'Offline'}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            <Separator className="mt-4 bg-blue-500/30" />
          </div>
        )}

        {/* Online Users */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-blue-300/70 mb-3">
            Online Users ({otherUsers.filter(u => u.isOnline).length})
          </h3>
          <div className="space-y-2">
            {otherUsers.filter(u => u.isOnline).map(user => (
              <Button
                key={user.id}
                variant="ghost"
                className="w-full justify-start p-2 h-auto hover:bg-blue-500/20 text-blue-200"
                onClick={() => onPrivateChat(user.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-glow-blue">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900 shadow-glow-green" />
                  </div>
                  <span className="font-medium text-sm text-blue-200">{user.username}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Offline Users */}
        {otherUsers.filter(u => !u.isOnline).length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-blue-300/70 mb-3">
              Offline Users ({otherUsers.filter(u => !u.isOnline).length})
            </h3>
            <div className="space-y-2">
              {otherUsers.filter(u => !u.isOnline).map(user => (
                <Button
                  key={user.id}
                  variant="ghost"
                  className="w-full justify-start p-2 h-auto opacity-60 hover:bg-blue-500/20 text-blue-200"
                  onClick={() => onPrivateChat(user.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-400 rounded-full border-2 border-gray-900" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm text-blue-200">{user.username}</div>
                      <div className="text-xs text-blue-300/70">
                        Last seen {user.lastSeen.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ChatSidebar;
