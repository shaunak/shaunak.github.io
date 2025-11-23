import React from 'react';
import './DenLoop.css';

interface ProfileCardProps {
  displayName: string;
  onSignOut: () => void;
  onEditProfile: () => void;
  loading: boolean;
}

function ProfileCard({ displayName, onSignOut, onEditProfile, loading }: ProfileCardProps) {
  return (
    <div className="denLoop-card">
      <h1>Greetings, {displayName.split(' ')[0]}!</h1>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-start', marginTop: '1rem' }}>
        <button 
          onClick={onEditProfile}
          disabled={loading}
          className="denLoop-button denLoop-button-secondary denLoop-button-small"
        >
          Edit Profile
        </button>
        <button 
          onClick={onSignOut} 
          disabled={loading}
          className="denLoop-button denLoop-button-secondary denLoop-button-small"
        >
          {loading ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </div>
  );
}

export default ProfileCard;

