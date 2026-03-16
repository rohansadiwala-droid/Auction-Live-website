import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { Team } from '../../types';
import { Plus, Edit2, Trash2, Upload, AlertCircle } from 'lucide-react';

export default function TeamsAdmin() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Partial<Team>>({ genderCategory: 'Male', color: '#3b82f6' });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'teams'), (snapshot) => {
      const t: Team[] = [];
      snapshot.forEach(doc => t.push({ id: doc.id, ...doc.data() } as Team));
      setTeams(t);
    });
    return () => unsub();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    setUploadError('');
    try {
      const storageRef = ref(storage, `teams/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setCurrentTeam(prev => ({ ...prev, logoUrl: url }));
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadError(error.message || 'Failed to upload image. Check Firebase Storage rules.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTeam.id) {
      await updateDoc(doc(db, 'teams', currentTeam.id), {
        name: currentTeam.name,
        logoUrl: currentTeam.logoUrl || '',
        color: currentTeam.color,
        genderCategory: currentTeam.genderCategory,
      });
    } else {
      await addDoc(collection(db, 'teams'), {
        name: currentTeam.name,
        logoUrl: currentTeam.logoUrl || '',
        color: currentTeam.color,
        genderCategory: currentTeam.genderCategory,
        createdAt: serverTimestamp(),
      });
    }
    setIsEditing(false);
    setCurrentTeam({ genderCategory: 'Male', color: '#3b82f6' });
    setUploadError('');
  };

  const confirmDelete = async (id: string) => {
    await deleteDoc(doc(db, 'teams', id));
    setDeletingId(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Manage Teams</h1>
        <button
          onClick={() => { setIsEditing(true); setCurrentTeam({ genderCategory: 'Male', color: '#3b82f6' }); setUploadError(''); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus size={20} /> Add Team
        </button>
      </div>

      {isEditing && (
        <form onSubmit={handleSave} className="bg-slate-900 p-6 rounded-xl mb-8 border border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Team Name</label>
              <input required value={currentTeam.name || ''} onChange={e => setCurrentTeam({...currentTeam, name: e.target.value})} className="w-full bg-slate-800 rounded p-2 text-white border border-slate-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Logo URL or Upload</label>
              <div className="flex gap-2">
                <input value={currentTeam.logoUrl || ''} onChange={e => setCurrentTeam({...currentTeam, logoUrl: e.target.value})} placeholder="https://..." className="flex-1 bg-slate-800 rounded p-2 text-white border border-slate-700" />
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
              <label className="block text-sm font-medium mb-1">Color</label>
              <input type="color" required value={currentTeam.color || '#3b82f6'} onChange={e => setCurrentTeam({...currentTeam, color: e.target.value})} className="w-full h-10 bg-slate-800 rounded p-1 border border-slate-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select required value={currentTeam.genderCategory} onChange={e => setCurrentTeam({...currentTeam, genderCategory: e.target.value as any})} className="w-full bg-slate-800 rounded p-2 text-white border border-slate-700">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700">Cancel</button>
            <button type="submit" disabled={uploading} className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">Save</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map(team => (
          <div key={team.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between" style={{ borderLeftColor: team.color, borderLeftWidth: '4px' }}>
            <div className="flex items-center gap-4">
              {team.logoUrl ? <img src={team.logoUrl} alt={team.name} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold">{team.name.charAt(0)}</div>}
              <div>
                <h3 className="font-bold text-lg">{team.name}</h3>
                <p className="text-sm text-slate-400">{team.genderCategory}</p>
              </div>
            </div>
            
            {deletingId === team.id ? (
              <div className="flex gap-2">
                <button onClick={() => confirmDelete(team.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">Confirm</button>
                <button onClick={() => setDeletingId(null)} className="px-2 py-1 text-xs bg-slate-700 text-white rounded hover:bg-slate-600">Cancel</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { setCurrentTeam(team); setIsEditing(true); setUploadError(''); }} className="p-2 text-slate-400 hover:text-white"><Edit2 size={18} /></button>
                <button onClick={() => setDeletingId(team.id)} className="p-2 text-red-400 hover:text-red-300"><Trash2 size={18} /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
