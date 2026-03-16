import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { Player } from '../../types';
import { Plus, Edit2, Trash2, Search, Upload, AlertCircle } from 'lucide-react';

export default function PlayersAdmin() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<Partial<Player>>({ gender: 'Male', status: 'Available', basePrice: 0 });
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'players'), (snapshot) => {
      const p: Player[] = [];
      snapshot.forEach(doc => p.push({ id: doc.id, ...doc.data() } as Player));
      setPlayers(p);
    });
    return () => unsub();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    setUploadError('');
    try {
      const storageRef = ref(storage, `players/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setCurrentPlayer(prev => ({ ...prev, photoUrl: url }));
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadError(error.message || 'Failed to upload image. Check Firebase Storage rules.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPlayer.id) {
      await updateDoc(doc(db, 'players', currentPlayer.id), {
        name: currentPlayer.name,
        photoUrl: currentPlayer.photoUrl || '',
        gender: currentPlayer.gender,
        basePrice: Number(currentPlayer.basePrice),
        status: currentPlayer.status,
      });
    } else {
      await addDoc(collection(db, 'players'), {
        name: currentPlayer.name,
        photoUrl: currentPlayer.photoUrl || '',
        gender: currentPlayer.gender,
        basePrice: Number(currentPlayer.basePrice),
        status: 'Available',
        createdAt: serverTimestamp(),
      });
    }
    setIsEditing(false);
    setCurrentPlayer({ gender: 'Male', status: 'Available', basePrice: 0 });
    setUploadError('');
  };

  const confirmDelete = async (id: string) => {
    await deleteDoc(doc(db, 'players', id));
    setDeletingId(null);
  };

  const filteredPlayers = players.filter(p => {
    const matchesGender = filter === 'All' || p.gender === filter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGender && matchesSearch;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white">Manage Players</h1>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search players..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded pl-10 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-slate-900 border border-slate-800 rounded px-3 py-2 focus:outline-none focus:border-indigo-500">
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <button
            onClick={() => { setIsEditing(true); setCurrentPlayer({ gender: 'Male', status: 'Available', basePrice: 0 }); setUploadError(''); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={20} /> Add Player
          </button>
        </div>
      </div>

      {isEditing && (
        <form onSubmit={handleSave} className="bg-slate-900 p-6 rounded-xl mb-8 border border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Player Name</label>
              <input required value={currentPlayer.name || ''} onChange={e => setCurrentPlayer({...currentPlayer, name: e.target.value})} className="w-full bg-slate-800 rounded p-2 text-white border border-slate-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Photo URL or Upload</label>
              <div className="flex gap-2">
                <input value={currentPlayer.photoUrl || ''} onChange={e => setCurrentPlayer({...currentPlayer, photoUrl: e.target.value})} placeholder="https://..." className="flex-1 bg-slate-800 rounded p-2 text-white border border-slate-700" />
                <label className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded cursor-pointer flex items-center gap-2">
                  <Upload size={18} />
                  {uploading ? '...' : 'Upload'}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
              {uploadError && (
                <div className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {uploadError}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select required value={currentPlayer.gender} onChange={e => setCurrentPlayer({...currentPlayer, gender: e.target.value as any})} className="w-full bg-slate-800 rounded p-2 text-white border border-slate-700">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Base Price</label>
              <input type="number" required value={currentPlayer.basePrice || 0} onChange={e => setCurrentPlayer({...currentPlayer, basePrice: Number(e.target.value)})} className="w-full bg-slate-800 rounded p-2 text-white border border-slate-700" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700">Cancel</button>
            <button type="submit" disabled={uploading} className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">Save</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredPlayers.map(player => (
          <div key={player.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              {player.photoUrl ? <img src={player.photoUrl} alt={player.name} className="w-16 h-16 rounded-full object-cover" /> : <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xl">{player.name.charAt(0)}</div>}
              <div>
                <h3 className="font-bold text-lg">{player.name}</h3>
                <p className="text-sm text-slate-400">{player.gender}</p>
              </div>
            </div>
            <div className="mt-auto flex justify-between items-center border-t border-slate-800 pt-4">
              <span className="text-indigo-400 font-bold">₹{player.basePrice}</span>
              
              {deletingId === player.id ? (
                <div className="flex gap-2">
                  <button onClick={() => confirmDelete(player.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">Confirm</button>
                  <button onClick={() => setDeletingId(null)} className="px-2 py-1 text-xs bg-slate-700 text-white rounded hover:bg-slate-600">Cancel</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { setCurrentPlayer(player); setIsEditing(true); setUploadError(''); }} className="p-2 text-slate-400 hover:text-white"><Edit2 size={18} /></button>
                  <button onClick={() => setDeletingId(player.id)} className="p-2 text-red-400 hover:text-red-300"><Trash2 size={18} /></button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
