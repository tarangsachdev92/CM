import React from 'react';
import styles from './ProfileSectionCards.module.scss';

interface ProfileSectionCardProps {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
}

const ProfileSectionCard: React.FC<ProfileSectionCardProps> = ({ icon, text, onClick }) => {
  return (
    <div className={styles['profile-section-card']}  onClick={onClick}>
      <div className={styles['profile-section-icon']}>{icon}</div>
      <div className={styles['profile-section-text']} >{text}</div>
    </div>
  );
};

export default ProfileSectionCard;
