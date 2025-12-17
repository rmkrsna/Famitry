
import React, { useState, useMemo } from 'react';
import { FamilyMember, RelationType } from '../types';
import { Search, MapPin, Briefcase, Filter, Phone, Mail, ArrowRightCircle, X, Network, ChevronRight } from 'lucide-react';

interface DirectoryProps {
  members: Record<string, FamilyMember>;
  currentUserId: string;
  onLocateInTree: (id: string) => void;
}

const Directory: React.FC<DirectoryProps> = ({ members, currentUserId, onLocateInTree }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    profession: '',
    caste: '',
    religion: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPath, setSelectedPath] = useState<{ targetId: string, path: string[] } | null>(null);

  const memberList = Object.values(members) as FamilyMember[];

  // Extract unique options for filters
  const options = useMemo(() => {
    const getUnique = (key: keyof FamilyMember) => 
        Array.from(new Set(memberList.map(m => m[key] as string).filter(Boolean))).sort();
    
    return {
        locations: getUnique('location'),
        professions: getUnique('profession'),
        castes: getUnique('caste'),
        religions: getUnique('religion')
    };
  }, [members]);

  // Filter Logic
  const filteredMembers = memberList.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            member.relation.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = !filters.location || member.location === filters.location;
      const matchesProfession = !filters.profession || member.profession === filters.profession;
      const matchesCaste = !filters.caste || member.caste === filters.caste;
      const matchesReligion = !filters.religion || member.religion === filters.religion;

      return matchesSearch && matchesLocation && matchesProfession && matchesCaste && matchesReligion;
  });

  const clearFilters = () => {
      setFilters({ location: '', profession: '', caste: '', religion: '' });
      setSearchTerm('');
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Relationship Pathfinder Logic (BFS)
  const calculatePath = (targetId: string) => {
    if (targetId === currentUserId) return;

    const queue: string[][] = [[currentUserId]];
    const visited = new Set([currentUserId]);
    
    while (queue.length > 0) {
      const path = queue.shift()!;
      const id = path[path.length - 1];
      
      if (id === targetId) {
        setSelectedPath({ targetId, path });
        return;
      }
      
      const member = members[id];
      if (!member) continue;

      // Identify Neighbors (Bidirectional graph)
      const neighbors = [
          ...member.parentIds,
          ...member.childrenIds,
          ...(member.spouseId ? [member.spouseId] : [])
      ];

      for (const neighborId of neighbors) {
          if (!visited.has(neighborId)) {
              visited.add(neighborId);
              queue.push([...path, neighborId]);
          }
      }
    }
    // No path found
    setSelectedPath({ targetId, path: [] });
  };

  const getRelationshipName = (fromId: string, toId: string): string => {
      const from = members[fromId];
      const to = members[toId];
      if (!from || !to) return 'Unknown';

      if (from.childrenIds.includes(toId)) {
          return to.gender === 'Male' ? 'Son' : 'Daughter';
      }
      if (from.parentIds.includes(toId)) {
          return to.gender === 'Male' ? 'Father' : 'Mother';
      }
      if (from.spouseId === toId) return 'Spouse';
      
      // Fallback for siblings (if parents match but no direct edge stored in simple graph traversal)
      const sharedParents = from.parentIds.filter(pid => to.parentIds.includes(pid));
      if (sharedParents.length > 0) return to.gender === 'Male' ? 'Brother' : 'Sister';

      return 'Relative';
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-20 relative">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Family Directory</h2>
                <p className="text-gray-500 text-sm">Find and connect with {memberList.length} relatives.</p>
            </div>
            
            <div className="flex gap-2">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search by name..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2.5 rounded-xl border transition-colors flex items-center gap-2 ${showFilters || activeFilterCount > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                    <Filter className="w-4 h-4" />
                    {activeFilterCount > 0 && <span className="bg-indigo-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">{activeFilterCount}</span>}
                </button>
            </div>
        </div>

        {/* Expandable Filters */}
        {(showFilters || activeFilterCount > 0) && (
            <div className="pt-4 border-t border-gray-100 animate-fade-in">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <select 
                        className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-indigo-500"
                        value={filters.location}
                        onChange={(e) => setFilters({...filters, location: e.target.value})}
                    >
                        <option value="">All Locations</option>
                        {options.locations.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>

                    <select 
                        className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-indigo-500"
                        value={filters.profession}
                        onChange={(e) => setFilters({...filters, profession: e.target.value})}
                    >
                        <option value="">All Professions</option>
                        {options.professions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>

                    <select 
                        className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-indigo-500"
                        value={filters.caste}
                        onChange={(e) => setFilters({...filters, caste: e.target.value})}
                    >
                        <option value="">All Castes</option>
                        {options.castes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                     
                     <div className="flex items-center">
                        {activeFilterCount > 0 && (
                            <button onClick={clearFilters} className="text-sm text-red-500 font-bold hover:underline flex items-center gap-1">
                                <X className="w-3 h-3" /> Clear Filters
                            </button>
                        )}
                     </div>
                </div>
            </div>
        )}
      </div>

      {/* Relationship Path Modal/Overlay */}
      {selectedPath && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedPath(null)}>
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold">Relationship Path</h3>
                        <p className="text-indigo-100 text-xs">Connection to {members[selectedPath.targetId]?.name}</p>
                    </div>
                    <button onClick={() => setSelectedPath(null)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {selectedPath.path.length > 0 ? (
                        <div className="relative">
                             {/* Vertical Line */}
                             <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-200"></div>
                             
                             <div className="space-y-6">
                                {selectedPath.path.map((id, index) => {
                                    const member = members[id];
                                    const nextId = selectedPath.path[index + 1];
                                    const relationLabel = nextId ? getRelationshipName(id, nextId) : 'Target';
                                    const isMe = id === currentUserId;

                                    return (
                                        <div key={id} className="relative flex items-center gap-4 group">
                                            <div className={`relative z-10 w-12 h-12 rounded-full border-4 ${isMe ? 'border-indigo-100' : 'border-white'} shadow-sm overflow-hidden flex-shrink-0 bg-white`}>
                                                <img src={member.avatarUrl} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-100 group-hover:border-indigo-200 transition-colors">
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-sm font-bold ${isMe ? 'text-indigo-600' : 'text-gray-900'}`}>
                                                        {isMe ? 'You' : member.name}
                                                    </span>
                                                    {index < selectedPath.path.length - 1 && (
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase bg-white px-2 py-0.5 rounded-full border border-gray-200">
                                                            is {relationLabel} of
                                                        </span>
                                                    )}
                                                </div>
                                                {index === selectedPath.path.length - 1 && (
                                                    <p className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1">
                                                        <Network className="w-3 h-3" /> Connected!
                                                    </p>
                                                )}
                                            </div>
                                            {index < selectedPath.path.length - 1 && (
                                                <div className="absolute left-6 top-10 w-6 h-6 flex items-center justify-center">
                                                    <ChevronRight className="w-4 h-4 text-gray-400 rotate-90 mt-4" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                             </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Network className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No direct relationship path found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Grid Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map(member => (
            <div key={member.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <img src={member.avatarUrl} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                        <div>
                            <h3 className="font-bold text-gray-900 leading-tight">{member.name}</h3>
                            <p className="text-xs text-indigo-600 font-semibold">{member.relation}</p>
                        </div>
                    </div>
                    {member.id === currentUserId && (
                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">YOU</span>
                    )}
                </div>

                <div className="space-y-2 mb-6 flex-1">
                    {member.profession && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                            {member.profession}
                        </div>
                    )}
                    {member.location && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {member.location}
                        </div>
                    )}
                    {(member.caste || member.subcaste) && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {member.religion && <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md text-[10px] font-medium">{member.religion}</span>}
                            {member.caste && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-medium">{member.caste}</span>}
                            {member.subcaste && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-[10px] font-medium">{member.subcaste}</span>}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                    <div className="flex gap-2">
                         {member.id !== currentUserId && (
                            <button 
                                onClick={() => calculatePath(member.id)}
                                className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors"
                                title="See Connection Path"
                            >
                                <Network className="w-4 h-4" />
                            </button>
                        )}
                        {member.phoneNumber && (
                            <a href={`tel:${member.phoneNumber}`} className="p-2 bg-gray-50 hover:bg-green-50 text-gray-500 hover:text-green-600 rounded-lg transition-colors">
                                <Phone className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                    <button 
                        onClick={() => onLocateInTree(member.id)}
                        className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
                    >
                        Locate in Tree <ArrowRightCircle className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        ))}

        {filteredMembers.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No family members found matching your filters.</p>
                <button onClick={clearFilters} className="text-indigo-600 font-bold text-sm mt-2 hover:underline">Clear Filters</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default Directory;
