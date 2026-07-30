import React from 'react';
import { useNotificationStore } from '../../context/store';

const Notification: React.FC = () => {
  const { message, color } = useNotificationStore();

  return (
    <div
      className={`notif ${message ? 'show' : ''}`}
      style={{
        background: color,
        color: color === 'var(--cr)' ? 'var(--bg)' : '#fff',
      }}
    >
      {message}
    </div>
  );
};

export default Notification;
