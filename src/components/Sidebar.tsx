import { useState } from 'react';
import { Target, Server, Database, KeyRound, Wifi, Search, Cpu } from 'lucide-react';
import { StudyModule } from '../types';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (id: string) => void;
  modules: StudyModule[];
}

const getIcon = (category: string) => {
  switch (category) {
    case 'Networking': return <Wifi className="w-5 h-5" />;
    case 'Tools': return <Server className="w-5 h-5" />;
    case 'Emerging': return <Target className="w-5 h-5" />;
    case 'Malware': return <Database className="w-5 h-5" />;
    case 'Phishing': return <KeyRound className="w-5 h-5" />;
    case 'Threat Intel': return <Search className="w-5 h-5" />;
    case 'AI Security': return <Cpu className="w-5 h-5" />;
    default: return <Target className="w-5 h-5" />;
  }
};

export function Sidebar({ activeModule, setActiveModule, modules }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredModules = modules
    .filter((mod) => {
      const q = searchQuery.toLowerCase();
      const matchTitle = mod.title.toLowerCase().includes(q);
      const matchKeywords = mod.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchKeywords;
    })
    .map((mod) => {
      const q = searchQuery.toLowerCase();
      let score = 0;
      if (mod.title.toLowerCase().includes(q)) score += 1;
      if (mod.keywords?.some((k) => k.toLowerCase().includes(q))) score += 2;
      return { ...mod, score };
    })
    .sort((a, b) => b.score - a.score);

  const categories = Array.from(new Set(filteredModules.map(m => m.category)));

  return (
    <div className="w-72 bg-black border-r border-emerald-900/50 h-screen flex flex-col fixed left-0 top-0 text-stone-300 scanlines z-50">
      <div className="p-6 border-b border-emerald-900/50">
        <h1 className="text-3xl font-mono tracking-tight title-animate">
          <span className="text-4xl">S</span>tudy <span className="text-4xl">R</span>ight.
        </h1>
        <p className="text-xs text-stone-500 mt-2 font-mono tracking-widest uppercase">
          IMMERSE YOURSELF IN CYBERSECURITY
        </p>
      </div>

      <div className="p-4 border-b border-emerald-900/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black border border-emerald-900/50 rounded-none py-2 pl-9 pr-4 text-sm text-emerald-400 placeholder-emerald-900 focus:outline-none focus:border-emerald-500 transition-all font-mono"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        {categories.map(cat => (
          <div key={cat}>
            <div className="px-6 py-2 text-[10px] uppercase tracking-widest text-emerald-800 font-mono">{cat}</div>
            {filteredModules.filter(m => m.category === cat).map((mod) => (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors duration-200 font-mono ${
                  activeModule === mod.id 
                    ? 'bg-emerald-950/30 border-r-4 border-emerald-500 text-emerald-400' 
                    : 'hover:bg-emerald-950/10 hover:text-emerald-100 border-r-4 border-transparent'
                }`}
              >
                  <div className="flex-shrink-0 text-emerald-700">{getIcon(mod.category)}</div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm truncate">{mod.title}</span>
                  </div>
              </button>
            ))}
          </div>
        ))}
        {filteredModules.length === 0 && (
          <div className="px-6 py-4 text-sm text-emerald-900 text-center font-mono">
            No modules found matching "{searchQuery}"
          </div>
        )}
      </div>
      
      <div className="p-6 border-t border-emerald-900/50 text-xs text-emerald-800 font-mono text-center">
        <p>SYSTEM SECURE: ACCESS GRANTED</p>
      </div>
    </div>
  );
}
