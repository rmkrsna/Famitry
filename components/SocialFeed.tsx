

import React, { useState, useMemo } from 'react';
import { Post, FamilyMember, PostCategory } from '../types';
import { Heart, MessageCircle, Calendar, Gift, Send, X, AlertCircle, Loader2, Sparkles, CheckCircle, Bell, Trophy, MailOpen, User, Megaphone } from 'lucide-react';
import { MOCK_USER_ID } from '../constants';
import { analyzePost } from '../services/geminiService';

interface SocialFeedProps {
  posts: Post[];
  members: Record<string, FamilyMember>;
}

// --- Actionable Card Components ---

const ActionButton = ({ onClick, icon: Icon, label, variant = 'primary', disabled = false }: any) => {
    const base = "flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm";
    const styles = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700",
        secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
        success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
        disabled: "bg-gray-100 text-gray-400 cursor-not-allowed"
    };
    return (
        <button 
            onClick={onClick} 
            disabled={disabled}
            className={`${base} ${disabled ? styles.disabled : styles[variant as keyof typeof styles]}`}
        >
            <Icon className="w-3.5 h-3.5" /> {label}
        </button>
    );
};

interface PostContainerProps {
    post: Post;
    author: FamilyMember;
    children: React.ReactNode;
    onCommentSubmit: (id: string, text: string) => void;
}

const PostContainer: React.FC<PostContainerProps> = ({ post, author, children, onCommentSubmit }) => {
    const [commentText, setCommentText] = useState('');

    const handleSubmit = () => {
        if (!commentText.trim()) return;
        onCommentSubmit(post.id, commentText);
        setCommentText('');
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-3 animate-fade-in-up">
            <div className="flex items-start gap-3 mb-2">
                 <img src={author.avatarUrl} className="w-8 h-8 rounded-full object-cover" />
                 <div className="flex-1">
                     <div className="flex justify-between items-start">
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">{author.name}</h4>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{post.type} • {post.timestamp}</p>
                        </div>
                     </div>
                 </div>
            </div>
            <div className="mb-3">
                <p className="text-gray-800 text-sm leading-relaxed">{post.content}</p>
                {post.imageUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden max-h-80 w-full">
                        <img src={post.imageUrl} className="w-full h-full object-cover" />
                    </div>
                )}
            </div>
            {children}
            
            {/* Comment Input Section */}
            <div className="mt-3 pt-3 border-t border-gray-50 flex gap-2">
                <input 
                    type="text" 
                    placeholder="Write a comment..."
                    className="flex-1 bg-gray-50 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300 text-gray-900"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <button 
                    onClick={handleSubmit}
                    disabled={!commentText.trim()}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 disabled:opacity-50"
                >
                    <Send className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

// --- Specific Cards ---

const InvitationCard: React.FC<{ post: Post, author: FamilyMember, onRsvp: (id: string, status: 'attending' | 'declined' | 'pending') => void, onComment: (id: string, text: string) => void }> = ({ post, author, onRsvp, onComment }) => {
    return (
        <PostContainer post={post} author={author} onCommentSubmit={onComment}>
             <div className="bg-amber-50 rounded-xl p-3 mb-3 border border-amber-100 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase">
                     <MailOpen className="w-4 h-4" /> Invitation
                 </div>
                 {post.rsvpStatus === 'attending' && <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Attending</span>}
                 {post.rsvpStatus === 'declined' && <span className="text-xs font-bold text-red-500">Declined</span>}
             </div>
             
             {(!post.rsvpStatus || post.rsvpStatus === 'pending') ? (
                 <div className="flex gap-3">
                     <ActionButton icon={CheckCircle} label="Accept" onClick={() => onRsvp(post.id, 'attending')} />
                     <ActionButton icon={X} label="Decline" variant="secondary" onClick={() => onRsvp(post.id, 'declined')} />
                 </div>
             ) : (
                <div className="flex justify-end">
                    <button onClick={() => onRsvp(post.id, 'pending')} className="text-xs text-gray-400 hover:text-indigo-500 underline">Change Response</button>
                </div>
             )}
        </PostContainer>
    );
};

const BirthdayCard: React.FC<{ post: Post, author: FamilyMember, onWish: (id: string) => void, onComment: (id: string, text: string) => void }> = ({ post, author, onWish, onComment }) => {
    return (
        <PostContainer post={post} author={author} onCommentSubmit={onComment}>
            {post.isWished ? (
                 <div className="bg-pink-50 text-pink-700 p-2 rounded-xl text-center text-xs font-bold border border-pink-100">
                     ✨ You sent warm wishes!
                 </div>
            ) : (
                <div className="flex gap-3">
                    <ActionButton icon={Sparkles} label="Send Wishes" onClick={() => onWish(post.id)} variant="primary" />
                    <ActionButton icon={Gift} label="Send Gift" variant="secondary" onClick={() => alert("Marketplace integration coming soon!")} />
                </div>
            )}
        </PostContainer>
    );
};

const ReminderCard: React.FC<{ post: Post, author: FamilyMember, onComment: (id: string, text: string) => void }> = ({ post, author, onComment }) => (
    <PostContainer post={post} author={author} onCommentSubmit={onComment}>
        <div className="bg-orange-50 rounded-lg p-3 flex items-start gap-3">
            <div className="bg-orange-100 p-1.5 rounded-full text-orange-600">
                <AlertCircle className="w-4 h-4" />
            </div>
            <div>
                <p className="text-xs font-bold text-gray-800">Reminder</p>
                <p className="text-xs text-gray-600">{post.content}</p>
            </div>
        </div>
    </PostContainer>
);

const StandardPostCard: React.FC<{ post: Post, author: FamilyMember, onLike: (id: string) => void, onComment: (id: string, text: string) => void }> = ({ post, author, onLike, onComment }) => {
    const isSelf = author.id === MOCK_USER_ID;
    
    return (
        <PostContainer post={post} author={author} onCommentSubmit={onComment}>
             <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => onLike(post.id)}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${post.likes > 0 ? 'text-rose-500' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        <Heart className={`w-4 h-4 ${post.likes > 0 ? 'fill-current' : ''}`} /> {post.likes || 'Like'}
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900">
                        <MessageCircle className="w-4 h-4" /> {post.comments || 'Comment'}
                    </button>
                </div>
             </div>
             
             {/* Show Recent Comments */}
             {post.commentsList && post.commentsList.length > 0 && (
                 <div className="mt-3 bg-gray-50 rounded-xl p-3 space-y-2">
                     {post.commentsList.slice(-2).map(c => (
                         <div key={c.id} className="text-xs flex gap-2">
                             <span className="font-bold text-gray-800">{c.authorId === MOCK_USER_ID ? 'You' : 'Relative'}:</span>
                             <span className="text-gray-700">{c.content}</span>
                         </div>
                     ))}
                     {post.commentsList.length > 2 && <p className="text-[10px] text-gray-400">View all comments</p>}
                 </div>
             )}
        </PostContainer>
    );
};


// --- Main Feed Component ---

const SocialFeed: React.FC<SocialFeedProps> = ({ posts: initialPosts, members }) => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [selectedView, setSelectedView] = useState<'all' | 'invitation' | 'birthday' | 'reminder' | 'milestone' | 'my_posts'>('all');
  
  // Post Creation
  const [createMode, setCreateMode] = useState<PostCategory | null>(null);
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // --- Derived State: Counts & Filtering ---
  const { viewPosts, counts } = useMemo(() => {
      const counts = {
          invitation: 0,
          birthday: 0,
          reminder: 0,
          milestone: 0
      };

      // Calculate Badge Counts (Unseen/Actionable items)
      posts.forEach(p => {
          if (p.type === 'invitation' && (!p.rsvpStatus || p.rsvpStatus === 'pending')) counts.invitation++;
          if (p.type === 'birthday' && !p.isWished) counts.birthday++;
          if (p.type === 'reminder') counts.reminder++; // Simple count for reminders
          if (p.type === 'milestone') counts.milestone++; // Simple count
      });

      // Filter Logic
      let filtered = posts;
      if (selectedView === 'my_posts') {
          filtered = posts.filter(p => p.authorId === MOCK_USER_ID);
      } else if (selectedView !== 'all') {
          filtered = posts.filter(p => p.type === selectedView);
      }

      return { viewPosts: filtered, counts };
  }, [posts, selectedView]);

  // --- Actions ---
  const handleLike = (id: string) => {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  };

  const handleRsvp = (id: string, status: 'attending' | 'declined' | 'pending') => {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, rsvpStatus: status } : p));
  };

  const handleWish = (id: string) => {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, isWished: true, comments: p.comments + 1, commentsList: [...(p.commentsList || []), { id: `c-${Date.now()}`, authorId: MOCK_USER_ID, content: 'Happy Birthday! 🎉', timestamp: 'Just now' }] } : p));
  };

  const handleComment = (id: string, text: string) => {
      setPosts(prev => prev.map(p => p.id === id ? { 
          ...p, 
          comments: p.comments + 1,
          commentsList: [...(p.commentsList || []), { id: `c-${Date.now()}`, authorId: MOCK_USER_ID, content: text, timestamp: 'Just now' }]
      } : p));
  };

  const handleCreatePost = async () => {
      if (!postContent.trim() || !createMode) return;
      setIsPosting(true);
      
      // If user selected general, try to auto-categorize, else respect their choice
      let finalType = createMode;
      if (createMode === 'general') {
        const analyzed = await analyzePost(postContent);
        finalType = analyzed;
      }

      const newPost: Post = {
          id: `new-${Date.now()}`,
          authorId: MOCK_USER_ID,
          content: postContent,
          timestamp: 'Just now',
          likes: 0,
          comments: 0,
          type: finalType,
          privacy: 'public',
          rsvpStatus: 'pending', // Default for invites
          isWished: false
      };

      setPosts([newPost, ...posts]);
      setPostContent('');
      setCreateMode(null);
      setIsPosting(false);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      {/* --- 1. FAMILY HUB DASHBOARD (Top Cards) --- */}
      <div className="mb-6">
          <div className="flex justify-between items-end mb-3">
              <h1 className="text-xl font-serif font-bold text-gray-900">Family Hub</h1>
              {selectedView !== 'all' && (
                  <button onClick={() => setSelectedView('all')} className="text-xs font-bold text-indigo-600 hover:underline">
                      View All Updates
                  </button>
              )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Invitations Card */}
              <button 
                onClick={() => setSelectedView('invitation')}
                className={`relative p-3 rounded-xl text-left transition-all border ${selectedView === 'invitation' ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 border-transparent' : 'bg-white hover:bg-indigo-50 border-gray-100 hover:border-indigo-200'}`}
              >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${selectedView === 'invitation' ? 'bg-white/20' : 'bg-indigo-100 text-indigo-600'}`}>
                      <MailOpen className="w-4 h-4" />
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${selectedView === 'invitation' ? 'text-indigo-200' : 'text-gray-500'}`}>Invitations</p>
                  <div className="flex justify-between items-end">
                      <span className="text-lg font-bold">Events</span>
                      {counts.invitation > 0 && (
                          <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">{counts.invitation}</span>
                      )}
                  </div>
              </button>

              {/* Birthdays Card */}
              <button 
                onClick={() => setSelectedView('birthday')}
                className={`relative p-3 rounded-xl text-left transition-all border ${selectedView === 'birthday' ? 'bg-pink-600 text-white ring-4 ring-pink-100 border-transparent' : 'bg-white hover:bg-pink-50 border-gray-100 hover:border-pink-200'}`}
              >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${selectedView === 'birthday' ? 'bg-white/20' : 'bg-pink-100 text-pink-600'}`}>
                      <Gift className="w-4 h-4" />
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${selectedView === 'birthday' ? 'text-pink-200' : 'text-gray-500'}`}>Celebrations</p>
                  <div className="flex justify-between items-end">
                      <span className="text-lg font-bold">Birthdays</span>
                      {counts.birthday > 0 && (
                          <span className="bg-white text-pink-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{counts.birthday}</span>
                      )}
                  </div>
              </button>

              {/* Reminders Card */}
              <button 
                onClick={() => setSelectedView('reminder')}
                className={`relative p-3 rounded-xl text-left transition-all border ${selectedView === 'reminder' ? 'bg-orange-500 text-white ring-4 ring-orange-100 border-transparent' : 'bg-white hover:bg-orange-50 border-gray-100 hover:border-orange-200'}`}
              >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${selectedView === 'reminder' ? 'bg-white/20' : 'bg-orange-100 text-orange-600'}`}>
                      <Bell className="w-4 h-4" />
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${selectedView === 'reminder' ? 'text-orange-100' : 'text-gray-500'}`}>Notices</p>
                  <div className="flex justify-between items-end">
                      <span className="text-lg font-bold">Reminders</span>
                      <span className="opacity-80 text-[10px] mb-1">{counts.reminder} Active</span>
                  </div>
              </button>

              {/* Milestones / News Card */}
              <button 
                onClick={() => setSelectedView('milestone')}
                className={`relative p-3 rounded-xl text-left transition-all border ${selectedView === 'milestone' ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 border-transparent' : 'bg-white hover:bg-emerald-50 border-gray-100 hover:border-emerald-200'}`}
              >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${selectedView === 'milestone' ? 'bg-white/20' : 'bg-emerald-100 text-emerald-600'}`}>
                      <Trophy className="w-4 h-4" />
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${selectedView === 'milestone' ? 'text-emerald-200' : 'text-gray-500'}`}>Highlights</p>
                  <div className="flex justify-between items-end">
                      <span className="text-lg font-bold">News</span>
                      <span className="opacity-80 text-[10px] mb-1">{counts.milestone} Stories</span>
                  </div>
              </button>
          </div>
      </div>

      {/* --- 2. CREATE UPDATE SECTION --- */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          {!createMode ? (
              <div className="flex items-center gap-3">
                  <img src={members[MOCK_USER_ID].avatarUrl} className="w-8 h-8 rounded-full object-cover" />
                  <div className="flex-1 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      <button onClick={() => setCreateMode('general')} className="flex-1 py-1.5 px-3 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 text-xs font-medium text-left truncate">
                          Share an update...
                      </button>
                      <button onClick={() => setCreateMode('invitation')} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold hover:bg-indigo-100">
                          <Calendar className="w-3.5 h-3.5" /> Plan Event
                      </button>
                      <button onClick={() => setCreateMode('milestone')} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold hover:bg-emerald-100">
                          <Megaphone className="w-3.5 h-3.5" /> Announce
                      </button>
                      <button onClick={() => setCreateMode('birthday')} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-600 rounded-full text-[10px] font-bold hover:bg-pink-100">
                          <Gift className="w-3.5 h-3.5" /> Wish
                      </button>
                  </div>
              </div>
          ) : (
              <div className="animate-fade-in">
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 flex items-center gap-2">
                          {createMode === 'invitation' && <><Calendar className="w-3.5 h-3.5 text-indigo-500" /> Planning Event</>}
                          {createMode === 'milestone' && <><Trophy className="w-3.5 h-3.5 text-emerald-500" /> Sharing Milestone</>}
                          {createMode === 'birthday' && <><Gift className="w-3.5 h-3.5 text-pink-500" /> Birthday Wish</>}
                          {createMode === 'general' && <><MessageCircle className="w-3.5 h-3.5 text-gray-500" /> General Update</>}
                      </span>
                      <button onClick={() => setCreateMode(null)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
                  </div>
                  <textarea 
                      className="w-full h-20 p-2 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm text-gray-900"
                      placeholder={createMode === 'invitation' ? "What's the occasion? When and where?" : "What's on your mind?"}
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      autoFocus
                  />
                  <div className="flex justify-end mt-2 gap-2">
                      <button 
                        onClick={() => setCreateMode(null)} 
                        className="px-4 py-1.5 text-gray-600 font-bold hover:bg-gray-100 rounded-lg text-xs"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleCreatePost}
                        disabled={!postContent.trim() || isPosting}
                        className="px-4 py-1.5 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                      >
                          {isPosting ? <Loader2 className="w-3 h-3 animate-spin" /> : <>Post Update <Send className="w-3 h-3" /></>}
                      </button>
                  </div>
              </div>
          )}
      </div>

      {/* --- 3. FILTER & FEED --- */}
      <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
               <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                   {selectedView === 'my_posts' ? <><User className="w-3.5 h-3.5"/> My Activity & Responses</> : 'Recent Updates'}
               </h3>
               <button 
                  onClick={() => setSelectedView(selectedView === 'my_posts' ? 'all' : 'my_posts')}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${selectedView === 'my_posts' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               >
                   {selectedView === 'my_posts' ? 'Show All Posts' : 'Show My Activity'}
               </button>
          </div>

          <div className="space-y-3">
              {viewPosts.length > 0 ? viewPosts.map(post => {
                  const author = members[post.authorId];
                  if (!author) return null;
                  
                  if (post.type === 'invitation') {
                      return <InvitationCard key={post.id} post={post} author={author} onRsvp={handleRsvp} onComment={handleComment} />;
                  }
                  if (post.type === 'birthday') {
                      return <BirthdayCard key={post.id} post={post} author={author} onWish={handleWish} onComment={handleComment} />;
                  }
                  if (post.type === 'reminder') {
                      return <ReminderCard key={post.id} post={post} author={author} onComment={handleComment} />;
                  }
                  return <StandardPostCard key={post.id} post={post} author={author} onLike={handleLike} onComment={handleComment} />;
              }) : (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <p className="text-gray-400 text-xs">No updates found in this category.</p>
                      <button onClick={() => setSelectedView('all')} className="mt-2 text-indigo-600 font-bold text-[10px]">Clear Filters</button>
                  </div>
              )}
          </div>
      </div>

    </div>
  );
};

export default SocialFeed;
