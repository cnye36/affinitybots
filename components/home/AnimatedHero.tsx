import React, { useEffect, useState } from 'react';

const ORCHESTRATOR = {
  x: 50,
  y: 58,
  name: 'Orchestrator',
  role: 'Workflow Manager',
  icon: '🤖',
  color: 'from-sky-500 to-indigo-500',
};

const BASE_AGENTS = [
  { id: 0, name: 'Researcher', role: 'Data Agent', color: 'from-purple-500 to-pink-500', icon: '🔍' },
  { id: 1, name: 'Analyzer', role: 'AI Agent', color: 'from-emerald-500 to-teal-500', icon: '🧠' },
  { id: 2, name: 'Writer', role: 'Content Agent', color: 'from-orange-500 to-red-500', icon: '✍️' },
  { id: 3, name: 'Reviewer', role: 'Quality Agent', color: 'from-indigo-500 to-purple-500', icon: '✓' },
  { id: 4, name: 'Publisher', role: 'Output Agent', color: 'from-yellow-400 to-orange-500', icon: '🚀' },
];

const AnimatedWorkflowHero = () => {
  const [activeAgentIndex, setActiveAgentIndex] = useState(0);

  // Position agents around the orbit ring with precise angle calculations
  // Using radius 36 to match the SVG circle exactly
  const radius = 36;
  const agentAngles = [
    -90,  // Researcher: top (12 o'clock)
    -30,  // Analyzer: top-right (1-2 o'clock)
    45,   // Writer: right (2-3 o'clock)
    130,  // Reviewer: bottom-left (7-8 o'clock)
    210,  // Publisher: bottom (8 o'clock)
  ];

  const agents = BASE_AGENTS.map((agent, index) => {
    const angleInDegrees = agentAngles[index];
    const angle = (angleInDegrees * Math.PI) / 180;
    const x = ORCHESTRATOR.x + radius * Math.cos(angle);
    const y = ORCHESTRATOR.y + radius * Math.sin(angle);
    return { ...agent, x, y };
  });

  useEffect(() => {
    // Simple cycle: Orchestrator → Agent 0 → Agent 1 → Agent 2 → ...
    const interval = setInterval(() => {
      setActiveAgentIndex((prev) => (prev + 1) % agents.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [agents.length]);

  return (
    <div className="relative w-full h-[420px] sm:h-[460px] md:h-[480px] lg:h-[500px] hidden md:flex items-center justify-center">
      {/* Orchestrator + agent connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.9" />
            <stop offset="50%" stopColor="rgb(168, 85, 247)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="rgb(236, 72, 153)" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Animated orbit ring with pulsing effect */}
        <circle
          cx={ORCHESTRATOR.x}
          cy={ORCHESTRATOR.y}
          r={radius}
          stroke="rgba(148,163,184,0.25)"
          strokeWidth="0.4"
          fill="none"
          strokeDasharray="2 2"
        >
          <animate
            attributeName="r"
            values="36;37;36"
            dur="4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.25;0.4;0.25"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>
        {/* Rotating dashed ring for movement effect - slow clockwise rotation */}
        <circle
          cx={ORCHESTRATOR.x}
          cy={ORCHESTRATOR.y}
          r={radius}
          stroke="rgba(56,189,248,0.3)"
          strokeWidth="0.5"
          fill="none"
          strokeDasharray="3 6"
          strokeDashoffset="0"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={`0 ${ORCHESTRATOR.x} ${ORCHESTRATOR.y};360 ${ORCHESTRATOR.x} ${ORCHESTRATOR.y}`}
            dur="40s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.3;0.5;0.3"
            dur="6s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Radial connections */}
        {agents.map((agent, index) => {
          // Agent is active during both sending and receiving phases
          const isActive = index === activeAgentIndex;
          const fromX = ORCHESTRATOR.x;
          const fromY = ORCHESTRATOR.y;
          const toX = agent.x;
          const toY = agent.y;

          return (
            <g key={agent.id}>
              {/* Base line */}
              <line
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke="rgba(148,163,184,0.4)"
                strokeWidth={isActive ? 0.6 : 0.35}
                className="transition-all duration-500"
              />

              {/* Highlighted gradient line for the active agent */}
              <line
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke="url(#gradient)"
                strokeWidth={1}
                strokeLinecap="round"
                className={`transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}
              />
            </g>
          );
        })}
      </svg>

      {/* Orchestrator node in the center */}
      <div
        className="absolute transition-all duration-500 ease-out"
        style={{
          left: `${ORCHESTRATOR.x}%`,
          top: `${ORCHESTRATOR.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="relative bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-sky-400/60 shadow-[0_0_30px_rgba(56,189,248,0.45)] w-[110px] md:w-[115px]">
          <div className={`bg-gradient-to-r ${ORCHESTRATOR.color} p-2.5 rounded-t-xl text-xl text-center`}>
            {ORCHESTRATOR.icon}
          </div>
          <div className="p-2.5 text-center">
            <div className="font-semibold text-white text-xs">{ORCHESTRATOR.name}</div>
            <div className="text-[11px] text-slate-300 mt-1">{ORCHESTRATOR.role}</div>
            <div className="flex items-center justify-center gap-1 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
              <span className="text-[11px] text-emerald-300">Coordinating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent nodes around the circle */}
      {agents.map((agent, index) => {
        const isActive = index === activeAgentIndex;
        const scale = isActive ? 1.05 : 1;

        return (
          <div
            key={agent.id}
            className="absolute transition-all duration-500 ease-out"
            style={{
              left: `${agent.x}%`,
              top: `${agent.y}%`,
              transform: `translate(-50%, -50%) scale(${scale})`,
            }}
          >
            {isActive && (
              <div className={`absolute inset-0 rounded-2xl blur-xl bg-gradient-to-r ${agent.color} opacity-40 animate-pulse`} />
            )}

            <div
              className={`relative bg-slate-900/90 backdrop-blur-sm rounded-2xl border transition-all duration-500 ${
                isActive ? 'border-sky-400 shadow-[0_0_24px_rgba(56,189,248,0.5)]' : 'border-slate-700/70'
              } w-[120px] md:w-[125px]`}
            >
              <div className={`bg-gradient-to-r ${agent.color} px-3 py-2 rounded-t-xl text-xl text-center`}>
                {agent.icon}
              </div>
              <div className="p-3 text-center">
                <div className="font-semibold text-white text-xs">{agent.name}</div>
                <div className="text-[11px] text-slate-400 mt-1">{agent.role}</div>
                {isActive && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] text-emerald-300">Running</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Compact status pill (keep "Live • 6 agents • 6 links") */}
      <div className="absolute top-4 right-4 hidden md:flex items-center gap-3 bg-slate-950/40 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10 shadow-lg">
        <span className="inline-flex items-center gap-2 text-xs text-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)]" />
          Live
        </span>
        <span className="h-4 w-px bg-white/10" />
        <span className="text-xs text-slate-300 tabular-nums">
          <span className="font-semibold text-emerald-300">6</span> agents
        </span>
        <span className="text-xs text-slate-300 tabular-nums">
          <span className="font-semibold text-sky-300">6</span> links
        </span>
      </div>

    </div>
  );
};

export default AnimatedWorkflowHero;