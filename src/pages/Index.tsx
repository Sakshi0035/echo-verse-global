
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
  const { toast } = useToast();

  useEffect(() => {
    // Simulate real-time connection
    setIsConnected(true);
  }, []);

  const handleLogin = (username: string) => {
    // Check if username is taken
    const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existingUser && existingUser.id !== currentUser?.id) {
      toast({
        title: "Username taken",
        description: "This username is already in use. Please choose another one.",
        variant: "destructive"
      });
      return false;
    }

    const newUser: User = {
      id: Date.now().toString(),
      username,
      isOnline: true,
      lastSeen: new Date()
    };

    setCurrentUser(newUser);
    setUsers(prev => [...prev, newUser]);
    
    toast({
      title: "Welcome to the chat!",
      description: `You've joined as ${username}`,
    });
    
    return true;
  };

  const handleSendMessage = (content: string, type: 'text' | 'image' | 'video' = 'text', recipientId?: string, replyToId?: string) => {
    if (!currentUser) return;

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

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <ChatInterface
      currentUser={currentUser}
      users={users}
      messages={messages}
      onSendMessage={handleSendMessage}
      isConnected={isConnected}
    />
  );
};

export default Index;
