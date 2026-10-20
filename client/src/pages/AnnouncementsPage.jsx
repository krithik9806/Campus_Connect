import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Bell,
  Megaphone,
  Calendar,
  Building2,
  Send,
  Sparkles,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';

export default function AnnouncementsPage() {
  const { user, role } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scopeFilter, setScopeFilter] = useState('all');

  // New announcement form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scope, setScope] = useState('college_wide');
  const [priority, setPriority] = useState('normal');
  const [postSuccess, setPostSuccess] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.getAnnouncements({
        scope: scopeFilter === 'all' ? undefined : scopeFilter
      });
      setAnnouncements(res.announcements || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [scopeFilter]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!title || !message) return;
    try {
      await api.createAnnouncement({ title, message, scope, priority });
      setTitle('');
      setMessage('');
      setPostSuccess(true);
      fetchAnnouncements();
      setTimeout(() => setPostSuccess(false), 3000);
    } catch (err) {
      alert('Post error: ' + err.message);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1.5">
          <Megaphone className="w-4 h-4" />
          <span>Official Communications</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Campus <span className="text-indigo-600">Announcements</span> & Bulletins
        </h1>
        <p className="text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
          Stay informed on policy updates, campus safety guidelines, club broadcasts, and key dates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Announcements Stream */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setScopeFilter('all')}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                scopeFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Bulletins ({announcements.length})
            </button>
            <button
              onClick={() => setScopeFilter('college_wide')}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                scopeFilter === 'college_wide' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              College-Wide Notices
            </button>
            <button
              onClick={() => setScopeFilter('club')}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                scopeFilter === 'club' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Club Bulletins
            </button>
          </div>

          <div className="space-y-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      ann.priority === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    }`}>
                      {ann.scope.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      By {ann.author_name || 'Dean of Student Affairs'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{ann.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {ann.message}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Post Form (Coordinators & Admins) */}
        <div>
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4 sticky top-24">
            <h3 className="font-bold text-sm text-slate-900">Publish Campus Bulletin</h3>
            <p className="text-xs text-slate-500">
              Broadcast high-priority communications across student dashboards.
            </p>

            {postSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Bulletin posted to campus board!</span>
              </div>
            )}

            <form onSubmit={handlePost} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Schedule Update or Safety Advisory..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Scope
                </label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="college_wide">College-Wide</option>
                  <option value="club">Club Specific</option>
                  <option value="event">Event Notice</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Message
                </label>
                <textarea
                  rows="4"
                  placeholder="Compose announcement..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/25 active:scale-98"
              >
                Broadcast Now
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
