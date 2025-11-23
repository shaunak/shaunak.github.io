import React from 'react';
import YourLoopsCard from './YourLoopsCard';
import ProfileCard from './ProfileCard';
import './DenLoop.css';

interface DenLoopHomeProps {
  profile: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
  };
  onSignOut: () => void;
  onEditProfile: () => void;
  loading: boolean;
}

function DenLoopHome({ profile, onSignOut, onEditProfile, loading }: DenLoopHomeProps) {
  const displayName = profile.full_name || profile.username || 'User';

  return (
    <div className="denLoop-container denLoop-home-container">
      <ProfileCard 
        displayName={displayName}
        onSignOut={onSignOut}
        onEditProfile={onEditProfile}
        loading={loading}
      />
      <YourLoopsCard profileId={profile.id} />
    </div>
  );
}

export default DenLoopHome;

