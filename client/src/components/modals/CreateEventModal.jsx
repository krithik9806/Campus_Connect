import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

export default function CreateEventModal({ onClose, onCreated }) {
  const { user, role } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    category: 'Workshops',
    club_id: '1',
    date_str: 'April 15, 2025',
    start_time: '10:00 AM',
    end_time: '04:00 PM',
    venue: 'Main Innovation Tower, Hall A',
    capacity: 150,
    price_type: 'free',
    ticket_price: 0,
    budget_requested: 500,
    image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80',
    description: '',
    coordinator_notes: 'Facilities booked. Faculty advisor notified and safety equipment verified.'
  });

  useEffect(() => {
    async function loadClubs() {
      try {
        const res = await api.getClubs();
        setClubs(res.clubs || []);
        if (res.clubs && res.clubs.length > 0) {
          setForm(prev => ({ ...prev, club_id: String(res.clubs[0].id) }));
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadClubs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...form,
        club_id: parseInt(form.club_id, 10),
        capacity: parseInt(form.capacity, 10),
        budget_requested: parseFloat(form.budget_requested),
        ticket_price: parseFloat(form.ticket_price)
      };

      const res = await api.createEvent(payload);
      if (onCreated) onCreated(res.event);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col relative animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div>
            <h3 className="font-bold text-lg text-slate-900">Host a Campus Event</h3>
            <p className="text-xs text-slate-500">
              {role === 'admin' ? 'Publish event directly to campus hub' : 'Submit event proposal for Administrative approval'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Event Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Event Title *
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Annual Spring HackCon 2025"
              value={form.title}
              onChange={handleChange}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Organizing Club & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Organizing Club *
              </label>
              <select
                name="club_id"
                value={form.club_id}
                onChange={handleChange}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none bg-white"
              >
                {clubs.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none bg-white"
              >
                <option value="Hackathons">Hackathons</option>
                <option value="Tech Talks">Tech Talks</option>
                <option value="Workshops">Workshops</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Career">Career</option>
                <option value="Socials">Socials</option>
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date *
              </label>
              <input
                type="text"
                name="date_str"
                required
                placeholder="March 28, 2025"
                value={form.date_str}
                onChange={handleChange}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Time
              </label>
              <input
                type="text"
                name="start_time"
                placeholder="09:00 AM"
                value={form.start_time}
                onChange={handleChange}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                End Time
              </label>
              <input
                type="text"
                name="end_time"
                placeholder="05:00 PM"
                value={form.end_time}
                onChange={handleChange}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Venue & Capacity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Campus Venue *
              </label>
              <input
                type="text"
                name="venue"
                required
                placeholder="Main Auditorium & Hall B"
                value={form.venue}
                onChange={handleChange}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Seat Capacity *
              </label>
              <input
                type="number"
                name="capacity"
                required
                min="10"
                max="2000"
                value={form.capacity}
                onChange={handleChange}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Budget & Poster URL */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Budget Requested ($)
              </label>
              <input
                type="number"
                name="budget_requested"
                min="0"
                value={form.budget_requested}
                onChange={handleChange}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Poster Image URL
              </label>
              <input
                type="text"
                name="image_url"
                value={form.image_url}
                onChange={handleChange}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Event Description
            </label>
            <textarea
              name="description"
              rows="3"
              placeholder="Outline workshop curriculum, guest speakers, key takeaways..."
              value={form.description}
              onChange={handleChange}
              className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Coordinator compliance notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Compliance & Safety Notes
            </label>
            <input
              type="text"
              name="coordinator_notes"
              value={form.coordinator_notes}
              onChange={handleChange}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-slate-600"
            />
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition active:scale-98 disabled:opacity-50"
            >
              {loading ? 'Submitting Proposal...' : role === 'admin' ? 'Publish Event Now' : 'Submit for Admin Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
