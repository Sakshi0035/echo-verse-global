
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LoginFormProps {
  onLogin: (username: string, isSignIn?: boolean) => boolean;
  existingUsers: string[];
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, existingUsers }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signup');

  const handleSubmit = async (e: React.FormEvent, isSignIn: boolean = false) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    const success = onLogin(username.trim(), isSignIn);
    if (!success) {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)'}}>
      <Card className="w-full max-w-md bg-gray-900 border-blue-500/30 neon-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold neon-text">
            SafeYou Chat
          </CardTitle>
          <CardDescription className="text-blue-300/70">
            Join the global chatroom or sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800 border border-blue-500/30">
              <TabsTrigger value="signup" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Sign Up
              </TabsTrigger>
              <TabsTrigger value="signin" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Sign In
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Choose your username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-800 border-blue-500/30 text-blue-100 placeholder-blue-300/50"
                    maxLength={20}
                    required
                  />
                  {existingUsers.length > 0 && (
                    <p className="text-xs text-blue-300/70 mt-1">
                      {existingUsers.length} user{existingUsers.length !== 1 ? 's' : ''} registered
                    </p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full neon-button"
                  disabled={isLoading || !username.trim()}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account & Join Chat'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Enter your username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-800 border-blue-500/30 text-blue-100 placeholder-blue-300/50"
                    maxLength={20}
                    required
                  />
                  {existingUsers.length > 0 && (
                    <div className="text-xs text-blue-300/70 mt-1">
                      <p>Existing users: {existingUsers.slice(0, 3).join(', ')}{existingUsers.length > 3 ? '...' : ''}</p>
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full neon-button"
                  disabled={isLoading || !username.trim()}
                >
                  {isLoading ? 'Signing In...' : 'Sign In to Chat'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
