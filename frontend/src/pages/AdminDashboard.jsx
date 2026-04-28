import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import StatCard from "../components/StatCard";
import ScrollReveal from "../components/ScrollReveal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useTheme } from "../context/ThemeContext";
import {
  Download,
  Users,
  BarChart3,
  List,
  Flame,
  CheckCircle,
  Search,
  MapPin,
  Edit3,
  Trash2,
} from "lucide-react";

export default function AdminDashboard() {
  const [tasks, setTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  // Modals / Dialogs
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    taskId: null,
  });
  const [cancelAssignConfirm, setCancelAssignConfirm] = useState({
    open: false,
    taskId: null,
    volId: null,
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    loadInitialData();

    // Real-time Firestore listeners for tasks
    let tasksUnsub = () => {};
    if (db) {
      tasksUnsub = onSnapshot(collection(db, "task_tracking"), (snapshot) => {
        loadInitialData();
      });
    }

    return () => tasksUnsub();
  }, []);

  const loadInitialData = async () => {
    try {
      const [t, v, s] = await Promise.all([
        api.getMyTasks(),
        api.getLeaderboard(50),
        api.getOrgStats(),
      ]);
      setTasks(t);
      setVolunteers(v);
      setStats(s);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    window.open(api.exportReport(), "_blank");
  };

  const handleCancelAssignment = async () => {
    const { taskId, volId } = cancelAssignConfirm;
    try {
      await api.cancelAssignment(taskId, volId);
      setCancelAssignConfirm({ open: false, taskId: null, volId: null });
      loadInitialData();
    } catch (err) {
      alert("Failed to cancel assignment: " + err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteTask(deleteConfirm.taskId);
      setDeleteConfirm({ open: false, taskId: null });
      loadInitialData();
    } catch (err) {
      alert("Failed to delete task: " + err.message);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask({
      ...task,
      required_skills: (task.required_skills || []).join(", "),
    });
    setShowEditModal(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      await api.updateTask(editingTask.id, {
        ...editingTask,
        required_skills: editingTask.required_skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        max_volunteers: parseInt(editingTask.max_volunteers),
      });
      setShowEditModal(false);
      loadInitialData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading)
    return (
      <div className="main-content">
        <div className="skeleton" style={{ height: 400 }} />
      </div>
    );

  return (
    <div className="main-content animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="animate-slide-up">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            Admin Control Panel
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Monitor resources, lifecycle stages, and volunteer performance.
          </p>
        </div>
        <div
          className="flex flex-wrap items-center gap-3 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <button
            className="btn btn-secondary !px-4 whitespace-nowrap"
            onClick={handleExportCSV}
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
          <button
            className="btn btn-secondary !px-4 whitespace-nowrap"
            onClick={() => navigate("/volunteers")}
          >
            <Users className="w-4 h-4" /> Volunteers
          </button>
          <button
            className="btn btn-primary !px-4 whitespace-nowrap"
            onClick={() => navigate("/analytics")}
          >
            <BarChart3 className="w-4 h-4" /> Insights
          </button>
        </div>
      </div>

      {/* Global Stats */}
      <div className="stats-grid">
        <StatCard
          icon={<List className="w-6 h-6" />}
          label="All Tasks"
          value={tasks.length}
          color="cyan"
          onClick={() => setStatusFilter("all")}
        />
        <StatCard
          icon={<Flame className="w-6 h-6" />}
          label="Active Tasks"
          value={stats?.active_tasks || 0}
          color="amber"
          onClick={() => setStatusFilter("in_progress")}
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6" />}
          label="Completed Tasks"
          value={stats?.completed_tasks || 0}
          color="emerald"
          onClick={() => setStatusFilter("completed")}
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Total Volunteers"
          value={volunteers.length}
          color="violet"
          onClick={() => navigate("/volunteers")}
        />
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* Task Management */}
        <div
          className="card animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4 flex-wrap">
              <h3 className="text-xl font-bold whitespace-nowrap">
                Task Lifecycle
              </h3>
              {statusFilter !== "all" && (
                <button
                  className="badge badge-cyan hover:scale-105 transition-transform"
                  onClick={() => setStatusFilter("all")}
                >
                  Filter: {statusFilter} ✕
                </button>
              )}
            </div>
            <div className="relative w-full sm:w-auto flex-shrink-0">
              <input
                type="text"
                placeholder="Search tasks..."
                className="form-input !py-2 !pl-10 !text-sm w-full sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
            </div>
          </div>

          <div className="data-table-container overflow-x-auto">
            <table className="data-table w-full min-w-[700px]">
              <thead>
                <tr>
                  <th className="text-left align-middle">Task</th>
                  <th className="text-center align-middle">Status</th>
                  <th className="text-left align-middle">Allocation</th>
                  <th className="text-left align-middle">Assigned</th>
                  <th className="text-right align-middle pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <td className="font-bold text-slate-900 dark:text-white align-middle max-w-[250px]">
                      <div
                        className="group-hover:text-primary-500 transition-colors block leading-tight truncate"
                        title={task.title}
                      >
                        {task.title}
                      </div>
                      <div className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tighter flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />{" "}
                        {task.location_name || "Remote"}
                      </div>
                    </td>
                    <td className="align-middle">
                      <div className="flex justify-center">
                        <span
                          className={`badge badge-${task.status === "completed" ? "emerald" : task.status === "open" ? "cyan" : "amber"} whitespace-nowrap`}
                        >
                          {task.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="align-middle w-48">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 transition-all duration-1000"
                            style={{
                              width: `${Math.min(100, (task.current_volunteers / task.max_volunteers) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-400 w-8 text-right whitespace-nowrap">
                          {task.current_volunteers}/{task.max_volunteers}
                        </span>
                      </div>
                    </td>
                    <td className="align-middle">
                      <div className="flex items-center -space-x-2">
                        {[1, 2, 3]
                          .slice(0, task.current_volunteers)
                          .map((i) => (
                            <div
                              key={i}
                              className="w-7 h-7 rounded-full bg-primary-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-bold text-white shadow-sm relative z-10"
                            >
                              V
                            </div>
                          ))}
                        {task.current_volunteers > 3 && (
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-500 shadow-sm relative z-0">
                            +{task.current_volunteers - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="align-middle pr-2">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-2 hover:bg-primary-500/10 text-primary-500 rounded-lg transition-colors flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTask(task);
                          }}
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm({ open: true, taskId: task.id });
                          }}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Volunteer Rankings */}
        <div
          className="card animate-slide-up"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold whitespace-nowrap">
              Volunteer Performance
            </h3>
            <button className="text-xs font-bold text-primary-500 hover:underline uppercase tracking-widest whitespace-nowrap">
              Full Leaderboard →
            </button>
          </div>
          <div className="data-table-container overflow-x-auto">
            <table className="data-table w-full min-w-[700px]">
              <thead>
                <tr>
                  <th className="text-left align-middle">Volunteer</th>
                  <th className="text-center align-middle">Score</th>
                  <th className="text-left align-middle">Reliability</th>
                  <th className="text-left align-middle">Badges</th>
                  <th className="text-center align-middle">Status</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.slice(0, 8).map((v) => (
                  <tr key={v.id}>
                    <td className="align-middle max-w-[200px]">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0">
                          {v.full_name[0]}
                        </div>
                        <div className="min-w-0">
                          <div
                            className="font-bold text-slate-900 dark:text-white leading-none mb-1 truncate"
                            title={v.full_name}
                          >
                            {v.full_name}
                          </div>
                          <div className="text-[10px] font-medium text-slate-400 uppercase truncate">
                            {v.tasks_completed} tasks completed
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="font-extrabold text-primary-500 text-center align-middle whitespace-nowrap">
                      {v.points} pts
                    </td>
                    <td className="align-middle w-40">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-1000 ${v.reliability > 80 ? "bg-emerald-500" : "bg-amber-500"}`}
                            style={{ width: `${v.reliability}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-400 w-8 text-right">
                          {v.reliability}%
                        </span>
                      </div>
                    </td>
                    <td className="align-middle">
                      <div className="flex flex-wrap gap-1">
                        {(v.badges || []).slice(0, 2).map((b) => (
                          <span
                            key={b}
                            className="skill-tag !text-[9px] !px-2 !py-0.5 !m-0 whitespace-nowrap"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="align-middle">
                      <div className="flex justify-center">
                        <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest whitespace-nowrap">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-soft flex-shrink-0" />
                          Online
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="glass-card w-full max-w-xl p-8 shadow-2xl animate-slide-up flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-6 flex-shrink-0">
              Modify Task Details
            </h2>
            <form
              onSubmit={handleUpdateTask}
              className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar"
            >
              <div className="form-group flex flex-col gap-2">
                <label className="form-label font-semibold text-sm">
                  Task Title
                </label>
                <input
                  className="form-input w-full"
                  value={editingTask.title}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group flex flex-col gap-2">
                <label className="form-label font-semibold text-sm">
                  Description
                </label>
                <textarea
                  className="form-input w-full min-h-[100px] resize-y"
                  value={editingTask.description}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="form-group flex flex-col gap-2">
                  <label className="form-label font-semibold text-sm">
                    Required Skills
                  </label>
                  <input
                    className="form-input text-xs w-full"
                    placeholder="UI, React, Writing..."
                    value={editingTask.required_skills}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        required_skills: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group flex flex-col gap-2">
                  <label className="form-label font-semibold text-sm">
                    Max Volunteers
                  </label>
                  <input
                    className="form-input w-full"
                    type="number"
                    min="1"
                    value={editingTask.max_volunteers}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        max_volunteers: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 pt-4 mt-auto">
                <button
                  type="submit"
                  className="flex-1 btn btn-primary py-3 font-semibold"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="flex-1 btn btn-secondary py-3 font-semibold"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Task?"
        message="This will permanently remove the task and all assignments."
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, taskId: null })}
      />

      <ConfirmDialog
        open={cancelAssignConfirm.open}
        title="Cancel Assignment?"
        message="This will remove the volunteer from this task and notify them."
        danger
        onConfirm={handleCancelAssignment}
        onCancel={() =>
          setCancelAssignConfirm({ open: false, taskId: null, volId: null })
        }
      />
    </div>
  );
}
