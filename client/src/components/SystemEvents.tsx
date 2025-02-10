import React from 'react';
import { SystemEvent } from '../types/agent';
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Workflow, 
  Network, 
  BarChart4, 
  ArrowRightLeft 
} from 'lucide-react';
import SystemLoader from './SystemLoader';

interface SystemEventsProps {
  events: SystemEvent[];
}

export default function SystemEvents({ events }: SystemEventsProps) {
  const getEventIcon = (type: 'info' | 'success' | 'error', subType?: string) => {
    if (type === 'error') return <AlertCircle className="w-4 h-4 text-red-400" />;
    if (type === 'success') return <CheckCircle className="w-4 h-4 text-green-400" />;

    switch (subType) {
      case 'bridge':
        return <ArrowRightLeft className="w-4 h-4 text-[#E84142]" />;
      case 'allora':
        return <BarChart4 className="w-4 h-4 text-[#E84142]" />;
      case 'network':
        return <Network className="w-4 h-4 text-[#E84142]" />;
      case 'defi':
        return <Workflow className="w-4 h-4 text-[#E84142]" />;
      default:
        return <Info className="w-4 h-4 text-[#E84142]" />;
    }
  };

  return (
    <div className="w-80 bg-[#111927] border-l border-white/10">
      <div className="sticky top-0 z-20 p-4 border-b border-white/10 bg-[#151f2e]">
        <div className="flex items-center gap-3">
          <Network className="w-5 h-5 text-[#E84142]" />
          <div>
            <h2 className="text-lg font-medium text-white">System Events</h2>
            <p className="text-sm text-white/60">AI Agent Activity Logs</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {events.map((event, index) => (
          <div
            key={index}
            className={`p-4 ${
              event.type === 'error'
                ? 'bg-red-950/30 border-l-2 border-l-red-500'
                : event.type === 'success'
                ? 'bg-emerald-950/30 border-l-2 border-l-emerald-500'
                : 'hover:bg-white/5'
            }`}
          >
            <div className="flex items-start gap-3">
              {getEventIcon(event.type, event.metadata?.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-white/90">{event.message}</p>
                </div>
                {event.metadata?.details && (
                  <div className="mt-2 text-xs text-white/60 font-mono">
                    {`> ${event.metadata.details}`}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                  {event.metadata?.type && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-[#E84142]/20 text-[#E84142]">
                      {event.metadata.type}
                    </span>
                  )}
                  <span className="text-xs text-white/40">
                    {event.timestamp}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
            <div className="transform scale-125 mb-6">
              <SystemLoader />
            </div>
            <h3 className="text-lg font-semibold text-white mt-4">System Initialization</h3>
            <p className="text-sm text-white/60 mt-2 text-center">
              Establishing secure blockchain connection...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}