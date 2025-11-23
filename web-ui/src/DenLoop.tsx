import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import DenLoopHome from './DenLoopHome';
import ProfileSetup from './ProfileSetup';
import './DenLoop.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || '',
  process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ''
);

const isErrorMessage = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  return (
    message.includes('error') ||
    message.includes('Error') ||
    message.includes('Invalid') ||
    message.includes('Passwords do not match') ||
    lowerMessage.includes('failed') ||
    lowerMessage.includes('incorrect')
  );
};

function DenLoop() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else {
        setProfile(data || null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfileLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setProfileLoading(true);
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/denLoop`,
        },
      });

      if (error) throw error;

      if (data.user) {
        setMessage('Check your email for the confirmation link!');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      setMessage(error.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setMessage('Successfully signed in!');
      }
    } catch (error: any) {
      setMessage(error.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMessage(error.message);
    } else {
      setUser(null);
      setProfile(null);
      setMessage('Successfully signed out!');
    }
    setLoading(false);
  };

  const handleProfileCreated = () => {
    if (user) {
      setProfileLoading(true);
      setIsEditingProfile(false);
      fetchProfile(user.id);
    }
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  // Show loading state while checking for profile
  if (user && profileLoading) {
    return (
      <div className="denLoop-container">
        <div className="denLoop-card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in and editing profile, show profile setup
  if (user && isEditingProfile) {
    return (
      <ProfileSetup 
        userId={user.id}
        existingProfile={profile}
        onProfileCreated={handleProfileCreated}
      />
    );
  }

  // If user is logged in and has a profile, show home
  if (user && profile) {
    return (
      <DenLoopHome 
        profile={profile} 
        onSignOut={handleSignOut}
        onEditProfile={handleEditProfile}
        loading={loading}
      />
    );
  }

  // If user is logged in but no profile, show profile setup
  if (user && !profile) {
    return (
      <ProfileSetup 
        userId={user.id}
        onProfileCreated={handleProfileCreated}
      />
    );
  }

  return (
    <div className="denLoop-container">
      <div className="denLoop-card">
        <h1>{isSignUp ? 'Sign Up' : 'Sign In'}</h1>
        <p>DenLoop</p>
        
        <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
          <div className="denLoop-form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              className="denLoop-input"
            />
          </div>
          
          <div className="denLoop-form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="denLoop-input"
              minLength={6}
            />
          </div>

          {isSignUp && (
            <div className="denLoop-form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="denLoop-input"
                minLength={6}
              />
            </div>
          )}

          {message && (
            <div className={`denLoop-message ${
              isErrorMessage(message) 
                ? 'denLoop-message-error' 
                : 'denLoop-message-success'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="denLoop-button denLoop-button-primary"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="denLoop-toggle">
          <p>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage('');
                setConfirmPassword('');
              }}
              className="denLoop-link-button"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default DenLoop;

