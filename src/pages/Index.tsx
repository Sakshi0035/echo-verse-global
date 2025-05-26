
import React, { useState, useEffect } from 'react';
import LoginForm from '../components/LoginForm';
import ChatInterface from '../components/ChatInterface';
import { useToast } from '@/hooks/use-toast';

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
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      // Check if user is timed out
      if (user.timeoutUntil && new Date(user.timeoutUntil) > new Date()) {
        user.isTimedOut = true;
      } else {
        user.isTimedOut = false;
        user.timeoutUntil = undefined;
        user.reportedBy = undefined;
      }
      
      setCurrentUser(user);
      setUsers(prev => {
        const existingUserIndex = prev.findIndex(u => u.id === user.id);
        if (existingUserIndex >= 0) {
          const updated = [...prev];
          updated[existingUserIndex] = { ...user, isOnline: true };
          return updated;
        }
        return [...prev, { ...user, isOnline: true }];
      });
    }

    // Load existing users from localStorage
    const savedUsers = localStorage.getItem('existingUsers');
    if (savedUsers) {
      setExistingUsers(JSON.parse(savedUsers));
    }

    // Load existing messages
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    }

    // Load users from localStorage
    const savedAllUsers = localStorage.getItem('allUsers');
    if (savedAllUsers) {
      setUsers(JSON.parse(savedAllUsers).map((user: any) => ({
        ...user,
        lastSeen: new Date(user.lastSeen),
        timeoutUntil: user.timeoutUntil ? new Date(user.timeoutUntil) : undefined
      })));
    }

    setIsConnected(true);
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

    // Find existing user data if signing in
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

    // Check if user is timed out
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
    
    setUsers(prev => {
      const existingUserIndex = prev.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
      if (existingUserIndex >= 0) {
        const updated = [...prev];
        updated[existingUserIndex] = { ...newUser, isOnline: true };
        return updated;
      }
      return [...prev, newUser];
    });
    
    toast({
      title: isSignIn ? "Welcome back!" : "Welcome to the chat!",
      description: `You've ${isSignIn ? 'signed in' : 'joined'} as ${username}`,
    });
    
    return true;
  };

  const handleLogout = () => {
    if (currentUser) {
      setUsers(prev => prev.map(u => 
        u.id === currentUser.id ? { ...u, isOnline: false, lastSeen: new Date() } : u
      ));
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

    // Check if user is timed out
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

    setMessages(prev => [...prev, newMessage]);
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    toast({
      title: "Message deleted",
      description: "Your message has been deleted.",
    });
  };

  const handleReportMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !currentUser) return;

    // Find the reported user
    const reportedUser = users.find(u => u.id === message.userId);
    if (!reportedUser) return;

    // Set timeout for 30 minutes
    const timeoutUntil = new Date();
    timeoutUntil.setMinutes(timeoutUntil.getMinutes() + 30);

    // Update users list
    setUsers(prev => prev.map(u => 
      u.id === reportedUser.id 
        ? { ...u, isTimedOut: true, timeoutUntil, reportedBy: currentUser.username }
        : u
    ));

    // Update current user if they are the reported user
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

    setMessages(prev => prev.map(msg => {
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
    }));
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
