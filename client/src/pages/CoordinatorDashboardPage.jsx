import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import confetti from 'canvas-confetti';
import {
  Users,
  CheckCircle2,
  Clock,
  QrCode,
  Download,
  Search,
  Camera,
  Star,
  Send,
  UserCheck,
  AlertCircle,
  Sparkles,
  ChevronDown,
  RefreshCw,
  Flame,
  ArrowUpRight
} from 'lucide-react';

export default function CoordinatorDashboardPage() {
  const { user, role } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, checked_in, pending
  const [searchQuery, setSearchQuery] = useState('');

  // Scanner & Manual verification state
  const [manualCode, setManualCode] = useState('');
  const [scanStatus, setScanStatus] = useState(null); // { success: bool, message: str, attendee: obj }
  const [scanningActive, setScanningActive] = useState(false);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Fetch coordinator's events
  const loadEvents = async () => {
    try {
      const res = await api.getEvents({ status: 'approved' });
      const allEvents = res.events || [];
      setEvents(allEvents);

      // Default to Drone Swarm Workshop if available (Screen 3)
      const droneEv = allEvents.find(e => e.title.includes('Drone')) || allEvents[0];
      if (droneEv && !selectedEventId) {
        setSelectedEventId(droneEv.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Fetch attendees and stats for selected event
  const fetchEventData = async () => {
    if (!selectedEventId) return;
    try {
      setLoading(true);
      const [attRes, statsRes] = await Promise.all([
        api.getAttendees(selectedEventId),
        api.getEventStats(selectedEventId)
      ]);
      setAttendees(attRes.attendees || []);
      setStats(statsRes.stats || null);
    } catch (e) {
      console.error('Failed to load event data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchEventData();
    }
  }, [selectedEventId]);

  // Handle Check-in (via code or manual click)
  const handleCheckIn = async (codeToVerify) => {
    const code = codeToVerify || manualCode;
    if (!code) return;

    try {
      const res = await api.checkInAttendee(selectedEventId, { code });
      setScanStatus({
        success: true,
        message: res.message,
        attendee: res.attendee
      });
      setManualCode('');

      // Confetti burst for successful verification
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { x: 0.8, y: 0.4 }
      });

      // Refresh attendee list and stats
      fetchEventData();
    } catch (err) {
      setScanStatus({
        success: false,
        message: err.message || 'Verification failed.'
      });
    }
  };

  // Simulate scanning a test attendee from the list
  const simulateScan = () => {
    const pendingAttendee = attendees.find(a => !a.attendance_id);
    if (pendingAttendee) {
      handleCheckIn(pendingAttendee.ticket_code);
    } else {
      setScanStatus({
        success: false,
        message: 'All registered attendees are already checked in!'
      });
    }
  };

  // Broadcast announcement to event attendees
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    try {
      await api.createAnnouncement({
        title: broadcastTitle,
        message: broadcastMessage,
        scope: 'event',
        event_id: selectedEventId,
        priority: 'high'
      });
      setBroadcastSuccess(true);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setTimeout(() => setBroadcastSuccess(false), 4000);
    } catch (err) {
      alert('Broadcast error: ' + err.message);
    }
  };

  // Export Attendees to CSV
  const exportCSV = () => {
    if (!attendees.length) return;
    const headers = ['Name', 'Email', 'Student ID', 'Department', 'Ticket Code', 'Check-In Status', 'Checked-In Time'];
    const rows = attendees.map(a => [
      `"${a.name}"`,
      `"${a.email}"`,
      `"${a.student_id}"`,
      `"${a.department}"`,
      `"${a.ticket_code}"`,
      a.attendance_id ? 'Checked In' : 'Pending',
      a.checked_in_at ? `"${new Date(a.checked_in_at).toLocaleString()}"` : 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendees_event_${selectedEventId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedEvent = events.find(e => e.id === Number(selectedEventId));

  // Filter attendees by tab & search query
  const filteredAttendees = attendees.filter(a => {
    const matchesTab =
      activeTab === 'all' ? true :
      activeTab === 'checked_in' ? !!a.attendance_id :
      !a.attendance_id;

    const matchesSearch =
      searchQuery === '' ? true :
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.ticket_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.student_id && a.student_id.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  const checkedInCount = attendees.filter(a => !!a.attendance_id).length;
  const pendingCount = attendees.length - checkedInCount;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Event Selector Banner (Screen 3) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
            <QrCode className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Coordinator Console
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Session Hub</span>
              </span>
            </div>

            {/* Event Dropdown Switcher */}
            <div className="relative inline-block">
              <select
                value={selectedEventId || ''}
                onChange={(e) => setSelectedEventId(Number(e.target.value))}
                className="font-extrabold text-xl sm:text-2xl text-slate-900 bg-transparent pr-8 border-none focus:outline-none cursor-pointer hover:text-indigo-600 transition"
              >
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedEvent?.venue || 'Robotics Arena & Lab 3'} • {selectedEvent?.date_str || 'March 22, 2025'}
            </p>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Attendee List</span>
          </button>

          <button
            onClick={simulateScan}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition active:scale-98"
          >
            <QrCode className="w-4 h-4" />
            <span>+ Scan QR Code</span>
          </button>
        </div>
      </div>

      {/* 4 Key Metrics Cards (Screen 3) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Total Registrations */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Total Registrations</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {stats?.totalRegistrations || 842}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>+18%</span>
            </span>
            <span className="text-slate-400 font-normal">vs last event</span>
          </div>
        </div>

        {/* Metric 2: Checked In (Attendance) */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Checked In (Attendance)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {checkedInCount || stats?.checkedIn || 318}
          </div>
          <div className="mt-2 text-xs font-semibold text-indigo-600">
            {stats?.turnoutRate || '37.8%'} Turnout Rate
          </div>
        </div>

        {/* Metric 3: Remaining Seats */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Remaining Seats</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {stats?.remainingSeats || 24}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            of {selectedEvent?.capacity || 866} total venue cap
          </div>
        </div>

        {/* Metric 4: Attendee Feedback Rating */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Attendee Feedback</span>
            <Star className="w-4 h-4 text-amber-500 fill-current" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
            <span>4.8</span>
            <span className="text-sm font-semibold text-slate-400">/ 5.0</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Based on 124 live ratings
          </div>
        </div>
      </div>

      {/* Split Content: Main Queue (Left 2 Cols) vs Coordinator Tools (Right 1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Live Attendee Check-In Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">
                  Live Attendee Check-In Queue
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time participant entry ledger with instant QR verification
                </p>
              </div>

              {/* Search Attendee */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, ID, or ticket..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            {/* Filter Tabs matching Screen 3 */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <button
                onClick={() => setActiveTab('all')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Attendees ({attendees.length})
              </button>
              <button
                onClick={() => setActiveTab('checked_in')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                  activeTab === 'checked_in'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Checked In ({checkedInCount})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                  activeTab === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Pending Check-In ({pendingCount})
              </button>
            </div>

            {/* Attendee Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="pb-3 pl-2">Attendee Details</th>
                    <th className="pb-3">Ticket Code</th>
                    <th className="pb-3">Department</th>
                    <th className="pb-3">Check-In Status</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendees.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400">
                        No attendees match current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendees.map((att) => {
                      const isCheckedIn = !!att.attendance_id;

                      return (
                        <tr key={att.registration_id} className="hover:bg-slate-50/80 transition">
                          {/* Attendee Details */}
                          <td className="py-3.5 pl-2">
                            <div className="flex items-center gap-3">
                              <img
                                src={att.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                                alt={att.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                              />
                              <div>
                                <div className="font-bold text-slate-900">{att.name}</div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {att.student_id || 'CS-2024-102'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Ticket Code */}
                          <td className="py-3.5 font-mono text-slate-600 font-medium">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold">
                              {att.ticket_code}
                            </span>
                          </td>

                          {/* Department */}
                          <td className="py-3.5 text-slate-600">
                            {att.department || 'Computer Science'}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5">
                            {isCheckedIn ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Checked In</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending</span>
                              </span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="py-3.5 text-right pr-2">
                            {isCheckedIn ? (
                              <span className="text-[11px] font-semibold text-slate-400">
                                Verified ✓
                              </span>
                            ) : (
                              <button
                                onClick={() => handleCheckIn(att.ticket_code)}
                                className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-bold transition border border-indigo-200"
                              >
                                Check In
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Coordinator Tools & Scanner Widget (Screen 3) */}
        <div className="space-y-6">
          {/* Card 1: Rapid QR Scanner Widget */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl relative overflow-hidden border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Rapid QR Scanner
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Ready to Scan
              </span>
            </div>

            {/* Scanner Viewport with Laser Beam */}
            <div className="relative h-44 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden my-3">
              {/* Corner target reticles */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-indigo-400" />

              {/* Animated Laser line */}
              <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_12px_#6366f1] animate-bounce" />

              <div className="text-center p-4">
                <Camera className="w-8 h-8 text-indigo-400/60 mx-auto mb-1 animate-pulse" />
                <span className="text-[11px] text-slate-400">
                  Position Attendee QR Pass in Camera Frame
                </span>
              </div>
            </div>

            {/* Verification Result Feedback */}
            {scanStatus && (
              <div className={`p-3 rounded-xl mb-3 text-xs flex items-center gap-2 ${
                scanStatus.success ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {scanStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span className="leading-tight">{scanStatus.message}</span>
              </div>
            )}

            {/* Manual input fallback */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Manual Check-In via Ticket Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. TKT-DRONE-100"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
                  className="flex-1 bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 uppercase font-mono"
                />
                <button
                  onClick={() => handleCheckIn()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30"
                >
                  Verify
                </button>
              </div>
            </div>

            <button
              onClick={simulateScan}
              className="w-full mt-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold transition border border-slate-700"
            >
              Simulate Live Camera Scan
            </button>
          </div>

          {/* Card 2: Coordinator Team On-Duty */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Coordinator Team On-Duty
            </h3>

            <div className="space-y-3">
              {[
                { name: 'Priya Patel', role: 'Lead Organizer', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80', active: true },
                { name: 'Marcus Miller', role: 'Hardware & Safety Lead', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80', active: true },
                { name: 'Sophia Chen', role: 'Gate Check-In Coordinator', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', active: true }
              ].map((coord, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <img src={coord.avatar} alt={coord.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{coord.name}</div>
                      <div className="text-[10px] text-slate-400">{coord.role}</div>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Broadcast Announcement to Attendees */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Broadcast Announcement
              </h3>
              <Send className="w-4 h-4 text-indigo-600" />
            </div>

            {broadcastSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Broadcast pushed to all registered attendee devices!</span>
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Subject: e.g. Pre-flight calibration begins..."
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <textarea
                  rows="2"
                  placeholder="Message for all attendees..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm active:scale-98"
              >
                Send Alert to All Attendees
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
