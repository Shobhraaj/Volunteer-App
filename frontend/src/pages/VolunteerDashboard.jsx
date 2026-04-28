import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import StatCard from "../components/StatCard";
import ConfirmDialog from "../components/ConfirmDialog";
import ActivityStatus from "../components/ActivityStatus";
import {
  notifyTaskApplied,
  notifyTaskCancelled,
} from "../services/notificationService";
import {
  Trophy,
  CheckCircle,
  Award,
  BarChart3,
  BrainCircuit,
  List,
  FileText,
  MapPin,
} from "lucide-react";

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [history, setHistory] = useState([]);
  const [badges, setBadges] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [tab, setTab] = useState("recommended");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Confirm dialog state
  const [confirm, setConfirm] = useState({ open: false, taskId: null });
  const [cancelConfirm, setCancelConfirm] = useState({
    open: false,
    participationId: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recs, hist, bdgs, tasks] = await Promise.all([
        api.getRecommendations(8),
        api.getHistory(),
        api.getBadges(),
        api.listTasks("open"),
      ]);
      setRecommendations(recs);
      setHistory(hist);
      setBadges(bdgs);
      setAllTasks(tasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (taskId) => {
    setConfirm({ open: true, taskId });
  };

  const confirmApply = async () => {
    const taskId = confirm.taskId;
    setConfirm({ open: false, taskId: null });
    try {
      const res = await api.applyToTask(taskId);
      const task = allTasks.find((t) => t.id === taskId);
      if (task) notifyTaskApplied(user.id, task.title);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = (participationId) => {
    setCancelConfirm({ open: true, participationId });
  };

  const confirmCancel = async () => {
    const pid = cancelConfirm.participationId;
    setCancelConfirm({ open: false, participationId: null });
    try {
      await api.cancelParticipation(pid);
      const histItem = history.find((h) => h.id === pid);
      if (histItem) notifyTaskCancelled(user.id, `Task #${histItem.task_id}`);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const completedCount = history.filter((h) => h.status === "completed").length;
  const appliedMap = {};
  history.forEach((h) => {
    appliedMap[h.task_id] = h;
  });

  if (loading) {
    return (
      <div className="main-content">
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 140, borderRadius: 16 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="main-content animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-10 mb-12">
        <div className="animate-slide-up flex-1">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-black uppercase tracking-widest rounded-full mb-6">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Volunteer Dashboard
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
            Welcome back,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
              {user?.full_name?.split(" ")[0]}
            </span>{" "}
            👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xl max-w-3xl leading-relaxed">
            Here's your personal activity overview and AI-powered
            recommendations tailored to your skills.
          </p>
        </div>

        <div
          className="flex items-center gap-8 px-10 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full shadow-premium animate-slide-up shrink-0 h-fit"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex flex-col">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Current Status
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white leading-none">
              Active Volunteer
            </div>
          </div>
          <div className="h-10 w-px bg-slate-100 dark:bg-white/10" />
          <div className="flex items-center">
            <ActivityStatus userId={user?.id} />
          </div>
        </div>
      </div>

      {/* ── Stat Cards & Achievements ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatCard
              icon={<Trophy className="w-7 h-7" />}
              label="Total Points"
              value={user?.points || 0}
              color="amber"
            />
            <StatCard
              icon={<CheckCircle className="w-7 h-7" />}
              label="Tasks Completed"
              value={completedCount}
              color="emerald"
            />
            <StatCard
              icon={<Award className="w-7 h-7" />}
              label="Badges Earned"
              value={badges.length}
              color="violet"
            />
            <StatCard
              icon={<BarChart3 className="w-7 h-7" />}
              label="Reliability Score"
              value={`${((user?.reliability_score || 0) * 100).toFixed(0)}%`}
              color="cyan"
            />
          </div>
        </div>

        <div className="lg:col-span-4">
          <div
            className="card h-full flex flex-col p-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-premium animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center border border-violet-500/20 shadow-sm">
                <Award className="w-7 h-7 text-violet-500 shrink-0" />
              </div>
              <div>
                <h3 className="text-xl font-black mb-0.5">Achievements</h3>
                <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">
                  {badges.length} items unlocked
                </span>
              </div>
            </div>

            {badges.length > 0 ? (
              <div className="flex-1 flex flex-col gap-3">
                {badges.slice(0, 3).map((b, i) => (
                  <div
                    key={i}
                    className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-[12px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between group hover:border-violet-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 bg-violet-500 rounded-full shadow-[0_0_12px_rgba(139,92,246,0.6)]" />
                      {b.badge_name}
                    </div>
                  </div>
                ))}
                {badges.length > 3 && (
                  <button className="mt-auto py-4 px-4 bg-slate-100 dark:bg-white/5 rounded-2xl text-xs font-black text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-dashed border-slate-300 dark:border-white/10 tracking-widest uppercase">
                    View full trophy case
                  </button>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem]">
                <Award className="w-12 h-12 text-slate-200 dark:text-white/10 mb-4" />
                <p className="text-slate-400 text-sm font-bold leading-relaxed max-w-[200px]">
                  Earn badges by completing high-impact volunteer tasks.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 animate-slide-up"
        style={{ animationDelay: "0.3s" }}
      >
        <div className="flex p-2 bg-slate-200/50 dark:bg-white/5 backdrop-blur-md rounded-[1.5rem] w-fit border border-slate-200/50 dark:border-white/10 shadow-sm">
          <TabButton
            active={tab === "recommended"}
            onClick={() => setTab("recommended")}
            label={
              <span className="flex items-center gap-2.5 px-2">
                <BrainCircuit className="w-5 h-5" /> AI Recommended
              </span>
            }
          />
          <TabButton
            active={tab === "all"}
            onClick={() => setTab("all")}
            label={
              <span className="flex items-center gap-2.5 px-2">
                <List className="w-5 h-5" /> Browse All
              </span>
            }
          />
          <TabButton
            active={tab === "history"}
            onClick={() => setTab("history")}
            label={
              <span className="flex items-center gap-2.5 px-2">
                <FileText className="w-5 h-5" /> My History
              </span>
            }
          />
        </div>

        <div className="flex items-center gap-4 px-6 py-3 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 shadow-premium">
          <div className="relative flex items-center justify-center w-3 h-3">
            <span className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-30" />
            <div className="relative w-2.5 h-2.5 bg-primary-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300">
            Live Task Feed
          </span>
        </div>
      </div>

      {/* ── Tab Panels ─────────────────────────────────────────────── */}
      <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
        {/* Recommended */}
        {tab === "recommended" && (
          <div className="space-y-8">
            {recommendations.length === 0 ? (
              <EmptyState
                icon={<BrainCircuit className="w-12 h-12" />}
                title="No recommendations yet"
                text="Complete your profile with skills & availability to get AI-powered suggestions"
              />
            ) : (
              recommendations.map((rec) => {
                const participation = appliedMap[rec.task.id];
                return (
                  <div
                    className="rec-card apple-hover group cursor-pointer !flex-row !items-center !gap-12 !p-10"
                    key={rec.task.id}
                    onClick={() => navigate(`/tasks/${rec.task.id}`)}
                  >
                    {/* Left: Score Circle */}
                    <div className="relative w-24 h-24 shrink-0 hidden md:flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                        <circle
                          cx="48"
                          cy="48"
                          r="42"
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-slate-100 dark:text-white/5"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="42"
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeDasharray={264}
                          strokeDashoffset={
                            264 - (264 * rec.relevance_score) / 100
                          }
                          className="text-primary-500 transition-all duration-1000"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                          {rec.relevance_score.toFixed(0)}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">
                          Match
                        </span>
                      </div>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors truncate tracking-tight">
                          {rec.task.title}
                        </div>
                        <span
                          className={`urgency-tag urgency-${rec.task.urgency} !mb-0 shadow-sm`}
                        >
                          {rec.task.urgency}
                        </span>
                      </div>

                      <div className="flex items-center gap-6 mb-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary-500" />
                          {rec.task.location_name || "Remote"}
                        </span>
                        <span className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-amber-500" />
                          {rec.task.points || 50} pts
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2.5 mb-6">
                        {(rec.task.required_skills || []).map((s) => (
                          <span
                            key={s}
                            className="skill-tag !mb-0 !px-4 !py-1.5 !rounded-xl border border-transparent group-hover:border-primary-500/20 transition-colors shadow-sm"
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2.5 text-xs font-bold text-primary-500 bg-primary-500/5 w-fit px-3 py-1.5 rounded-lg border border-primary-500/10">
                        <BrainCircuit className="w-4 h-4" />
                        {rec.reasons[0]}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex flex-col justify-end shrink-0">
                      {!participation ? (
                        <button
                          className="btn btn-primary !px-8 !py-4 !rounded-2xl shadow-xl shadow-primary-500/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApply(rec.task.id);
                          }}
                        >
                          Apply Now
                        </button>
                      ) : participation.status === "applied" ||
                        participation.status === "assigned" ? (
                        <div className="flex flex-col gap-3">
                          <span className="badge badge-emerald py-3 px-6 !text-sm font-bold shadow-sm">
                            Applied ✓
                          </span>
                          {participation.status === "applied" && (
                            <button
                              className="btn btn-secondary !bg-red-500/10 !text-red-500 hover:!bg-red-500/20 !py-2.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancel(participation.id);
                              }}
                            >
                              Withdraw
                            </button>
                          )}
                        </div>
                      ) : (
                        <span
                          className={`badge badge-${participation.status === "completed" ? "emerald" : "violet"} py-3 px-6 !text-sm font-bold shadow-sm`}
                        >
                          {participation.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* All Tasks */}
        {tab === "all" && (
          <div className="task-grid">
            {allTasks.map((task) => {
              const participation = appliedMap[task.id];
              return (
                <div
                  className="card flex flex-col apple-hover group cursor-pointer"
                  key={task.id}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`urgency-tag urgency-${task.urgency}`}>
                      {task.urgency}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      {task.current_volunteers}/{task.max_volunteers} filled
                    </span>
                  </div>

                  <div className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors mb-3 leading-snug">
                    {task.title}
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-5 flex-1 leading-relaxed">
                    {task.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {(task.required_skills || []).slice(0, 3).map((s) => (
                      <span key={s} className="skill-tag !text-[10px] !px-2">
                        {s}
                      </span>
                    ))}
                    {task.required_skills?.length > 3 && (
                      <span className="text-[10px] font-bold text-slate-400 self-center">
                        +{task.required_skills.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {task.location_name || "Remote"}
                    </span>
                    {!participation ? (
                      <button
                        className="btn btn-primary !px-4 !py-2 !text-xs shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApply(task.id);
                        }}
                      >
                        Apply
                      </button>
                    ) : participation.status === "applied" ? (
                      <button
                        className="btn btn-secondary !bg-red-500/10 !text-red-500 !px-4 !py-2 !text-xs shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel(participation.id);
                        }}
                      >
                        Withdraw
                      </button>
                    ) : (
                      <span
                        className={`badge badge-${participation.status === "completed" ? "emerald" : "cyan"}`}
                      >
                        {participation.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {allTasks.length === 0 && (
              <EmptyState
                icon={<List className="w-12 h-12" />}
                title="No open tasks right now"
                text="Check back soon for new opportunities!"
              />
            )}
          </div>
        )}

        {/* History */}
        {tab === "history" && (
          <div className="card">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Participation History</h3>
              <Link
                to="/history"
                className="text-sm font-bold text-primary-500 hover:underline underline-offset-2"
              >
                View Full History →
              </Link>
            </div>

            {history.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-12 h-12" />}
                title="No participation history"
                text="Apply to tasks to start building your volunteer legacy!"
              />
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Status</th>
                      <th>Match Score</th>
                      <th>Applied Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 10).map((h) => (
                      <tr key={h.id}>
                        <td className="font-bold text-slate-900 dark:text-white">
                          <Link
                            to={`/tasks/${h.task_id}`}
                            className="hover:text-primary-500 transition-colors"
                          >
                            Task #{h.task_id}
                          </Link>
                        </td>
                        <td>
                          <span
                            className={`badge badge-${
                              h.status === "completed"
                                ? "emerald"
                                : h.status === "no_show"
                                  ? "danger"
                                  : h.status === "assigned"
                                    ? "cyan"
                                    : "violet"
                            }`}
                          >
                            {h.status}
                          </span>
                        </td>
                        <td className="font-medium">
                          {h.match_score ? `${h.match_score.toFixed(0)}%` : "—"}
                        </td>
                        <td className="text-slate-400">
                          {h.applied_at
                            ? new Date(h.applied_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>
                          {h.status === "applied" && (
                            <button
                              className="text-red-500 hover:text-red-600 font-bold text-xs uppercase tracking-wide transition-colors"
                              onClick={() => handleCancel(h.id)}
                            >
                              Withdraw
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Confirm Dialogs ─────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirm.open}
        title="Confirm Application"
        message="Are you sure you want to apply for this task? The organizer will be notified of your application."
        confirmLabel="Yes, Apply Now"
        onConfirm={confirmApply}
        onCancel={() => setConfirm({ open: false, taskId: null })}
      />

      <ConfirmDialog
        open={cancelConfirm.open}
        title="Withdraw Application"
        message="Are you sure you want to withdraw? This will remove you from the candidate list."
        confirmLabel="Yes, Withdraw"
        cancelLabel="Keep Application"
        danger
        onConfirm={confirmCancel}
        onCancel={() =>
          setCancelConfirm({ open: false, participationId: null })
        }
      />
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
        active
          ? "bg-white dark:bg-white/10 text-primary-500 shadow-sm"
          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 card border-dashed">
      <div className="mb-5 text-slate-300 dark:text-slate-700">{icon}</div>
      <h3 className="text-lg font-bold text-slate-400 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 text-center max-w-xs leading-relaxed">
        {text}
      </p>
    </div>
  );
}
