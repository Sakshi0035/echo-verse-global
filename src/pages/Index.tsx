
import React, { useState, useEffect } from 'react';
import LoginForm from '../components/LoginForm';
import ChatInterface from '../components/ChatInterface';
import { useToast } from '@/hooks/use-toast';
import { supabaseService } from '../services/supabaseService';

export interface User {
  id: string;
  username: string;
  password: string; // Store hashed password in real implementation
  isOnline: boolean;
  lastSeen: Date;
  avatar?: string;
  isTimedOut?: boolean;
  timeoutUntil?: Date;
  reportedBy?: string;
}

export interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  type: 'text' | 'image' | 'video';
  imageUrl?: string; // For combined image + text messages
  timestamp: Date;
  isPrivate: boolean;
  recipientId?: string;
  reactions: { [emoji: string]: string[] };
  readBy: string[];
  isEdited: boolean;
  replyTo?: string | Message;
}

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  // Check if user is currently timed out
  const isUserTimedOut = (user: User): boolean => {
    if (!user.isTimedOut || !user.timeoutUntil) return false;
    return new Date(user.timeoutUntil) > new Date();
  };

  useEffect(() => {
    // Load initial data from Supabase
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

        // Check for saved user in localStorage and verify they still exist
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          const existingUser = initialUsers.find(u => u.id === user.id);
          
          if (existingUser) {
            // Check if timeout has expired
            if (existingUser.timeoutUntil && new Date(existingUser.timeoutUntil) <= new Date()) {
              await supabaseService.updateUser(existingUser.id, {
                isTimedOut: false,
                timeoutUntil: undefined,
                reportedBy: undefined
              });
              existingUser.isTimedOut = false;
              existingUser.timeoutUntil = undefined;
              existingUser.reportedBy = undefined;
            }
            
            // Update user as online
            await supabaseService.updateUser(existingUser.id, {
              isOnline: true,
              lastSeen: new Date()
            });
            
            setCurrentUser(existingUser);
          } else {
            localStorage.removeItem('currentUser');
          }
        }

        // Subscribe to real-time updates
        const unsubscribe = supabaseService.subscribe((data) => {
          console.log('Real-time update received:', data);
          
          if (data.type === 'messages') {
            setMessages(data.data);
          } else if (data.type === 'users') {
            setUsers(data.data);
            
            // Update current user if their data changed
            if (currentUser) {
              const updatedCurrentUser = data.data.find((u: User) => u.id === currentUser.id);
              if (updatedCurrentUser) {
                setCurrentUser(updatedCurrentUser);
              }
            }
          }
        });

        setIsConnected(true);

        // Cleanup function
        return unsubscribe;
      } catch (error) {
        console.error('Error initializing data:', error);
        setIsConnected(false);
      }
    };

    const unsubscribe = initializeData();

    return () => {
      if (unsubscribe && typeof unsubscribe.then === 'function') {
        unsubscribe.then(cleanup => cleanup && cleanup());
      } else if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      supabaseService.destroy();
    };
  }, []);

  // Save current user to localStorage when it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  const handleLogin = async (username: string, password: string, isSignIn: boolean = false) => {
    try {
      if (isSignIn) {
        // Sign in: verify credentials
        const { user, error } = await supabaseService.loginUser(username, password);
        
        if (error) {
          toast({
            title: error.includes('Invalid') ? "Invalid credentials" : "User not found",
            description: error.includes('Invalid') ? "Incorrect password. Click 'Forgot Password?' to reset it." : "This username doesn't exist. Please sign up first.",
            variant: "destructive"
          });
          return false;
        }

        if (!user) return false;

        // Check if user is timed out
        if (isUserTimedOut(user)) {
          const timeLeft = Math.ceil((new Date(user.timeoutUntil!).getTime() - new Date().getTime()) / (1000 * 60));
          toast({
            title: "Account temporarily suspended",
            description: `You have been reported by ${user.reportedBy}. You can't send messages for ${timeLeft} more minutes.`,
            variant: "destructive"
          });
        }

        setCurrentUser(user);
      } else {
        // Sign up: create new user
        const existingUsers = await supabaseService.getAllUsers();
        const usernameExists = existingUsers.some(u => u.username.toLowerCase() === username.toLowerCase());
        
        if (usernameExists) {
          toast({
            title: "Username taken",
            description: "This username already exists. Please choose a different username.",
            variant: "destructive"
          });
          return false;
        }

        const { user, error } = await supabaseService.createUser(username, password);
        
        if (error || !user) {
          toast({
            title: "Sign up failed",
            description: error || "Failed to create account. Please try again.",
            variant: "destructive"
          });
          return false;
        }

        setCurrentUser(user);
      }
      
      toast({
        title: isSignIn ? "Welcome back!" : "Welcome to SafeYou Chat!",
        description: `You've ${isSignIn ? 'signed in' : 'joined'} as ${username}`,
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleLogout = async () => {
    if (currentUser) {
      await supabaseService.logoutUser(currentUser.id);
      localStorage.removeItem('currentUser');
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

    await supabaseService.updateUser(reportedUser.id, {
      isTimedOut: true,
      timeoutUntil,
      reportedBy: currentUser.username
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
    // This will be handled in ChatInterface to open private chat
    return userId;
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;

    // Delete user and their messages
    await supabaseService.deleteUser(currentUser.id);

    // Clear current user and localStorage
    localStorage.removeItem('currentUser');
    setCurrentUser(null);

    toast({
      title: "Account deleted",
      description: "Your account has been permanently deleted.",
      variant: "destructive"
    });
  };

  const handleResetPassword = async (username: string, newPassword: string) => {
    try {
      const allUsers = await supabaseService.getAllUsers();
      const userExists = allUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
      
      if (!userExists) {
        return false;
      }

      // In a real app, you'd have a proper password reset flow
      // For now, we'll just update the password hash
      const passwordHash = btoa(newPassword + 'safeyou_salt');
      await supabaseService.updateUser(userExists.id, { password: passwordHash } as any);
      
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      return false;
    }
  };

  if (!currentUser) {
    return (
      <LoginForm 
        onLogin={handleLogin}
        users={users}
        onResetPassword={handleResetPassword}
      />
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
