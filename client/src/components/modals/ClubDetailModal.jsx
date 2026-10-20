import React, { useState } from 'react';
import api from '../../api/client';
import {
  X,
  Users,
  Award,
  Calendar,
  CheckCircle2,
  Mail,
  UserCheck,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function ClubDetailModal({ club, onClose, onClubUpdated, onSelectEvent }) {
  const [loading, setLoading] = useState(false);
  const [isMember, setIsMember] = useState(club?.is_member || false);

  if (!club) return null;

  const handleJoin = async () => {
    setLoading(true);
    try {
      await api.joinClub(club.id);
      setIsMember(true);
      if (onClubUpdated) onClubUpdated();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md transition shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cover Header */}
        <div className="h-48 w-full relative shrink-0 overflow-hidden rounded-t-3xl bg-slate-900">
          <img
            src={club.cover_image || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80'}
            alt={club.name}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

          {/* Floating Logo */}
          <div className="absolute -bottom-6 left-6 flex items-end gap-4">
            <img
              src={club.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80'}
              alt={club.name}
              className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-xl bg-white"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 pt-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {club.category}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-500" />
                  <span>{club.points || 980} Activity Pts</span>
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{club.name}</h2>
            </div>

            <button
              onClick={handleJoin}
              disabled={loading || isMember}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                isMember
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              }`}
            >
              {isMember ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Official Member</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>{loading ? 'Joining...' : 'Join Community'}</span>
                </>
              )}
            </button>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Club Mission</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {club.description}
            </p>
          </div>

          {/* Club Coordinator Info */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  {club.coordinator_name || 'Priya Patel (Lead Coordinator)'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Official Club Leadership & Advisor Point of Contact
                </div>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Verified Lead
            </span>
          </div>

          {/* Club Events */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Upcoming Club Events ({club.events?.length || 1})
            </h4>

            <div className="space-y-2.5">
              {club.events && club.events.length > 0 ? (
                club.events.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => {
                      onClose();
                      if (onSelectEvent) onSelectEvent(ev);
                    }}
                    className="p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                        <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                          {ev.title}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{ev.date_str}</span>
                          <span>•</span>
                          <span>{ev.venue}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition flex items-center gap-1">
                      <span>View Pass</span>
                      <span>→</span>
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-400">
                  No upcoming public events scheduled for this club yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
