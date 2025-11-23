import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
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

interface ProfileSetupProps {
  userId: string;
  existingProfile?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
  } | null;
  onProfileCreated: () => void;
}

function ProfileSetup({ userId, existingProfile, onProfileCreated }: ProfileSetupProps) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (existingProfile) {
      setUsername(existingProfile.username || '');
      setFullName(existingProfile.full_name || '');
    }
  }, [existingProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let data, error;
      
      if (existingProfile) {
        // Update existing profile
        const result = await supabase
          .from('profiles')
          .update({
            username: username || null,
            full_name: fullName || null,
          })
          .eq('id', userId)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Create new profile
        const result = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: username || null,
            full_name: fullName || null,
          })
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      if (data) {
        onProfileCreated();
      }
    } catch (error: any) {
      setMessage(error.message || `An error occurred while ${existingProfile ? 'updating' : 'creating'} your profile`);
    } finally {
      setLoading(false);
    }
  };

  const isEditMode = !!existingProfile;

  return (
    <div className="denLoop-container">
      <div className="denLoop-card">
        <h1>{isEditMode ? 'Edit Profile' : 'Tell us about yourself'}</h1>
        <p>{isEditMode ? 'Update your profile information' : 'Complete your profile to get started'}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="denLoop-form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              className="denLoop-input"
              required
            />
          </div>

          <div className="denLoop-form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="denLoop-input"
              required
            />
          </div>

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
            {loading 
              ? (isEditMode ? 'Updating profile...' : 'Creating profile...') 
              : (isEditMode ? 'Update Profile' : 'Create Profile')
            }
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfileSetup;

