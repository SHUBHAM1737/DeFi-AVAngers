import React, { useState } from 'react';
import { ChevronDown, Cpu, ArrowRightLeft, BarChart2, Network, Settings } from 'lucide-react';
import { SettingsDialog } from './SettingsDialog';

const agents = [
  {
    title: 'Portfolio Manager',
    type: 'Asset Intelligence Agent',
    description: 'AI-driven portfolio optimization and risk management',
    image: '/1.png',
    commands: [
      { label: "Risk Analysis", command: "Analyze my portfolio risk exposure" },
      { label: "Rebalance", command: "Suggest optimal portfolio rebalancing" },
      { label: "Yield Farming", command: "Find best yield opportunities" },
      { label: "Position Monitor", command: "Monitor all DeFi positions" }
    ]
  },
  {
    title: 'DeFi Navigator',
    type: 'Financial Intelligence Agent',
    description: 'Your autonomous guide for cross-chain DeFi operations and analytics',
    image: '/2.png',
    commands: [
      { label: "Token Swap", command: "Swap 100 USDC for ETH on Avalanche" },
      { label: "Token Bridge", command: "Bridge 50 USDC from Ethereum to Avalanche" },
      { label: "DeFi Deposit", command: "Deposit 100 USDC into Aave on Avalanche" },
      { label: "DeFi Withdraw", command: "Withdraw my USDC position from Aave" }
    ]
  },
  {
    title: 'Graph AI',
    type: 'Analytics Intelligence Agent',
    description: 'Deep insights through blockchain knowledge graph analysis',
    image: '/3.png',
    commands: [
      { label: "Pattern Detection", command: "Detect trading patterns in the last 24 hours" },
      { label: "Entity Analysis", command: "Analyze the ETH/USDC trading pair relationships" },
      { label: "Market Insights", command: "Query market trends for Avalanche DeFi" },
      { label: "Network Analysis", command: "Show related protocols for Aave lending" }
    ]
  },
  {
    title: 'Network Oracle',
    type: 'System Intelligence Agent',
    description: 'Advanced blockchain analytics and network optimization engine',
    image: '/4.png',
    commands: [
      { label: "Network Scanner", command: "Show supported networks" },
      { label: "Action Explorer", command: "Show available actions" },
      { label: "Test Token Request", command: "Get test tokens on Base Sepolia" }
    ]
  }
];

export default function AgentSidebar() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="w-80 bg-[#111927] border-r border-white/10">
      <div className="sticky top-0 z-20 p-4 border-b border-white/10 bg-[#151f2e]">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0,0,256,256" className="w-10 h-10">
              <g transform=""><g fill="#e84142" fillRule="nonzero" stroke="none" strokeWidth="1" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="10" strokeDasharray="" strokeDashoffset="0" fontFamily="none" fontWeight="none" fontSize="none" textAnchor="none" style={{mixBlendMode: "normal"}}><g transform="scale(5.12,5.12)"><path d="M25,1c-1.29724,0.00027 -2.37875,0.99272 -2.49023,2.28516l-15.25586,8.83398c-0.24372,-0.07807 -0.49799,-0.11825 -0.75391,-0.11914c-1.075,0.00112 -2.02893,0.68933 -2.36901,1.70912c-0.34008,1.01979 0.00985,2.14281 0.86901,2.78893v17.00586c-0.85747,0.64658 -1.20619,1.76856 -0.86632,2.78729c0.33987,1.01873 1.29239,1.70658 2.36632,1.70881c0.25647,-0.00006 0.51141,-0.03959 0.75586,-0.11719l15.25781,8.83398c0.1123,1.29017 1.19128,2.281 2.48633,2.2832c1.29724,-0.00027 2.37875,-0.99272 2.49023,-2.28516l15.25586,-8.83398c0.24372,0.07807 0.49799,0.11825 0.75391,0.11914c1.075,-0.00112 2.02893,-0.68933 2.36901,-1.70912c0.34008,-1.01979 -0.00985,-2.14281 -0.86901,-2.78893v-17.00586c0.85747,-0.64658 1.20619,-1.76856 0.86632,-2.78729c-0.33987,-1.01873 -1.29239,-1.70658 -2.36632,-1.70881c-0.25647,0.00006 -0.51141,0.03959 -0.75586,0.11719l-15.25781,-8.83398c-0.1123,-1.29017 -1.19128,-2.281 -2.48633,-2.2832zM22.27148,5.73633l-7.13672,12.39453l-6.13867,-3.55273c0.01117,-0.35814 -0.05477,-0.7145 -0.19336,-1.04492zM27.73047,5.73633l13.4668,7.79687c-0.13954,0.33088 -0.20615,0.68794 -0.19531,1.04688l-6.13477,3.55273zM24.46094,5.93945c0.17696,0.03967 0.35771,0.05998 0.53906,0.06055c0.18135,-0.00057 0.3621,-0.02087 0.53906,-0.06055l7.5957,13.19531l-6.6543,3.85156c-0.42907,-0.3157 -0.94777,-0.48609 -1.48047,-0.48633c-0.53225,0.00122 -1.05022,0.17228 -1.47852,0.48828l-6.65625,-3.85352zM8.13477,16.39063l6.00195,3.47461l-7.13672,12.39453v-15.31055c0.41988,-0.08585 0.81064,-0.27821 1.13477,-0.55859zM41.86719,16.39063c0.32378,0.27938 0.71381,0.47104 1.13281,0.55664v15.31445l-7.13477,-12.39648zM15.86719,20.86719l6.65234,3.85156c-0.12299,1.0886 0.47711,2.13047 1.48047,2.57031v7.71094h-15.05273c-0.08579,-0.42146 -0.27886,-0.81365 -0.56055,-1.13867zM34.13281,20.86719l7.48242,12.99414c-0.28169,0.32502 -0.47476,0.71722 -0.56055,1.13867h-15.05469v-7.71094c1.00412,-0.43921 1.6051,-1.48122 1.48242,-2.57031zM9.72266,37h14.27734v7.21094c-0.3097,0.13528 -0.58876,0.33195 -0.82031,0.57812zM26,37h14.27734l-13.45703,7.78906c-0.23155,-0.24617 -0.51061,-0.44284 -0.82031,-0.57812z"></path></g></g></g>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#E84142] tracking-tight">DeFi AVAnger</h2>
            <p className="text-sm text-white/70 font-medium">Autonomous DeFi Force</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {agents.map((agent, index) => (
          <div key={index} className="relative">
            <button
              onClick={() => setSelectedAgent(selectedAgent === agent.title ? null : agent.title)}
              className="w-full p-4 text-left transition-colors hover:bg-white/5 relative group"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  <img
                    src={agent.image}
                    alt={agent.title}
                    className="w-10 h-10 rounded-full ring-1 ring-white/10 relative z-10 transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-white truncate group-hover:text-[#E84142] transition-colors">{agent.title}</h3>
                    <ChevronDown
                      className={`w-4 h-4 text-white/40 transform transition-transform flex-none ${
                        selectedAgent === agent.title ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  <p className="text-sm text-[#E84142] font-medium truncate">{agent.type}</p>
                </div>
              </div>
              {!selectedAgent && (
                <p className="mt-2 text-sm text-white/80 line-clamp-2">{agent.description}</p>
              )}
            </button>

            {selectedAgent === agent.title && (
              <div className="bg-white/5 border-t border-white/5">
                <div className="p-4">
                  <p className="text-sm text-white/60">{agent.description}</p>
                </div>
                <div className="border-t border-white/5">
                  {agent.commands.map((cmd, idx) => (
                    <button
                      key={idx}
                      className="w-full px-4 py-2 text-left text-sm text-white/60 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors group"
                    >
                      <div className="p-1 rounded bg-[#E84142] opacity-75 group-hover:opacity-100 transition-opacity">
                        {agent.title === 'Knowledge Graph Explorer' ? (
                          <Network className="w-3 h-3 text-white" />
                        ) : (
                          <ArrowRightLeft className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="truncate">{cmd.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Settings Button */}
        <button
          className="w-full p-4 text-left transition-colors hover:bg-white/5 relative group flex items-center gap-3"
          onClick={() => setShowSettings(true)}
        >
          <div className="relative w-10 h-10 flex items-center justify-center bg-[#E84142]/10 rounded-full">
            <Settings className="w-6 h-6 text-[#E84142]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[#E84142] truncate">Platform Settings</h3>
            <p className="text-sm text-white/60">Configure platform keys and preferences</p>
          </div>
        </button>

        {/* Settings Dialog */}
        <SettingsDialog
          open={showSettings}
          onOpenChange={setShowSettings}
        />
      </div>
    </div>
  );
}