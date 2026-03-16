import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Player, Team, AuctionState } from '../types';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';

export default function PublicBoard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubPlayers = onSnapshot(collection(db, 'players'), (snapshot) => {
      const p: Player[] = [];
      snapshot.forEach(doc => p.push({ id: doc.id, ...doc.data() } as Player));
      setPlayers(p);
    });

    const unsubTeams = onSnapshot(collection(db, 'teams'), (snapshot) => {
      const t: Team[] = [];
      snapshot.forEach(doc => t.push({ id: doc.id, ...doc.data() } as Team));
      setTeams(t);
    });

    const unsubState = onSnapshot(doc(db, 'auctionState', 'current'), (docSnap) => {
      if (docSnap.exists()) {
        setAuctionState(docSnap.data() as AuctionState);
      }
    });

    return () => { unsubPlayers(); unsubTeams(); unsubState(); };
  }, []);

  const currentPlayer = players.find(p => p.id === auctionState?.currentPlayerId);
  const currentTeam = currentPlayer?.teamId ? teams.find(t => t.id === currentPlayer.teamId) : null;

  useEffect(() => {
    if (currentPlayer) {
      if (prevStatusRef.current === 'In Auction' && currentPlayer.status === 'Sold') {
        // Trigger confetti
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: currentTeam ? [currentTeam.color, '#ffffff'] : undefined
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: currentTeam ? [currentTeam.color, '#ffffff'] : undefined
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
      }
      prevStatusRef.current = currentPlayer.status;
    } else {
      prevStatusRef.current = null;
    }
  }, [currentPlayer?.status, currentTeam]);

  // Derived stats
  const availableCount = players.filter(p => p.status === 'Available').length;
  const soldCount = players.filter(p => p.status === 'Sold').length;
  const unsoldCount = players.filter(p => p.status === 'Unsold').length;

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden flex flex-col font-sans relative">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shadow-lg z-10">
        <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 uppercase italic">
          Ganga Dham Tower Auction
        </h1>
        <div className="flex gap-6 text-xl font-bold">
          <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">Available: <span className="text-cyan-400">{availableCount}</span></div>
          <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">Sold: <span className="text-green-400">{soldCount}</span></div>
          <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">Unsold: <span className="text-red-400">{unsoldCount}</span></div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-6 gap-6 overflow-hidden relative">
        
        {/* Top Half: Current Player */}
        <div className="flex-none h-[45vh] bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex items-center justify-center">
          <AnimatePresence mode="wait">
            {currentPlayer ? (
              <motion.div
                key={currentPlayer.id + currentPlayer.status}
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="flex items-center gap-12 w-full max-w-6xl px-12"
              >
                {/* Photo */}
                <div className="relative">
                  <div className={`w-64 h-64 rounded-full overflow-hidden border-8 shadow-2xl ${currentPlayer.status === 'Sold' ? 'border-green-500' : currentPlayer.status === 'Unsold' ? 'border-red-500' : 'border-indigo-500'}`}>
                    {currentPlayer.photoUrl ? (
                      <img src={currentPlayer.photoUrl} alt={currentPlayer.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-8xl font-black text-slate-600">
                        {currentPlayer.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  {currentPlayer.status === 'Sold' && currentTeam && (
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
                      className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full border-4 border-slate-900 overflow-hidden bg-white"
                    >
                      {currentTeam.logoUrl ? (
                        <img src={currentTeam.logoUrl} alt={currentTeam.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-black" style={{ backgroundColor: currentTeam.color }}>
                          {currentTeam.name.charAt(0)}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <h2 className="text-7xl font-black uppercase tracking-tight mb-4">{currentPlayer.name}</h2>
                  <div className="flex gap-4 mb-8">
                    <span className="text-2xl font-bold bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">{currentPlayer.gender}</span>
                    <span className="text-2xl font-bold bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">Base: ₹{currentPlayer.basePrice}</span>
                  </div>

                  {currentPlayer.status === 'In Auction' && (
                    <div className="inline-block bg-indigo-600 text-white text-4xl font-black px-8 py-4 rounded-2xl animate-pulse shadow-[0_0_30px_rgba(79,70,229,0.5)]">
                      CURRENTLY BIDDING
                    </div>
                  )}

                  {currentPlayer.status === 'Sold' && (
                    <motion.div 
                      initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                      className="inline-block bg-green-500 text-white px-8 py-4 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.6)]"
                    >
                      <div className="text-2xl font-bold uppercase opacity-90 mb-1">Sold To {currentTeam?.name}</div>
                      <div className="text-6xl font-black">₹{currentPlayer.soldPrice}</div>
                    </motion.div>
                  )}

                  {currentPlayer.status === 'Unsold' && (
                    <div className="inline-block bg-red-600 text-white text-6xl font-black px-8 py-4 rounded-2xl shadow-[0_0_40px_rgba(220,38,38,0.6)]">
                      UNSOLD
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center"
              >
                <h2 className="text-5xl font-black text-slate-600 uppercase tracking-widest">Waiting for next player...</h2>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Half: Teams Grid */}
        <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 overflow-hidden flex flex-col">
          <h3 className="text-2xl font-bold text-slate-400 uppercase tracking-widest mb-4 flex-none">Franchises</h3>
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {teams.map(team => {
                const teamPlayers = players.filter(p => p.teamId === team.id);
                return (
                  <div key={team.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 flex flex-col">
                    <div className="p-3 flex items-center gap-3 border-b border-slate-700" style={{ backgroundColor: `${team.color}20`, borderBottomColor: team.color }}>
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name} className="w-10 h-10 rounded-full object-cover bg-white" />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: team.color }}>
                          {team.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg truncate text-white">{team.name}</h4>
                        <p className="text-xs text-slate-400">{teamPlayers.length} Players</p>
                      </div>
                    </div>
                    <div className="p-3 flex-1 bg-slate-800/50">
                      <div className="flex flex-wrap gap-1">
                        {teamPlayers.map(p => (
                          <div key={p.id} className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300 truncate max-w-full">
                            {p.name} <span className="text-green-400 font-bold">₹{p.soldPrice}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </main>

      {/* Admin Link */}
      <Link 
        to="/admin" 
        className="absolute bottom-4 right-4 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white p-3 rounded-full backdrop-blur-sm transition-all z-50 flex items-center gap-2"
        title="Admin Dashboard"
      >
        <Settings size={20} />
        <span className="text-sm font-medium pr-1">Admin</span>
      </Link>
    </div>
  );
}
