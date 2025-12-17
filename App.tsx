
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import FamilyTree from './components/FamilyTree';
import SocialFeed from './components/SocialFeed';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import Profile from './components/Profile';
import Directory from './components/Directory';
import FamilyStats from './components/FamilyStats';
import { FamilyMember, Post, RelationType, SupportTicket } from './types';
import { INITIAL_FAMILY, MOCK_POSTS, MOCK_USER_ID, COMMON_PROFESSIONS, COMMON_RELIGIONS, COMMON_CASTES, COMMON_SUBCASTES, COMMON_LOCATIONS, MOCK_TICKETS } from './constants';
import { generateBio, getCulturalOptions } from './services/geminiService';
import { Mail, Phone, AlertCircle, Upload, Save, Sparkles, Loader2, MessageSquare } from 'lucide-react';

const App: React.FC = () => {
  // --- Persistent State Initialization ---
  
  // 1. Members
  const [members, setMembers] = useState<Record<string, FamilyMember>>(() => {
    try {
      const saved = localStorage.getItem('famitry_members');
      return saved ? JSON.parse(saved) : INITIAL_FAMILY;
    } catch (e) {
      console.error("Failed to load members", e);
      return INITIAL_FAMILY;
    }
  });
  
  // 2. Posts
  const [posts, setPosts] = useState<Post[]>(() => {
      try {
          const saved = localStorage.getItem('famitry_posts');
          return saved ? JSON.parse(saved) : MOCK_POSTS;
      } catch (e) {
          return MOCK_POSTS;
      }
  });

  // 3. Auth
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem('famitry_current_user');
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('famitry_current_user');
  });
  
  // 4. Other Data
  const [tickets, setTickets] = useState<SupportTicket[]>(MOCK_TICKETS);

  const [activeTab, setActiveTab] = useState('tree');
  const [treeFocusId, setTreeFocusId] = useState<string | null>(null);

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem('famitry_members', JSON.stringify(members));
  }, [members]);
  
  useEffect(() => {
    localStorage.setItem('famitry_posts', JSON.stringify(posts));
  }, [posts]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addContext, setAddContext] = useState<{ relation: RelationType, relativeToId: string } | null>(null);
  
  const [generatingBio, setGeneratingBio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expanded Form State
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male',
    dob: '',
    religion: '',
    caste: '',
    subcaste: '',
    gothra: '',
    profession: '',
    location: '',
    email: '',
    phoneNumber: '',
    avatarUrl: '',
    bio: '',
  });

  // --- AI Options State ---
  const [aiSuggestions, setAiSuggestions] = useState({
    castes: [] as string[],
    subcastes: [] as string[],
    gothras: [] as string[],
  });
  
  const [loadingOptions, setLoadingOptions] = useState({
    caste: false,
    subcaste: false,
    gothra: false
  });

  // --- Auth Handlers ---

  const handleLogin = (userId: string) => {
      localStorage.setItem('famitry_current_user', userId);
      setCurrentUserId(userId);
      setIsAuthenticated(true);
  };

  const handleLogout = () => {
      localStorage.removeItem('famitry_current_user');
      setCurrentUserId(null);
      setIsAuthenticated(false);
  };

  const handleRegister = (newMember: FamilyMember) => {
      setMembers(prev => ({ ...prev, [newMember.id]: newMember }));
      handleLogin(newMember.id);
  };

  const handleClaimProfile = (memberId: string) => {
      const updatedMembers = { ...members };
      if (updatedMembers[memberId]) {
          updatedMembers[memberId] = {
              ...updatedMembers[memberId],
              joined: true,
          };
          setMembers(updatedMembers);
          handleLogin(memberId);
          alert(`Welcome back! You have successfully claimed the profile for ${updatedMembers[memberId].name}.`);
      }
  };
  
  // --- Data Management Handlers ---
  const handleImportData = (data: any) => {
      if (data.members) setMembers(data.members);
      if (data.posts) setPosts(data.posts);
      alert("Data restored successfully!");
  };

  // --- Tree Navigation Handlers ---
  const handleLocateInTree = (id: string) => {
      setTreeFocusId(id);
      setActiveTab('tree');
  };

  // --- Admin Handlers ---
  const handleAdminDeletePost = (postId: string) => {
      if (window.confirm("Are you sure you want to delete this content?")) {
          setPosts(prev => prev.filter(p => p.id !== postId));
      }
  };

  const handleAdminIgnoreReport = (postId: string) => {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isReported: false, reportReason: undefined } : p));
  };

  const handleAdminBanUser = (userId: string) => {
      if (window.confirm(`Suspend user ${members[userId].name}? They will not be able to login.`)) {
          // In a real app, this would update DB status and revoke token
          setMembers(prev => ({
              ...prev,
              [userId]: { ...prev[userId], status: 'suspended', joined: false } // Reset joined status effectively locking them out
          }));
          alert("User suspended.");
      }
  };

  const handleAdminResolveTicket = (ticketId: string) => {
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'resolved' } : t));
  };

  const handleUserContactSupport = () => {
      const message = prompt("How can we help you? Describe your issue:");
      if (message) {
          const newTicket: SupportTicket = {
              id: `t-${Date.now()}`,
              userId: currentUserId || 'unknown',
              subject: 'User Inquiry',
              message: message,
              status: 'open',
              timestamp: 'Just now'
          };
          setTickets([newTicket, ...tickets]);
          alert("Your message has been sent to our support team!");
      }
  };

  // --- Cascading AI Effects ---
  
  useEffect(() => {
    const fetchCastes = async () => {
        if (!formData.religion || formData.religion.length < 3) return;
        setLoadingOptions(prev => ({ ...prev, caste: true }));
        const options = await getCulturalOptions('caste', { religion: formData.religion });
        setAiSuggestions(prev => ({ ...prev, castes: options }));
        setLoadingOptions(prev => ({ ...prev, caste: false }));
    };
    const timer = setTimeout(fetchCastes, 1000); 
    return () => clearTimeout(timer);
  }, [formData.religion]);

  useEffect(() => {
    const fetchSubcastes = async () => {
        if (!formData.caste || formData.caste.length < 3) return;
        setLoadingOptions(prev => ({ ...prev, subcaste: true }));
        const options = await getCulturalOptions('subcaste', { religion: formData.religion, caste: formData.caste });
        setAiSuggestions(prev => ({ ...prev, subcastes: options }));
        setLoadingOptions(prev => ({ ...prev, subcaste: false }));
    };
    const timer = setTimeout(fetchSubcastes, 1000);
    return () => clearTimeout(timer);
  }, [formData.caste, formData.religion]);

  useEffect(() => {
    const fetchGothras = async () => {
        if ((!formData.subcaste || formData.subcaste.length < 3) && (!formData.caste || formData.caste.length < 3)) return;
        setLoadingOptions(prev => ({ ...prev, gothra: true }));
        const options = await getCulturalOptions('gothra', { 
            religion: formData.religion, 
            caste: formData.caste,
            subcaste: formData.subcaste 
        });
        setAiSuggestions(prev => ({ ...prev, gothras: options }));
        setLoadingOptions(prev => ({ ...prev, gothra: false }));
    };
    const timer = setTimeout(fetchGothras, 1000);
    return () => clearTimeout(timer);
  }, [formData.subcaste, formData.caste, formData.religion]);


  // --- Dynamic Autocomplete Options ---
  const suggestions = useMemo(() => {
    const allMembers = Object.values(members);
    const getOptions = (key: keyof FamilyMember, defaults: string[] = [], aiExtras: string[] = []) => {
        const uniqueSet = new Set<string>([...defaults, ...aiExtras]);
        allMembers.forEach(member => {
            const val = member[key];
            if (val && typeof val === 'string') {
                uniqueSet.add(val.trim());
            }
        });
        return Array.from(uniqueSet).sort();
    };

    return {
        religions: getOptions('religion', COMMON_RELIGIONS),
        castes: getOptions('caste', COMMON_CASTES, aiSuggestions.castes),
        subcastes: getOptions('subcaste', COMMON_SUBCASTES, aiSuggestions.subcastes),
        gothras: getOptions('gothra', [], aiSuggestions.gothras),
        professions: getOptions('profession', COMMON_PROFESSIONS),
        locations: getOptions('location', COMMON_LOCATIONS),
    };
  }, [members, aiSuggestions]);

  // --- Actions ---

  const handleAddClick = (relation: RelationType, relativeToId: string) => {
    setIsEditing(false);
    setEditingId(null);
    setAddContext({ relation, relativeToId });
    setError(null);
    setAiSuggestions({ castes: [], subcastes: [], gothras: [] });
    
    const relative = members[relativeToId];
    
    // Logic for Inheritance
    let sourceMember = relative;
    let shouldInherit = false;

    if (relation === RelationType.CHILD) {
        shouldInherit = true;
        if (relative.gender === 'Female' && relative.spouseId && members[relative.spouseId]) {
            sourceMember = members[relative.spouseId];
        } else if (relative.gender === 'Male') {
            sourceMember = relative;
        }
    } else if (relation === RelationType.SIBLING) {
        shouldInherit = true;
    } else if (relation === RelationType.SPOUSE) {
        shouldInherit = false;
    } else {
        shouldInherit = true;
    }
    
    let defaultGender = 'Male';
    if (relation === RelationType.MOTHER) defaultGender = 'Female';
    else if (relation === RelationType.FATHER) defaultGender = 'Male';
    else if (relation === RelationType.SPOUSE) defaultGender = relative.gender === 'Male' ? 'Female' : 'Male';

    setFormData({
      name: '',
      gender: defaultGender,
      dob: '',
      religion: shouldInherit ? (sourceMember.religion || '') : '',
      caste: shouldInherit ? (sourceMember.caste || '') : '',
      subcaste: shouldInherit ? (sourceMember.subcaste || '') : '',
      gothra: shouldInherit ? (sourceMember.gothra || '') : '',
      profession: '',
      location: relative.location || '',
      email: '',
      phoneNumber: '',
      avatarUrl: '',
      bio: '',
    });
    setShowModal(true);
  };

  const handleEditClick = (memberId: string) => {
    const member = members[memberId];
    if (!member) return;

    setIsEditing(true);
    setEditingId(memberId);
    setAddContext(null);
    setError(null);
    setAiSuggestions({ castes: [], subcastes: [], gothras: [] });

    setFormData({
        name: member.name,
        gender: member.gender,
        dob: member.dob,
        religion: member.religion || '',
        caste: member.caste || '',
        subcaste: member.subcaste || '',
        gothra: member.gothra || '',
        profession: member.profession || '',
        location: member.location || '',
        email: member.email || '',
        phoneNumber: member.phoneNumber || '',
        avatarUrl: member.avatarUrl,
        bio: member.bio || '',
    });
    setShowModal(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setFormData({ ...formData, avatarUrl: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSubmit = async () => {
    if (isEditing) {
        await handleUpdateMember();
    } else {
        await handleSaveNewMember();
    }
  };

  const handleUpdateMember = async () => {
    if (!editingId || !formData.name) return;

    const duplicate = (Object.values(members) as FamilyMember[]).find(m => {
        if (m.id === editingId) return false;
        const emailMatch = formData.email && m.email && m.email.toLowerCase() === formData.email.toLowerCase();
        const phoneMatch = formData.phoneNumber && m.phoneNumber && m.phoneNumber === formData.phoneNumber;
        return emailMatch || phoneMatch;
    });

    if (duplicate) {
        setError(`Another user already exists with this contact info: ${duplicate.name}.`);
        return;
    }

    const updatedMember: FamilyMember = {
        ...members[editingId],
        ...formData,
        gender: formData.gender as 'Male' | 'Female' | 'Other',
        id: editingId, 
    };

    setMembers({ ...members, [editingId]: updatedMember });
    setShowModal(false);
  };

  const handleSaveNewMember = async () => {
    if (!addContext || !formData.name) return;
    setError(null);

    const duplicate = (Object.values(members) as FamilyMember[]).find(m => {
        const emailMatch = formData.email && m.email && m.email.toLowerCase() === formData.email.toLowerCase();
        const phoneMatch = formData.phoneNumber && m.phoneNumber && m.phoneNumber === formData.phoneNumber;
        return emailMatch || phoneMatch;
    });

    if (duplicate) {
        setError(`User already exists in the tree: ${duplicate.name} (${duplicate.relation}).`);
        return;
    }

    setGeneratingBio(true);
    const bio = await generateBio({ name: formData.name, profession: formData.profession || 'Family Member' });
    setGeneratingBio(false);

    const newId = `user-${Date.now()}`;
    const relative = members[addContext.relativeToId];
    
    let finalRelation = addContext.relation;

    const relativeRelation = relative.relation;
    const isMale = formData.gender === 'Male';
    const isFemale = formData.gender === 'Female';

    // Simplified relation logic
    if (addContext.relation === RelationType.FATHER || addContext.relation === RelationType.MOTHER) {
         if (relativeRelation === RelationType.SELF) {
             finalRelation = isFemale ? RelationType.MOTHER : RelationType.FATHER;
         } else if (relativeRelation === RelationType.FATHER || relativeRelation === RelationType.MOTHER) {
             finalRelation = isFemale ? RelationType.GRANDMOTHER : RelationType.GRANDFATHER;
         } else if (relativeRelation === RelationType.SPOUSE) {
             finalRelation = isFemale ? RelationType.MOTHER_IN_LAW : RelationType.FATHER_IN_LAW;
         }
    } else if (addContext.relation === RelationType.CHILD) {
        if (relativeRelation === RelationType.SELF || relativeRelation === RelationType.SPOUSE) {
            finalRelation = isMale ? RelationType.SON : RelationType.DAUGHTER;
        } else if (relativeRelation === RelationType.FATHER || relativeRelation === RelationType.MOTHER) {
             finalRelation = isMale ? RelationType.BROTHER : RelationType.SISTER;
        } else if (relativeRelation === RelationType.GRANDFATHER || relativeRelation === RelationType.GRANDMOTHER) {
             finalRelation = isMale ? RelationType.UNCLE : RelationType.AUNT;
        } else if (relativeRelation === RelationType.UNCLE || relativeRelation === RelationType.AUNT) {
             finalRelation = RelationType.COUSIN;
        } else if (relativeRelation === RelationType.SIBLING || relativeRelation === RelationType.BROTHER || relativeRelation === RelationType.SISTER) {
             finalRelation = isMale ? RelationType.NEPHEW : RelationType.NIECE;
        } else if (relativeRelation === RelationType.SON || relativeRelation === RelationType.DAUGHTER || relativeRelation === RelationType.CHILD) {
             finalRelation = isMale ? RelationType.GRANDSON : RelationType.GRANDDAUGHTER;
        }
    } else if (addContext.relation === RelationType.SIBLING) {
        if (relativeRelation === RelationType.SELF) {
            finalRelation = isMale ? RelationType.BROTHER : RelationType.SISTER;
        } else if (relativeRelation === RelationType.FATHER || relativeRelation === RelationType.MOTHER) {
            finalRelation = isMale ? RelationType.UNCLE : RelationType.AUNT;
        } else if (relativeRelation === RelationType.SPOUSE) {
            finalRelation = isMale ? RelationType.BROTHER_IN_LAW : RelationType.SISTER_IN_LAW;
        }
    } else if (addContext.relation === RelationType.SPOUSE) {
         if (relativeRelation === RelationType.SIBLING || relativeRelation === RelationType.BROTHER || relativeRelation === RelationType.SISTER) {
             finalRelation = isMale ? RelationType.BROTHER_IN_LAW : RelationType.SISTER_IN_LAW;
         } else if (relativeRelation === RelationType.SON || relativeRelation === RelationType.DAUGHTER || relativeRelation === RelationType.CHILD) {
             finalRelation = isMale ? RelationType.SON_IN_LAW : RelationType.DAUGHTER_IN_LAW;
         }
    }

    const newMember: FamilyMember = {
        id: newId,
        name: formData.name,
        relation: finalRelation, 
        gender: formData.gender as 'Male' | 'Female' | 'Other',
        dob: formData.dob || '2000-01-01',
        religion: formData.religion,
        caste: formData.caste,
        subcaste: formData.subcaste,
        gothra: formData.gothra,
        profession: formData.profession,
        location: formData.location,
        avatarUrl: formData.avatarUrl || `https://picsum.photos/seed/${newId}/200/200`,
        isMarried: false,
        parentIds: [],
        childrenIds: [],
        joined: false,
        createdBy: currentUserId || MOCK_USER_ID,
        bio: bio,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        status: 'active'
    };

    const updatedMembers = { ...members, [newId]: newMember };

    // Linking Logic (same as before)
    if (addContext.relation === RelationType.CHILD) {
        updatedMembers[addContext.relativeToId] = {
            ...relative,
            childrenIds: [...relative.childrenIds, newId]
        };
        newMember.parentIds = [relative.id];
        if (relative.spouseId && updatedMembers[relative.spouseId]) {
            const spouse = updatedMembers[relative.spouseId];
             updatedMembers[relative.spouseId] = {
                ...spouse,
                childrenIds: [...spouse.childrenIds, newId]
            };
            newMember.parentIds.push(relative.spouseId);
        }
    } else if (addContext.relation === RelationType.SIBLING) {
        newMember.parentIds = [...relative.parentIds];
        relative.parentIds.forEach(parentId => {
            if (updatedMembers[parentId]) {
                updatedMembers[parentId] = {
                    ...updatedMembers[parentId],
                    childrenIds: [...updatedMembers[parentId].childrenIds, newId]
                };
            }
        });
    } else if (addContext.relation === RelationType.FATHER || addContext.relation === RelationType.MOTHER) {
        updatedMembers[addContext.relativeToId] = {
            ...relative,
            parentIds: [...relative.parentIds, newId]
        };
        newMember.childrenIds = [relative.id];
        const existingParentId = relative.parentIds.find(id => id !== newId);
        if (existingParentId && updatedMembers[existingParentId]) {
            updatedMembers[existingParentId] = { ...updatedMembers[existingParentId], spouseId: newId, isMarried: true };
            newMember.spouseId = existingParentId;
            newMember.isMarried = true;
        }
    } else if (addContext.relation === RelationType.SPOUSE) {
        updatedMembers[addContext.relativeToId] = {
            ...relative,
            spouseId: newId,
            isMarried: true
        };
        newMember.spouseId = relative.id;
        newMember.isMarried = true;
        newMember.childrenIds = relative.childrenIds;
        relative.childrenIds.forEach(childId => {
             if (updatedMembers[childId]) {
                 updatedMembers[childId] = {
                     ...updatedMembers[childId],
                     parentIds: [...updatedMembers[childId].parentIds, newId]
                 };
             }
        });
    }

    setMembers(updatedMembers);
    setShowModal(false);
    
    setTimeout(() => {
      const shouldInvite = window.confirm(`Added ${formData.name} successfully!\n\nWould you like to send them an invite via WhatsApp?`);
      if (shouldInvite) {
        const inviteText = `Hi ${formData.name}, I've added you to our family tree on Famitry! You can view and claim your profile here: https://famitry.app/invite/${newId}`;
        const phone = formData.phoneNumber ? formData.phoneNumber.replace(/[^0-9]/g, '') : '';
        const waUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(inviteText)}` : `https://wa.me/?text=${encodeURIComponent(inviteText)}`;
        window.open(waUrl, '_blank');
      }
    }, 300);
  };

  const renderContent = () => {
    const effectiveUser = currentUserId || MOCK_USER_ID;
    const currentUserData = members[effectiveUser];
    const isAdmin = currentUserData?.role === 'admin';
    
    switch (activeTab) {
      case 'feed':
        return <SocialFeed posts={posts} members={members} />;
      case 'tree':
        return <FamilyTree 
                    members={members} 
                    currentUser={effectiveUser} 
                    onAddMember={handleAddClick} 
                    onEditMember={handleEditClick} 
                    initialFocusId={treeFocusId}
                />;
      case 'directory':
        return <Directory members={members} currentUserId={effectiveUser} onLocateInTree={handleLocateInTree} />;
      case 'insights':
        return <FamilyStats members={members} />;
      case 'admin':
        return isAdmin ? (
            <AdminDashboard 
                members={members} 
                posts={posts} 
                tickets={tickets}
                onDeletePost={handleAdminDeletePost}
                onIgnoreReport={handleAdminIgnoreReport}
                onBanUser={handleAdminBanUser}
                onResolveTicket={handleAdminResolveTicket}
            />
        ) : <SocialFeed posts={posts} members={members} />;
      case 'profile':
        return (
            <Profile 
                currentUser={members[effectiveUser] || {
                  id: 'unknown',
                  name: 'Unknown User',
                  relation: RelationType.SELF,
                  gender: 'Other',
                  dob: '',
                  avatarUrl: '',
                  isMarried: false,
                  parentIds: [],
                  childrenIds: [],
                  joined: false
                } as FamilyMember}
                members={members}
                posts={posts}
                onEdit={handleEditClick}
                onLogout={handleLogout}
                onContactSupport={handleUserContactSupport}
                onImportData={handleImportData}
            />
        );
      default:
        return <SocialFeed posts={posts} members={members} />;
    }
  };

  if (!isAuthenticated) {
      return (
          <LoginScreen 
            members={members} 
            onLogin={handleLogin} 
            onRegister={handleRegister} 
            onClaim={handleClaimProfile}
          />
      );
  }
  
  const currentUserData = members[currentUserId || MOCK_USER_ID];
  const isAdmin = currentUserData?.role === 'admin';

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} notifications={3} isAdmin={isAdmin}>
      {renderContent()}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{isEditing ? 'Edit Profile' : 'Add Family Member'}</h3>
            <p className="text-sm text-gray-500 mb-6">
                {isEditing 
                ? `Updating details for ${members[editingId!]?.name}` 
                : `Adding ${addContext?.relation} to ${members[addContext?.relativeToId || '']?.name}'s tree.`}
            </p>
            
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="space-y-4">
               {/* Photo Upload */}
               <div className="flex justify-center mb-6">
                    <div className="relative group cursor-pointer">
                        <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                            {formData.avatarUrl ? (
                                <img src={formData.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <Upload className="w-8 h-8 text-gray-400" />
                            )}
                        </div>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <span className="text-xs text-indigo-600 font-semibold mt-2 block text-center">
                            {formData.avatarUrl ? 'Change Photo' : 'Upload Photo'}
                        </span>
                    </div>
               </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide">Full Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-gray-900 placeholder-gray-400"
                      placeholder="e.g. Vikram Sharma"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide">Gender</label>
                    <select 
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                    >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide">Date of Birth</label>
                    <input 
                      type="date" 
                      max="9999-12-31"
                      value={formData.dob}
                      onChange={(e) => {
                          const val = e.target.value;
                          const year = val.split('-')[0];
                          if (year.length > 4) return;
                          setFormData({...formData, dob: val});
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                    />
                  </div>
                  
                  <div className="col-span-2 grid grid-cols-2 gap-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                     <div className="col-span-2">
                        <p className="text-xs font-bold text-indigo-900 mb-2 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> Contact & Notification Details
                        </p>
                     </div>
                     <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide">Email Address</label>
                        <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-400"
                        placeholder="For invite notifications"
                        />
                     </div>
                     <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide">Phone Number</label>
                        <input 
                        type="tel" 
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-400"
                        placeholder="+91 98765 43210"
                        />
                     </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide">Religion</label>
                    <input 
                      type="text" 
                      list="religion-options"
                      value={formData.religion}
                      onChange={(e) => setFormData({...formData, religion: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                      placeholder="Type to search..."
                      autoComplete="off"
                    />
                    <datalist id="religion-options">
                        {suggestions.religions.map((r, i) => <option key={i} value={r} />)}
                    </datalist>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide">
                        Caste
                        {loadingOptions.caste && <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />}
                        {aiSuggestions.castes.length > 0 && !loadingOptions.caste && <Sparkles className="w-3 h-3 text-indigo-500" />}
                    </label>
                    <input 
                      type="text"
                      list="caste-options" 
                      value={formData.caste}
                      onChange={(e) => setFormData({...formData, caste: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                      placeholder={loadingOptions.caste ? "AI finding options..." : "Type to search..."}
                      autoComplete="off"
                    />
                     <datalist id="caste-options">
                        {suggestions.castes.map((c, i) => <option key={i} value={c} />)}
                    </datalist>
                  </div>

                   <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide">
                        Subcaste
                        {loadingOptions.subcaste && <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />}
                         {aiSuggestions.subcastes.length > 0 && !loadingOptions.subcaste && <Sparkles className="w-3 h-3 text-indigo-500" />}
                    </label>
                    <input 
                      type="text" 
                      list="subcaste-options"
                      value={formData.subcaste}
                      onChange={(e) => setFormData({...formData, subcaste: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                      placeholder={loadingOptions.subcaste ? "AI finding options..." : "Type to search..."}
                      autoComplete="off"
                    />
                    <datalist id="subcaste-options">
                        {suggestions.subcastes.map((sc, i) => <option key={i} value={sc} />)}
                    </datalist>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide">
                        Gothra
                        {loadingOptions.gothra && <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />}
                         {aiSuggestions.gothras.length > 0 && !loadingOptions.gothra && <Sparkles className="w-3 h-3 text-indigo-500" />}
                    </label>
                    <input 
                      type="text"
                      list="gothra-options"
                      value={formData.gothra}
                      onChange={(e) => setFormData({...formData, gothra: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-400"
                      placeholder={loadingOptions.gothra ? "AI finding options..." : "e.g. Bharadwaj"}
                      autoComplete="off"
                    />
                     <datalist id="gothra-options">
                        {suggestions.gothras.map((g, i) => <option key={i} value={g} />)}
                    </datalist>
                  </div>

                   <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide">Profession</label>
                    <input 
                      type="text" 
                      list="profession-options"
                      value={formData.profession}
                      onChange={(e) => setFormData({...formData, profession: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-400"
                      placeholder="Start typing to select..."
                      autoComplete="off"
                    />
                    <datalist id="profession-options">
                        {suggestions.professions.map((p, i) => <option key={i} value={p} />)}
                    </datalist>
                  </div>

                   <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide">Current Location</label>
                    <input 
                      type="text"
                      list="location-options"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-400"
                      placeholder="e.g. Mumbai, India"
                      autoComplete="off"
                    />
                    <datalist id="location-options">
                        {suggestions.locations.map((l, i) => <option key={i} value={l} />)}
                    </datalist>
                  </div>

              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button 
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={!formData.name || generatingBio}
                  className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-200 text-sm"
                >
                  {generatingBio ? 'Processing...' : (isEditing ? 'Save Changes' : 'Add & Invite')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
