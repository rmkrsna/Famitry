
import React, { useState, useRef } from 'react';
import { FamilyMember, Post } from '../types';
import { Mail, Phone, MessageSquare, LogOut, Grid, Settings, Download, Upload, Image as ImageIcon, Trash2, AlertTriangle } from 'lucide-react';

interface ProfileProps {
  currentUser: FamilyMember;
  members: Record<string, FamilyMember>;
  posts: Post[];
  onEdit: (id: string) => void;
  onLogout: () => void;
  onContactSupport: () => void;
  onImportData: (data: any) => void;
}

const Profile: React.FC<ProfileProps> = ({ 
    currentUser, members, posts, onEdit, onLogout, onContactSupport, onImportData 
}) => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'settings'>('gallery');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter posts with images for the Gallery
  const galleryImages = posts.filter(p => p.imageUrl);

  // Stats
  const familySize = Object.keys(members).length;
  // Calculate generations (rough approximation based on depth of parents)
  const calculateGenerations = () => {
     let maxDepth = 0;
     const traverse = (id: string, depth: number) => {
         if (depth > maxDepth) maxDepth = depth;
         if (depth > 5) return; // Prevent infinite loops
         const member = members[id];
         if (member && member.childrenIds.length > 0) {
             member.childrenIds.forEach(childId => traverse(childId, depth + 1));
         }
     };
     // Start from roots (people with no parents in tree)
     (Object.values(members) as FamilyMember[]).filter(m => m.parentIds.length === 0).forEach(root => traverse(root.id, 1));
     return maxDepth || 1;
  };
  const generations = calculateGenerations();

  // Handlers
  const handleExport = () => {
      const data = {
          version: '1.0',
          timestamp: new Date().toISOString(),
          members,
          posts
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `famitry_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              if (json.members && json.posts) {
                  if (window.confirm("This will overwrite your current family tree and posts. Are you sure?")) {
                      onImportData(json);
                  }
              } else {
                  alert("Invalid file format. Please upload a valid Famitry backup.");
              }
          } catch (err) {
              alert("Error reading file. Please try again.");
          }
      };
      reader.readAsText(file);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
        {/* Profile Header */}
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center relative overflow-hidden border border-gray-100">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
            
            <div className="relative z-10">
                <div className="w-32 h-32 mx-auto mb-4 relative">
                    <img 
                        src={currentUser.avatarUrl || 'https://picsum.photos/200'} 
                        className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg bg-white" 
                    />
                    <button 
                        onClick={() => onEdit(currentUser.id)}
                        className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow-md border border-gray-100 text-gray-600 hover:text-indigo-600 transition-colors"
                        title="Edit Profile"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
                
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">{currentUser.name || 'Unknown User'}</h2>
                <p className="text-gray-500 font-medium mt-1 max-w-md mx-auto">{currentUser.bio || 'Member of the family'}</p>
                
                <div className="flex justify-center gap-6 mt-4 text-sm text-gray-500">
                    {currentUser.email && (
                        <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full"><Mail className="w-3.5 h-3.5" /> {currentUser.email}</span>
                    )}
                    {currentUser.phoneNumber && (
                        <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full"><Phone className="w-3.5 h-3.5" /> {currentUser.phoneNumber}</span>
                    )}
                </div>

                {/* Stats */}
                <div className="mt-8 grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                        <span className="text-2xl font-black text-indigo-600">{familySize}</span>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mt-1">Family Members</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                        <span className="text-2xl font-black text-purple-600">{generations}</span>
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mt-1">Generations</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex">
            <button 
                onClick={() => setActiveTab('gallery')}
                className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'gallery' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <Grid className="w-4 h-4" /> Family Gallery
            </button>
            <button 
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'settings' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <Settings className="w-4 h-4" /> Data & Settings
            </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'gallery' && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[300px]">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-indigo-500" /> Shared Memories
                </h3>
                {galleryImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {galleryImages.map(post => (
                            <div key={post.id} className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer border border-gray-100">
                                <img src={post.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                    <p className="text-white text-xs font-medium truncate">{post.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No photos shared yet. Start posting in the feed!</p>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="space-y-4">
                {/* Data Management Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Download className="w-5 h-5 text-indigo-500" /> Data Management
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Your family tree is stored locally on this device. Create a backup to avoid losing data or to transfer it to another device.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                            onClick={handleExport}
                            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-indigo-50 bg-indigo-50/50 text-indigo-700 font-bold hover:bg-indigo-100 hover:border-indigo-200 transition-all"
                        >
                            <Download className="w-5 h-5" /> Backup Data (JSON)
                        </button>
                        
                        <button 
                            onClick={handleImportClick}
                            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-gray-100 bg-white text-gray-700 font-bold hover:border-gray-300 transition-all"
                        >
                            <Upload className="w-5 h-5" /> Restore Data
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept=".json" 
                            className="hidden" 
                        />
                    </div>
                </div>

                {/* Danger Zone / Support */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-gray-400" /> Support & Actions
                    </h3>
                    
                    <div className="space-y-3">
                        <button 
                            onClick={onContactSupport}
                            className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-gray-100"
                        >
                            <MessageSquare className="w-4 h-4" /> Contact Support
                        </button>
                        
                        <button 
                            onClick={onLogout}
                            className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-red-100"
                        >
                            <LogOut className="w-4 h-4" /> Log Out
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Profile;
