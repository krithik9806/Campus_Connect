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
  ArrowRight,
  Award,
  Layers,
  Sparkles,
  Search,
  ExternalLink
} from 'lucide-react';

export default function AdminGovernancePage() {
  const { user, role, switchRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [clubsCompliance, setClubsCompliance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, rejected, compliance, audit
  const [showAccreditationModal, setShowAccreditationModal] = useState(false);
  const [accreditationReport, setAccreditationReport] = useState(null);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, propRes, auditRes, compRes] = await Promise.all([
        api.getAdminStats(),
        api.getProposals(),
        api.getAuditLogs(),
        api.getClubsCompliance()
      ]);
      setStats(statsRes.stats);
      setProposals(propRes.proposals || []);
      setAuditLogs(auditRes.logs || []);
      setClubsCompliance(compRes.clubs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [role]);

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

  const handleFetchAccreditation = async () => {
    try {
      const res = await api.getAccreditationReport();
      setAccreditationReport(res.report);
      setShowAccreditationModal(true);
    } catch (err) {
      alert('Failed to generate report: ' + err.message);
    }
  };

  const handleUpdateClubStanding = async (clubId, newStanding) => {
    try {
      await api.updateClubCompliance(clubId, { status: newStanding, standing: newStanding });
      const compRes = await api.getClubsCompliance();
      setClubsCompliance(compRes.clubs || []);
    } catch (err) {
      alert(err.message || 'Failed to update club standing');
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
            <span>Institutional Governance & Dean Office</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Governance & <span className="text-indigo-600">Sanctions Bureau</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
            Review event proposals, regulate club charters, monitor institutional audit trails, and generate statutory accreditation metrics for NAAC / NIRF reporting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleFetchAccreditation}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Generate NAAC / NIRF Audit Report</span>
          </button>

          <button
            onClick={() => setActiveTab('compliance')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition active:scale-98"
          >
            <Building2 className="w-4 h-4" />
            <span>Club Charter Oversight</span>
          </button>
        </div>
      </div>

      {/* Non-admin notice */}
      {role !== 'admin' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-900">Administrator Persona Recommended</div>
              <p className="text-xs text-amber-700">
                You are currently previewing as a <span className="capitalize font-semibold">{role}</span>. Switch to the Administrator persona (Dr. Rajesh Menon) to sanction proposals, regulate charters, and review audit logs.
              </p>
            </div>
          </div>
          <button
            onClick={() => switchRole('admin')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition shadow-sm"
          >
            Switch to Administrator Persona
          </button>
        </div>
      )}

      {/* 4 Top KPI Stat Cards (Screen 4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Stat 1: Pending Proposals */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Pending Proposals</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {pendingProposals.length}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
            <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px]">
              Requires Dean Sanction
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
            {approvedProposals.length}
          </div>
          <div className="mt-2 text-xs font-semibold text-emerald-600">
            Active This Academic Cycle
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
            Extracurricular Enrollment
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
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
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
          onClick={() => setActiveTab('compliance')}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
            activeTab === 'compliance'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Club Charters & Compliance ({clubsCompliance.length})
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

      {/* Main Content Split: Left 2 Cols vs Right 1 Col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Proposals / Club Compliance / Audit */}
        <div className="lg:col-span-2 space-y-6">
          {/* TAB 1: CLUB CHARTER & COMPLIANCE MANAGER */}
          {activeTab === 'compliance' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Recognized Student Organizations & Club Standing
                  </h3>
                  <p className="text-xs text-slate-500">
                    Faculty advisor supervision, disciplinary status, and budgetary sanction eligibility.
                  </p>
                </div>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                  Dean Registry
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {clubsCompliance.map((club) => (
                  <div key={club.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{club.name}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {club.category}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                        <span>Advisor: <strong className="text-slate-700">{club.faculty_advisor || 'Dr. Robert Chen'}</strong></span>
                        <span>•</span>
                        <span>Audited Events: <strong className="text-indigo-600">{club.event_count || 1}</strong></span>
                        <span>•</span>
                        <span>Charter Reg: #{club.id.toString().padStart(4, '0')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={club.compliance_standing || 'good_standing'}
                        onChange={(e) => handleUpdateClubStanding(club.id, e.target.value)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none cursor-pointer ${
                          club.compliance_standing === 'warning'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : club.compliance_standing === 'probation'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        <option value="good_standing">Good Standing</option>
                        <option value="warning">Notice / Warning</option>
                        <option value="probation">Probation / Suspended</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">
                Immutable Governance Audit Trail
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-slate-900">{log.action}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Target: {log.target_type} #{log.target_id} • User: {log.performed_by_name || 'Admin'}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PROPOSALS (Pending, Approved, Rejected) */}
          {activeTab !== 'audit' && activeTab !== 'compliance' && (
            <div className="space-y-4">
              {(activeTab === 'pending' ? pendingProposals : activeTab === 'approved' ? approvedProposals : rejectedProposals).length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
                  No event proposals in this sanction state.
                </div>
              ) : (
                (activeTab === 'pending' ? pendingProposals : activeTab === 'approved' ? approvedProposals : rejectedProposals).map((prop) => (
                  <div
                    key={prop.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:border-indigo-200 transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                            {prop.category}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            Proposal #{prop.id}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {prop.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Submitted by <strong className="text-slate-700">{prop.club_name}</strong> • Coordinator: {prop.coordinator_name || 'Priya Patel'}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {prop.status === 'pending_approval' && (
                          <>
                            <button
                              onClick={() => handleReject(prop.id, prop.title)}
                              className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                            <button
                              onClick={() => handleApprove(prop.id, prop.title)}
                              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve & Sanction</span>
                            </button>
                          </>
                        )}
                        {prop.status === 'approved' && (
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Sanctioned</span>
                          </span>
                        )}
                        {prop.status === 'rejected' && (
                          <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Declined</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {prop.description}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400 block">Date</span>
                        <span className="font-bold text-slate-800">{prop.date_str}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Venue</span>
                        <span className="font-bold text-slate-800 truncate block">{prop.venue}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Requested Cap</span>
                        <span className="font-bold text-slate-800">{prop.capacity} Seats</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Budget Sanction</span>
                        <span className="font-bold text-emerald-600">$450 Allocated</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Column: Compliance Sidebars (Screen 4) */}
        <div className="space-y-6">
          {/* Card 1: Academic Calendar */}
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
              Institutional Accreditation Status
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dean's office extracurricular audit compliance: <strong>99.1%</strong> verified student attendance records with cryptographic hashes.
            </p>
            <div className="pt-1">
              <button
                onClick={handleFetchAccreditation}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
              >
                <span>View NAAC / NIRF Metrics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STATUTORY NAAC / NIRF ACCREDITATION AUDIT MODAL */}
      {showAccreditationModal && accreditationReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 relative space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                  Institution Quality Assurance Cell (IQAC)
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  Extracurricular Audit Report (NIRF / NAAC Criterion 5)
                </h2>
              </div>
              <button
                onClick={() => setShowAccreditationModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100">
                <div className="text-2xl font-black text-indigo-700">{accreditationReport.total_approved_events}</div>
                <div className="text-[11px] font-semibold text-slate-600 mt-1">Conducted Events</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="text-2xl font-black text-emerald-700">{accreditationReport.total_registrations}</div>
                <div className="text-[11px] font-semibold text-slate-600 mt-1">Total Registrations</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-100">
                <div className="text-2xl font-black text-purple-700">{accreditationReport.total_verified_attendees}</div>
                <div className="text-[11px] font-semibold text-slate-600 mt-1">Verified Attendees</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100">
                <div className="text-2xl font-black text-amber-700">{accreditationReport.total_certificates_issued}</div>
                <div className="text-[11px] font-semibold text-slate-600 mt-1">Certificates Issued</div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Departmental Extracurricular Participation Share
              </h4>
              <div className="space-y-2">
                {accreditationReport.department_distribution.map((dept, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">{dept.department}</span>
                    <span className="font-mono font-bold text-indigo-600">{dept.count} Students ({dept.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs flex items-center justify-between">
              <div>
                <div className="font-bold">Cryptographic Report Hash:</div>
                <div className="font-mono text-indigo-300 text-[10px] break-all">{accreditationReport.integrity_hash}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Official Audit PDF</span>
              </button>
              <button
                onClick={() => setShowAccreditationModal(false)}
                className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
