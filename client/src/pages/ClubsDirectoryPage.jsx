import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  Users,
  Search,
  Award,
  Sparkles,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Building2,
  ChevronRight,
  Shield,
  Plus
} from 'lucide-react';

export default function ClubsDirectoryPage({
  onSelectClub,
  onSelectEvent,
  searchQuery: globalSearch,
  setSearchQuery: setGlobalSearch
}) {
  const [clubs, setClubs] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [localSearch, setLocalSearch] = useState('');

  const searchQuery = globalSearch !== undefined ? globalSearch : localSearch;
  const setSearchQuery = setGlobalSearch || setLocalSearch;

  const categories = [
    { label: 'All', count: '64' },
    { label: 'Technical & Coding', count: '18' },
    { label: 'Design & Creative', count: '9' },
    { label: 'Entrepreneurship', count: '6' },
    { label: 'Cultural & Arts', count: '12' },
    { label: 'Social & Community', count: '11' }
  ];

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const res = await api.getClubs({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: searchQuery || undefined
      });
      setClubs(res.clubs || []);

      const lbRes = await api.getLeaderboard();
      setLeaderboard(lbRes.leaderboard || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, [selectedCategory, searchQuery]);

  const handleQuickJoin = async (clubId, e) => {
    e.stopPropagation();
    try {
      await api.joinClub(clubId);
      setClubs(clubs.map(c => c.id === clubId ? { ...c, is_member: true } : c));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Users className="w-4 h-4" />
            <span>Campus Communities</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Discover <span className="text-indigo-600">64+ Student</span> Organizations & Chapters
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
            Connect with communities that ignite your passions. From technical innovation to creative arts, find your tribe on campus.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 font-medium shadow-2xs w-60"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => setSelectedCategory(cat.label)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-600 ring-offset-2'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500'}`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Split Layout: 2 Cols for Cards, 1 Col for Right Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Club Cards Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Showing {clubs.length} campus student organizations</span>
            <span className="font-semibold text-slate-700">Sort by: Most Active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {clubs.map((club) => (
              <div
                key={club.id}
                onClick={() => onSelectClub(club)}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Card Cover & Logo */}
                  <div className="h-36 w-full relative overflow-hidden bg-slate-900">
                    <img
                      src={club.cover_image}
                      alt={club.name}
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-full text-indigo-700">
                      {club.category}
                    </div>

                    {/* Floating Avatar Logo */}
                    <div className="absolute -bottom-4 left-4">
                      <img
                        src={club.logo_url}
                        alt={club.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md bg-white"
                      />
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 pt-7 space-y-2">
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition leading-snug line-clamp-1">
                      {club.name}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {club.description}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{club.member_count}+ Members</span>
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{club.active_events_count || 2} Events</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => handleQuickJoin(club.id, e)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                      club.is_member
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                    }`}
                  >
                    {club.is_member ? 'Joined' : 'Join Club'}
                  </button>

                  <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition flex items-center gap-1">
                    <span>Explore Club</span>
                    <span>→</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination bar matching designs */}
          <div className="pt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>Showing 1 to {clubs.length} of 64 organizations</span>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-medium">Previous</button>
              <button className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold">1</button>
              <button className="w-8 h-8 rounded-lg hover:bg-slate-100 font-medium text-slate-700">2</button>
              <button className="w-8 h-8 rounded-lg hover:bg-slate-100 font-medium text-slate-700">3</button>
              <button className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-medium">Next</button>
            </div>
          </div>
        </div>

        {/* Right Rail Widgets (Matching Screen 2) */}
        <div className="space-y-6">
          {/* Card 1: Top Performing Clubs This Month */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Top Performing Clubs This Month
              </h3>
              <Award className="w-4 h-4 text-amber-500" />
            </div>

            <div className="space-y-3">
              {leaderboard.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      idx === 0 ? 'bg-amber-100 text-amber-800' : idx === 1 ? 'bg-slate-200 text-slate-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      #{idx + 1}
                    </span>
                    <img src={item.logo_url} alt={item.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 truncate max-w-[130px]">{item.name}</div>
                      <div className="text-[10px] text-slate-400">{item.category}</div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {item.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Annual Student Innovation Expo (Call for Booths) */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 mb-1 block">
              Flagship Campus Showcase
            </span>
            <h3 className="text-lg font-bold text-white mb-2 leading-snug">
              Annual Student Innovation Expo
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Call for club booths! Showcase your club projects, hardware builds, and creative portfolios to 3,000+ visiting attendees.
            </p>
            <button
              onClick={() => alert('Booth reservation request submitted for club review!')}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-indigo-950 hover:bg-slate-100 font-bold text-xs transition shadow-md"
            >
              Reserve a Booth Space
            </button>
          </div>

          {/* Card 3: Club Leader Guidelines & Support */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Club Leader Guidelines
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Learn about event budget sanctions, campus safety protocols, room reservation policies, and attendance verification.
            </p>
            <div className="pt-1">
              <a
                href="#guidelines"
                onClick={(e) => { e.preventDefault(); alert('Opening Student Club Handbook & Safety Protocol 2025 PDF.'); }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
              >
                <span>Read Governance Policies</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
