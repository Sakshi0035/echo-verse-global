
import { supabase } from '@/integrations/supabase/client';
import { User, Message } from '../pages/Index';

export class SupabaseService {
  private listeners: ((data: any) => void)[] = [];
  private messagesChannel: any = null;
  private usersChannel: any = null;

  // Get current authenticated user from database
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        console.error('No authenticated user:', authError);
        return null;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();

      if (error || !data) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return {
        id: data.id,
        username: data.username,
        password: '',
        isOnline: data.is_online,
        lastSeen: new Date(data.last_seen),
        isTimedOut: data.is_timed_out || false,
        timeoutUntil: data.timeout_until ? new Date(data.timeout_until) : undefined,
        reportedBy: data.reported_by || []
      };
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
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
      .from('users_safe')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data.map(user => ({
      id: user.id,
      username: user.username,
      password: '',
      isOnline: user.is_online,
      lastSeen: new Date(user.last_seen),
      isTimedOut: false,
      timeoutUntil: undefined,
      reportedBy: []
    }));
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const dbUpdates: any = {};
    
    if (updates.isOnline !== undefined) dbUpdates.is_online = updates.isOnline;
    if (updates.lastSeen) dbUpdates.last_seen = updates.lastSeen.toISOString();
    if (updates.isTimedOut !== undefined) dbUpdates.is_timed_out = updates.isTimedOut;
    if (updates.timeoutUntil) dbUpdates.timeout_until = updates.timeoutUntil.toISOString();
    if (updates.reportedBy !== undefined) dbUpdates.reported_by = Array.isArray(updates.reportedBy) ? updates.reportedBy : [updates.reportedBy];

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

  // Message management with proper reply handling
  async sendMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          user_id: message.userId,
          username: message.username,
          content: message.content,
          type: message.type as 'text' | 'image' | 'video',
          image_url: message.imageUrl,
          is_private: message.isPrivate,
          recipient_id: message.recipientId,
          reply_to_id: typeof message.replyTo === 'string' ? message.replyTo : (message.replyTo as Message)?.id,
          reaction: message.reactions || {},
          read_by: JSON.stringify(message.readBy || []),
          is_edited: message.isEdited || false
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
        reactions: (typeof data.reaction === 'object' && data.reaction !== null) ? data.reaction as { [emoji: string]: string[] } : {},
        readBy: JSON.parse((data.read_by as string) || '[]'),
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

    // Transform the messages first
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
      reactions: (typeof msg.reaction === 'object' && msg.reaction !== null) ? msg.reaction as { [emoji: string]: string[] } : {},
      readBy: JSON.parse((msg.read_by as string) || '[]'),
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

  // Enhanced real-time subscriptions with better error handling
  subscribe(callback: (data: any) => void) {
    this.listeners.push(callback);

    // Subscribe to messages changes with enhanced real-time sync
    this.messagesChannel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        async (payload) => {
          console.log('Real-time messages change:', payload);
          // Immediately fetch fresh data to ensure consistency across all sessions
          const messages = await this.getAllMessages();
          callback({ type: 'messages', data: messages });
        }
      )
      .subscribe((status) => {
        console.log('Messages channel status:', status);
      });

    // Subscribe to users changes with enhanced real-time sync
    this.usersChannel = supabase
      .channel('users-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        async (payload) => {
          console.log('Real-time users change:', payload);
          // Immediately fetch fresh data to ensure consistency across all sessions
          const users = await this.getAllUsers();
          callback({ type: 'users', data: users });
        }
      )
      .subscribe((status) => {
        console.log('Users channel status:', status);
      });

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

  // Sync user status across sessions
  async syncUserStatus(userId: string): Promise<void> {
    await supabase
      .from('users')
      .update({ 
        is_online: true, 
        last_seen: new Date().toISOString() 
      })
      .eq('id', userId);
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
