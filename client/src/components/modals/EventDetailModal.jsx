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
  Building2,
  User,
  Phone,
  Mail,
  GraduationCap,
  Shirt,
  Utensils,
  Globe,
  FileCheck,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

export default function EventDetailModal({ event, onClose, onRegisteredChange }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Info/Review, 2: Real-world Registration Form, 3: Completed Pass
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(event?.is_registered || false);
  const [ticketCode, setTicketCode] = useState(event?.user_ticket_code || 'TKT-CC-894');
  const [qrToken, setQrToken] = useState(
    `CC_PASS_${event?.id}_${user?.id || 1}_${event?.user_ticket_code || 'TKT-CC-894'}`
  );

  // Real-world practical registration details
  const [formData, setFormData] = useState({
    academicYear: '3rd Year',
    phoneNumber: user?.phone || '+91 98765 43210',
    emergencyContact: '+91 91234 56789',
    participationType: 'solo', // solo or team
    teamName: '',
    teamMembers: '',
    dietaryPref: 'Veg', // Veg, Non-Veg, Jain, Vegan
    tshirtSize: 'L', // S, M, L, XL, XXL
    portfolioUrl: '',
    specialAccommodations: '',
    acceptedConduct: false
  });

  if (!event) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.acceptedConduct) {
      setError('Please agree to the Campus Event Code of Conduct.');
      return;
    }

    if (formData.participationType === 'team' && !formData.teamName.trim()) {
      setError('Please provide a team name for team participation.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.registerForEvent(event.id, formData);
      setRegistered(true);
      setTicketCode(res.ticketCode);
      setQrToken(res.registration.qr_token);
      setStep(3); // Show boarding pass

      // Trigger celebration confetti
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });

      if (onRegisteredChange) onRegisteredChange();
    } catch (err) {
      setError(err.message || 'Failed to complete registration.');
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
      setStep(1);
      if (onRegisteredChange) onRegisteredChange();
    } catch (err) {
      setError(err.message || 'Failed to cancel registration.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCalendarInvite = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CampusConnect//College Community Hub//EN
BEGIN:VEVENT
SUMMARY:${event.title}
DESCRIPTION:Organized by ${event.club_name || 'Campus Club'}. Ticket: ${ticketCode}
LOCATION:${event.venue}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}_pass.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="h-56 sm:h-64 w-full relative shrink-0 overflow-hidden rounded-t-3xl bg-slate-900">
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
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
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

          {/* STEP 1: EVENT DETAILS OVERVIEW (If not registered and on step 1) */}
          {!registered && step === 1 && (
            <>
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

              {/* Action Button: Proceed to Registration Form */}
              <div className="pt-2">
                <button
                  onClick={() => setStep(2)}
                  disabled={event.registered_count >= event.capacity}
                  className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/25 transition active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {event.registered_count >= event.capacity ? (
                    <span>Event Full Capacity</span>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4" />
                      <span>Proceed to Official Registration</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* STEP 2: REAL-WORLD COMPREHENSIVE REGISTRATION FORM */}
          {!registered && step === 2 && (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    <span>Attendee Logistics & Survival Details</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Required for on-campus insurance, meal distribution, and verified participation certificates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              </div>

              {/* Section 1: Academic & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Standing
                  </label>
                  <select
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleChange}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="1st Year (Freshman)">1st Year (Freshman)</option>
                    <option value="2nd Year (Sophomore)">2nd Year (Sophomore)</option>
                    <option value="3rd Year (Junior)">3rd Year (Junior)</option>
                    <option value="4th Year (Senior)">4th Year (Senior)</option>
                    <option value="Postgraduate / PhD">Postgraduate / PhD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    placeholder="+91 98765 43210"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Emergency Contact Number
                  </label>
                  <input
                    type="tel"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    required
                    placeholder="+91 91234 56789"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GitHub / Portfolio / LinkedIn
                  </label>
                  <input
                    type="url"
                    name="portfolioUrl"
                    value={formData.portfolioUrl}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Section 2: Participation Type */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <label className="block text-xs font-bold text-slate-900">
                  Participation Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, participationType: 'solo' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                      formData.participationType === 'solo'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Solo Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, participationType: 'team' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                      formData.participationType === 'team'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Team / Squad
                  </button>
                </div>

                {formData.participationType === 'team' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Team Name *
                      </label>
                      <input
                        type="text"
                        name="teamName"
                        value={formData.teamName}
                        onChange={handleChange}
                        placeholder="e.g. Binary Beasts"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Teammates' Roll Numbers
                      </label>
                      <input
                        type="text"
                        name="teamMembers"
                        value={formData.teamMembers}
                        onChange={handleChange}
                        placeholder="CS21B044, EC21B012"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Event Logistics (Meals & Merchandise) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Catering Dietary Preference</span>
                  </label>
                  <select
                    name="dietaryPref"
                    value={formData.dietaryPref}
                    onChange={handleChange}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="Veg">Vegetarian Meal</option>
                    <option value="Non-Veg">Non-Vegetarian Meal</option>
                    <option value="Jain">Jain (No Onion/Garlic)</option>
                    <option value="Vegan">Vegan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Shirt className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Event T-Shirt Size</span>
                  </label>
                  <select
                    name="tshirtSize"
                    value={formData.tshirtSize}
                    onChange={handleChange}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="S">Small (S - 38")</option>
                    <option value="M">Medium (M - 40")</option>
                    <option value="L">Large (L - 42")</option>
                    <option value="XL">Extra Large (XL - 44")</option>
                    <option value="XXL">Double XL (XXL - 46")</option>
                  </select>
                </div>
              </div>

              {/* Special Accommodations */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Special Accessibility / Hardware Requirements (Optional)
                </label>
                <input
                  type="text"
                  name="specialAccommodations"
                  value={formData.specialAccommodations}
                  onChange={handleChange}
                  placeholder="e.g. Wheelchair ramp, power outlet for dual laptops, etc."
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Code of Conduct Checkbox */}
              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="conductCheck"
                  name="acceptedConduct"
                  checked={formData.acceptedConduct}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="conductCheck" className="text-xs text-slate-700 leading-snug cursor-pointer select-none">
                  I solemnly pledge to uphold the <strong>Institution Code of Conduct</strong>, respect campus property, and maintain academic integrity throughout this event.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/25 transition active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Generating Secure Ticket & Pass...</span>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Complete Registration & Issue Gate Pass</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3 / REGISTERED STATE: DIGITAL BOARDING PASS WALLET */}
          {(registered || step === 3) && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white relative overflow-hidden shadow-2xl border border-indigo-800/50">
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-44 h-44 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Pass Verified</span>
                    </span>
                    <span className="text-indigo-300 text-xs font-medium">Digital Campus Passbook</span>
                  </div>

                  <h3 className="text-xl font-bold text-white">
                    {user?.name || 'Aarav Sharma'}
                  </h3>

                  <div className="text-xs text-indigo-200 font-mono flex items-center gap-2">
                    Ticket Code:
                    <span className="font-bold text-white bg-indigo-950/80 px-2.5 py-0.5 rounded-lg border border-indigo-700/80">
                      {ticketCode}
                    </span>
                  </div>

                  <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>
                      <span className="text-indigo-400 font-semibold">Seat/Gate:</span> Main Hall #4
                    </div>
                    <div>
                      <span className="text-indigo-400 font-semibold">Dietary:</span> {formData.dietaryPref || 'Veg'}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs pt-1">
                    Present this dynamic QR code at the registration desk for instant check-in.
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="bg-white p-3.5 rounded-2xl shadow-xl shrink-0 flex flex-col items-center">
                  <QRCodeSVG
                    value={qrToken}
                    size={115}
                    level="H"
                    includeMargin={false}
                  />
                  <span className="text-[9px] font-bold text-slate-900 mt-1.5 uppercase tracking-wider">
                    Scan for Admission
                  </span>
                </div>
              </div>

              {/* Utility actions */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={downloadCalendarInvite}
                  className="text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Add to Apple/Google Calendar (.ics)</span>
                </button>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="text-xs text-rose-300 hover:text-rose-100 font-medium transition"
                  >
                    Cancel Pass
                  </button>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ID: {user?.student_id || 'CS-2023-894'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
