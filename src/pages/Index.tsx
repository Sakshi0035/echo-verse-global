import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';
import { useToast } from '@/hooks/use-toast';
import { supabaseService } from '../services/supabaseService';
import { useUser } from '@clerk/clerk-react';

export interface User {
  id: string;
  username: string;
  password: string;
  isOnline: boolean;
  lastSeen: Date;
  avatar?: string;
  isTimedOut?: boolean;
  timeoutUntil?: Date;
  reportedBy?: string[];
}

export interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  type: 'text' | 'image' | 'video';
  imageUrl?: string;
  timestamp: Date;
  isPrivate: boolean;
  recipientId?: string;
  reactions: { [emoji: string]: string[] };
  readBy: string[];
  isEdited: boolean;
  replyTo?: string | Message;
}

const Index = () => {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  // Redirect to /auth when signed out
  useEffect(() => {
    if (!isSignedIn) {
      navigate('/auth', { replace: true });
    }
  }, [isSignedIn, navigate]);

  // Ensure DB user exists and hydrate currentUser after Clerk sign-in
  useEffect(() => {
    if (isSignedIn && user && !currentUser) {
      const username =
        (user as any).username ||
        (user as any).firstName ||
        (user as any).emailAddresses?.[0]?.emailAddress.split('@')[0] ||
        'User';
      handleAuthSuccess((user as any).id, username);
    }
  }, [isSignedIn, user, currentUser]);

  // Check if user is currently timed out
  const isUserTimedOut = (user: User): boolean => {
    if (!user.isTimedOut || !user.timeoutUntil) return false;
    return new Date(user.timeoutUntil) > new Date();
  };

  useEffect(() => {
    // Enhanced real-time initialization for synchronization across sessions
    const initializeData = async () => {
      try {
        console.log('Loading initial data from Supabase...');
        
        const [initialMessages, initialUsers] = await Promise.all([
          supabaseService.getAllMessages(),
          supabaseService.getAllUsers()
        ]);
        
        console.log('Initial messages:', initialMessages);
        console.log('Initial users:', initialUsers);
        
        setMessages(initialMessages);
        setUsers(initialUsers);

        // Enhanced real-time subscription for cross-session sync
        const unsubscribe = supabaseService.subscribe((data) => {
          console.log('Real-time update received:', data);
          
          if (data.type === 'messages') {
            setMessages(data.data);
          } else if (data.type === 'users') {
            setUsers(data.data);
            
            // Update current user if their data changed across sessions
            if (currentUser) {
              const updatedCurrentUser = data.data.find((u: User) => u.id === currentUser.id);
              if (updatedCurrentUser) {
                setCurrentUser(updatedCurrentUser);
              }
            }
          }
        });

        setIsConnected(true);
        return unsubscribe;
      } catch (error) {
        console.error('Error initializing data:', error);
        setIsConnected(false);
        return undefined;
      }
    };

    let unsubscribePromise: Promise<(() => void) | undefined>;
    unsubscribePromise = initializeData();

    // Periodic sync to ensure consistency across sessions
    const syncInterval = setInterval(async () => {
      if (currentUser) {
        await supabaseService.syncUserStatus(currentUser.id);
      }
    }, 30000); // Sync every 30 seconds

    return () => {
      clearInterval(syncInterval);
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
      supabaseService.destroy();
    };
  }, [currentUser]);

  const handleAuthSuccess = async (userId: string, username: string) => {
    try {
      const allUsers = await supabaseService.getAllUsers();
      // Find by username instead of Clerk ID (DB uses UUID ids)
      let user = allUsers.find((u) => u.username === username);

      if (!user) {
        const { user: newUser } = await supabaseService.createUser(username, userId);
        if (newUser) {
          user = newUser;
        }
      } else {
        // Sync by the actual DB user id
        await supabaseService.syncUserStatus(user.id);
      }

      if (user) {
        setCurrentUser(user);
        toast({
          title: "Welcome!",
          description: `Signed in as ${username}`,
        });
      }
    } catch (error) {
      console.error('Auth success handler error:', error);
    }
  };

  const handleLogout = async () => {
    if (currentUser) {
      await supabaseService.logoutUser(currentUser.id);
      setCurrentUser(null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    }
  };

  const handleSendMessage = async (content: string, type: 'text' | 'image' | 'video' = 'text', imageUrl?: string, recipientId?: string, replyToId?: string) => {
    if (!currentUser) return;

    // Check if current user is timed out
    if (isUserTimedOut(currentUser)) {
      const timeLeft = Math.ceil((new Date(currentUser.timeoutUntil!).getTime() - new Date().getTime()) / (1000 * 60));
      toast({
        title: "Cannot send message",
        description: `You are temporarily suspended for ${timeLeft} more minutes.`,
        variant: "destructive"
      });
      return;
    }

    const newMessage = {
      userId: currentUser.id,
      username: currentUser.username,
      content,
      type,
      imageUrl,
      isPrivate: !!recipientId,
      recipientId,
      reactions: {},
      readBy: [currentUser.id],
      isEdited: false,
      replyTo: replyToId
    };

    await supabaseService.sendMessage(newMessage);
  };

  const handleDeleteMessage = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.userId !== currentUser?.id) return;

    await supabaseService.deleteMessage(messageId);
    
    toast({
      title: "Message deleted",
      description: "Your message has been deleted.",
    });
  };

  const handleReportMessage = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !currentUser) return;

    const reportedUser = users.find(u => u.id === message.userId);
    if (!reportedUser) return;

    // Set timeout for 40 minutes
    const timeoutUntil = new Date();
    timeoutUntil.setMinutes(timeoutUntil.getMinutes() + 40);

    const reportedBy = reportedUser.reportedBy || [];
    await supabaseService.updateUser(reportedUser.id, {
      isTimedOut: true,
      timeoutUntil,
      reportedBy: [...reportedBy, currentUser.username]
    });

    toast({
      title: "User reported",
      description: `${reportedUser.username} has been suspended for 40 minutes and cannot send messages.`,
    });
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;

    const message = messages.find(msg => msg.id === messageId);
    if (!message) return;

    const reactions = { ...message.reactions };
    if (reactions[emoji]) {
      if (reactions[emoji].includes(currentUser.id)) {
        reactions[emoji] = reactions[emoji].filter(id => id !== currentUser.id);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      } else {
        reactions[emoji].push(currentUser.id);
      }
    } else {
      reactions[emoji] = [currentUser.id];
    }

    await supabaseService.updateMessage(messageId, { reactions });
  };

  const handleUsernameClick = (userId: string) => {
    return userId;
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;

    await supabaseService.deleteUser(currentUser.id);
    setCurrentUser(null);
    

    toast({
      title: "Account deleted",
      description: "Your account has been permanently deleted.",
      variant: "destructive"
    });
  };

  if (!isSignedIn) {
    return null;
  }
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading your chat...</p>
      </div>
    );
  }

  return (
    <ChatInterface
      currentUser={currentUser}
      users={users}
      messages={messages}
      onSendMessage={handleSendMessage}
      onDeleteMessage={handleDeleteMessage}
      onReportMessage={handleReportMessage}
      onReaction={handleReaction}
      onLogout={handleLogout}
      onDeleteAccount={handleDeleteAccount}
      isConnected={isConnected}
      onUsernameClick={handleUsernameClick}
    />
  );
};

export default Index;
