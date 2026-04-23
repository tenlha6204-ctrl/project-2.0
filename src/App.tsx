/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Brain, 
  Clock, 
  MessageSquare, 
  AlertTriangle, 
  ChevronRight, 
  RefreshCw,
  Activity,
  Briefcase,
  Heart,
  Moon,
  Zap,
  Target,
  Send,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { simulateFuture, chatWithFutureSelf, UserHabits, SimulationResult } from './lib/gemini';

// --- Components ---

const MetricCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="border-t border-line-subtle py-4 flex flex-col gap-2">
    <div className="text-[10px] uppercase tracking-[0.2em] font-semibold opacity-40">{label}</div>
    <div className="flex items-center justify-between gap-4">
      <div className="text-4xl font-serif">{value}<span className="text-base opacity-40">/10</span></div>
      <div className="flex-1 h-px bg-white/5 relative">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value * 10}%` }}
          className={`absolute inset-y-0 left-0 bg-accent`}
        />
      </div>
    </div>
  </div>
);

const HabitInputFields = ({ habits, setHabits }: { habits: UserHabits; setHabits: (h: UserHabits) => void }) => {
  const updateHabit = (key: keyof UserHabits, val: string | number) => {
    setHabits({ ...habits, [key]: val });
  };

  return (
    <div className="space-y-12 w-full max-w-3xl mx-auto font-sans">
      <div className="space-y-4">
        <label className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40 flex items-center gap-2">
          01. Study & Work Architecture
        </label>
        <textarea 
          placeholder="Describe your current cognitive routine..."
          className="w-full bg-transparent border-b border-line-subtle py-4 px-0 text-xl font-serif text-ink placeholder:text-ink/20 focus:outline-none focus:border-accent transition-all h-32 resize-none italic"
          value={habits.studyHabits}
          onChange={(e) => updateHabit('studyHabits', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">
            02. Physical Optimization
          </label>
          <input 
            type="text"
            placeholder="Fitness routine..."
            className="w-full bg-transparent border-b border-line-subtle py-4 px-0 text-lg font-serif text-ink placeholder:text-ink/20 focus:outline-none focus:border-accent transition-all italic"
            value={habits.fitnessRoutine}
            onChange={(e) => updateHabit('fitnessRoutine', e.target.value)}
          />
        </div>
        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">
            03. Biological Reset
          </label>
          <input 
            type="text"
            placeholder="Sleep schedule..."
            className="w-full bg-transparent border-b border-line-subtle py-4 px-0 text-lg font-serif text-ink placeholder:text-ink/20 focus:outline-none focus:border-accent transition-all italic"
            value={habits.sleepSchedule}
            onChange={(e) => updateHabit('sleepSchedule', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">
          04. Prime Objectives
        </label>
        <input 
          type="text"
          placeholder="Where do you expect to land in 5 years?"
          className="w-full bg-transparent border-b border-line-subtle py-4 px-0 text-lg font-serif text-ink placeholder:text-ink/20 focus:outline-none focus:border-accent transition-all italic"
          value={habits.goals}
          onChange={(e) => updateHabit('goals', e.target.value)}
        />
      </div>

      <div className="space-y-6 pt-6">
        <div className="flex justify-between items-center">
          <label className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">Cognitive Tension Level</label>
          <span className="text-2xl font-serif text-accent italic">{habits.stressLevel}/10</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="10" 
          step="1"
          className="w-full h-px bg-white/10 appearance-none cursor-pointer accent-accent"
          value={habits.stressLevel}
          onChange={(e) => updateHabit('stressLevel', parseInt(e.target.value))}
        />
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [step, setStep] = useState<'landing' | 'input' | 'simulating' | 'results'>('landing');
  const [habits, setHabits] = useState<UserHabits>({
    studyHabits: '',
    fitnessRoutine: '',
    sleepSchedule: '',
    goals: '',
    stressLevel: 5
  });
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!process.env.GEMINI_API_KEY) {
      setApiKeyMissing(true);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleStartSimulate = async () => {
    if (!process.env.GEMINI_API_KEY) {
      setApiKeyMissing(true);
      alert("Missing GEMINI_API_KEY. Please add it to your AI Studio Secrets to proceed.");
      return;
    }
    setStep('simulating');
    try {
      const res = await simulateFuture(habits);
      setResult(res);
      setStep('results');
    } catch (error) {
      console.error(error);
      setStep('input');
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !result) return;
    
    const newMessage = { role: 'user' as const, parts: [{ text: userInput }] };
    setChatHistory(prev => [...prev, newMessage]);
    setUserInput('');
    setIsChatLoading(true);

    try {
      const responseText = await chatWithFutureSelf([...chatHistory, newMessage], userInput, result);
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: responseText }] }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-editor text-ink font-sans flex antialiased">
      {/* Editorial Siderail */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-24 border-r border-line-subtle flex-col justify-between items-center py-12 z-50 bg-bg-editor">
        <div className="writing-vertical rotate-180 text-[10px] uppercase tracking-[0.4em] font-bold opacity-30 whitespace-nowrap">
          LifeLens Behavioral Projection 2.0
        </div>
        <div className="flex flex-col gap-6 items-center">
          <div className="w-2 h-2 rounded-full bg-accent"></div>
          <div className="w-2 h-2 rounded-full border border-line-subtle"></div>
          <div className="w-2 h-2 rounded-full border border-line-subtle"></div>
        </div>
      </aside>

      <div className="flex-1 ml-0 md:ml-24 flex flex-col min-h-screen">
        {/* Header */}
        <header className="relative z-10 p-8 md:p-12 border-b border-line-subtle flex justify-between items-start max-w-7xl w-full mx-auto">
          <div className="group cursor-pointer" onClick={() => setStep('landing')}>
            <h1 className="text-2xl font-serif italic tracking-tight flex items-center gap-2">
              <span className="w-6 h-6 bg-accent rounded-full inline-block" />
              LifeLens
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-30 mt-1">Experimental Trajectory Engine</p>
          </div>
          {step === 'results' && (
            <button 
              onClick={() => setStep('input')}
              className="text-accent hover:text-white border-b border-accent/20 hover:border-white pb-1 text-[10px] font-bold tracking-[0.2em] uppercase transition-all"
            >
              Reset Projection
            </button>
          )}
        </header>

        <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-8 md:px-12 py-12">
          <AnimatePresence mode="wait">
            {step === 'landing' && (
              <motion.div 
                key="landing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col gap-24 py-12"
              >
                <div className="relative">
                   <div className="absolute -left-12 -top-12 opacity-[0.03] select-none pointer-events-none">
                     <h1 className="text-[300px] font-serif font-black leading-none uppercase">Lens</h1>
                   </div>
                   <div className="relative z-10 space-y-12">
                    <div className="max-w-xs">
                      <p className="text-[10px] uppercase tracking-[0.3em] font-bold mb-4 opacity-50 flex items-center gap-3">
                        <span className="w-8 h-px bg-accent" /> Genesis
                      </p>
                      <h2 className="text-3xl font-serif italic italic leading-tight">"The Architecture of Your Existence"</h2>
                    </div>
                    
                    <h1 className="text-massive font-serif font-black uppercase text-white">
                      SEE YOUR <br />
                      <span className="text-accent italic font-normal lowercase tracking-tight">future</span> <br />
                      BEFORE YOU LIVE IT
                    </h1>

                    {apiKeyMissing && (
                      <div className="bg-accent/10 border border-accent/30 p-6 max-w-md">
                        <p className="text-accent text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" /> Activation Required
                        </p>
                        <p className="text-white/60 text-[10px] leading-relaxed uppercase space-y-2">
                          To inaugurate the trajectory engine, please configure your <span className="text-accent">GEMINI_API_KEY</span> in the <span className="text-white font-bold">Secrets</span> panel of the AI Studio sidebar.
                          <br/><br/>
                          <span className="opacity-40 italic">Note: The engine uses this connection to synthesize your future projections.</span>
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
                      <p className="text-ink/60 text-lg leading-relaxed font-light max-w-md">
                        A behavioral projection engine that calculates the cumulative impact of your current choices. We map the trajectory of your health, career, and biological vitality across multiple temporal horizons.
                      </p>
                      <div className="flex flex-col gap-6">
                        <motion.button 
                          whileHover={{ x: 10 }}
                          onClick={() => setStep('input')}
                          className="w-full md:w-auto border border-accent text-accent px-12 py-6 font-bold text-sm tracking-[0.3em] uppercase hover:bg-accent hover:text-black transition-all flex items-center justify-between"
                        >
                          Inaugurate Simulation <ChevronRight className="w-5 h-5" />
                        </motion.button>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-30 text-right italic">Requires 5 minutes of focused input</p>
                      </div>
                    </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 border-t border-line-subtle">
                  {[
                    { icon: Brain, label: "Habit Engine", desc: "Neural mapping of daily routines" },
                    { icon: Clock, label: "6M/5Y Previews", desc: "Bitemporal state projection" },
                    { icon: MessageSquare, label: "Future Self Chat", desc: "Synthetic personality linking" },
                    { icon: AlertTriangle, label: "Reality Warnings", desc: "Burnout & decay risk analysis" }
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col gap-4 p-8 border-r border-line-subtle last:border-r-0">
                      <item.icon className="w-5 h-5 text-accent" />
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                        <p className="text-[10px] opacity-40 leading-relaxed uppercase pr-4">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'input' && (
              <motion.div 
                key="input"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl space-y-20 py-12"
              >
                <div className="flex flex-col gap-6">
                   <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-50 flex items-center gap-3">
                    <span className="w-8 h-px bg-accent" /> Calibration
                  </p>
                  <h2 className="text-6xl font-serif font-black uppercase">CONFIGURE <br/> YOUR TRAJECTORY</h2>
                </div>

                <HabitInputFields habits={habits} setHabits={setHabits} />

                <div className="pt-12 border-t border-line-subtle flex justify-between items-center">
                   <button 
                    onClick={() => setStep('landing')}
                    className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 hover:opacity-100 transition-opacity"
                  >
                    Discard Changes
                  </button>
                  <button 
                    disabled={!habits.studyHabits || !habits.goals}
                    onClick={handleStartSimulate}
                    className="bg-accent text-black px-16 py-6 font-bold text-sm tracking-[0.3em] uppercase disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-all active:scale-95"
                  >
                    GENERATE TIMELINE
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'simulating' && (
              <motion.div 
                key="simulating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-40 gap-12"
              >
                <div className="relative">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="w-64 h-64 border-t border-accent border-r border-accent rounded-full opacity-20"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="text-massive font-serif font-black animate-pulse text-accent leading-none">AI</div>
                      <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-30">Synthesizing Probability</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  {[1, 2, 3].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ height: [20, 60, 20] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      className="w-px bg-accent/40"
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'results' && result && (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-12"
              >
                {/* Left Column: Projections */}
                <div className="lg:col-span-8 space-y-24">
                  {/* Summary & Trajectory */}
                  <header className="flex justify-between items-start border-b border-line-subtle pb-12">
                    <div className="max-w-md">
                      <p className="text-[10px] uppercase tracking-[0.3em] font-bold mb-4 opacity-50">Current Trajectory</p>
                      <h2 className="text-4xl font-serif italic leading-tight">"{result.sixMonths.description.split('.')[0].substring(0, 30)}..."</h2>
                      <p className="text-sm mt-4 opacity-60 leading-relaxed italic pr-12">Based on your input, your life maps to a path of {habits.stressLevel > 7 ? 'sustained tension' : 'gradual evolution'}.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold font-mono tracking-widest">{new Date().getFullYear() + 5} HORIZON</p>
                      <p className="text-[10px] uppercase tracking-[0.2em] opacity-40 mt-1">Estimated Peak</p>
                    </div>
                  </header>

                  {/* 6 Month View */}
                  <section className="relative">
                    <div className="absolute -left-12 top-0 opacity-[0.03] select-none pointer-events-none">
                      <h1 className="text-massive font-serif font-black">SIX MONTHS</h1>
                    </div>
                    <div className="relative z-10 pt-12 space-y-12">
                      <div className="flex items-center gap-4">
                        <span className="w-12 h-px bg-accent" />
                        <h3 className="text-5xl font-serif font-black uppercase">0.5 YEARS</h3>
                      </div>
                      
                      <div className="flex flex-col md:flex-row gap-12 items-start">
                         <div className="w-full md:w-1/2 space-y-6">
                            <p className="text-ink font-light text-xl leading-relaxed">
                              {result.sixMonths.description}
                            </p>
                         </div>
                         <div className="flex-1 w-full space-y-1">
                            <MetricCard label="Physiological Health" value={result.sixMonths.metrics.health} color="bg-accent" />
                            <MetricCard label="Career Trajectory" value={result.sixMonths.metrics.career} color="bg-accent" />
                            <MetricCard label="Subjective Happiness" value={result.sixMonths.metrics.happiness} color="bg-accent" />
                         </div>
                      </div>
                    </div>
                  </section>

                  {/* 5 Year View */}
                  <section className="relative pt-24 border-t border-line-subtle">
                    <div className="absolute -left-12 top-24 opacity-[0.03] select-none pointer-events-none">
                      <h1 className="text-massive font-serif font-black">LONG TERM</h1>
                    </div>
                    <div className="relative z-10 space-y-12">
                      <div className="flex items-center gap-4">
                        <span className="w-12 h-px bg-accent" />
                        <h3 className="text-5xl font-serif font-black uppercase tracking-tighter">05 YEARS</h3>
                      </div>

                      <div className="flex flex-col md:flex-row gap-12">
                        <div className="w-full md:w-64 h-80 bg-neutral-900/40 border border-line-subtle relative group shrink-0">
                           <div className="absolute inset-0 bg-gradient-to-t from-bg-editor/80 to-transparent" />
                           <div className="absolute bottom-6 left-6 space-y-1">
                              <p className="text-[10px] uppercase tracking-widest opacity-50">Projected Persona</p>
                              <p className="text-xl font-serif italic text-accent underline underline-offset-4 decoration-accent/30">The Future Self</p>
                           </div>
                        </div>
                        <div className="flex-1 space-y-12">
                           <p className="text-ink font-light text-2xl leading-tight">
                              {result.fiveYears.description}
                           </p>
                           <div className="grid grid-cols-2 gap-8 border-t border-line-subtle pt-8">
                             <div>
                               <p className="text-[10px] uppercase tracking-widest opacity-40 mb-2 font-bold">Vitality Index</p>
                               <p className="text-4xl font-serif text-accent">{result.fiveYears.metrics.health * 10}<span className="text-base">%</span></p>
                             </div>
                             <div>
                               <p className="text-[10px] uppercase tracking-widest opacity-40 mb-2 font-bold">Success Probability</p>
                               <p className="text-4xl font-serif">{result.fiveYears.metrics.career * 10}<span className="text-base">%</span></p>
                             </div>
                             <div>
                               <p className="text-[10px] uppercase tracking-widest opacity-40 mb-2 font-bold">Fulfillment</p>
                               <p className="text-4xl font-serif italic font-normal text-accent">{result.fiveYears.metrics.happiness}/10</p>
                             </div>
                             <div>
                               <p className="text-[10px] uppercase tracking-widest opacity-40 mb-2 font-bold">Social Impact</p>
                               <p className="text-4xl font-serif">Significant</p>
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Footer Highlights */}
                  <footer className="pt-12 border-t border-line-subtle flex flex-col md:flex-row gap-12 justify-between items-end">
                    <div className="flex flex-wrap gap-8 items-center">
                       <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold px-2 py-1 bg-red-500 text-black rounded-sm">CRITICAL</span>
                          <span className="text-xs font-bold leading-none tracking-tight">{result.warnings[0]}</span>
                       </div>
                       <div className="h-4 w-px bg-white/10 hidden md:block" />
                       <p className="text-sm opacity-50 italic">Future Self: "{result.futureSelfAdvice.substring(0, 80)}..."</p>
                    </div>
                    <button 
                      onClick={() => setStep('input')}
                      className="px-8 py-3 border border-ink/20 hover:border-accent hover:text-accent transition-all text-[10px] font-bold tracking-[0.2em] uppercase shrink-0"
                    >
                      Adjust Habits
                    </button>
                  </footer>
                </div>

                {/* Right Column: Decision Engine & Chat */}
                <aside className="lg:col-span-4 flex flex-col gap-8">
                  <div className="bg-neutral-900/40 p-8 border border-line-subtle space-y-12">
                    <h3 className="text-[10px] uppercase tracking-[0.3em] font-black opacity-30 border-b border-line-subtle pb-4">Decision Engine</h3>
                    <div className="space-y-8">
                      {result.habitAnalysis.slice(0, 3).map((analysis, i) => (
                        <div key={i} className="space-y-3">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] uppercase tracking-widest font-bold opacity-60 leading-tight pr-4">{analysis.split(' ')[0]} {analysis.split(' ')[1]}</span>
                            <span className="text-[10px] font-mono text-accent">ANALYSIS_{i+1}</span>
                          </div>
                          <div className="w-full h-[2px] bg-white/5">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${60 + i * 15}%` }}
                              className="h-full bg-accent"
                            />
                          </div>
                          <p className="text-[10px] opacity-40 leading-relaxed uppercase">{analysis}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-12 p-6 bg-accent/5 border-l border-accent border-r border-line-subtle">
                      <p className="text-[11px] leading-relaxed italic text-accent/80 font-medium tracking-tight">
                        "{result.futureSelfAdvice}"
                      </p>
                    </div>
                  </div>

                  <div className="bg-accent p-8 h-48 flex flex-col justify-between items-start text-black relative overflow-hidden group cursor-pointer">
                    <div className="absolute right-[-10%] top-[-10%] opacity-10 group-hover:rotate-12 transition-transform">
                       <MessageSquare className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1">Timeline Link</p>
                      <h3 className="text-4xl font-serif font-black leading-none uppercase">FUTURE <br /> SELF</h3>
                    </div>
                    <div className="relative z-10 w-8 h-8 rounded-full border-2 border-black flex items-center justify-center">
                       <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Mini Chat Container */}
                  <div className="border border-line-subtle flex-1 min-h-[400px] flex flex-col">
                    <div className="p-4 border-b border-line-subtle flex items-center justify-between bg-neutral-900/20">
                       <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Secure Connection</span>
                       <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[500px]">
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`p-4 text-xs ${
                            msg.role === 'user' 
                              ? 'bg-accent/10 border border-accent/20 text-accent italic' 
                              : 'bg-white/5 border border-white/10 text-ink/70'
                          }`}>
                            {msg.parts[0].text}
                          </div>
                        </div>
                      ))}
                      {isChatLoading && <div className="text-[10px] font-mono opacity-30 animate-pulse">DECRYPTING_SIGNAL...</div>}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="p-4 border-t border-line-subtle bg-neutral-900/20">
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="Ask Self 2029..."
                          className="w-full bg-transparent p-0 text-xs text-ink placeholder:text-ink/20 focus:outline-none"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                      </div>
                    </div>
                  </div>
                </aside>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="relative z-10 py-12 border-t border-line-subtle max-w-7xl w-full mx-auto px-8 md:px-12 flex flex-col md:flex-row justify-between items-center gap-8 opacity-20">
           <div className="text-[10px] font-bold tracking-[0.4em] uppercase">Trajectory Synthesis Lab</div>
           <div className="text-[10px] font-bold tracking-[0.4em] uppercase">All Futures Reserved &copy; 2026</div>
        </footer>
      </div>
    </div>
  );
}

