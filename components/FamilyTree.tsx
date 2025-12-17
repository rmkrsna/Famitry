
import React, { useState, useRef, useEffect } from 'react';
import { FamilyMember, RelationType } from '../types';
import { Plus, Minus, Move, Edit2, MapPin, Briefcase, UserPlus, Heart, ArrowUpCircle, Users, Search, Maximize2, Target } from 'lucide-react';

interface FamilyTreeProps {
  members: Record<string, FamilyMember>;
  currentUser: string;
  onAddMember: (relation: RelationType, relativeToId: string) => void;
  onEditMember: (memberId: string) => void;
  initialFocusId?: string | null; // Added Prop
}

const FamilyTree: React.FC<FamilyTreeProps> = ({ members, currentUser, onAddMember, onEditMember, initialFocusId }) => {
  const [focusId, setFocusId] = useState(initialFocusId || currentUser);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Effect to handle external focus changes (from Directory)
  useEffect(() => {
    if (initialFocusId && initialFocusId !== focusId) {
        setFocusId(initialFocusId);
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }
  }, [initialFocusId]);

  // --- Search Logic ---
  const filteredMembers = (Object.values(members) as FamilyMember[]).filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchSelect = (id: string) => {
    setFocusId(id);
    setSearchTerm('');
    setShowSearchResults(false);
    setScale(1); // Reset zoom to focus on them clearly
    setPosition({ x: 0, y: 0 });
  };

  // --- Pan & Zoom Handlers (Mouse) ---
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if clicking the background, not buttons/cards
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.node-card')) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // --- Pan Handlers (Touch/Mobile) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.node-card')) return;
    
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      const touch = e.touches[0];
      setPosition({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setScale(prev => Math.min(Math.max(0.2, prev + delta), 2));
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setFocusId(currentUser);
  };

  // --- Tree Traversal & Root Finding ---
  const getRoots = (startId: string) => {
    let current = members[startId];
    if (!current) return [];
    
    // Traverse up to find the oldest ancestor of the current view
    // We limit depth to prevent infinite loops if data is bad
    let depth = 0;
    const visited = new Set<string>();
    
    while (current && current.parentIds.length > 0 && depth < 10 && !visited.has(current.id)) {
        visited.add(current.id);
        const fatherId = current.parentIds.find(pid => members[pid]?.gender === 'Male');
        const parentId = fatherId || current.parentIds[0];
        if (members[parentId]) {
            current = members[parentId];
        } else {
            break;
        }
        depth++;
    }
    return [current];
  };
  
  const currentRoots = getRoots(focusId);

  // --- Components ---

  const ActionButton = ({ icon: Icon, onClick, label, color = "text-gray-500", bg = "hover:bg-gray-100" }: any) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`p-1.5 rounded-full ${bg} transition-colors ${color}`}
        title={label}
    >
        <Icon className="w-3.5 h-3.5" />
    </button>
  );

  const FamilyNodeCard: React.FC<{ member: FamilyMember }> = ({ member }) => {
    const isFocus = member.id === focusId;
    const isCurrentUser = member.id === currentUser;
    
    // Parent Logic: Check who is missing
    const hasFather = member.parentIds.some(pid => members[pid]?.gender === 'Male');
    // If we need to add a parent, determine best default (Father if neither, else whatever is missing)
    const nextParentType = !hasFather ? RelationType.FATHER : RelationType.MOTHER;

    // Permission Logic
    // 1. Can always edit Self
    // 2. Can edit others ONLY if they haven't joined AND you created them
    const isCreator = member.createdBy === currentUser;
    const hasJoined = member.joined;
    const canEdit = isCurrentUser || (isCreator && !hasJoined);

    return (
        <div 
            className={`
                node-card group relative flex flex-col items-center bg-white rounded-xl shadow-sm border-2 
                transition-all duration-300 w-60 overflow-hidden hover:shadow-lg cursor-pointer
                ${isFocus ? 'border-indigo-600 ring-4 ring-indigo-50/50' : isCurrentUser ? 'border-indigo-400' : 'border-gray-200 hover:border-indigo-300'}
            `}
            onClick={(e) => { 
                e.stopPropagation(); 
                setFocusId(member.id); 
            }}
        >
            {/* Header / Banner */}
            <div className={`w-full h-14 ${member.gender === 'Female' ? 'bg-gradient-to-r from-pink-50 to-rose-50' : 'bg-gradient-to-r from-blue-50 to-indigo-50'} border-b border-gray-100 relative`}>
                {isCurrentUser && (
                   <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                       YOU
                   </div>
                )}
                
                {/* Only Show Edit button if permissions allow */}
                {canEdit && (
                    <div className="absolute top-2 right-2 flex space-x-1 bg-white/60 backdrop-blur-sm rounded-full p-1 shadow-sm border border-white/50">
                        <ActionButton icon={Edit2} label="Edit Profile" onClick={() => onEditMember(member.id)} color="text-blue-600" bg="hover:bg-blue-50" />
                    </div>
                )}
            </div>

            {/* Avatar */}
            <div className="-mt-8 mb-2 relative">
                <img 
                    src={member.avatarUrl} 
                    alt={member.name} 
                    className={`w-16 h-16 rounded-full object-cover border-4 border-white shadow-md ${member.joined ? '' : 'grayscale'}`}
                />
                 {!member.joined && (
                    <span className="absolute -bottom-1 -right-2 bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-amber-200">
                        INVITE
                    </span>
                )}
            </div>

            {/* Details */}
            <div className="px-3 pb-3 text-center w-full">
                <h3 className="font-bold text-gray-900 truncate text-sm">{member.name}</h3>
                <p className="text-xs text-indigo-600 font-semibold mb-2">{member.relation}</p>
                
                <div className="space-y-1 mb-3">
                    {member.profession && (
                        <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500">
                            <Briefcase className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{member.profession}</span>
                        </div>
                    )}
                    {member.location && (
                        <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{member.location}</span>
                        </div>
                    )}
                </div>

                {/* Visible Quick Actions */}
                <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-2 justify-center">
                     {/* Add Child */}
                     <button 
                        onClick={(e) => { e.stopPropagation(); onAddMember(RelationType.CHILD, member.id); }}
                        className="flex-1 min-w-[50px] flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 transition-colors"
                        title="Add Child"
                     >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-bold">Child</span>
                     </button>

                     {/* Add Spouse (Only if not married) */}
                     {!member.isMarried && (
                        <button 
                             onClick={(e) => { e.stopPropagation(); onAddMember(RelationType.SPOUSE, member.id); }}
                             className="flex-1 min-w-[50px] flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 transition-colors"
                             title="Add Spouse"
                        >
                            <Heart className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-bold">Spouse</span>
                        </button>
                     )}
                     
                     {/* Add Sibling (Only if parents exist to link to) */}
                     {member.parentIds.length > 0 && (
                        <button 
                             onClick={(e) => { e.stopPropagation(); onAddMember(RelationType.SIBLING, member.id); }}
                             className="flex-1 min-w-[50px] flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100 transition-colors"
                             title="Add Sibling"
                        >
                            <Users className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-bold">Sibling</span>
                        </button>
                     )}

                     {/* Add Parent (If less than 2 parents) */}
                     {member.parentIds.length < 2 && (
                        <button 
                             onClick={(e) => { e.stopPropagation(); onAddMember(nextParentType, member.id); }}
                             className="flex-1 min-w-[50px] flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 transition-colors"
                             title={`Add ${nextParentType}`}
                        >
                            <ArrowUpCircle className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-bold">Parent</span>
                        </button>
                     )}
                </div>
            </div>
        </div>
    );
  };

  const TreeNode: React.FC<{ memberId: string }> = ({ memberId }) => {
      const member = members[memberId];
      if (!member) return null;

      const spouse = member.spouseId ? members[member.spouseId] : null;
      const childrenIds = member.childrenIds || [];

      return (
          <li>
              <div className="tree-node-content">
                  <div className="flex items-start gap-4 p-2 bg-white/40 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm transition-all hover:bg-white/60">
                      <FamilyNodeCard member={member} />
                      {spouse && (
                          <div className="relative">
                            {/* Connector between spouses */}
                            <div className="absolute top-16 -left-4 w-4 border-t-2 border-slate-400 border-dashed"></div>
                            <FamilyNodeCard member={spouse} />
                          </div>
                      )}
                  </div>
              </div>
              
              {childrenIds.length > 0 && (
                  <ul>
                      {childrenIds.map(childId => (
                          <TreeNode key={childId} memberId={childId} />
                      ))}
                  </ul>
              )}
          </li>
      );
  };

  // --- Main Render ---
  return (
    <div className="w-full h-full relative bg-slate-50 overflow-hidden select-none flex flex-col">
        
        {/* Top Bar: Search & Controls */}
        <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-start pointer-events-none">
            {/* Search Bar */}
            <div className="relative pointer-events-auto w-full max-w-xs">
                 <div className="relative bg-white rounded-xl shadow-lg border border-gray-100 flex items-center px-3 py-2">
                     <Search className="w-4 h-4 text-gray-400 mr-2" />
                     <input 
                        type="text" 
                        placeholder="Search family member..."
                        className="text-sm bg-transparent outline-none w-full text-gray-700 placeholder-gray-400"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowSearchResults(true);
                        }}
                     />
                 </div>
                 {showSearchResults && searchTerm && (
                     <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto">
                        {filteredMembers.length > 0 ? (
                            filteredMembers.map(m => (
                                <button 
                                    key={m.id}
                                    className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm flex items-center gap-2"
                                    onClick={() => handleSearchSelect(m.id)}
                                >
                                    <img src={m.avatarUrl} className="w-6 h-6 rounded-full" />
                                    <span className="truncate">{m.name}</span>
                                    {m.id === currentUser && <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1 rounded ml-auto">YOU</span>}
                                </button>
                            ))
                        ) : (
                            <div className="p-3 text-xs text-gray-500 text-center">No members found.</div>
                        )}
                     </div>
                 )}
            </div>

            {/* View Controls */}
            <div className="flex flex-col gap-2 pointer-events-auto bg-white p-1.5 rounded-xl shadow-lg border border-gray-100">
                <button onClick={() => handleZoom(0.1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Zoom In"><Plus className="w-5 h-5" /></button>
                <button onClick={() => handleZoom(-0.1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Zoom Out"><Minus className="w-5 h-5" /></button>
                <button onClick={resetView} className="p-2 hover:bg-gray-100 rounded-lg text-indigo-600" title="Center on Me"><Target className="w-5 h-5" /></button>
                <button 
                  onClick={() => containerRef.current?.requestFullscreen()} 
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hidden md:block"
                  title="Fullscreen"
                >
                    <Maximize2 className="w-5 h-5" />
                </button>
            </div>
        </div>

        <div className="absolute bottom-4 left-4 z-50 bg-white/80 backdrop-blur px-4 py-2 rounded-lg text-xs text-gray-500 border border-gray-200 pointer-events-none">
            Drag to Pan • Pinch/Scroll to Zoom • Tap person to focus
        </div>

        {/* Canvas */}
        <div 
            ref={containerRef}
            className={`w-full h-full cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={(e) => handleZoom(e.deltaY > 0 ? -0.1 : 0.1)}
        >
            <div 
                className="tree-container origin-center transition-transform duration-75 ease-out"
                style={{ 
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                }}
            >
                <div className="tree">
                    <ul>
                        {currentRoots.map(root => (
                            <TreeNode key={root.id} memberId={root.id} />
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    </div>
  );
};

export default FamilyTree;
