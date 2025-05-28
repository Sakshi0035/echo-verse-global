import React, { useState, useEffect } from 'react';
import LoginForm from '../components/LoginForm';
import ChatInterface from '../components/ChatInterface';
import { useToast } from '@/hooks/use-toast';
import { realTimeService } from '../utils/realTimeService';

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
  replyTo?: string;
}

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [existingUsers, setExistingUsers] = useState<string[]>([]);
  const { toast } = useToast();

  // Simple password hashing (in production, use proper bcrypt)
  const hashPassword = (password: string): string => {
    return btoa(password + 'safeyou_salt'); // Simple base64 encoding for demo
  };

  const verifyPassword = (password: string, hashedPassword: string): boolean => {
    return hashPassword(password) === hashedPassword;
  };

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

    // Load real-time data - ensure these return arrays
    const initialMessages = realTimeService.getMessages();
    const initialUsers = realTimeService.getUsers();
    
    console.log('Initial messages:', initialMessages);
    console.log('Initial users:', initialUsers);
    
    setMessages(Array.isArray(initialMessages) ? initialMessages : []);
    setUsers(Array.isArray(initialUsers) ? initialUsers : []);

    // Subscribe to real-time updates
    const unsubscribe = realTimeService.subscribe((data) => {
      console.log('Real-time update received:', data);
      
      if (data.type === 'messages') {
        const newMessages = Array.isArray(data.data) ? data.data : [];
        setMessages(newMessages);
      } else if (data.type === 'users') {
        const newUsers = Array.isArray(data.data) ? data.data : [];
        setUsers(newUsers);
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

  const handleLogin = (username: string, password: string, isSignIn: boolean = false) => {
    if (isSignIn) {
      // Sign in: verify credentials
      const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (!existingUser) {
        toast({
          title: "User not found",
          description: "This username doesn't exist. Please sign up first.",
          variant: "destructive"
        });
        return false;
      }

      if (!verifyPassword(password, existingUser.password)) {
        toast({
          title: "Invalid credentials",
          description: "Incorrect password. Click 'Forgot Password?' to reset it.",
          variant: "destructive"
        });
        return false;
      }

      // Check if user is timed out
      if (existingUser.timeoutUntil && new Date(existingUser.timeoutUntil) > new Date()) {
        const timeLeft = Math.ceil((new Date(existingUser.timeoutUntil).getTime() - new Date().getTime()) / (1000 * 60));
        toast({
          title: "Account temporarily suspended",
          description: `You have been reported by ${existingUser.reportedBy}. You can't send messages for ${timeLeft} more minutes.`,
          variant: "destructive"
        });
      }

      const updatedUser = { ...existingUser, isOnline: true, lastSeen: new Date() };
      setCurrentUser(updatedUser);

      // Update users list
      const updatedUsers = users.map(u => u.id === existingUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      realTimeService.broadcastUserUpdate(updatedUsers);

    } else {
      // Sign up: create new user
      const usernameExists = existingUsers.some(u => u.toLowerCase() === username.toLowerCase());
      
      if (usernameExists) {
        toast({
          title: "Username taken",
          description: "This username already exists. Please choose a different username.",
          variant: "destructive"
        });
        return false;
      }

      const newUser: User = {
        id: Date.now().toString(),
        username,
        password: hashPassword(password),
        isOnline: true,
        lastSeen: new Date(),
        isTimedOut: false
      };

      setCurrentUser(newUser);
      setExistingUsers(prev => [...prev, username]);
      
      // Update users list and broadcast to all devices
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      realTimeService.broadcastUserUpdate(updatedUsers);
    }
    
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

  const handleSendMessage = (content: string, type: 'text' | 'image' | 'video' = 'text', imageUrl?: string, recipientId?: string, replyToId?: string) => {
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
      imageUrl, // Include image URL for combined messages
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
    const message = messages.find(m => m.id === messageId);
    if (!message || message.userId !== currentUser?.id) return;

    const updatedMessages = messages.filter(msg => msg.id !== messageId);
    setMessages(updatedMessages);
    realTimeService.broadcastUpdatedMessages(updatedMessages);
    
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
    realTimeService.broadcastUpdatedMessages(updatedMessages);
  };

  const handleUsernameClick = (userId: string) => {
    // This will be handled in ChatInterface to open private chat
    return userId;
  };

  const handleDeleteAccount = () => {
    if (!currentUser) return;

    // Remove user from users list
    const updatedUsers = users.filter(u => u.id !== currentUser.id);
    setUsers(updatedUsers);
    realTimeService.broadcastUserUpdate(updatedUsers);

    // Remove all messages from this user
    const updatedMessages = messages.filter(msg => msg.userId !== currentUser.id);
    setMessages(updatedMessages);
    realTimeService.broadcastUpdatedMessages(updatedMessages);

    // Remove from existing users list
    const updatedExistingUsers = existingUsers.filter(username => 
      username.toLowerCase() !== currentUser.username.toLowerCase()
    );
    setExistingUsers(updatedExistingUsers);

    // Clear current user and localStorage
    localStorage.removeItem('currentUser');
    setCurrentUser(null);

    toast({
      title: "Account deleted",
      description: "Your account has been permanently deleted.",
      variant: "destructive"
    });
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
      users={Array.isArray(users) ? users : []}
      messages={Array.isArray(messages) ? messages : []}
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
