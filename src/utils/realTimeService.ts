
import { supabase } from "@/integrations/supabase/client";

// Enhanced real-time messaging service using Supabase
class RealTimeService {
  private listeners: ((data: any) => void)[] = [];
  private channel: any = null;

  constructor() {
    this.initializeChannel();
  }

  private initializeChannel() {
    // Create a channel for real-time messaging
    this.channel = supabase.channel('safeyou-chat', {
      config: {
        broadcast: { self: true },
        presence: { key: 'user-presence' }
      }
    });

    // Subscribe to broadcast events
    this.channel
      .on('broadcast', { event: 'message' }, (payload: any) => {
        this.notifyListeners({ type: 'messages', data: payload.data });
      })
      .on('broadcast', { event: 'users' }, (payload: any) => {
        this.notifyListeners({ type: 'users', data: payload.data });
      })
      .subscribe();
  }

  subscribe(callback: (data: any) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(data: any) {
    this.listeners.forEach(listener => listener(data));
  }

  // Broadcast message to all connected clients via Supabase
  async broadcastMessage(message: any) {
    try {
      // Store message in Supabase database
      const { error } = await supabase
        .from('messages')
        .insert([{
          content: message.content,
          username: message.username,
          reply_to_id: message.replyTo || null,
          reaction: message.reactions || {}
        }]);

      if (error) {
        console.error('Error storing message:', error);
        return;
      }

      // Also broadcast via real-time channel for immediate delivery
      const messages = await this.getMessages();
      await this.channel.send({
        type: 'broadcast',
        event: 'message',
        data: messages
      });

      // Update local storage as fallback
      localStorage.setItem('safeyou_global_messages', JSON.stringify(messages));
    } catch (error) {
      console.error('Error broadcasting message:', error);
      // Fallback to localStorage only
      const messages = this.getMessages();
      const newMessages = [...messages, message];
      localStorage.setItem('safeyou_global_messages', JSON.stringify(newMessages));
      this.notifyListeners({ type: 'messages', data: newMessages });
    }
  }

  // Broadcast user update to all connected clients
  async broadcastUserUpdate(users: any[]) {
    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'users',
        data: users
      });
      
      // Update local storage as fallback
      localStorage.setItem('safeyou_global_users', JSON.stringify(users));
    } catch (error) {
      console.error('Error broadcasting user update:', error);
      // Fallback to localStorage only
      localStorage.setItem('safeyou_global_users', JSON.stringify(users));
      this.notifyListeners({ type: 'users', data: users });
    }
  }

  async getMessages() {
    try {
      // Try to get messages from Supabase first
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        // Fallback to localStorage
        return this.getLocalMessages();
      }

      // Transform Supabase data to match expected format
      const transformedMessages = data?.map((msg: any) => ({
        id: msg.id,
        userId: msg.username, // Using username as userId for compatibility
        username: msg.username,
        content: msg.content,
        type: 'text',
        timestamp: new Date(msg.created_at),
        isPrivate: false,
        reactions: msg.reaction || {},
        readBy: [],
        isEdited: false,
        replyTo: msg.reply_to_id
      })) || [];

      return transformedMessages;
    } catch (error) {
      console.error('Error in getMessages:', error);
      return this.getLocalMessages();
    }
  }

  private getLocalMessages() {
    const stored = localStorage.getItem('safeyou_global_messages');
    return stored ? JSON.parse(stored).map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    })) : [];
  }

  getUsers() {
    const stored = localStorage.getItem('safeyou_global_users');
    return stored ? JSON.parse(stored).map((user: any) => ({
      ...user,
      lastSeen: new Date(user.lastSeen),
      timeoutUntil: user.timeoutUntil ? new Date(user.timeoutUntil) : undefined
    })) : [];
  }

  clearData() {
    localStorage.removeItem('safeyou_global_messages');
    localStorage.removeItem('safeyou_global_users');
  }

  // Clean up channel when service is destroyed
  disconnect() {
    if (this.channel) {
      this.channel.unsubscribe();
    }
  }
}

export const realTimeService = new RealTimeService();
