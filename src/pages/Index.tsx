import React, { useState, useEffect } from 'react';
import LoginForm from '../components/LoginForm';
import ChatInterface from '../components/ChatInterface';
import { useToast } from '@/hooks/use-toast';
import { realTimeService } from '../utils/realTimeService';

export interface User {
  id: string;
  username: string;
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
  timestamp: Date;
  isPrivate: boolean;
  recipientId?: string;
  reactions: { [emoji: string]: string[] };
  readBy: string[];
  isEdited: boolean;
  replyTo?: string;
}

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [existingUsers, setExistingUsers] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load initial data
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user.timeoutUntil && new Date(user.timeoutUntil) > new Date()) {
        user.isTimedOut = true;
      } else {
        user.isTimedOut = false;
        user.timeoutUntil = undefined;
        user.reportedBy = undefined;
      }
      setCurrentUser(user);
    }

    const savedUsers = localStorage.getItem('existingUsers');
    if (savedUsers) {
      setExistingUsers(JSON.parse(savedUsers));
    }

    // Load real-time data
    setMessages(realTimeService.getMessages());
    setUsers(realTimeService.getUsers());

    // Subscribe to real-time updates
    const unsubscribe = realTimeService.subscribe((data) => {
      if (data.type === 'messages') {
        setMessages(data.data || []);
      } else if (data.type === 'users') {
        setUsers(data.data || []);
      }
    });

    setIsConnected(true);

    return unsubscribe;
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('existingUsers', JSON.stringify(existingUsers));
  }, [existingUsers]);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('allUsers', JSON.stringify(users));
  }, [users]);

  const handleLogin = (username: string, isSignIn: boolean = false) => {
    const usernameExists = existingUsers.some(u => u.toLowerCase() === username.toLowerCase());
    
    if (isSignIn && !usernameExists) {
      toast({
        title: "User not found",
        description: "This username doesn't exist. Please sign up first.",
        variant: "destructive"
      });
      return false;
    }

    if (!isSignIn && usernameExists) {
      toast({
        title: "Username taken",
        description: "This username already exists. Please sign in or choose a different username.",
        variant: "destructive"
      });
      return false;
    }

    const existingUserData = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    const newUser: User = {
      id: isSignIn && existingUserData ? existingUserData.id : Date.now().toString(),
      username,
      isOnline: true,
      lastSeen: new Date(),
      isTimedOut: existingUserData?.isTimedOut || false,
      timeoutUntil: existingUserData?.timeoutUntil,
      reportedBy: existingUserData?.reportedBy
    };

    if (newUser.timeoutUntil && new Date(newUser.timeoutUntil) > new Date()) {
      const timeLeft = Math.ceil((new Date(newUser.timeoutUntil).getTime() - new Date().getTime()) / (1000 * 60));
      toast({
        title: "Account temporarily suspended",
        description: `You have been reported by ${newUser.reportedBy}. You can't send messages for ${timeLeft} more minutes.`,
        variant: "destructive"
      });
    }

    setCurrentUser(newUser);
    
    if (!isSignIn) {
      setExistingUsers(prev => [...prev, username]);
    }
    
    // Update users list and broadcast to all devices
    const updatedUsers = users.filter(u => u.username.toLowerCase() !== username.toLowerCase());
    updatedUsers.push(newUser);
    setUsers(updatedUsers);
    realTimeService.broadcastUserUpdate(updatedUsers);
    
    toast({
      title: isSignIn ? "Welcome back!" : "Welcome to SafeYou Chat!",
      description: `You've ${isSignIn ? 'signed in' : 'joined'} as ${username}`,
    });
    
    return true;
  };

  const handleLogout = () => {
    if (currentUser) {
      const updatedUsers = users.map(u => 
        u.id === currentUser.id ? { ...u, isOnline: false, lastSeen: new Date() } : u
      );
      setUsers(updatedUsers);
      realTimeService.broadcastUserUpdate(updatedUsers);
      localStorage.removeItem('currentUser');
      setCurrentUser(null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    }
  };

  const handleSendMessage = (content: string, type: 'text' | 'image' | 'video' = 'text', recipientId?: string, replyToId?: string) => {
    if (!currentUser) return;

    if (currentUser.timeoutUntil && new Date(currentUser.timeoutUntil) > new Date()) {
      const timeLeft = Math.ceil((new Date(currentUser.timeoutUntil).getTime() - new Date().getTime()) / (1000 * 60));
      toast({
        title: "Cannot send message",
        description: `You are temporarily suspended for ${timeLeft} more minutes.`,
        variant: "destructive"
      });
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      userId: currentUser.id,
      username: currentUser.username,
      content,
      type,
      timestamp: new Date(),
      isPrivate: !!recipientId,
      recipientId,
      reactions: {},
      readBy: [currentUser.id],
      isEdited: false,
      replyTo: replyToId
    };

    // Broadcast message to all devices
    realTimeService.broadcastMessage(newMessage);
  };

  const handleDeleteMessage = (messageId: string) => {
    const updatedMessages = messages.filter(msg => msg.id !== messageId);
    setMessages(updatedMessages);
    localStorage.setItem('safeyou_global_messages', JSON.stringify(updatedMessages));
    toast({
      title: "Message deleted",
      description: "Your message has been deleted.",
    });
  };

  const handleReportMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !currentUser) return;

    const reportedUser = users.find(u => u.id === message.userId);
    if (!reportedUser) return;

    const timeoutUntil = new Date();
    timeoutUntil.setMinutes(timeoutUntil.getMinutes() + 30);

    const updatedUsers = users.map(u => 
      u.id === reportedUser.id 
        ? { ...u, isTimedOut: true, timeoutUntil, reportedBy: currentUser.username }
        : u
    );
    
    setUsers(updatedUsers);
    realTimeService.broadcastUserUpdate(updatedUsers);

    if (currentUser.id === reportedUser.id) {
      setCurrentUser(prev => prev ? { ...prev, isTimedOut: true, timeoutUntil, reportedBy: currentUser.username } : null);
    }

    toast({
      title: "User reported",
      description: `${reportedUser.username} has been suspended for 30 minutes.`,
    });
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;

    const updatedMessages = messages.map(msg => {
      if (msg.id === messageId) {
        const reactions = { ...msg.reactions };
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
        return { ...msg, reactions };
      }
      return msg;
    });

    setMessages(updatedMessages);
    localStorage.setItem('safeyou_global_messages', JSON.stringify(updatedMessages));
  };

  const handleUsernameClick = (userId: string) => {
    // This will be handled in ChatInterface to open private chat
    return userId;
  };

  if (!currentUser) {
    return (
      <LoginForm 
        onLogin={handleLogin} 
        existingUsers={existingUsers}
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
      isConnected={isConnected}
      onUsernameClick={handleUsernameClick}
    />
  );
};

export default Index;
