import { useEffect } from 'react';

import io from 'socket.io-client';

const useProjectSocket = (
  projectId,
  onTaskUpdated,
  onTaskCreated
) => {
  useEffect(() => {
    const socket = io(
      import.meta.env.VITE_SOCKET_URL
    );

    socket.emit(
      'joinProject',
      projectId
    );

    socket.on(
      'taskUpdated',
      onTaskUpdated
    );

    socket.on(
      'taskCreated',
      onTaskCreated
    );

    return () => {
      socket.disconnect();
    };
  }, [
    projectId,
    onTaskUpdated,
    onTaskCreated
  ]);
};

export default useProjectSocket;