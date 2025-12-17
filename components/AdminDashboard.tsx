
import React, { useState } from 'react';
import { FamilyMember, Post, SupportTicket } from '../types';
import { Shield, Users, Activity, AlertTriangle, CheckCircle, XCircle, Trash2, Ban, Mail, Check } from 'lucide-react';

interface AdminDashboardProps {
  members: Record<string, FamilyMember>;
  posts: Post[];
  tickets: SupportTicket[];
  onDeletePost: (postId: string) => void;
  onBanUser: (userId: string) => void;
  onIgnoreReport: (postId: string) => void;
  onResolveTicket: (ticketId: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    members, posts, tickets, onDeletePost, onBanUser, onIgnoreReport, onResolveTicket 
}) => {
  const [view, setView] = useState<'overview' | 'inbox'>('overview');
  const memberList = Object.values(members) as FamilyMember[];
  const reportedPosts = posts.filter(p => p.isReported);
  const openTickets = tickets.filter(t => t.status === 'open');
  
  // Calculate basic metrics
  const totalUsers = memberList.length;
  const activeUsers = memberList.filter(m => m.joined).length;
  const totalPosts = posts.length;
  const engagementRate = Math.round((posts.reduce((acc, p) => acc + p.likes + p.comments, 0) / totalUsers) * 10) / 10;

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex justify-between items-end">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-indigo-500 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
             </div>
             <h2 className="text-3xl font-black tracking-tight">Admin Console</h2>
           </div>
           <p className="text-slate-400">Monitor app health, moderate content, and manage users.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
             <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button 
                    onClick={() => setView('overview')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'overview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    Overview
                </button>
                <button 
                    onClick={() => setView('inbox')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${view === 'inbox' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    Inbox 
                    {openTickets.length > 0 && <span className="bg-red-500 text-white px-1.5 rounded-full text-[9px]">{openTickets.length}</span>}
                </button>
             </div>
        </div>
      </div>

      {view === 'overview' && (
        <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Total Users</span>
                        <Users className="w-4 h-4 text-indigo-500" />
                    </div>
                    <p className="text-2xl font-black text-gray-900">{totalUsers}</p>
                    <p className="text-[10px] text-green-600 font-medium">+12% this week</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Active (Joined)</span>
                        <Activity className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-black text-gray-900">{activeUsers}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Verified profiles</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Total Posts</span>
                        <Activity className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-black text-gray-900">{totalPosts}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Engagement</span>
                        <Activity className="w-4 h-4 text-orange-500" />
                    </div>
                    <p className="text-2xl font-black text-gray-900">{engagementRate}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Interactions / User</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Moderation Queue */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" /> Moderation Queue
                        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">{reportedPosts.length} pending</span>
                    </h3>
                    
                    {reportedPosts.length > 0 ? (
                        <div className="space-y-3">
                            {reportedPosts.map(post => {
                                const author = members[post.authorId];
                                return (
                                    <div key={post.id} className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <img src={author?.avatarUrl} className="w-8 h-8 rounded-full" />
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{author?.name || 'Unknown'}</p>
                                                    <p className="text-xs text-red-500 font-medium">Report Reason: {post.reportReason || 'User flagged'}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-gray-400">{post.timestamp}</span>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 mb-4">
                                            "{post.content}"
                                        </div>
                                        <div className="flex gap-3 justify-end">
                                            <button 
                                                onClick={() => onIgnoreReport(post.id)}
                                                className="text-xs font-bold text-gray-500 hover:bg-gray-100 px-3 py-2 rounded-lg flex items-center gap-2 transition"
                                                >
                                                <CheckCircle className="w-4 h-4" /> Keep Content
                                            </button>
                                            <button 
                                                onClick={() => onDeletePost(post.id)}
                                                className="text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg flex items-center gap-2 transition"
                                                >
                                                <Trash2 className="w-4 h-4" /> Delete Post
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-gray-200 text-center">
                            <CheckCircle className="w-12 h-12 text-emerald-200 mx-auto mb-3" />
                            <p className="text-gray-400 font-medium">All caught up! No reports pending.</p>
                        </div>
                    )}
                </div>

                {/* User Management List */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" /> Recent Users
                    </h3>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {memberList.slice(0, 6).map((member, i) => (
                            <div key={member.id} className={`p-3 flex items-center justify-between ${i !== memberList.slice(0,6).length -1 ? 'border-b border-gray-50' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <img src={member.avatarUrl} className="w-8 h-8 rounded-full" />
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-bold text-gray-900 truncate w-24">{member.name}</p>
                                        <p className={`text-[10px] font-bold ${member.joined ? 'text-emerald-500' : 'text-gray-400'}`}>
                                            {member.joined ? 'Active' : 'Invited'}
                                        </p>
                                    </div>
                                </div>
                                {member.joined && (
                                    <button 
                                        onClick={() => onBanUser(member.id)}
                                        className="p-2 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-lg transition" title="Suspend User"
                                    >
                                        <Ban className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <div className="p-3 bg-gray-50 text-center">
                            <button className="text-xs font-bold text-indigo-600 hover:underline">View All Users</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
      )}

      {view === 'inbox' && (
          <div className="max-w-3xl mx-auto space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-indigo-500" /> Support Inbox
                </h3>
                {tickets.length > 0 ? (
                    tickets.map(ticket => {
                        const user = members[ticket.userId];
                        return (
                            <div key={ticket.id} className={`bg-white p-5 rounded-2xl border shadow-sm transition-all ${ticket.status === 'resolved' ? 'border-gray-100 opacity-60' : 'border-indigo-100'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <img src={user?.avatarUrl} className="w-10 h-10 rounded-full" />
                                        <div>
                                            <h4 className="font-bold text-gray-900">{ticket.subject}</h4>
                                            <p className="text-xs text-gray-500">From: {user?.name || 'Unknown'} • {ticket.timestamp}</p>
                                        </div>
                                    </div>
                                    {ticket.status === 'open' ? (
                                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Open</span>
                                    ) : (
                                        <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Resolved</span>
                                    )}
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 mb-3">
                                    {ticket.message}
                                </div>
                                {ticket.status === 'open' && (
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={() => onResolveTicket(ticket.id)}
                                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                                        >
                                            <Check className="w-3 h-3" /> Mark Resolved
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })
                ) : (
                     <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-gray-200 text-center text-gray-400">
                        <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        No support tickets found.
                     </div>
                )}
          </div>
      )}

    </div>
  );
};

export default AdminDashboard;
