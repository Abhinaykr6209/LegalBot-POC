import { useMemo, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { API_BASE_URL } from "./config";
import {
  Search,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  MessageSquare,
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

type PieItem = { name: string; value: number; color: string };

type ApprovalRecord = {
  response_id: string;
  prompt: string;
  created_by: string;
  approved_by: string | null;
  status: string;
  approved_at: string | null;
  timestamp_utc: string | null;
};

export function ApprovalDashboard() {
  const { token } = useAuth();
  const [summary, setSummary] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    flagged: 0,
  });

  const [trendData, setTrendData] = useState<{ day: string; approved: number }[]>([]);
  const [reviewerData, setReviewerData] = useState<{ reviewer: string; reviews: number }[]>([]);
  const [records, setRecords] = useState<ApprovalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      // 1. Fetch summary
      const summaryRes = await fetch(`${API_BASE_URL}/api/dashboard/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!summaryRes.ok) throw new Error("Failed to load summary stats");
      const summaryData = await summaryRes.json();
      setSummary(summaryData);

      // 2. Fetch trend
      const trendRes = await fetch(`${API_BASE_URL}/api/dashboard/trend`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!trendRes.ok) throw new Error("Failed to load trend data");
      const trendJson = await trendRes.json();
      // Map 'count' to 'approved' for chart compatibility
      const mappedTrend = trendJson.map((item: any) => ({
        day: item.day,
        approved: item.count,
      }));
      setTrendData(mappedTrend);

      // 3. Fetch reviewer performance
      const reviewerRes = await fetch(`${API_BASE_URL}/api/dashboard/reviewer-performance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!reviewerRes.ok) throw new Error("Failed to load reviewer stats");
      const reviewerJson = await reviewerRes.json();
      setReviewerData(reviewerJson);

      // 4. Fetch records
      const recordsRes = await fetch(`${API_BASE_URL}/api/dashboard/records`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!recordsRes.ok) throw new Error("Failed to load approval records");
      const recordsJson = await recordsRes.json();
      setRecords(recordsJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const cards = useMemo(
    () => [
      {
        title: "Total Chats",
        value: summary.total,
        color: "text-slate-800",
        bg: "bg-white",
        icon: <MessageSquare className="h-6 w-6 text-blue-600" />,
      },
      {
        title: "Approved",
        value: summary.approved,
        color: "text-green-600",
        bg: "bg-green-50",
        icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
      },
      {
        title: "Pending",
        value: summary.pending,
        color: "text-yellow-600",
        bg: "bg-yellow-50",
        icon: <Clock3 className="h-6 w-6 text-yellow-600" />,
      },
      {
        title: "Flagged",
        value: summary.flagged,
        color: "text-red-600",
        bg: "bg-red-50",
        icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
      },
    ],
    [summary]
  );

  // Derive unique statuses dynamically from DB records — no hardcoded status names
  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.status))).sort();
  }, [records]);

  // Build pie chart slices from actual DB status distribution
  const STATUS_COLORS: Record<string, string> = {
    Approved: "#10b981",
    Pending: "#f59e0b",
    Flagged: "#ef4444",
  };
  const DEFAULT_COLOR = "#64748b";

  const pieData = useMemo<PieItem[]>(() => {
    const counts: Record<string, number> = {};
    for (const r of records) {
      counts[r.status] = (counts[r.status] || 0) + 1;
    }
    return Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: STATUS_COLORS[name] ?? DEFAULT_COLOR,
      }));
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((row) => {
      const matchesSearch =
        search.trim() === "" ||
        row.prompt.toLowerCase().includes(search.toLowerCase()) ||
        row.created_by.toLowerCase().includes(search.toLowerCase()) ||
        (row.approved_by && row.approved_by.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === "All" ||
        row.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  // Show all records from DB — no artificial slice limit
  const timelineRecords = useMemo(() => records, [records]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatTimelineTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();

      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();

      const dayLabel = isToday
        ? "Today"
        : isYesterday
        ? "Yesterday"
        : d.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
      const timeLabel = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${dayLabel} • ${timeLabel}`;
    } catch (e) {
      return dateStr;
    }
  };

  if (isLoading && records.length === 0 && summary.total === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-100 p-6 rounded-2xl">
        <div className="flex flex-col items-center gap-3 text-slate-700">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Loading approval dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-auto rounded-2xl bg-slate-100 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            Approval Dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Monitor all AI approvals and reviewer activity.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-slate-700 font-semibold shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Error Loading Dashboard</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`${card.bg} rounded-2xl border border-slate-200 p-6 shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{card.title}</p>
                <h2 className={`mt-2 text-4xl font-bold ${card.color}`}>
                  {card.value}
                </h2>
              </div>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Prompt, User..."
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="All" className="text-slate-900 bg-white font-medium">All Statuses</option>
            {uniqueStatuses.map((s) => (
              <option key={s} value={s} className="text-slate-900 bg-white font-medium">{s}</option>
            ))}
          </select>

          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Filter className="h-4 w-4" />
            Sync API
          </button>
        </div>
      </div>

      {/* ================= CHARTS ================= */}
      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Approval Trend */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-semibold text-slate-900">
            Approval Trend
          </h3>
          {trendData.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-slate-700">
              No trend data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  tickFormatter={(value: string) => {
                    // value arrives as "YYYY-MM-DD" from backend
                    const d = new Date(value + "T00:00:00");
                    return d.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    }); // e.g. "1 Aug"
                  }}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(label: string) => {
                    const d = new Date(label + "T00:00:00");
                    return d.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="approved"
                  stroke="#2563eb"
                  fill="#bfdbfe"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Reviewer Performance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-semibold text-slate-900">Reviewer Performance</h3>
          {reviewerData.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-slate-700">
              No reviewer activity recorded
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reviewerData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="reviewer" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="reviews" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ================= PIE + TIMELINE ================= */}
      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Pie */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-semibold text-slate-900">Approval Status</h3>
          {pieData.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-slate-700">
              No status records available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" label>
                  {pieData.map((item, index) => (
                    <Cell key={index} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Timeline */}
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold text-slate-900">
            Approval Timeline
            <span className="ml-2 text-sm font-normal text-slate-400">
              ({timelineRecords.length} record{timelineRecords.length !== 1 ? "s" : ""})
            </span>
          </h3>
          <div className="max-h-80 overflow-y-auto pr-1 space-y-6">
            {timelineRecords.length === 0 ? (
              <p className="text-sm text-slate-700 py-4 text-center">No activity recorded.</p>
            ) : (
              timelineRecords.map((item, idx) => {
                const isLast = idx === timelineRecords.length - 1;
                const statusLower = item.status.toLowerCase();
                const isApproved = statusLower === "approved";
                const isPending = statusLower === "pending";

                // Dot and text colors derived from DB status value
                const dotColor = STATUS_COLORS[item.status]
                  ? isApproved ? "bg-green-500" : isPending ? "bg-yellow-500" : "bg-red-500"
                  : "bg-slate-400";

                const statusTextColor = isApproved
                  ? "text-green-600"
                  : isPending
                  ? "text-yellow-600"
                  : STATUS_COLORS[item.status] ? "text-red-600" : "text-slate-600";

                // Status label built entirely from DB values — no hardcoded fallbacks
                const statusLabel = isPending
                  ? "Pending Review"
                  : item.approved_by
                  ? `${item.status} by ${item.approved_by}`
                  : item.status;

                return (
                  <div key={item.response_id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`h-4 w-4 rounded-full ${dotColor} shrink-0`}></div>
                      {!isLast && <div className="h-full w-0.5 bg-slate-300 min-h-[40px]"></div>}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 line-clamp-1">
                        {item.prompt || "AI Conversation"}
                      </p>
                      <p className="text-sm text-slate-500">Created by {item.created_by}</p>
                      <p className={`mt-1 text-sm font-semibold ${statusTextColor}`}>
                        {statusLabel}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatTimelineTime(item.approved_at || item.timestamp_utc)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ================= APPROVAL TABLE ================= */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">Approval Records</h3>
          <p className="text-sm text-slate-700">Review all AI chat approvals</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-900">
                  Prompt
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-900">
                  Created By
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-900">
                  Approved By
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-900">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-900">
                  Date
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase text-slate-900">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-700">
                    No approval records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row) => {
                  // Badge color derived from DB status value via STATUS_COLORS map
                  const statusLower = row.status.toLowerCase();
                  const color =
                    statusLower === "approved"
                      ? "bg-green-100 text-green-700"
                      : statusLower === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : statusLower === "flagged"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-700"; // fallback for any new status from DB

                  return (
                    <tr
                      key={row.response_id}
                      className="border-t border-slate-200 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 font-medium max-w-[300px] truncate text-slate-900">
                        {row.prompt}
                      </td>
                      <td className="px-6 py-4 text-slate-900">{row.created_by}</td>
                      <td className="px-6 py-4 text-slate-900">{row.approved_by || "-"}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-900">
                        {formatDate(row.approved_at || row.timestamp_utc)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          to={`/certificate/${row.response_id}`}
                          className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 shadow-sm transition-colors"
                        >
                          View Audit
                        </Link>
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
  );
}

export default ApprovalDashboard;
