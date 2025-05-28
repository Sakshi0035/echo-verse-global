
import React, { useState } from 'react';
import { User } from '../pages/Index';
import { Button } from '@/components/ui/button';
import { LogOut, Users, MessageCircle, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ChatSidebarProps {
  currentUser: User;
  users: User[];
  dmUsers: string[];
  onPrivateChat: (userId: string) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  isConnected: boolean;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  currentUser,
  users,
  dmUsers,
  onPrivateChat,
  onLogout,
  onDeleteAccount,
  isConnected
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const onlineUsers = users.filter(u => u.isOnline && u.id !== currentUser.id);
  const dmUserObjects = users.filter(u => dmUsers.includes(u.id) && u.id !== currentUser.id);

  const handleDeleteAccount = () => {
    onDeleteAccount();
    setShowDeleteDialog(false);
  };

  return (
    <div className="w-80 bg-black/95 backdrop-blur border-r border-cyan-500/30 flex flex-col h-screen neon-border">
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/30">
        <h1 className="text-xl font-bold neon-text mb-2">SafeYou Chat</h1>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-sm text-cyan-300/70">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Current User */}
      <div className="p-4 border-b border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-black font-semibold text-sm">
              {currentUser.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-cyan-100">{currentUser.username}</div>
            <div className="text-xs text-green-400">Online</div>
          </div>
        </div>
      </div>

      {/* Direct Messages */}
      {dmUserObjects.length > 0 && (
        <div className="p-4 border-b border-cyan-500/30">
          <h3 className="text-sm font-semibold text-cyan-300 mb-3 flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Direct Messages
          </h3>
          <div className="space-y-2">
            {dmUserObjects.map(user => (
              <button
                key={user.id}
                onClick={() => onPrivateChat(user.id)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-cyan-500/20 transition-colors text-left"
              >
                <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-cyan-100">{user.username}</div>
                  <div className={`text-xs ${user.isOnline ? 'text-green-400' : 'text-gray-400'}`}>
                    {user.isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Online Users */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-cyan-300 mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Online Users ({onlineUsers.length})
        </h3>
        <div className="space-y-2">
          {onlineUsers.map(user => (
            <button
              key={user.id}
              onClick={() => onPrivateChat(user.id)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-cyan-500/20 transition-colors text-left"
            >
              <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-black text-xs font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="text-sm text-cyan-100">{user.username}</div>
                <div className="text-xs text-green-400">Online</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-cyan-500/30 space-y-2">
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-900 border-red-500/30">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-400">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                This action cannot be undone. This will permanently delete your account
                and remove all your data from our servers. All your messages will be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-700 text-gray-300 hover:bg-gray-600">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, delete my account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <Button 
          onClick={onLogout}
          variant="outline" 
          className="w-full border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default ChatSidebar;
