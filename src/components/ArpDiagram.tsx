import { motion } from 'motion/react';

export const ArpDiagram = () => {
  return (
    <div className="w-full h-48 bg-black rounded-lg p-6 flex flex-col items-center justify-center border border-emerald-900/50 relative overflow-hidden">
      <div className="flex w-full justify-between items-center z-10">
        <div className="bg-stone-900 p-3 rounded border border-stone-700 text-stone-300 font-mono text-xs shadow-[0_0_10px_rgba(255,255,255,0.1)]">Target</div>
        <div className="bg-emerald-950 p-3 rounded border border-emerald-700 text-emerald-400 font-mono text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">Attacker</div>
        <div className="bg-stone-900 p-3 rounded border border-stone-700 text-stone-300 font-mono text-xs">Gateway</div>
      </div>
      
      {/* Animated Packet: Target -> Attacker */}
      <motion.div
        animate={{ x: [-140, 0, 140], opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className="absolute top-24 w-3 h-3 bg-red-500 rounded-full z-0 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
      />
      
      {/* Animated Packet: Attacker -> Gateway */}
      <motion.div
        animate={{ x: [0, 145, 290], opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.75 }}
        className="absolute top-24 w-3 h-3 bg-emerald-500 rounded-full z-0 shadow-[0_0_10px_rgba(16,185,129,0.8)]"
      />
    </div>
  );
};
