

import React, { useMemo } from 'react';
import { FamilyMember } from '../types';
import { PieChart, MapPin, Briefcase, Users, Hash, TrendingUp, Award, Activity } from 'lucide-react';

interface FamilyStatsProps {
  members: Record<string, FamilyMember>;
}

const FamilyStats: React.FC<FamilyStatsProps> = ({ members }) => {
  const memberList = Object.values(members) as FamilyMember[];
  const total = memberList.length;

  const stats = useMemo(() => {
    const s = {
      gender: { Male: 0, Female: 0, Other: 0 } as { Male: number; Female: number; Other: number; [key: string]: number },
      locations: {} as Record<string, number>,
      professions: {} as Record<string, number>,
      castes: {} as Record<string, number>,
      gothras: {} as Record<string, number>,
      ageGroups: { '0-18': 0, '19-30': 0, '31-50': 0, '51-70': 0, '70+': 0 } as Record<string, number>,
      married: 0,
      single: 0
    };

    const currentYear = new Date().getFullYear();

    memberList.forEach(m => {
      // Gender
      if (s.gender[m.gender] !== undefined) {
        s.gender[m.gender] = (s.gender[m.gender] || 0) + 1;
      }
      
      // Marital Status
      if (m.isMarried) {
        s.married = (s.married || 0) + 1;
      } else {
        s.single = (s.single || 0) + 1;
      }

      // Location
      if (m.location) {
        const city = m.location.split(',')[0].trim();
        s.locations[city] = (s.locations[city] || 0) + 1;
      }

      // Profession
      if (m.profession) {
        s.professions[m.profession] = (s.professions[m.profession] || 0) + 1;
      }

      // Cultural
      if (m.caste) s.castes[m.caste] = (s.castes[m.caste] || 0) + 1;
      if (m.gothra) s.gothras[m.gothra] = (s.gothras[m.gothra] || 0) + 1;

      // Age
      if (m.dob) {
        const year = parseInt(m.dob.split('-')[0]);
        if (!isNaN(year)) {
          const age = currentYear - year;
          if (age <= 18) s.ageGroups['0-18'] = (s.ageGroups['0-18'] || 0) + 1;
          else if (age <= 30) s.ageGroups['19-30'] = (s.ageGroups['19-30'] || 0) + 1;
          else if (age <= 50) s.ageGroups['31-50'] = (s.ageGroups['31-50'] || 0) + 1;
          else if (age <= 70) s.ageGroups['51-70'] = (s.ageGroups['51-70'] || 0) + 1;
          else s.ageGroups['70+'] = (s.ageGroups['70+'] || 0) + 1;
        }
      }
    });

    // Helper to sort and slice
    const getTop = (obj: Record<string, number>, n = 5) => 
      Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);

    return {
      ...s,
      topLocations: getTop(s.locations),
      topProfessions: getTop(s.professions),
      topCastes: getTop(s.castes),
      topGothras: getTop(s.gothras),
    };
  }, [members, memberList]);

  // Extract values for chart to avoid TS complex expression errors
  const maleCount = stats.gender.Male;
  const femaleCount = stats.gender.Female;
  
  const malePercentage = total > 0 ? (maleCount / total) * 100 : 0;
  const femaleAndMalePercentage = total > 0 ? ((maleCount + femaleCount) / total) * 100 : 0;
  
  const chartBackground = useMemo(() => {
    if (total <= 0) return '#e2e8f0';
    return `conic-gradient(
        #6366f1 0% ${malePercentage}%, 
        #ec4899 ${malePercentage}% ${femaleAndMalePercentage}%, 
        #e2e8f0 ${femaleAndMalePercentage}% 100%
    )`;
  }, [total, malePercentage, femaleAndMalePercentage]);

  // Simple Progress Bar Component
  const StatBar: React.FC<{ label: string; value: number; total: number; colorClass: string }> = ({ label, value, total, colorClass }) => (
    <div className="mb-3">
      <div className="flex justify-between text-xs font-bold mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500">{value} ({total > 0 ? Math.round((value / total) * 100) : 0}%)</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${total > 0 ? (value / total) * 100 : 0}%` }}></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-2">Family Insights</h2>
          <p className="text-slate-400">Deep dive into your family's heritage and demographics.</p>
        </div>
        <div className="mt-6 md:mt-0 flex gap-4 text-center">
             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                 <div className="text-3xl font-bold">{total}</div>
                 <div className="text-[10px] uppercase tracking-wider opacity-70">Members</div>
             </div>
             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                 <div className="text-3xl font-bold">{Object.keys(stats.locations).length}</div>
                 <div className="text-[10px] uppercase tracking-wider opacity-70">Cities</div>
             </div>
             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                 <div className="text-3xl font-bold">{Object.keys(stats.professions).length}</div>
                 <div className="text-[10px] uppercase tracking-wider opacity-70">Careers</div>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Gender & Marital Status */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
           <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" /> Demographics
           </h3>
           
           <div className="flex items-center justify-center mb-8 gap-8">
               {/* CSS Donut Chart for Gender */}
               <div className="relative w-32 h-32 rounded-full" 
                    style={{ background: chartBackground }}>
                    <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase">Ratio</span>
                    </div>
               </div>
               <div className="text-xs space-y-2">
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded-full"></div> Male ({stats.gender.Male})</div>
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-pink-500 rounded-full"></div> Female ({stats.gender.Female})</div>
               </div>
           </div>

           <div className="space-y-3 pt-4 border-t border-gray-50">
              <StatBar label="Married" value={stats.married} total={total} colorClass="bg-emerald-500" />
              <StatBar label="Single" value={stats.single} total={total} colorClass="bg-blue-400" />
           </div>
        </div>

        {/* Age Distribution */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
           <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" /> Age Distribution
           </h3>
           <div className="space-y-4">
               {Object.entries(stats.ageGroups).map(([range, count]) => (
                   <div key={range} className="flex items-center gap-3">
                       <span className="text-xs font-bold text-gray-500 w-12">{range}</span>
                       <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                           <div className="h-full bg-orange-400 rounded-full" style={{ width: `${total > 0 ? (Number(count) / total) * 100 : 0}%` }}></div>
                       </div>
                       <span className="text-xs font-bold text-gray-900 w-6 text-right">{count}</span>
                   </div>
               ))}
           </div>
        </div>

        {/* Cultural Heritage */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
           <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-500" /> Heritage
           </h3>
           
           <div className="mb-6">
               <p className="text-xs font-bold text-gray-400 uppercase mb-3">Top Castes</p>
               <div className="flex flex-wrap gap-2">
                   {stats.topCastes.map(([name, count]) => (
                       <span key={name} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold border border-purple-100">
                           {name} <span className="opacity-60 ml-1">x{count}</span>
                       </span>
                   ))}
               </div>
           </div>

           <div>
               <p className="text-xs font-bold text-gray-400 uppercase mb-3">Top Gothras</p>
               <div className="space-y-2">
                   {stats.topGothras.map(([name, count]) => (
                       <StatBar key={name} label={name} value={count} total={total} colorClass="bg-purple-500" />
                   ))}
               </div>
           </div>
        </div>

        {/* Geography */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-500" /> Geographic Distribution
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               {stats.topLocations.map(([city, count]) => (
                   <div key={city} className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between">
                       <span className="text-sm font-bold text-gray-700 truncate mr-2">{city}</span>
                       <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2 py-1 rounded-full">{count}</span>
                   </div>
               ))}
           </div>
        </div>

        {/* Professions */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-1">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-500" /> Professional Network
           </h3>
           <div className="space-y-3">
               {stats.topProfessions.map(([job, count]) => (
                   <div key={job} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-lg -mx-2 transition-colors">
                       <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                               {job.charAt(0)}
                           </div>
                           <span className="text-sm font-medium text-gray-700">{job}</span>
                       </div>
                       <span className="text-xs font-bold text-gray-400">{count}</span>
                   </div>
               ))}
           </div>
        </div>

      </div>
    </div>
  );
};

export default FamilyStats;
