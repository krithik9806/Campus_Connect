import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import confetti from 'canvas-confetti';
import {
  Bell,
  AlertTriangle,
  Megaphone,
  Radio,
  Share2,
  Bookmark,
  FileText,
  Download,
  Calendar,
  Building2,
  Users,
  Search,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Lock,
  PhoneCall,
  Flame,
  Filter,
  Send,
  Eye,
  MessageSquare,
  HelpCircle,
  Printer,
  X
} from 'lucide-react';

export default function AnnouncementsPage() {
  const { user, role } = useAuth();
  const [bulletins, setBulletins] = useState([]);
  const [urgentAdvisory, setUrgentAdvisory] = useState(null);
  const [advisoryDismissed, setAdvisoryDismissed] = useState(false);
  const [stats, setStats] = useState(null);
  const [subscribedFeeds, setSubscribedFeeds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected bulletin for detailed description modal inspection
  const [selectedBulletin, setSelectedBulletin] = useState(null);
  const [bulletinClarifications, setBulletinClarifications] = useState([]);
  const [clarificationQuestion, setClarificationQuestion] = useState('');
  const [submittingClarification, setSubmittingClarification] = useState(false);
  const [clarificationSuccess, setClarificationSuccess] = useState(false);

  // Filter & Search Controls
  const [activeFilter, setActiveFilter] = useState('all'); // all, urgent, academic, student
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAudience, setSelectedAudience] = useState('All Students');
  const [selectedTerm, setSelectedTerm] = useState('Fall 2025');
  const [selectedSort, setSelectedSort] = useState('recent'); // recent, reads

  // Bookmarked bulletin IDs in local state
  const [bookmarks, setBookmarks] = useState(new Set([101]));

  // Quick Dispatch Form state
  const [headline, setHeadline] = useState('');
  const [targetAudience, setTargetAudience] = useState('Robotics Club Members (142 Active)');
  const [priority, setPriority] = useState('standard'); // standard, urgent
  const [dispatching, setDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Modal for full announcement creation
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    title: '',
    category: 'ACADEMIC SENATE',
    target_audience: 'All Undergraduates & Faculty',
    priority: 'standard',
    message: '',
    attachment_name: ''
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.getAnnouncements({
        filter: activeFilter === 'all' ? undefined : activeFilter,
        search: searchQuery.trim() || undefined,
        sort: selectedSort
      });
      setBulletins(res.bulletins || []);
      setUrgentAdvisory(res.urgentAdvisory || null);
      setStats(res.stats || null);
      setSubscribedFeeds(res.subscribedFeeds || []);
    } catch (e) {
      console.error('Failed to load announcements:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [activeFilter, selectedSort]);

  // Handle search when user types or presses Enter
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAnnouncements();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Acknowledge the urgent weather notice
  const handleAcknowledgeAdvisory = async () => {
    try {
      await api.acknowledgeAdvisory();
      setUrgentAdvisory(prev => ({ ...prev, isAcknowledged: true }));
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.2, x: 0.85 }
      });
    } catch (err) {
      alert(err.message);
    }
  };

  // Toggle Feed Subscription
  const handleToggleFeed = async (feedId) => {
    try {
      const res = await api.toggleFeed(feedId);
      setSubscribedFeeds(prev =>
        prev.map(f => (f.id === feedId ? { ...f, enabled: res.feed.enabled } : f))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  // Toggle bookmark
  const toggleBookmark = (id) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Fetch clarifications when a bulletin is clicked
  useEffect(() => {
    if (selectedBulletin) {
      api.getClarifications(selectedBulletin.id)
        .then(res => setBulletinClarifications(res.clarifications || []))
        .catch(() => setBulletinClarifications([]));
      setClarificationQuestion('');
      setClarificationSuccess(false);
    }
  }, [selectedBulletin]);

  // Handle clarification submit
  const handleClarificationSubmit = async (e) => {
    e.preventDefault();
    if (!clarificationQuestion.trim() || !selectedBulletin) return;
    setSubmittingClarification(true);
    try {
      const res = await api.postClarification(selectedBulletin.id, clarificationQuestion.trim());
      setBulletinClarifications(res.clarifications || []);
      setClarificationQuestion('');
      setClarificationSuccess(true);
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6, x: 0.5 }
      });
      setTimeout(() => setClarificationSuccess(false), 3500);
      setBulletins(prev =>
        prev.map(b => (b.id === selectedBulletin.id ? { ...b, clarifications_count: (b.clarifications_count || 0) + 1 } : b))
      );
    } catch (err) {
      alert(err.message || 'Failed to submit clarification question.');
    } finally {
      setSubmittingClarification(false);
    }
  };

  // Download official document memorandum
  const handleDownloadAttachment = (b, e) => {
    if (e) e.stopPropagation();
    const docName = b.attachment_name || `${b.reference_no}_Official_Decree.txt`;
    const content = `========================================================================
STATE UNIVERSITY • CENTRAL CAMPUS REGISTRY
OFFICIAL ADMINISTRATIVE DECREE & DISPATCH
========================================================================

DOCUMENT REFERENCE: ${b.reference_no}
DATE ISSUED: ${b.posted_date_str}
CATEGORY: ${b.category}
ISSUING AUTHORITY: ${b.issuer}
AUTHORIZED SIGNEE: ${b.signee || 'Office of Academic & Student Affairs'}
TARGET COHORT: ${b.target_audience || 'All Enrolled Students & Faculty'}
PRIORITY STATUS: ${b.priority?.toUpperCase() || 'STANDARD'}

------------------------------------------------------------------------
TITLE:
${b.title}
------------------------------------------------------------------------

OFFICIAL COMMUNICATION / DECREE BODY:
${b.message}

DIRECTIVE SUMMARY & COMPLIANCE REQUIREMENTS:
1. Strict adherence to specified university regulations and dates.
2. Verified cryptographic validation: SHA256-${b.id}B92-CC-REGISTRY.
3. For administrative questions or petitions, visit Department Office Hours.

------------------------------------------------------------------------
CampusConnect Hub • State University Administrative Services
Archived in Central University Registrar Records
========================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = docName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert(`Downloading official document: ${docName}`);
  };

  // Share notice via navigator.clipboard
  const handleShareNotice = (b) => {
    const text = `[CampusConnect Dispatch] ${b.title}\nRef: ${b.reference_no}\n${b.message}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert('Official Dispatch copied to clipboard!');
    }
  };

  // Quick Dispatch handler
  const handleQuickDispatch = async (e) => {
    e.preventDefault();
    if (!headline.trim()) return;

    setDispatching(true);
    try {
      await api.createAnnouncement({
        title: headline,
        message: `Official communication regarding: ${headline}. Target audience: ${targetAudience}. Please consult club room or portal for detailed guidelines.`,
        target_audience: targetAudience,
        priority: priority === 'urgent' ? 'urgent' : 'normal',
        category: 'COORDINATOR DISPATCH'
      });

      setHeadline('');
      setDispatchSuccess(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5, x: 0.8 }
      });
      fetchAnnouncements();
      setTimeout(() => setDispatchSuccess(false), 3500);
    } catch (err) {
      alert(err.message || 'Dispatch failed.');
    } finally {
      setDispatching(false);
    }
  };

  // Full Publish Modal Submit
  const handlePublishSubmit = async (e) => {
    e.preventDefault();
    if (!modalForm.title || !modalForm.message) return;

    try {
      await api.createAnnouncement({
        title: modalForm.title,
        message: modalForm.message,
        target_audience: modalForm.target_audience,
        category: modalForm.category,
        priority: modalForm.priority === 'urgent' ? 'urgent' : 'normal',
        attachment_name: modalForm.attachment_name || undefined
      });

      setShowPublishModal(false);
      setModalForm({
        title: '',
        category: 'ACADEMIC SENATE',
        target_audience: 'All Undergraduates & Faculty',
        priority: 'standard',
        message: '',
        attachment_name: ''
      });
      fetchAnnouncements();
    } catch (err) {
      alert(err.message || 'Failed to publish announcement.');
    }
  };

  // Export Bulletin PDF
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 font-sans">
      {/* 1. TOP HEADER & DISPATCH BADGE */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-[11px] font-bold text-indigo-700 tracking-wider uppercase shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>Official Dispatch • State University Bulletin</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Campus Announcements & Official Notices
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Centralized registry of university administrative decrees, faculty academic memos, emergency advisories, and student club broadcasts.
          </p>
        </div>

        {/* Top Header Action Buttons matching Image */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
          <div className="relative inline-block">
            <button
              onClick={() => alert('Department Filter: Showing all university departments')}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-2xs transition"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Department</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Bulletin PDF</span>
          </button>

          <button
            onClick={() => setShowPublishModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-98 transition"
          >
            <span>+ Publish Announcement</span>
            <span className="text-[10px] font-mono uppercase bg-indigo-700/80 px-1.5 py-0.5 rounded text-indigo-200">
              Faculty / Lead
            </span>
          </button>
        </div>
      </div>

      {/* 3. 4 KEY METRIC TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Notices */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            <span>Active Notices</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {bulletins.length || stats?.activeNotices || 18}
            <span className="text-xs font-semibold text-slate-400 ml-1.5 font-sans">Published</span>
          </div>
        </div>

        {/* Metric 2: Campus Reach */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            <span>Campus Reach</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {stats?.campusReach || '94.2%'}
            <span className="text-xs font-semibold text-slate-400 ml-1.5 font-sans">Read Rate</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>{stats?.enrolledCount || '14,820 / 15,730 Enrolled'}</span>
            <span className="font-bold text-indigo-600">{stats?.cohortGrade || 'Cohort A+'}</span>
          </div>
        </div>

        {/* Metric 3: Emergency SMS Blasts */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            <span>Emergency SMS Blasts</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {stats?.emergencyBlasts || 3}
            <span className="text-xs font-semibold text-slate-400 ml-1.5 font-sans">Sent this term</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{stats?.blastNote || '100% delivered carrier gateway'}</span>
          </div>
        </div>

        {/* Metric 4: Target Channels */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            <span>Target Channels</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {stats?.targetChannels || 8}
            <span className="text-xs font-semibold text-slate-400 ml-1.5 font-sans">Active segments</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium truncate">
            {stats?.channelsNote || 'Eng, Arts, Dorms, Commuters'}
          </div>
        </div>
      </div>

      {/* 4. MAIN LAYOUT: LEFT STREAM (2 COLS) vs RIGHT WIDGETS (1 COL) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ================= LEFT 2 COLS: BULLETIN FEED ================= */}
        <div className="lg:col-span-2 space-y-5">
          {/* Filter Pills row */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Notices ({bulletins.length})
            </button>

            <button
              onClick={() => setActiveFilter('urgent')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                activeFilter === 'urgent'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Urgent Advisories</span>
            </button>

            <button
              onClick={() => setActiveFilter('academic')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                activeFilter === 'academic'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Academic & Exam</span>
            </button>

            <button
              onClick={() => setActiveFilter('student')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                activeFilter === 'student'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Student Orgs & Clubs</span>
            </button>
          </div>

          {/* Filter / Search Bar controls row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter current list..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 w-full sm:w-auto justify-end">
              <select
                value={selectedAudience}
                onChange={(e) => setSelectedAudience(e.target.value)}
                className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
              >
                <option value="All Students">Audience: All Students</option>
                <option value="Undergraduate">Audience: Undergraduates</option>
                <option value="Faculty">Audience: Faculty & Leads</option>
              </select>

              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
              >
                <option value="Fall 2025">Term: Fall 2025</option>
                <option value="Spring 2026">Term: Spring 2026</option>
              </select>

              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
              >
                <option value="recent">Sort: Most Recent</option>
                <option value="reads">Sort: Top Reads</option>
              </select>
            </div>
          </div>

          {/* Bulletin Cards List */}
          <div className="space-y-4">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
                Loading campus dispatches...
              </div>
            ) : bulletins.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
                No active announcements match your filter.
              </div>
            ) : (
              bulletins.map((b) => {
                const isBookmarked = bookmarks.has(b.id);

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBulletin(b)}
                    className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-400 transition-all duration-200 space-y-4 relative cursor-pointer group"
                  >
                    {/* Card Header: Category Badge + Reference Code + Timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                          b.category?.includes('PINNED') || b.category?.includes('ACADEMIC')
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : b.category?.includes('CAREER')
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : b.category?.includes('CAMPUS LIFE') || b.category?.includes('COLLEGE')
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {b.category}
                        </span>

                        <span className="font-mono text-slate-500 font-bold">
                          REF: {b.reference_no}
                        </span>
                      </div>

                      <div className="text-slate-400 font-medium flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b.posted_date_str}</span>
                      </div>
                    </div>

                    {/* Headline Title */}
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                      {b.title}
                    </h2>

                    {/* Signee Metadata Line */}
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{b.issuer}</span>
                      </span>
                      {b.signee && <span>• {b.signee}</span>}
                      {b.target_audience && (
                        <span className="text-indigo-600 font-semibold">
                          • Target: {b.target_audience}
                        </span>
                      )}
                    </div>

                    {/* Notice Content Paragraph */}
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line line-clamp-3">
                      {b.message}
                    </p>

                    {/* Optional Attachments / Portal Links */}
                    {(b.attachment_name || b.portal_link || b.ballot_url) && (
                      <div className="flex flex-wrap items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                        {b.attachment_name && (
                          <button
                            type="button"
                            onClick={(e) => handleDownloadAttachment(b, e)}
                            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 transition"
                          >
                            <FileText className="w-4 h-4 text-indigo-600" />
                            <span>{b.attachment_name}</span>
                            {b.attachment_size && (
                              <span className="text-[10px] text-slate-400 font-normal">({b.attachment_size})</span>
                            )}
                            <Download className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                          </button>
                        )}

                        {b.portal_link && (
                          <a
                            href={b.portal_link}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <span>View Academic Calendar Portal</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {b.ballot_url && (
                          <a
                            href={b.ballot_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <span>Open Ballot Page</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Click prompt */}
                    <div className="pt-1 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-700 transition">
                      <span className="flex items-center gap-1.5">
                        <span>Read Full Official Directive & Details</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <span className="text-[11px] font-normal text-slate-400 group-hover:text-slate-600">Click to inspect</span>
                    </div>

                    {/* Card Footer: Read counts, clarifications, bookmark & share */}
                    <div
                      className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 font-medium">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>{b.reads_count?.toLocaleString()} Reads ({b.reads_percentage}% of cohort)</span>
                        </span>

                        {b.clarifications_count !== undefined && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                            <span>{b.clarifications_count} Public Clarifications</span>
                          </span>
                        )}

                        {b.rsvp_synced && (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>RSVP Auto-synced</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(b.id);
                          }}
                          className={`flex items-center gap-1 text-xs font-medium transition ${
                            isBookmarked ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current text-indigo-600' : ''}`} />
                          <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareNotice(b);
                          }}
                          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share to Email</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= RIGHT 1 COL: SIDEBAR WIDGETS ================= */}
        <div className="space-y-6">
          {/* WIDGET 1: QUICK DISPATCH (COORDINATOR ROLE) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Quick Dispatch</h3>
                  <p className="text-[10px] text-slate-400">Rapid student notification broadcast</p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold uppercase tracking-wider">
                Coordinator Role
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Draft a fast notice directly to your assigned student circles without full administrative sign-off.
            </p>

            {dispatchSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Notice dispatched to assigned student circle!</span>
              </div>
            )}

            <form onSubmit={handleQuickDispatch} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Notice Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lab Session Rescheduled to Room 204"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  required
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Target Audience
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white font-medium"
                >
                  <option value="Robotics Club Members (142 Active)">Robotics Club Members (142 Active)</option>
                  <option value="HackCon Registered Attendees">HackCon Registered Attendees</option>
                  <option value="Computer Science Sophomores">Computer Science Sophomores</option>
                  <option value="General Campus Cohort">General Campus Cohort</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Broadcast Priority
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority('standard')}
                    className={`py-1.5 text-xs font-bold rounded-xl border transition ${
                      priority === 'standard'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Standard
                  </button>

                  <button
                    type="button"
                    onClick={() => setPriority('urgent')}
                    className={`py-1.5 text-xs font-bold rounded-xl border transition ${
                      priority === 'urgent'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Urgent Push
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={dispatching}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{dispatching ? 'Dispatching...' : 'Draft New Notice'}</span>
              </button>
            </form>
          </div>

          {/* WIDGET 2: SUBSCRIBED FEEDS (ALERT PREFERENCES) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-600" />
                <span>Subscribed Feeds</span>
              </h3>
              <button
                onClick={() => alert('Feed preferences saved to student profile.')}
                className="text-[11px] text-indigo-600 font-bold hover:underline"
              >
                Manage All
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Tune your live notification alerts per collegiate division.
            </p>

            <div className="divide-y divide-slate-100">
              {subscribedFeeds.map((feed) => (
                <div key={feed.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      {feed.locked ? (
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <Bell className="w-3.5 h-3.5 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{feed.name}</div>
                      <div className="text-[10px] text-slate-400">{feed.subtext}</div>
                    </div>
                  </div>

                  {feed.locked ? (
                    <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-100">
                      Locked
                    </span>
                  ) : (
                    <button
                      onClick={() => handleToggleFeed(feed.id)}
                      className={`w-9 h-5 rounded-full p-0.5 transition flex items-center ${
                        feed.enabled ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* WIDGET 3: 24/7 SAFETY DESK CALLOUT */}
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider">
                <PhoneCall className="w-4 h-4" />
                <span>24/7 Safety Desk</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Direct dispatch for physical emergencies, campus escorts, and mental wellness clinics.
            </p>

            <div className="space-y-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 flex items-center justify-between">
                <div>
                  <div className="text-slate-500 text-[10px] font-semibold">Campus Police Emergency</div>
                  <div className="font-bold text-slate-900">Ext. 4400</div>
                </div>
                <a
                  href="tel:4400"
                  className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold hover:bg-rose-100 transition"
                >
                  📞
                </a>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 flex items-center justify-between">
                <div>
                  <div className="text-slate-500 text-[10px] font-semibold">Safe-Walk Night Escort</div>
                  <div className="font-bold text-slate-900">Ext. 2890 (6PM-4AM)</div>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 flex items-center justify-between">
                <div>
                  <div className="text-slate-500 text-[10px] font-semibold">Crisis Care & Mental Health</div>
                  <div className="font-bold text-slate-900">Dial 988 or Ext. 1104</div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  24/7
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: PUBLISH OFFICIAL ANNOUNCEMENT */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-7 shadow-2xl border border-slate-200 relative space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                  Institutional Dispatch Console
                </span>
                <h3 className="font-bold text-lg text-slate-900 mt-0.5">
                  Publish Campus Announcement
                </h3>
              </div>
              <button
                onClick={() => setShowPublishModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublishSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Headline Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Schedule Update for Fall Convocation..."
                  value={modalForm.title}
                  onChange={(e) => setModalForm(p => ({ ...p, title: e.target.value }))}
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Category Tag
                  </label>
                  <select
                    value={modalForm.category}
                    onChange={(e) => setModalForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="ACADEMIC SENATE">ACADEMIC SENATE</option>
                    <option value="CAREER ADVANCEMENT">CAREER ADVANCEMENT</option>
                    <option value="CAMPUS LIFE & HOUSING">CAMPUS LIFE & HOUSING</option>
                    <option value="STUDENT GOVERNMENT">STUDENT GOVERNMENT</option>
                    <option value="URGENT SAFETY">URGENT SAFETY</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Priority Level
                  </label>
                  <select
                    value={modalForm.priority}
                    onChange={(e) => setModalForm(p => ({ ...p, priority: e.target.value }))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="standard">Standard Bulletin</option>
                    <option value="urgent">Urgent / Pinned Dispatch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Target Audience
                </label>
                <input
                  type="text"
                  placeholder="e.g. All Undergraduates, Faculty & Research Scholars"
                  value={modalForm.target_audience}
                  onChange={(e) => setModalForm(p => ({ ...p, target_audience: e.target.value }))}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Official Communication Body *
                </label>
                <textarea
                  rows="4"
                  placeholder="Type official decree, policy memo, or event instruction..."
                  value={modalForm.message}
                  onChange={(e) => setModalForm(p => ({ ...p, message: e.target.value }))}
                  required
                  className="w-full text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Attachment Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dean_Notice_AddDrop_v2.pdf"
                  value={modalForm.attachment_name}
                  onChange={(e) => setModalForm(p => ({ ...p, attachment_name: e.target.value }))}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition"
                >
                  Broadcast Bulletin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAILED ANNOUNCEMENT INSPECTION */}
      {selectedBulletin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedBulletin(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col relative my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header Bar */}
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  <span>Official University Dispatch</span>
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200/80 text-slate-700 font-mono">
                  REF: {selectedBulletin.reference_no}
                </span>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  selectedBulletin.category?.includes('PINNED') || selectedBulletin.category?.includes('ACADEMIC')
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : selectedBulletin.category?.includes('CAREER')
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : selectedBulletin.category?.includes('CAMPUS LIFE') || selectedBulletin.category?.includes('COLLEGE')
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {selectedBulletin.category}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBulletin(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition border border-slate-200 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* Title & Metadata */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                  {selectedBulletin.title}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 font-medium flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Dispatched on {selectedBulletin.posted_date_str}</span>
                  </span>
                  <span>•</span>
                  <span className="text-indigo-600 font-semibold uppercase">
                    Priority: {selectedBulletin.priority || 'Standard'}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-600 font-medium">Digital Registry Verified</span>
                </div>
              </div>

              {/* Issuing Authority & Credential Details Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Issuing Department</div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="truncate">{selectedBulletin.issuer}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Authorized Signee</div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{selectedBulletin.signee || 'Office of Academic Affairs'}</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold block">Identity Verified</span>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Cohort</div>
                  <div className="font-bold text-indigo-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="truncate">{selectedBulletin.target_audience || 'All Enrolled Students'}</span>
                  </div>
                </div>
              </div>

              {/* Key Directives & Action Items Summary */}
              <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Executive Directives & Key Action Items</span>
                </div>

                <ul className="space-y-2 text-xs text-indigo-950 font-medium">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Mandatory Review:</strong> Review all deadlines, prerequisites, and attendance metrics outlined in this decree prior to the cutoff date.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Official Channels:</strong> Submit any forms, course petitions, or ballots exclusively through verified CampusConnect portals.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Dispute & Advisory Window:</strong> Visit authorized office hours or submit a clarification inquiry below if special accommodations are needed.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Detailed Description / Decree Body */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Official Decree & Detailed Memorandum
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-sm leading-relaxed whitespace-pre-line font-normal space-y-3 shadow-2xs">
                  <p className="font-medium text-slate-900 text-base leading-relaxed">
                    {selectedBulletin.message}
                  </p>
                  <p className="text-xs text-slate-500 pt-3 border-t border-slate-100">
                    This notice is cataloged in the State University Central Academic & Administrative Archives under reference code <strong>{selectedBulletin.reference_no}</strong>. Failure to comply with stipulated deadlines may lead to automatic administrative course drops or restriction of campus services.
                  </p>
                </div>
              </div>

              {/* Official Attachments & Digital Portals */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Authorized Attachments & External Portals
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Download memorandum card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {selectedBulletin.attachment_name || `${selectedBulletin.reference_no}_Notice.pdf`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Official Memorandum • {selectedBulletin.attachment_size || '1.2 MB'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadAttachment(selectedBulletin)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-indigo-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>

                  {/* Optional Portal Link or Verification Seal */}
                  {selectedBulletin.portal_link ? (
                    <a
                      href={selectedBulletin.portal_link}
                      target="_blank"
                      rel="noreferrer"
                      className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 hover:bg-indigo-100 flex items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                          <ExternalLink className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-indigo-950">Academic Calendar Portal</div>
                          <div className="text-[10px] text-indigo-600">Open official university site</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-indigo-600" />
                    </a>
                  ) : selectedBulletin.ballot_url ? (
                    <a
                      href={selectedBulletin.ballot_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 hover:bg-purple-100 flex items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                          <ExternalLink className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-purple-950">Campus Ballot System</div>
                          <div className="text-[10px] text-purple-600">Cast student vote on budget</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-purple-600" />
                    </a>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Tamper-evident Registry</div>
                        <div className="text-[10px] text-slate-400">Cryptographically signed decree</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Readership Telemetry & Reach */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>Cohort Readership: {selectedBulletin.reads_count?.toLocaleString()} Students</span>
                  </span>
                  <span className="font-bold text-indigo-600">{selectedBulletin.reads_percentage}% Reached</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                    style={{ width: `${selectedBulletin.reads_percentage || 75}%` }}
                  />
                </div>
              </div>

              {/* Interactive Public Clarifications & Inquiries (Q&A) */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <span>Public Clarifications & Official Answers ({bulletinClarifications.length})</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Moderated by Division Desk</span>
                </div>

                {/* List of existing clarifications */}
                <div className="space-y-3">
                  {bulletinClarifications.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-400">
                      No inquiries submitted yet. Ask a clarification question below.
                    </div>
                  ) : (
                    bulletinClarifications.map((c) => (
                      <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 flex items-center gap-1">
                            <span className="text-indigo-600 font-mono">Q:</span>
                            <span>{c.question}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">{c.timestamp}</span>
                        </div>
                        <div className="pl-4 border-l-2 border-indigo-500 text-slate-600 space-y-1">
                          <p className="leading-relaxed">
                            <strong className="text-indigo-900">Official Clarification:</strong> {c.answer}
                          </p>
                          <div className="text-[10px] text-slate-400">
                            Answered by: <span className="font-semibold text-slate-700">{c.author}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Ask Clarification Form */}
                <form onSubmit={handleClarificationSubmit} className="space-y-2 pt-1">
                  {clarificationSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Your clarification inquiry has been dispatched to the department desk!</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ask a clarifying question regarding this announcement..."
                      value={clarificationQuestion}
                      onChange={(e) => setClarificationQuestion(e.target.value)}
                      className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={submittingClarification || !clarificationQuestion.trim()}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingClarification ? 'Posting...' : 'Ask Question'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Clarifications are verified by department coordinators before permanent archival.
                  </p>
                </form>
              </div>
            </div>

            {/* Modal Bottom Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => toggleBookmark(selectedBulletin.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                    bookmarks.has(selectedBulletin.id)
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${bookmarks.has(selectedBulletin.id) ? 'fill-current text-indigo-600' : ''}`} />
                  <span>{bookmarks.has(selectedBulletin.id) ? 'Bookmarked' : 'Bookmark Notice'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShareNotice(selectedBulletin)}
                  className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Notice</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Decree</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBulletin(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
              >
                Close Full View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
