import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Ticket,
  AlertCircle,
  Share2,
  Sparkles,
  Download,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function EventDetailModal({ event, onClose, onRegisteredChange }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(event?.is_registered || false);
  const [ticketCode, setTicketCode] = useState(event?.user_ticket_code || 'TKT-CC-894');
  const [qrToken, setQrToken] = useState(
    `CC_PASS_${event?.id}_${user?.id || 1}_${event?.user_ticket_code || 'TKT-CC-894'}`
  );

  if (!event) return null;

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.registerForEvent(event.id);
      setRegistered(true);
      setTicketCode(res.ticketCode);
      setQrToken(res.registration.qr_token);

      // Trigger confetti celebration!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      if (onRegisteredChange) onRegisteredChange();
    } catch (err) {
      setError(err.message || 'Failed to register for event.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your registration?')) return;
    setLoading(true);
    setError('');
    try {
      await api.cancelRegistration(event.id);
      setRegistered(false);
      if (onRegisteredChange) onRegisteredChange();
    } catch (err) {
      setError(err.message || 'Failed to cancel registration.');
    } finally {
      setLoading(false);
    }
  };

  const capacityPct = Math.min(100, Math.round(((event.registered_count || 0) / (event.capacity || 100)) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col relative animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md transition shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Image Banner */}
        <div className="h-64 w-full relative shrink-0 overflow-hidden rounded-t-3xl bg-slate-900">
          <img
            src={event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'}
            alt={event.title}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Badges on Top */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="bg-indigo-600/90 text-white backdrop-blur-md text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              {event.category}
            </span>
            <span className="bg-emerald-500/90 text-white backdrop-blur-md text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              {event.price_type === 'free' ? 'Free Entry' : `$${event.ticket_price}`}
            </span>
          </div>

          {/* Title & Host info */}
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <div className="text-xs text-indigo-300 font-semibold mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Organized by {event.club_name || 'ACM Chapter'}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white leading-snug">
              {event.title}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium mb-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Date</span>
              </div>
              <div className="text-xs font-bold text-slate-900">{event.date_str}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Time</span>
              </div>
              <div className="text-xs font-bold text-slate-900">{event.start_time || '09:00 AM'}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-2">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium mb-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Venue</span>
              </div>
              <div className="text-xs font-bold text-slate-900 truncate">{event.venue}</div>
            </div>
          </div>

          {/* Capacity Progress Bar */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/80">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Capacity & Seat Availability</span>
              </span>
              <span className="font-bold text-indigo-700">
                {event.registered_count} / {event.capacity} Registered ({capacityPct}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-indigo-200/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${capacityPct}%` }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">About Event</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {event.description || 'Join fellow students and innovators for this campus session. Gain hands-on exposure, network with club leadership, and build career-defining projects.'}
            </p>
          </div>

          {/* Registered Digital Pass Wallet Card */}
          {registered ? (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white relative overflow-hidden shadow-xl border border-indigo-800/40">
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Pass Confirmed</span>
                    </span>
                    <span className="text-indigo-300 text-xs font-medium">Digital Campus Pass</span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">
                    {user?.name || 'Aarav Sharma'}
                  </h3>
                  <div className="text-xs text-indigo-200 mb-3 font-mono">
                    Ticket Code: <span className="font-bold text-white bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">{ticketCode}</span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed max-w-xs">
                    Present this secure QR code at venue entry. Scanned automatically by coordinators.
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="bg-white p-3 rounded-2xl shadow-lg shrink-0 flex flex-col items-center">
                  <QRCodeSVG
                    value={qrToken}
                    size={110}
                    level="H"
                    includeMargin={false}
                  />
                  <span className="text-[9px] font-bold text-slate-800 mt-1 uppercase tracking-wider">
                    Scan for Entry
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="text-xs text-rose-300 hover:text-rose-100 font-medium transition"
                >
                  Cancel Registration
                </button>
                <div className="text-[10px] text-slate-400">
                  Student ID: {user?.student_id || 'CS-2023-894'}
                </div>
              </div>
            </div>
          ) : (
            /* Action Button */
            <div className="pt-2">
              <button
                onClick={handleRegister}
                disabled={loading || event.registered_count >= event.capacity}
                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/25 transition active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Reserving Seat...</span>
                ) : event.registered_count >= event.capacity ? (
                  <span>Event Full Capacity</span>
                ) : (
                  <>
                    <Ticket className="w-4 h-4" />
                    <span>Confirm Registration (Free)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
