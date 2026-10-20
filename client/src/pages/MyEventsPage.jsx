import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { QRCodeSVG } from 'qrcode.react';
import {
  Ticket,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Download,
  Share2,
  Trash2,
  Award,
  Utensils,
  Shirt,
  ShieldCheck,
  FileCheck,
  ExternalLink
} from 'lucide-react';

export default function MyEventsPage({ onSelectEvent }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCert, setActiveCert] = useState(null); // certificate modal state

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getEvents();
      // Filter events where is_registered is true
      const registered = (res.events || []).filter(e => e.is_registered);
      setEvents(registered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, [user]);

  const handleCancelRegistration = async (eventId, e) => {
    e.stopPropagation();
    if (!window.confirm('Cancel this event pass?')) return;
    try {
      await api.cancelRegistration(eventId);
      fetchMyEvents();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownloadCertificate = async (ev, e) => {
    e.stopPropagation();
    try {
      const res = await api.getEventCertificate(ev.id);
      setActiveCert(res.certificate);
    } catch (err) {
      alert(err.message || 'Certificate not yet issued for this event.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Ticket className="w-4 h-4" />
            <span>Student Passbook & Credentials</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            My Registered <span className="text-indigo-600">Events & Credentials</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
            Access your verified entry passes, seating gate codes, catering preferences, and download authentic participation certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Active Student: {user?.student_id || 'CS-2023-894'}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading your passes...</div>
      ) : events.length === 0 ? (
        <div className="p-16 rounded-3xl bg-white border border-slate-200/80 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-slate-900">No active event registrations</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't registered for any events yet. Head over to the Discover Hub to RSVP for hackathons, seminars, and club workshops!
          </p>
        </div>
      ) : (
        /* Grid of Digital Passes */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((ev) => {
            const qrToken = `CC_PASS_${ev.id}_${user?.id || 1}_${ev.user_ticket_code || 'TKT-CC-894'}`;

            return (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className="group p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white border border-indigo-900/50 shadow-xl relative overflow-hidden flex flex-col justify-between cursor-pointer hover:border-indigo-500/50 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider">
                          {ev.category}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {ev.price_type === 'free' ? 'Free RSVP' : 'Paid Admission'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white mt-2 leading-snug group-hover:text-indigo-300 transition">
                        {ev.title}
                      </h3>
                      <div className="text-xs text-indigo-200 font-mono mt-1">
                        Pass Code: <span className="font-bold text-white bg-indigo-900/80 px-2 py-0.5 rounded border border-indigo-700/60">{ev.user_ticket_code || 'TKT-CC-894'}</span>
                      </div>
                    </div>

                    {/* QR Code SVG */}
                    <div className="bg-white p-2.5 rounded-2xl shadow-lg shrink-0 flex flex-col items-center">
                      <QRCodeSVG
                        value={qrToken}
                        size={80}
                        level="H"
                        includeMargin={false}
                      />
                      <span className="text-[8px] font-bold text-slate-800 mt-1 uppercase tracking-wider">
                        Gate Pass
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{ev.date_str}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{ev.venue}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDownloadCertificate(ev, e)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/50 hover:bg-indigo-600 text-[11px] font-semibold text-indigo-200 hover:text-white flex items-center gap-1.5 transition border border-indigo-500/40"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>Certificate</span>
                    </button>

                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirmed</span>
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleCancelRegistration(ev.id, e)}
                    className="text-xs text-rose-400 hover:text-rose-200 font-medium transition"
                  >
                    Cancel Pass
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VERIFIED DIGITAL CERTIFICATE PREVIEW MODAL */}
      {activeCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border-4 border-indigo-100 relative space-y-6 animate-in zoom-in-95 duration-200 text-center">
            {/* Header Badge */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-amber-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-300/30">
              <Award className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                Official Credential of Completion
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                Certificate of Active Participation
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Credential ID: <span className="font-bold text-slate-800">{activeCert.certificate_id}</span>
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-sm leading-relaxed">
              This certifies that <strong className="text-slate-900 underline decoration-indigo-500">{activeCert.student_name}</strong> ({activeCert.student_id}) has successfully registered and participated in the session:
              <div className="text-base font-bold text-indigo-700 mt-2">
                "{activeCert.event_title}"
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Organized by {activeCert.club_name} • Date: {activeCert.event_date}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-4 px-4">
              <div>
                <div className="font-bold text-slate-800">Faculty Advisor</div>
                <div className="text-[11px] text-slate-400">Dr. Sarah Jenkins</div>
              </div>
              <div className="text-center">
                <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto mb-0.5" />
                <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Blockchain Verified</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-800">Dean Student Affairs</div>
                <div className="text-[11px] text-slate-400">Dr. Robert Vance</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>
              <button
                onClick={() => setActiveCert(null)}
                className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
