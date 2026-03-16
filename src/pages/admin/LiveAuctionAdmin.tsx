import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Player, Team, AuctionState } from '../../types';
import { Play, Check, X, RefreshCw, Radio, Search } from 'lucide-react';

export default function LiveAuctionAdmin() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);

  const [soldPrice, setSoldPrice] = useState<number>(0);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

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
      } else {
        // Initialize if not exists
        setDoc(doc(db, 'auctionState', 'current'), { currentPlayerId: null, updatedAt: serverTimestamp() });
      }
    });

    return () => { unsubPlayers(); unsubTeams(); unsubState(); };
  }, []);

  const currentPlayer = players.find(p => p.id === auctionState?.currentPlayerId);
  const availablePlayers = players.filter(p => 
    (p.status === 'Available' || p.status === 'Unsold') && 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startAuction = async (playerId: string) => {
    await updateDoc(doc(db, 'players', playerId), { status: 'In Auction' });
    await updateDoc(doc(db, 'auctionState', 'current'), { currentPlayerId: playerId, updatedAt: serverTimestamp() });
    setSoldPrice(players.find(p => p.id === playerId)?.basePrice || 0);
    setSelectedTeamId('');
  };

  const markSold = async () => {
    if (!currentPlayer || !selectedTeamId || soldPrice <= 0) return;
    await updateDoc(doc(db, 'players', currentPlayer.id), {
      status: 'Sold',
      soldPrice: Number(soldPrice),
      teamId: selectedTeamId
    });
  };

  const markUnsold = async () => {
    if (!currentPlayer) return;
    await updateDoc(doc(db, 'players', currentPlayer.id), { status: 'Unsold' });
  };

  const clearScreen = async () => {
    await updateDoc(doc(db, 'auctionState', 'current'), { currentPlayerId: null, updatedAt: serverTimestamp() });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column: Current Auction Control */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <h2 className="text-2xl font-bold text-white mb-6">Live Control</h2>
        
        {currentPlayer ? (
          <div className="flex flex-col items-center">
            {currentPlayer.photoUrl ? (
              <img src={currentPlayer.photoUrl} alt={currentPlayer.name} className="w-48 h-48 rounded-full object-cover mb-4 border-4 border-indigo-500" />
            ) : (
              <div className="w-48 h-48 rounded-full bg-slate-800 flex items-center justify-center font-bold text-5xl mb-4 border-4 border-indigo-500">
                {currentPlayer.name.charAt(0)}
              </div>
            )}
            <h3 className="text-3xl font-bold text-white mb-2">{currentPlayer.name}</h3>
            <p className="text-xl text-slate-400 mb-6">Base Price: ₹{currentPlayer.basePrice}</p>

            {currentPlayer.status === 'In Auction' ? (
              <div className="w-full space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Sold Price (₹)</label>
                  <input type="number" value={soldPrice} onChange={e => setSoldPrice(Number(e.target.value))} className="w-full bg-slate-800 rounded p-3 text-white border border-slate-700 text-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Select Team</label>
                  <select value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)} className="w-full bg-slate-800 rounded p-3 text-white border border-slate-700 text-xl">
                    <option value="">-- Select Team --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={markSold} disabled={!selectedTeamId || soldPrice <= 0} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded flex items-center justify-center gap-2">
                    <Check size={24} /> Mark Sold
                  </button>
                  <button onClick={markUnsold} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded flex items-center justify-center gap-2">
                    <X size={24} /> Mark Unsold
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full text-center">
                <div className={`text-2xl font-bold mb-6 ${currentPlayer.status === 'Sold' ? 'text-green-400' : 'text-red-400'}`}>
                  {currentPlayer.status.toUpperCase()}
                </div>
                <button onClick={clearScreen} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded flex items-center justify-center gap-2">
                  <RefreshCw size={24} /> Clear Screen
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Radio size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl">No player currently on screen.</p>
            <p>Select a player from the list to start.</p>
          </div>
        )}
      </div>

      {/* Right Column: Available Players */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Available Players</h2>
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-full pl-9 pr-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 space-y-3 pr-2">
          {availablePlayers.map(player => (
            <div key={player.id} className="bg-slate-800 p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-4">
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center font-bold">{player.name.charAt(0)}</div>
                )}
                <div>
                  <h4 className="font-bold text-white">{player.name}</h4>
                  <p className="text-sm text-slate-400">{player.gender} • Base: ₹{player.basePrice}</p>
                </div>
              </div>
              <button
                onClick={() => startAuction(player.id)}
                disabled={!!currentPlayer && currentPlayer.status === 'In Auction'}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2 rounded-full"
              >
                <Play size={20} />
              </button>
            </div>
          ))}
          {availablePlayers.length === 0 && (
            <p className="text-center text-slate-500 py-8">No available players.</p>
          )}
        </div>
      </div>
    </div>
  );
}
