import React from 'react';
import './DenLoop.css';

interface WelcomeCardProps {
  displayName: string;
}

function WelcomeCard({ displayName }: WelcomeCardProps) {
  return (
    <div className="denLoop-card">
      <h1>Greetings, {displayName.split(' ')[0]}!</h1>
    </div>
  );
}

export default WelcomeCard;

