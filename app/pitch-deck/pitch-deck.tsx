import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function PitchDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "AffinityBots",
      content: (
        <div className="h-full flex items-center justify-center px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full max-w-7xl">
            <div className="text-center md:text-left">
              <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                AffinityBots
              </h1>
              <p className="text-3xl mb-4 text-gray-300">Don&apos;t Hire... Create!</p>
              <p className="text-xl text-gray-400 mb-8">
                Build custom AI agents and agent teams in minutes—no coding required
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 justify-center md:justify-start">
                <div>Early Stage • Seeking Seed Funding</div>
                <div>•</div>
                <div>Beta Launch: Q4 2025</div>
              </div>
            </div>
            <div className="flex justify-center items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-3xl rounded-full"></div>
                <img 
                  src="/images/Four-bots.png" 
                  alt="Four AI Agent Bots" 
                  className="relative w-full max-w-md mx-auto drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "The Problem",
      content: (
        <div className="h-full flex items-center px-12">
          <div className="w-1/2 pr-8">
            <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop" alt="Overwhelmed business person" className="rounded-lg shadow-2xl" />
          </div>
          <div className="w-1/2">
            <div className="space-y-8">
              <div className="border-l-4 border-red-500 pl-6">
                <h3 className="text-2xl font-bold text-red-400 mb-2">Small Teams, Big Workload</h3>
                <p className="text-gray-300">Solo founders and small teams drown in operational tasks that pull them away from core business activities</p>
              </div>
              
              <div className="border-l-4 border-orange-500 pl-6">
                <h3 className="text-2xl font-bold text-orange-400 mb-2">Tool Fragmentation</h3>
                <p className="text-gray-300">Existing AI tools are siloed—requiring multiple subscriptions, complex integrations, and constant context-switching</p>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-6">
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">The Hiring Paradox</h3>
                <p className="text-gray-300">Cannot afford to hire help, but cannot scale without it. Traditional automation is too rigid and expensive</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Why Now?",
      content: (
        <div className="h-full flex flex-col justify-center px-12">
          <h2 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            The Perfect Storm for AI-First Businesses
          </h2>
          
          <div className="grid grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-purple-900/30 to-purple-600/10 p-8 rounded-xl border border-purple-500/20">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold mb-3 text-purple-300">Solo Revolution</h3>
              <p className="text-gray-300">AI enables single developers to build what once required entire teams. The era of the solo unicorn founder is here.</p>
            </div>

            <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-600/10 p-8 rounded-xl border border-cyan-500/20">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-2xl font-bold mb-3 text-cyan-300">Capital Efficiency</h3>
              <p className="text-gray-300">Build MVPs for under $10K instead of $100K+. Investors get more runway and faster validation with AI-native teams.</p>
            </div>

            <div className="bg-gradient-to-br from-pink-900/30 to-pink-600/10 p-8 rounded-xl border border-pink-500/20">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold mb-3 text-pink-300">Speed to Market</h3>
              <p className="text-gray-300">Launch in weeks, not months. AI agents handle customer support, sales, ops from day one—no hiring delay.</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-2xl text-gray-400 italic">
              &quot;The best time to invest in AI infrastructure was yesterday. The second best time is now.&quot;
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Our Solution",
      content: (
        <div className="h-full flex flex-col justify-center px-12">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-cyan-300">The AI Workforce Platform</h2>
              <p className="text-xl text-gray-300 mb-8">
                AffinityBots is the operating system for your AI workforce. Build specialized agents for any role, coordinate them into teams, and deploy them anywhere your business needs them.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">No-Code Builder</h3>
                    <p className="text-gray-400">Visual interface for creating and customizing AI agents</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🔗</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">70+ Integrations</h3>
                    <p className="text-gray-400">Connect to Slack, Google, GitHub, and more via MCP</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🤝</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Team Orchestration</h3>
                    <p className="text-gray-400">Multiple agents work together on complex workflows</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-slate-700">
              <h3 className="text-2xl font-bold mb-6 text-center text-purple-300">Internal & External Agents</h3>
              
              <div className="space-y-6">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="font-bold text-cyan-300 mb-2">Private Assistants</h4>
                  <p className="text-sm text-gray-300">Work alongside you for research, data analysis, task management</p>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="font-bold text-pink-300 mb-2">Customer-Facing Agents</h4>
                  <p className="text-sm text-gray-300">Deploy to website, social media for 24/7 customer engagement</p>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="font-bold text-purple-300 mb-2">Specialized Teams</h4>
                  <p className="text-sm text-gray-300">Multiple agents collaborate on complex multi-step workflows</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Key Features",
      content: (
        <div className="h-full flex items-center px-12">
          <div className="w-full grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-900/40 to-slate-800 p-6 rounded-xl border border-purple-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-xl">👥</span>
                  </div>
                  <h3 className="text-xl font-bold text-purple-300">Team Orchestration</h3>
                </div>
                <p className="text-gray-300">Coordinate multiple agents for complex, multi-step workflows</p>
              </div>

              <div className="bg-gradient-to-br from-cyan-900/40 to-slate-800 p-6 rounded-xl border border-cyan-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🎨</span>
                  </div>
                  <h3 className="text-xl font-bold text-cyan-300">No-Code Builder</h3>
                </div>
                <p className="text-gray-300">Create custom automation flows without technical expertise</p>
              </div>

              <div className="bg-gradient-to-br from-pink-900/40 to-slate-800 p-6 rounded-xl border border-pink-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🏪</span>
                  </div>
                  <h3 className="text-xl font-bold text-pink-300">Agent Marketplace</h3>
                </div>
                <p className="text-gray-300">Access industry-specific templates and pre-built configurations</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-900/40 to-slate-800 p-6 rounded-xl border border-green-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-xl">⚡</span>
                  </div>
                  <h3 className="text-xl font-bold text-green-300">One-Click Deployment</h3>
                </div>
                <p className="text-gray-300">Monitor performance through comprehensive analytics dashboard</p>
              </div>

              <div className="bg-gradient-to-br from-orange-900/40 to-slate-800 p-6 rounded-xl border border-orange-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🧠</span>
                  </div>
                  <h3 className="text-xl font-bold text-orange-300">Knowledge Integration</h3>
                </div>
                <p className="text-gray-300">Equip agents with documents, websites, and custom data sources</p>
              </div>

              <div className="bg-gradient-to-br from-blue-900/40 to-slate-800 p-6 rounded-xl border border-blue-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🔗</span>
                  </div>
                  <h3 className="text-xl font-bold text-blue-300">70+ Integrations</h3>
                </div>
                <p className="text-gray-300">Powered by MCP servers for limitless extensibility</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Competitive Landscape",
      content: (
        <div className="h-full flex flex-col justify-center px-12">
          <h2 className="text-4xl font-bold mb-8 text-center text-cyan-300">
            We&apos;re Not Competing—We&apos;re Completing
          </h2>
          
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-xl font-bold mb-3 text-gray-300">ChatGPT/Claude</h3>
              <div className="text-sm space-y-2 text-gray-400">
                <div>✅ Great for conversations</div>
                <div>✅ Integration</div>
                <div>❌ No automation</div>
                <div>❌ No deployment options</div>
                <div>❌ Confined to providers models</div>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-xl font-bold mb-3 text-gray-300">Zapier/Make</h3>
              <div className="text-sm space-y-2 text-gray-400">
                <div>✅ Good integrations</div>
                <div>✅ Some AI reasoning</div>
                <div>❌ Rule-based only</div>
                <div>❌ Limited by triggers</div>
                <div>❌ Too complex for most</div>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-xl font-bold mb-3 text-gray-300">Custom Development</h3>
              <div className="text-sm space-y-2 text-gray-400">
                <div>✅ Fully customizable</div>
                <div>✅ Any Provider/Model</div>
                <div>❌ Takes much longer</div>
                <div>❌ Expensive ($10K+)</div>
                <div>❌ Requires coding experience</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/40 via-cyan-900/30 to-pink-900/40 p-8 rounded-xl border-2 border-cyan-500/50">
            <h3 className="text-2xl font-bold mb-4 text-center text-white">AffinityBots: The Best of All Worlds</h3>
            <div className="grid grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-3xl mb-2">🤖</div>
                <div className="text-sm font-bold text-cyan-300">AI-Powered</div>
                <div className="text-xs text-gray-400">Intelligent reasoning</div>
              </div>
              <div>
                <div className="text-3xl mb-2">🔗</div>
                <div className="text-sm font-bold text-purple-300">Integrated</div>
                <div className="text-xs text-gray-400">70+ platforms</div>
              </div>
              <div>
                <div className="text-3xl mb-2">🤝</div>
                <div className="text-sm font-bold text-blue-300">Model Agnostic</div>
                <div className="text-xs text-gray-400">Integrate with any model</div>
              </div>
              <div>
                <div className="text-3xl mb-2">⚡</div>
                <div className="text-sm font-bold text-pink-300">No-Code</div>
                <div className="text-xs text-gray-400">Anyone can build</div>
              </div>
              <div>
                <div className="text-3xl mb-2">🚀</div>
                <div className="text-sm font-bold text-green-300">Deploy Anywhere</div>
                <div className="text-xs text-gray-400">Internal or external</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Market Opportunity",
      content: (
        <div className="h-full flex items-center px-12">
          <div className="w-1/2 pr-8">
            <div className="relative h-96">
              <div className="absolute bottom-0 left-0 w-24 h-48 bg-gradient-to-t from-cyan-500 to-cyan-600 rounded-t-lg flex flex-col justify-end items-center p-4">
                <div className="text-white font-bold text-sm mb-2">$8B</div>
                <div className="text-white text-xs text-center">2022</div>
              </div>
              <div className="absolute bottom-0 left-32 w-24 h-64 bg-gradient-to-t from-cyan-400 to-cyan-500 rounded-t-lg flex flex-col justify-end items-center p-4">
                <div className="text-white font-bold text-sm mb-2">$16B</div>
                <div className="text-white text-xs text-center">2024</div>
              </div>
              <div className="absolute bottom-0 left-64 w-24 h-96 bg-gradient-to-t from-cyan-300 to-cyan-400 rounded-t-lg flex flex-col justify-end items-center p-4">
                <div className="text-white font-bold text-sm mb-2">$22B+</div>
                <div className="text-white text-xs text-center">2026</div>
              </div>
            </div>
          </div>

          <div className="w-1/2 space-y-6">
            <h2 className="text-3xl font-bold mb-6 text-cyan-300">Massive Growth Potential</h2>
            
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <div className="text-4xl font-bold text-cyan-400 mb-2">$22B+</div>
              <p className="text-gray-300">Global workflow automation market by 2026</p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <div className="text-4xl font-bold text-purple-400 mb-2">70%</div>
              <p className="text-gray-300">Of companies now prioritize AI productivity tools</p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <div className="text-4xl font-bold text-pink-400 mb-2">Rising</div>
              <p className="text-gray-300">Demand for specialized collaborative AI agents</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Team",
      content: (
        <div className="h-full flex flex-col justify-center px-8 py-4">
          <h2 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            The AI-First Team
          </h2>
          
          <p className="text-lg text-center text-gray-400 mb-6 max-w-3xl mx-auto">
            Built in the era we&apos;re building for. One founder + AI teammates represents the new paradigm: lean, capital-efficient, and infinitely scalable.
          </p>

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-900/40 to-slate-800 p-6 rounded-xl border-2 border-purple-500/50 relative">
              <div className="absolute -top-2 -right-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                FOUNDER
              </div>
              <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden">
                <img 
                  src="/images/curtis-profile-image-1.png" 
                  alt="Curtis - Founder" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-lg font-bold text-center text-white mb-1">Curtis Nye</h3>
              <p className="text-center text-purple-300 mb-3 text-sm">Solo Founder & Developer</p>
              <div className="space-y-1 text-xs text-gray-300">
                <div>✓ Full-stack developer</div>
                <div>✓ AI/ML enthusiast</div>
                <div>✓ Product visionary</div>
                <div>✓ Proven executor</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-900/40 to-slate-800 p-6 rounded-xl border-2 border-cyan-500/50 relative">
              <div className="absolute -top-2 -right-2 bg-cyan-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                AI DEV
              </div>
              <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center">
                <img 
                  src="/integration-icons/Cursor-logo.png" 
                  alt="Cursor AI" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-lg font-bold text-center text-white mb-1">Cursor</h3>
              <p className="text-center text-cyan-300 mb-3 text-sm">AI Development Partner</p>
              <div className="space-y-1 text-xs text-gray-300">
                <div>✓ 10x development speed</div>
                <div>✓ 24/7 pair programming</div>
                <div>✓ Code review & debugging</div>
                <div>✓ Architecture guidance</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-pink-900/40 to-slate-800 p-6 rounded-xl border-2 border-pink-500/50 relative">
              <div className="absolute -top-2 -right-2 bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                AI ANALYST
              </div>
              <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center">
                <img 
                  src="/integration-icons/Perplexity-logo-turquoise.png" 
                  alt="Perplexity" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-lg font-bold text-center text-white mb-1">Perplexity</h3>
              <p className="text-center text-pink-300 mb-3 text-sm">Market Intelligence</p>
              <div className="space-y-1 text-xs text-gray-300">
                <div>✓ Market research</div>
                <div>✓ Competitive analysis</div>
                <div>✓ Customer insights</div>
                <div>✓ Content creation</div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-gradient-to-r from-purple-900/30 via-cyan-900/30 to-pink-900/30 p-4 rounded-xl border border-purple-500/30">
            <p className="text-center text-sm text-gray-300">
              <span className="font-bold text-white">The paradox:</span> We&apos;re proving solo founders can build the future by building tools that enable solo founders to build the future. 
              <span className="text-cyan-400 font-bold"> This is the team structure of tomorrow.</span>
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Current Status",
      content: (
        <div className="h-full flex flex-col justify-center px-8 py-4">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-4 text-cyan-300">Where We Are Today</h2>
              
              <div className="space-y-3">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-lg">✅</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">MVP Built</h3>
                  </div>
                  <p className="text-gray-400 text-xs">Core platform functional with agent creation and deployment</p>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                      <span className="text-lg">👥</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">Early Beta</h3>
                  </div>
                  <p className="text-gray-400 text-xs">Small cohort of test users providing feedback</p>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🎯</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">Pre-Revenue</h3>
                  </div>
                  <p className="text-gray-400 text-xs">Focused on product-market fit</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4 text-purple-300">12-Month Vision</h2>
              
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-purple-900/30 to-slate-800 p-4 rounded-xl border border-purple-500/30">
                  <div className="text-2xl font-bold text-purple-400 mb-1">1,000+</div>
                  <p className="text-gray-300 text-sm">Active users building AI workforces</p>
                </div>

                <div className="bg-gradient-to-br from-cyan-900/30 to-slate-800 p-4 rounded-xl border border-cyan-500/30">
                  <div className="text-2xl font-bold text-cyan-400 mb-1">$50K</div>
                  <p className="text-gray-300 text-sm">MRR from Pro and Enterprise tiers</p>
                </div>

                <div className="bg-gradient-to-br from-pink-900/30 to-slate-800 p-4 rounded-xl border border-pink-500/30">
                  <div className="text-2xl font-bold text-pink-400 mb-1">100+</div>
                  <p className="text-gray-300 text-sm">Pre-built workflow templates</p>
                </div>

                <div className="bg-gradient-to-br from-green-900/30 to-slate-800 p-4 rounded-xl border border-green-500/30">
                  <div className="text-2xl font-bold text-green-400 mb-1">Launch</div>
                  <p className="text-gray-300 text-sm">Mobile app and enterprise features</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Business Model",
      content: (
        <div className="h-full flex flex-col justify-center px-8 py-4">
          <h2 className="text-3xl font-bold mb-6 text-center text-cyan-300">
            Multiple Revenue Streams
          </h2>

          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border-2 border-cyan-500/50">
              <div className="text-center mb-3">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
                <div className="text-3xl font-bold text-cyan-400 mb-1">$29</div>
                <div className="text-gray-400 text-xs mb-3">per month</div>
              </div>
              <div className="space-y-1 text-xs text-gray-300">
                <div>✓ 10 AI agents</div>
                <div>✓ 25 active workflows</div>
                <div>✓ 10K Credits/day</div>
                <div>✓ Community support</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border-2 border-purple-500/50 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                POPULAR
              </div>
              <div className="text-center mb-3">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                <div className="text-3xl font-bold text-purple-400 mb-1">$99</div>
                <div className="text-gray-400 text-xs mb-3">per month</div>
              </div>
              <div className="space-y-1 text-xs text-gray-300">
                <div>✓ Unlimited agents</div>
                <div>✓ Unlimited active workflows</div>
                <div>✓ 100K Credits/day</div>
                <div>✓ Priority support</div>
                <div>✓ Advanced analytics</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border-2 border-pink-500/50">
              <div className="text-center mb-3">
                <div className="text-4xl mb-3">🏢</div>
                <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                <div className="text-3xl font-bold text-pink-400 mb-1">Custom</div>
                <div className="text-gray-400 text-xs mb-3">contact us</div>
              </div>
              <div className="space-y-1 text-xs text-gray-300">
                <div>✓ Everything in Pro</div>
                <div>✓ Unlimited messages</div>
                <div>✓ Custom integrations</div>
                <div>✓ Dedicated support</div>
                <div>✓ SLA guarantees</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 p-4 rounded-xl border border-cyan-500/30">
            <h3 className="text-lg font-bold mb-2 text-white">Additional Revenue Streams</h3>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
              <div>💎 Premium agent templates</div>
              <div>🔌 Integration marketplace</div>
              <div>📊 Usage-based pricing</div>
              <div>🎓 Training programs</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Product Roadmap",
      content: (
        <div className="h-full flex flex-col justify-center px-12">
          <h2 className="text-4xl font-bold mb-12 text-center text-cyan-300">
            18-Month Roadmap
          </h2>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-cyan-500 via-purple-500 to-pink-500"></div>

            <div className="space-y-12">
              <div className="flex items-center gap-8">
                <div className="w-1/2 text-right">
                  <div className="inline-block bg-gradient-to-r from-cyan-900/40 to-slate-800 p-6 rounded-xl border border-cyan-500/30">
                    <h3 className="text-2xl font-bold text-cyan-300 mb-2">Q3 2025</h3>
                    <p className="text-gray-300">Advanced analytics dashboard and expanded integrations</p>
                  </div>
                </div>
                <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center z-10 flex-shrink-0">
                  <span className="text-xl font-bold text-white">1</span>
                </div>
                <div className="w-1/2"></div>
              </div>

              <div className="flex items-center gap-8">
                <div className="w-1/2"></div>
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center z-10 flex-shrink-0">
                  <span className="text-xl font-bold text-white">2</span>
                </div>
                <div className="w-1/2">
                  <div className="inline-block bg-gradient-to-l from-purple-900/40 to-slate-800 p-6 rounded-xl border border-purple-500/30">
                    <h3 className="text-2xl font-bold text-purple-300 mb-2">Q4 2025</h3>
                    <p className="text-gray-300">Cross-agent collaboration and AI team optimization</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="w-1/2 text-right">
                  <div className="inline-block bg-gradient-to-r from-pink-900/40 to-slate-800 p-6 rounded-xl border border-pink-500/30">
                    <h3 className="text-2xl font-bold text-pink-300 mb-2">Q1 2026</h3>
                    <p className="text-gray-300">Mobile app launch and enterprise security features</p>
                  </div>
                </div>
                <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center z-10 flex-shrink-0">
                  <span className="text-xl font-bold text-white">3</span>
                </div>
                <div className="w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "The Ask",
      content: (
        <div className="h-full flex flex-col justify-center px-8 py-4">
          <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Seeking Seed Investment
          </h2>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-gradient-to-br from-purple-900/40 to-slate-800 p-6 rounded-xl border-2 border-purple-500/50">
              <h3 className="text-2xl font-bold text-purple-300 mb-4">We&apos;re Raising</h3>
              <div className="text-4xl font-bold text-white mb-3">$500K</div>
              <p className="text-lg text-gray-300">Seed Round</p>
            </div>

            <div className="bg-gradient-to-br from-cyan-900/40 to-slate-800 p-6 rounded-xl border-2 border-cyan-500/50">
              <h3 className="text-2xl font-bold text-cyan-300 mb-4">Use of Funds</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between items-center">
                  <span>Product Development</span>
                  <span className="font-bold text-white">40%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1">
                  <div className="bg-cyan-500 h-1 rounded-full" style={{width: '40%'}}></div>
                </div>

                <div className="flex justify-between items-center">
                  <span>Marketing & User Acquisition</span>
                  <span className="font-bold text-white">30%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1">
                  <div className="bg-purple-500 h-1 rounded-full" style={{width: '30%'}}></div>
                </div>

                <div className="flex justify-between items-center">
                  <span>Infrastructure & Hosting</span>
                  <span className="font-bold text-white">20%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1">
                  <div className="bg-pink-500 h-1 rounded-full" style={{width: '20%'}}></div>
                </div>

                <div className="flex justify-between items-center">
                  <span>Legal & Operations</span>
                  <span className="font-bold text-white">10%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1">
                  <div className="bg-green-500 h-1 rounded-full" style={{width: '10%'}}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-900/30 via-purple-900/30 to-pink-900/30 p-6 rounded-xl border border-cyan-500/30">
            <h3 className="text-xl font-bold mb-3 text-white text-center">18-Month Milestones</h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-cyan-400 mb-1">1K+</div>
                <p className="text-xs text-gray-300">Active Users</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400 mb-1">$50K</div>
                <p className="text-xs text-gray-300">Monthly Recurring Revenue</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-pink-400 mb-1">Series A</div>
                <p className="text-xs text-gray-300">Ready for Next Round</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400 mb-1">5+</div>
                <p className="text-xs text-gray-300">Team Members</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Join Us",
      content: (
        <div className="h-full flex flex-col justify-center items-center text-center px-12">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Don&apos;t Hire... Create!
          </h1>
          
          <p className="text-2xl text-gray-300 max-w-3xl mb-12">
            Join the AI-first automation revolution transforming how businesses operate. Build the intelligent workforce of tomorrow, today.
          </p>

          <div className="grid grid-cols-2 gap-8 w-full max-w-4xl mb-12">
            <div className="bg-gradient-to-br from-purple-900/40 to-slate-800 p-8 rounded-xl border border-purple-500/30">
              <h3 className="text-2xl font-bold text-purple-300 mb-3">Partner With Us</h3>
              <p className="text-gray-300 mb-4">We&apos;re seeking strategic partners and investment to accelerate our growth trajectory</p>
              <a href="mailto:support@affinitybots.com" className="block w-full">
                <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition">
                  Schedule Meeting
                </button>
              </a>
            </div>

            <div className="bg-gradient-to-br from-cyan-900/40 to-slate-800 p-8 rounded-xl border border-cyan-500/30">
              <h3 className="text-2xl font-bold text-cyan-300 mb-3">Request Demo</h3>
              <p className="text-gray-300 mb-4">Early adopters receive priority access to new features and dedicated support</p>
              <a href="https://affinitybots.com/early-access" className="block w-full" target="_blank" rel="noopener noreferrer">
                <button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg transition">
                  Get Early Access
                </button>
              </a>
            </div>
          </div>

          <div className="text-gray-400">
            <p className="mb-2">contact@affinitybots.com</p>
            <p>affinitybots.com</p>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'Left') {
        setCurrentSlide((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'Right') {
        setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
      <div className="relative overflow-hidden" style={{ aspectRatio: '16/9', height: '65vh', minHeight: '450px' }}>
        {slides[currentSlide].content}
      </div>

      <div className="bg-slate-900/80 backdrop-blur-sm border-t border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={prevSlide}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentSlide === 0}
          >
            <ChevronLeft size={20} />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {currentSlide + 1} / {slides.length}
            </span>
            <div className="hidden md:flex gap-1">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition ${
                    index === currentSlide ? 'bg-cyan-500 w-8' : 'bg-slate-600'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={nextSlide}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentSlide === slides.length - 1}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PitchDeck;