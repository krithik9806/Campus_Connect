import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Ticket,
  SlidersHorizontal,
  Flame,
  Award,
  ChevronRight
} from 'lucide-react';

export default function DiscoverEventsPage({
  onSelectEvent,
  onNavigateToClubs,
  searchQuery: globalSearch,
  setSearchQuery: setGlobalSearch
}) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All Events');
  const [localSearch, setLocalSearch] = useState('');

  const searchQuery = globalSearch !== undefined ? globalSearch : localSearch;
  const setSearchQuery = setGlobalSearch || setLocalSearch;

  const categories = [
    'All Events',
    'Hackathons',
    'Tech Talks',
    'Workshops',
    'Cultural',
    'Sports',
    'Career',
    'Socials'
  ];

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getEvents({
        category: selectedCategory === 'All Events' ? undefined : selectedCategory,
        search: searchQuery || undefined
      });
      setEvents(res.events || []);
    } catch (e) {
      console.error('Failed to load events:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, searchQuery]);

  // Find Featured Event (HackCon)
  const featuredEvent = events.find(e => e.title.includes('HackCon')) || events[0];
  const regularEvents = events.filter(e => e.id !== featuredEvent?.id);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Sparkles className="w-4 h-4" />
            <span>Discover Campus Life</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Happening on Campus <span className="text-indigo-600">This Week</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
            Browse and discover what's happening around campus. Filter by club, category, or date to find your next adventure.
          </p>
        </div>

        {/* Search & filter pill */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 font-medium shadow-2xs w-60"
            />
          </div>
        </div>
      </div>

      {/* Filter Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-600 ring-offset-2'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Split with Featured Showcase on Left, Widgets on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Featured Hero Card */}
        <div className="lg:col-span-2 space-y-8">
          {featuredEvent && (
            <div className="group relative rounded-3xl overflow-hidden bg-slate-950 text-white shadow-2xl border border-slate-800 transition hover:shadow-indigo-500/10">
              <div className="h-80 sm:h-96 w-full relative">
                <img
                  src={featuredEvent.image_url}
                  alt={featuredEvent.title}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-103 transition duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

                {/* Badges on top */}
                <div className="absolute top-5 left-5 flex items-center gap-2">
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>Featured</span>
                  </span>
                  <span className="bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-white/20">
                    {featuredEvent.category}
                  </span>
                  <span className="bg-emerald-500/90 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Free Entry
                  </span>
                </div>

                {/* Bottom details inside Hero */}
                <div className="absolute bottom-6 left-6 right-6 space-y-3">
                  <div className="text-xs font-semibold text-indigo-300 flex items-center gap-2">
                    <span>By {featuredEvent.club_name || 'ACM Student Chapter'}</span>
                    <span>•</span>
                    <span>36 Hours Flagship Hackathon</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                    {featuredEvent.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-xl leading-relaxed">
                    {featuredEvent.description}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-white/10">
                    <div className="flex items-center gap-4 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{featuredEvent.date_str}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{featuredEvent.venue}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Attendees Avatars */}
                      <div className="flex items-center -space-x-2">
                        <img className="w-7 h-7 rounded-full border-2 border-slate-900" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Avatar" />
                        <img className="w-7 h-7 rounded-full border-2 border-slate-900" src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80" alt="Avatar" />
                        <img className="w-7 h-7 rounded-full border-2 border-slate-900" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="Avatar" />
                        <span className="w-7 h-7 rounded-full border-2 border-slate-900 bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                          +340
                        </span>
                      </div>

                      <button
                        onClick={() => onSelectEvent(featuredEvent)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-98 flex items-center gap-1.5"
                      >
                        {featuredEvent.is_registered ? (
                          <>
                            <Ticket className="w-4 h-4" />
                            <span>View Digital Pass</span>
                          </>
                        ) : (
                          <>
                            <span>Register Now</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Upcoming Sessions & Meetups */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Upcoming Sessions & Meetups
                </h3>
                <p className="text-xs text-slate-500">Curated workshops, guest lectures, and student meetups</p>
              </div>
              <span className="text-xs font-semibold text-indigo-600">
                View All ({events.length} Events)
              </span>
            </div>

            {/* Grid of Event Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {regularEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Card Cover */}
                    <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                      <img
                        src={ev.image_url}
                        alt={ev.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-out"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {ev.category}
                        </span>
                        {ev.is_registered && (
                          <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Registered</span>
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-2.5 right-3 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
                        {ev.capacity - ev.registered_count} seats left
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-2">
                      <div className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                        <span>{ev.club_name || 'Campus Club'}</span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition leading-snug line-clamp-1">
                        {ev.title}
                      </h4>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {ev.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{ev.date_str}</span>
                    </div>

                    <button className="font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1 shrink-0">
                      <span>{ev.is_registered ? 'Pass' : 'Register'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Rail Widgets (Matching Designs) */}
        <div className="space-y-6">
          {/* Card 1: Live Campus Highlights */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Campus Highlights</span>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              14+ Active Events
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Happening across Main Auditorium, Tech Tower, and Robotics labs this term.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-50">
                <div className="font-bold text-sm text-slate-900">4,219</div>
                <div className="text-[10px] text-slate-400 font-medium">Students Enrolled</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <div className="font-bold text-sm text-indigo-600">64</div>
                <div className="text-[10px] text-slate-400 font-medium">Clubs Active</div>
              </div>
            </div>
          </div>

          {/* Card 2: Campus Engagement Score (With Circular Radial Gauge matching image) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Campus Engagement Score
              </h3>
              <Award className="w-4 h-4 text-indigo-600" />
            </div>

            <div className="flex items-center gap-5">
              {/* Circular Gauge */}
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background Track */}
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Colored Progress */}
                  <path
                    className="text-indigo-600"
                    strokeDasharray="78, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute font-black text-sm text-slate-900">
                  78%
                </div>
              </div>

              <div>
                <div className="font-bold text-sm text-slate-900">
                  Level 4 Campus Leader
                </div>
                <div className="text-xs text-indigo-600 font-semibold mt-0.5">
                  Ranked #12 in Active Participation
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Based on workshop registrations and attendance history.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Trending Campus Clubs (Matching designs) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Trending Campus Clubs
              </h3>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>

            <div className="space-y-3">
              {[
                { name: 'ACM Student Chapter', members: '450+ members', logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80' },
                { name: 'Robotics & AI Guild', members: '320+ members', logo: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=100&q=80' },
                { name: 'Design & UX Collective', members: '210+ members', logo: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?auto=format&fit=crop&w=100&q=80' },
                { name: 'Music & Acoustic Society', members: '180+ members', logo: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=100&q=80' }
              ].map((club, idx) => (
                <div
                  key={idx}
                  onClick={onNavigateToClubs}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <img src={club.logo} alt={club.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition truncate max-w-[150px]">
                        {club.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{club.members}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                </div>
              ))}
            </div>

            <button
              onClick={onNavigateToClubs}
              className="w-full pt-2 flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              <span>Connect with All 64 Clubs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
