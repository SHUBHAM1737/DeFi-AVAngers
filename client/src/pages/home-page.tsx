import React from 'react';
import AvalancheChat from '@/components/AvalancheChat';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0B1120]">
      <div className="transition-all duration-300">
        <AvalancheChat />
      </div>
    </div>
  );
}