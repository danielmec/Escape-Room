import { useEffect } from 'react';
import socket from './socket';

const useLeaveLobbyOnBack = () => {
  useEffect(() => {
    const handlePopState = () => {
      socket.emit('leaveLobby');
    };

    const handleBeforeUnload = () => {
      socket.emit('leaveLobby');
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
};

export default useLeaveLobbyOnBack;