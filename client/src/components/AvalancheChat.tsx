// Same content as SonicChat.tsx but rename the component
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SystemEvent, WebSocketMessage } from '../types/agent';
import AgentSidebar from './AgentSidebar';
import SystemEvents from './SystemEvents';
import { Send, Loader2 } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';

export default function AvalancheChat() {
  // Rest of the component implementation remains the same
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket Connected');
      addSystemEvent('WebSocket connection established', 'success');
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);

        if (data.type === 'response') {
          const response = data.data as any;
          const agentMessage: ChatMessage = {
            type: 'agent',
            content: response.response,
            timestamp: new Date().toLocaleTimeString(),
            metadata: {
              agentType: response.agentType,
              subType: response.subType,
              details: response.details
            }
          };
          setMessages(prev => [...prev, agentMessage]);

          if (response.agentType === 'analytics') {
            addSystemEvent(`Analytics ${response.subType} completed`, 'success', {
              type: 'analytics',
              details: `Processed ${response.subType} analysis`
            });
          }
        } else if (data.type === 'error') {
          const errorData = data.data as { error: string };
          const errorMessage: ChatMessage = {
            type: 'error',
            content: errorData.error,
            timestamp: new Date().toLocaleTimeString(),
          };
          setMessages(prev => [...prev, errorMessage]);
          addSystemEvent(errorData.error, 'error');
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        addSystemEvent('Error processing response', 'error');
        setIsLoading(false);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      addSystemEvent('WebSocket connection closed', 'error');
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      addSystemEvent('WebSocket error occurred', 'error');
    };

    setWsConnection(ws);

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !wsConnection) return;

    const userMessage: ChatMessage = {
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      wsConnection.send(JSON.stringify({
        type: 'request',
        content: inputMessage
      }));
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        type: 'error',
        content: error instanceof Error ? error.message : 'Failed to send message',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, errorMessage]);
      addSystemEvent('Error sending message', 'error');
      setIsLoading(false);
    }
  };

  const addSystemEvent = (message: string, type: 'info' | 'success' | 'error', metadata?: SystemEvent['metadata']) => {
    setSystemEvents(prev => [...prev, {
      message,
      timestamp: new Date().toLocaleTimeString(),
      type,
      metadata
    }]);
  };

  return (
    <div className="flex h-screen text-white relative">
      <AgentSidebar />

      <div className="flex-1 flex flex-col bg-[#0B1120] relative">
        {/* Avalanche Logo Background */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.15] mix-blend-soft-light select-none">
          <svg width="600" height="600" viewBox="0 0 1503 1504" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-w-full max-h-full">
            <path d="M538.688 1050.86H392.94C362.314 1050.86 347.186 1050.86 337.962 1044.96C327.999 1038.5 321.911 1027.8 321.173 1015.99C320.619 1005.11 328.184 991.822 343.312 965.255L703.182 330.935C718.495 303.999 726.243 290.531 736.021 285.55C746.537 280.2 759.083 280.2 769.599 285.55C779.377 290.531 787.126 303.999 802.438 330.935L876.42 460.079L876.797 460.738C893.336 489.635 901.723 504.289 905.385 519.669C909.443 536.458 909.443 554.169 905.385 570.958C901.695 586.455 893.393 601.215 876.604 630.549L687.573 964.702L687.084 965.558C670.436 994.693 661.999 1009.46 650.306 1020.6C637.576 1032.78 622.263 1041.63 605.474 1046.62C590.161 1050.86 573.004 1050.86 538.688 1050.86ZM906.75 1050.86H1115.59C1146.4 1050.86 1161.9 1050.86 1171.13 1044.78C1181.09 1038.32 1187.36 1027.43 1187.92 1015.63C1188.45 1005.1 1181.05 992.33 1166.55 967.307C1166.05 966.455 1165.55 965.588 1165.04 964.706L1060.43 785.75L1059.24 783.735C1044.54 758.877 1037.12 746.324 1027.59 741.472C1017.08 736.121 1004.71 736.121 994.199 741.472C984.605 746.453 976.857 759.552 961.544 785.934L857.306 964.891L856.949 965.507C841.69 991.847 834.064 1005.01 834.614 1015.81C835.352 1027.62 841.44 1038.5 851.402 1044.96C860.443 1050.86 875.94 1050.86 906.75 1050.86Z" fill="white"/>
          </svg>
        </div>

        <div className="flex-1 overflow-y-auto p-6 relative z-10">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-4 ${
                  message.type === 'user' ? 'justify-end' : ''
                }`}
              >
                {message.type !== 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-[#E84142] flex items-center justify-center">
                    <div className="text-sm font-semibold">A</div>
                  </div>
                )}
                <div className={`max-w-[80%] ${message.type === 'user' ? 'ml-auto' : ''}`}>
                  <div className={`rounded-lg p-4 ${
                    message.type === 'user'
                      ? 'bg-[#E84142] text-white'
                      : message.type === 'error'
                      ? 'bg-red-500/20 border border-red-500/20'
                      : 'bg-white/10'
                  }`}>
                    <div className="text-sm font-mono tracking-tighter">{message.content}</div>
                    {message.metadata && (
                      <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2 text-xs text-white/60">
                        <span>{message.metadata.agentType}</span>
                        <span>→</span>
                        <span>{message.metadata.subType}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-white/40 px-1">
                    {message.timestamp}
                  </div>
                </div>
                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-[#4169E1] flex items-center justify-center">
                    <div className="text-sm font-semibold">U</div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <p className="text-sm">Processing Request</p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-white/10 bg-[#0D1424] p-4 relative z-10">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 bg-[#151f2e] h-11 px-4 text-sm text-white placeholder-white/40 focus:outline-none rounded-lg border border-white/10 focus:border-[#E84142]"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="bg-[#E84142] hover:bg-[#E84142]/90 text-white h-11 px-6 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[100px]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    <span className="leading-none">Send</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <SystemEvents events={systemEvents} />
    </div>
  );
}
