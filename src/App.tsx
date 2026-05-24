import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ModuleView } from './components/ModuleView';
import { studyModules } from './data/studyModules';

export default function App() {
  const [activeModuleId, setActiveModuleId] = useState(studyModules[0].id);

  const activeModule = studyModules.find(m => m.id === activeModuleId);

  return (
    <div className="min-h-screen bg-black text-emerald-400 font-mono selection:bg-emerald-900 selection:text-emerald-100 scanlines">
      <Sidebar 
        activeModule={activeModuleId} 
        setActiveModule={setActiveModuleId} 
        modules={studyModules} 
      />
      
      <main className="pl-72 pt-12 px-12 min-h-screen relative z-0">
        {activeModule ? (
          <ModuleView module={activeModule} />
        ) : (
          <div className="text-emerald-900 font-mono">Module not found.</div>
        )}
      </main>
    </div>
  );
}
