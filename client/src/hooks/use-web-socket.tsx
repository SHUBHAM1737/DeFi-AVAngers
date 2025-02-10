import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface WebSocketHookOptions {
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
  onOpen?: () => void;
}

export function useWebSocket(options: WebSocketHookOptions = {}) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const MAX_RETRIES = 3;
  const RETRY_INTERVAL = 5000;

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      if (retryCount >= MAX_RETRIES) {
        toast({
          title: 'Connection Failed',
          description: 'Maximum retry attempts reached. Please refresh the page.',
          variant: 'destructive',
        });
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        setRetryCount(0);
        toast({
          title: 'Connected',
          description: 'Real-time updates are now enabled',
        });

        // Send authentication message
        if (user) {
          ws.send(JSON.stringify({
            type: 'auth',
            userId: user.id,
          }));
        }

        options.onOpen?.();
      };

      ws.onclose = () => {
        setIsConnected(false);
        setSocket(null);

        // Only attempt reconnection if we have a user
        if (user) {
          toast({
            title: 'Connection Lost',
            description: 'Attempting to reconnect...',
            variant: 'destructive',
          });

          setRetryCount(prev => prev + 1);
          reconnectTimeout = setTimeout(connectWebSocket, RETRY_INTERVAL);
        }

        options.onClose?.();
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        options.onError?.(error);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          options.onMessage?.(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      setSocket(ws);
    };

    // Only connect if we have a user
    if (user) {
      connectWebSocket();
    }

    return () => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [user]); // Reconnect when user changes

  const sendMessage = useCallback((data: any) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to use this feature',
        variant: 'destructive',
      });
      return;
    }

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        ...data,
        userId: user.id,
      }));
    } else {
      toast({
        title: 'Connection Error',
        description: 'Attempting to reconnect...',
        variant: 'destructive',
      });
    }
  }, [socket, user]);

  return {
    isConnected,
    sendMessage,
    authenticated: !!user,
  };
}