import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Calendar,
  Building2,
  DollarSign,
  Activity,
  FileText,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function AdminGovernancePage() {
  const { user, role } = useAuth();
  const [stats, setStats] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, rejected, audit

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, propRes, auditRes] = await Promise.all([
        api.getAdminStats(),
        api.getProposals(),
        api.getAuditLogs()
      ]);
      setStats(statsRes.stats);
      setProposals(propRes.proposals || []);
      setAuditLogs(auditRes.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleApprove = async (id, title) => {
    try {
      await api.approveEvent(id, 'Sanctioned by Dean of Student Affairs');
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.5 }
      });
      loadAdminData();
    } catch (err) {
      alert('Approval error: ' + err.message);
    }
  };

  const handleReject = async (id, title) => {
    const reason = window.prompt(`Enter reason for declining proposal "${title}":`, 'Requires revised safety protocols.');
    if (!reason) return;
    try {
      await api.rejectEvent(id, reason);
      loadAdminData();
    } catch (err) {
      alert('Rejection error: ' + err.message);
    }
  };

  const pendingProposals = proposals.filter(p => p.status === 'pending_approval');
  const approvedProposals = proposals.filter(p => p.status === 'approved');
  const rejectedProposals = proposals.filter(p => p.status === 'rejected');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Banner (Screen 4) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Administrative Governance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Governance & <span className="text-indigo-600">Sanctions Bureau</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
            Review pending event proposals, regulate club compliance, monitor platform audit trails, and approve high-impact campus events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('Campus Policy Regulation Handbook v4.2 downloaded.')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Review Policies</span>
          </button>

          <button
            onClick={() => alert('New Policy Decree modal opened.')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition active:scale-98"
          >
            <span>+ Platform Policy</span>
          </button>
        </div>
      </div>

      {/* 4 Top KPI Stat Cards (Screen 4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Stat 1: Pending Proposals */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Pending Proposals</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {pendingProposals.length || stats?.pendingProposals || 7}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
            <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px]">
              Requires Review
            </span>
          </div>
        </div>

        {/* Stat 2: Approved Events */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Approved Events</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {approvedProposals.length || stats?.approvedEvents || 38}
          </div>
          <div className="mt-2 text-xs font-semibold text-emerald-600">
            Active This Term
          </div>
        </div>

        {/* Stat 3: Total Student Registrations */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Total Registrations</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {stats?.totalRegistrations || 4219}
          </div>
          <div className="mt-2 text-xs font-semibold text-indigo-600">
            +24% Month-over-Month
          </div>
        </div>

        {/* Stat 4: Attendance Rate Gauge */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold mb-2">Turnout Rate</div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {stats?.attendanceRate || '84%'}
            </div>
            <div className="mt-2 text-xs text-slate-500 font-medium">Campus Turnout</div>
          </div>

          {/* Mini Radial Gauge */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-indigo-600"
                strokeDasharray="84, 100"
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute font-bold text-xs text-slate-800">
              84%
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs (Screen 4) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('pending')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
            activeTab === 'pending'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pending Approvals ({pendingProposals.length})
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
            activeTab === 'approved'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Sanctioned & Approved ({approvedProposals.length})
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
            activeTab === 'rejected'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Declined / Flagged ({rejectedProposals.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
            activeTab === 'audit'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Audit Log ({auditLogs.length})
        </button>
      </div>

      {/* Main Content Split: Left 2 Cols (Proposals) vs Right 1 Col (Compliance & Audit) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Proposals List */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'audit' ? (
            /* Audit Trail View */
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">Platform System Audit Trail</h3>
              <div className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                        {log.action}
                      </span>
                      <p className="text-slate-600 mt-1">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Event Proposals Cards (Matching Screen 4) */
            <div className="space-y-5">
              {(activeTab === 'pending' ? pendingProposals : activeTab === 'approved' ? approvedProposals : rejectedProposals).map((prop) => (
                <div
                  key={prop.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5 hover:border-indigo-200 transition"
                >
                  {/* Proposal Top Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {prop.category}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {prop.club_name || 'Robotics & AI Guild'}
                        </span>
                        {prop.status === 'pending_approval' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Needs Approval
                          </span>
                        )}
                        {prop.status === 'approved' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Sanctioned & Published
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-xl text-slate-900">{prop.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black text-slate-900 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                        Budget: ${prop.budget_requested || 1250}
                      </span>
                    </div>
                  </div>

                  {/* Proposal Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Dates</span>
                      <span className="font-semibold text-slate-900">{prop.date_str}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Venue</span>
                      <span className="font-semibold text-slate-900 truncate block">{prop.venue}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Capacity</span>
                      <span className="font-semibold text-slate-900">{prop.capacity} Seats</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Impact Rating</span>
                      <span className="font-bold text-indigo-600">{prop.impact_score || 'High Impact'}</span>
                    </div>
                  </div>

                  {/* Safety & Compliance Notes (Screen 4) */}
                  <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs space-y-1">
                    <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Coordinator Review Checklist:</span>
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      {prop.coordinator_notes || 'Facilities cleared. Security team assigned. Speaker list verified and travel funded.'}
                    </p>
                  </div>

                  {/* Action Buttons (Matching Screen 4) */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                    <button
                      onClick={() => alert(`Downloading official administrative proposal PDF for ${prop.title}`)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF Proposal</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {prop.status === 'pending_approval' && (
                        <>
                          <button
                            onClick={() => handleReject(prop.id, prop.title)}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(prop.id, prop.title)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition active:scale-98 flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve & Sanction Event</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Administrative Tools (Screen 4) */}
        <div className="space-y-6">
          {/* Card 1: Mini Approval Queue Calendar */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Approval Queue Calendar
              </h3>
              <Calendar className="w-4 h-4 text-indigo-600" />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
              <div className="text-xs font-bold text-slate-900">Current Session: Spring 2025</div>
              <div className="grid grid-cols-7 gap-1 text-[11px] font-bold text-slate-400 pt-2">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs font-semibold pt-1">
                <span className="p-1 rounded text-slate-300">28</span>
                <span className="p-1 rounded text-slate-300">29</span>
                <span className="p-1 rounded bg-indigo-100 text-indigo-700">1</span>
                <span className="p-1 rounded text-slate-700">2</span>
                <span className="p-1 rounded text-slate-700">3</span>
                <span className="p-1 rounded text-slate-700">4</span>
                <span className="p-1 rounded text-slate-700">5</span>
                <span className="p-1 rounded text-slate-700">6</span>
                <span className="p-1 rounded text-slate-700">7</span>
                <span className="p-1 rounded text-slate-700">8</span>
                <span className="p-1 rounded text-slate-700">9</span>
                <span className="p-1 rounded text-slate-700">10</span>
                <span className="p-1 rounded text-slate-700">11</span>
                <span className="p-1 rounded text-slate-700">12</span>
                <span className="p-1 rounded text-slate-700">13</span>
                <span className="p-1 rounded text-slate-700">14</span>
                <span className="p-1 rounded bg-amber-200 text-amber-900 font-bold">15</span>
                <span className="p-1 rounded bg-amber-200 text-amber-900 font-bold">16</span>
                <span className="p-1 rounded text-slate-700">17</span>
                <span className="p-1 rounded text-slate-700">18</span>
                <span className="p-1 rounded text-slate-700">19</span>
              </div>
            </div>
          </div>

          {/* Card 2: Safety & Policy Enforcement Alert (Screen 4) */}
          <div className="p-6 rounded-3xl bg-amber-50/70 border border-amber-200/80 text-amber-950 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Safety & Policy Enforcement
              </span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              Overnight events beyond 10:00 PM require advance security clearance from Campus Patrol. Noise curfews strictly apply after 10:30 PM.
            </p>
          </div>

          {/* Card 3: Platform Audit Activity Summary */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Administrative Compliance
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dean's office compliance metrics: 98.4% of event proposals evaluated within 48 hours SLA.
            </p>
            <div className="pt-1">
              <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                <span>Sanction Compliance Logged</span>
                <span>✓</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
