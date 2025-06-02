import { supabase } from '@/integrations/supabase/client';
import { User, Message } from '../pages/Index';

export class SupabaseService {
  private listeners: ((data: any) => void)[] = [];
  private messagesChannel: any = null;
  private usersChannel: any = null;

  // User management
  async createUser(username: string, password: string): Promise<{ user: User | null; error: string | null }> {
    try {
      // Simple password hashing (in production, use proper bcrypt)
      const passwordHash = btoa(password + 'safeyou_salt');
      
      const { data, error } = await supabase
        .from('users')
        .insert([{
          username,
          password_hash: passwordHash,
          is_online: true,
          last_seen: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        return { user: null, error: error.message };
      }

      const user: User = {
        id: data.id,
        username: data.username,
        password: data.password_hash,
        isOnline: data.is_online,
        lastSeen: new Date(data.last_seen),
        isTimedOut: data.is_timed_out,
        timeoutUntil: data.timeout_until ? new Date(data.timeout_until) : undefined,
        reportedBy: data.reported_by
      };

      return { user, error: null };
    } catch (error) {
      return { user: null, error: (error as Error).message };
    }
  }

  async loginUser(username: string, password: string): Promise<{ user: User | null; error: string | null }> {
    try {
      const passwordHash = btoa(password + 'safeyou_salt');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', passwordHash)
        .single();

      if (error) {
        return { user: null, error: 'Invalid credentials' };
      }

      // Update user as online
      await supabase
        .from('users')
        .update({ 
          is_online: true, 
          last_seen: new Date().toISOString() 
        })
        .eq('id', data.id);

      const user: User = {
        id: data.id,
        username: data.username,
        password: data.password_hash,
        isOnline: true,
        lastSeen: new Date(),
        isTimedOut: data.is_timed_out,
        timeoutUntil: data.timeout_until ? new Date(data.timeout_until) : undefined,
        reportedBy: data.reported_by
      };

      return { user, error: null };
    } catch (error) {
      return { user: null, error: (error as Error).message };
    }
  }

  async logoutUser(userId: string): Promise<void> {
    await supabase
      .from('users')
      .update({ 
        is_online: false, 
        last_seen: new Date().toISOString() 
      })
      .eq('id', userId);
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data.map(user => ({
      id: user.id,
      username: user.username,
      password: user.password_hash,
      isOnline: user.is_online,
      lastSeen: new Date(user.last_seen),
      isTimedOut: user.is_timed_out,
      timeoutUntil: user.timeout_until ? new Date(user.timeout_until) : undefined,
      reportedBy: user.reported_by
    }));
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const dbUpdates: any = {};
    
    if (updates.isOnline !== undefined) dbUpdates.is_online = updates.isOnline;
    if (updates.lastSeen) dbUpdates.last_seen = updates.lastSeen.toISOString();
    if (updates.isTimedOut !== undefined) dbUpdates.is_timed_out = updates.isTimedOut;
    if (updates.timeoutUntil) dbUpdates.timeout_until = updates.timeoutUntil.toISOString();
    if (updates.reportedBy !== undefined) dbUpdates.reported_by = updates.reportedBy;

    await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', userId);
  }

  async deleteUser(userId: string): Promise<void> {
    await supabase
      .from('users')
      .delete()
      .eq('id', userId);
  }

  // Message management
  async sendMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          user_id: message.userId,
          username: message.username,
          content: message.content,
          type: message.type,
          image_url: message.imageUrl,
          is_private: message.isPrivate,
          recipient_id: message.recipientId,
          reply_to_id: typeof message.replyTo === 'string' ? message.replyTo : undefined,
          reaction: message.reactions,
          read_by: JSON.stringify(message.readBy),
          is_edited: message.isEdited
        }])
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        username: data.username,
        content: data.content,
        type: (data.type as 'text' | 'image' | 'video') || 'text',
        imageUrl: data.image_url,
        timestamp: new Date(data.created_at),
        isPrivate: data.is_private,
        recipientId: data.recipient_id,
        reactions: typeof data.reaction === 'object' && data.reaction !== null ? data.reaction as { [emoji: string]: string[] } : {},
        readBy: JSON.parse(data.read_by as string || '[]'),
        isEdited: data.is_edited,
        replyTo: data.reply_to_id
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  async getAllMessages(): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    // Transform the messages and resolve reply relationships
    const messages = data.map(msg => ({
      id: msg.id,
      userId: msg.user_id,
      username: msg.username,
      content: msg.content,
      type: (msg.type as 'text' | 'image' | 'video') || 'text',
      imageUrl: msg.image_url,
      timestamp: new Date(msg.created_at),
      isPrivate: msg.is_private,
      recipientId: msg.recipient_id,
      reactions: typeof msg.reaction === 'object' && msg.reaction !== null ? msg.reaction as { [emoji: string]: string[] } : {},
      readBy: JSON.parse(msg.read_by as string || '[]'),
      isEdited: msg.is_edited,
      replyTo: msg.reply_to_id
    }));

    // Now resolve the reply relationships
    return messages.map(message => {
      if (message.replyTo && typeof message.replyTo === 'string') {
        const replyToMessage = messages.find(m => m.id === message.replyTo);
        if (replyToMessage) {
          return {
            ...message,
            replyTo: replyToMessage
          };
        }
      }
      return message;
    });
  }

  async updateMessage(messageId: string, updates: Partial<Message>): Promise<void> {
    const dbUpdates: any = {};
    
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.reactions !== undefined) dbUpdates.reaction = updates.reactions;
    if (updates.readBy !== undefined) dbUpdates.read_by = JSON.stringify(updates.readBy);
    if (updates.isEdited !== undefined) dbUpdates.is_edited = updates.isEdited;

    await supabase
      .from('messages')
      .update(dbUpdates)
      .eq('id', messageId);
  }

  async deleteMessage(messageId: string): Promise<void> {
    await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);
  }

  // Real-time subscriptions
  subscribe(callback: (data: any) => void) {
    this.listeners.push(callback);

    // Subscribe to messages changes
    this.messagesChannel = supabase
      .channel('messages-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        async (payload) => {
          console.log('Messages change:', payload);
          const messages = await this.getAllMessages();
          callback({ type: 'messages', data: messages });
        }
      )
      .subscribe();

    // Subscribe to users changes
    this.usersChannel = supabase
      .channel('users-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        async (payload) => {
          console.log('Users change:', payload);
          const users = await this.getAllUsers();
          callback({ type: 'users', data: users });
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
      if (this.messagesChannel) {
        supabase.removeChannel(this.messagesChannel);
        this.messagesChannel = null;
      }
      if (this.usersChannel) {
        supabase.removeChannel(this.usersChannel);
        this.usersChannel = null;
      }
    };
  }

  destroy() {
    if (this.messagesChannel) {
      supabase.removeChannel(this.messagesChannel);
      this.messagesChannel = null;
    }
    if (this.usersChannel) {
      supabase.removeChannel(this.usersChannel);
      this.usersChannel = null;
    }
    this.listeners = [];
  }
}

export const supabaseService = new SupabaseService();
