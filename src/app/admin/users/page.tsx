"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Search,
  ShieldCheck,
  Users,
  Mail,
  MonitorSmartphone,
  CalendarDays,
  Activity,
  Trash2,
  X,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  UserCog,
  Shield,
  User,
} from "lucide-react";
import {
  getAllUsers,
  updateUserRole,
  deleteUserAccount,
} from "@/actions/users";
import ConfirmDialog from "../../../component/ConfirmDialog";

// ============================================================
// Types
// ============================================================
interface UserAccount {
  id: string;
  email: string;
  role: "admin" | "user";
  provider?: string;
  isOnline?: boolean;
  created_at: string;
  last_sign_in_at?: string;
}

type TabKey = "all" | "online" | "admins";
type SortKey = "email" | "role" | "isOnline" | "created_at";
type SortDirection = "asc" | "desc";

type DialogState =
  | { type: "role"; ids: string[]; emails: string[]; newRole: "admin" | "user" }
  | { type: "delete"; ids: string[]; emails: string[] }
  | null;

const ROWS_PER_PAGE = 8;

// Redesigned: Elegant, subtle gradients for avatars (Enterprise look)
const AVATAR_PALETTE = [
  "from-zinc-200 to-zinc-300 text-zinc-700",
  "from-slate-200 to-slate-300 text-slate-700",
  "from-gray-200 to-gray-300 text-gray-700",
  "from-stone-200 to-stone-300 text-stone-700",
  "from-neutral-200 to-neutral-300 text-neutral-700",
];

function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getAvatarGradient(email?: string) {
  if (!email) return AVATAR_PALETTE[0];
  return AVATAR_PALETTE[hashString(email) % AVATAR_PALETTE.length];
}

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return "ไม่เคยเข้าสู่ระบบ";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} วันที่แล้ว`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} สัปดาห์ที่แล้ว`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} เดือนที่แล้ว`;
  return `${Math.floor(days / 365)} ปีที่แล้ว`;
}

// ============================================================
// Component
// ============================================================
export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const searchQuery = useDebouncedValue(searchInput, 300);

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "created_at",
    direction: "desc",
  });
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dropdown menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [dialog, setDialog] = useState<DialogState>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchUsersData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeTab]);

  // Handle clicking outside to close action menu
  useEffect(() => {
    const handleGlobalClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      const normalizedUsers: UserAccount[] = (data ?? []).map((u: any) => ({
        id: u.id,
        email: u.email ?? "",
        role: u.role === "admin" ? "admin" : "user",
        provider: u.provider,
        isOnline: !!u.isOnline,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      }));
      setUsers(normalizedUsers);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "ไม่สามารถโหลดข้อมูลผู้ใช้งานได้";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // -------------------- derived data --------------------
  const stats = useMemo(
    () => ({
      total: users.length,
      online: users.filter((u) => u.isOnline).length,
      admins: users.filter((u) => u.role === "admin").length,
    }),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      const matchSearch = !q || u.email?.toLowerCase().includes(q);
      const matchTab =
        activeTab === "all"
          ? true
          : activeTab === "online"
            ? !!u.isOnline
            : u.role === "admin";
      return matchSearch && matchTab;
    });
  }, [users, searchQuery, activeTab]);

  const sortedUsers = useMemo(() => {
    const list = [...filteredUsers];
    const dir = sort.direction === "asc" ? 1 : -1;
    list.sort((a, b) => {
      switch (sort.key) {
        case "email":
          return (a.email || "").localeCompare(b.email || "") * dir;
        case "role":
          return (a.role || "").localeCompare(b.role || "") * dir;
        case "isOnline":
          return ((a.isOnline ? 1 : 0) - (b.isOnline ? 1 : 0)) * dir;
        case "created_at":
        default:
          return (
            (new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()) *
            dir
          );
      }
    });
    return list;
  }, [filteredUsers, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / ROWS_PER_PAGE));
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return sortedUsers.slice(start, start + ROWS_PER_PAGE);
  }, [sortedUsers, page]);

  const allOnPageSelected =
    paginatedUsers.length > 0 &&
    paginatedUsers.every((u) => selectedIds.has(u.id));

  // -------------------- handlers --------------------
  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) paginatedUsers.forEach((u) => next.delete(u.id));
      else paginatedUsers.forEach((u) => next.add(u.id));
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyEmail = async (e: React.MouseEvent, u: UserAccount) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(u.email);
      setCopiedId(u.id);
      toast.success("คัดลอกอีเมลแล้ว");
      setTimeout(() => setCopiedId((c) => (c === u.id ? null : c)), 1500);
    } catch {
      toast.error("ไม่สามารถคัดลอกอีเมลได้");
    }
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const openBulkRoleDialog = (newRole: "admin" | "user") => {
    const ids = Array.from(selectedIds);
    const emails = users
      .filter((u) => selectedIds.has(u.id))
      .map((u) => u.email);
    setDialog({ type: "role", ids, emails, newRole });
  };

  const openBulkDeleteDialog = () => {
    const ids = Array.from(selectedIds);
    const emails = users
      .filter((u) => selectedIds.has(u.id))
      .map((u) => u.email);
    setDialog({ type: "delete", ids, emails });
  };

  const handleConfirmAction = async () => {
    if (!dialog) return;
    setIsProcessing(true);
    try {
      if (dialog.type === "role") {
        await Promise.all(
          dialog.ids.map((id) => updateUserRole(id, dialog.newRole)),
        );
        toast.success(
          dialog.ids.length > 1
            ? `เปลี่ยนสิทธิ์ผู้ใช้งาน ${dialog.ids.length} คนเป็น ${dialog.newRole} แล้ว`
            : `เปลี่ยนสิทธิ์ ${dialog.emails[0]} เป็น ${dialog.newRole} แล้ว`,
        );
      } else if (dialog.type === "delete") {
        await Promise.all(dialog.ids.map((id) => deleteUserAccount(id)));
        toast.success(
          dialog.ids.length > 1
            ? `ลบผู้ใช้งาน ${dialog.ids.length} คนออกจากระบบแล้ว`
            : `ลบผู้ใช้งาน ${dialog.emails[0]} ออกจากระบบแล้ว`,
        );
      }
      setSelectedIds(new Set());
      await fetchUsersData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "ทำรายการไม่สำเร็จ";
      toast.error(message);
    } finally {
      setIsProcessing(false);
      setDialog(null);
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sort.key !== column)
      return (
        <ChevronsUpDown
          size={14}
          className="opacity-0 group-hover:opacity-40 transition-opacity"
        />
      );
    return sort.direction === "asc" ? (
      <ChevronUp size={14} className="text-zinc-900" />
    ) : (
      <ChevronDown size={14} className="text-zinc-900" />
    );
  };

  const TAB_LABEL: Record<TabKey, string> = {
    all: "ทั้งหมด",
    online: "ออนไลน์",
    admins: "แอดมิน",
  };

  const TAB_COUNT: Record<TabKey, number> = {
    all: stats.total,
    online: stats.online,
    admins: stats.admins,
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-24 font-sans text-zinc-900 selection:bg-blue-100 selection:text-blue-900">
      <main className="max-w-6xl mx-auto pt-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            จัดการสมาชิกและผู้ดูแลระบบ
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            จัดการข้อมูลสมาชิก กำหนดสิทธิ์การใช้งาน และตรวจสอบสถานะบัญชีผู้ใช้
          </p>
        </div>

        {/* Minimal Stripe-style Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              key: "total",
              label: "สมาชิกทั้งหมด",
              value: loading ? "-" : stats.total,
            },
            {
              key: "online",
              label: "ออนไลน์",
              value: loading ? "-" : stats.online,
              highlight: true,
            },
            {
              key: "admins",
              label: "แอดมิน",
              value: loading ? "-" : stats.admins,
            },
          ].map((stat) => (
            <div
              key={stat.key}
              className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between"
            >
              <p className="text-xs font-medium text-zinc-500 mb-2">
                {stat.label}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold text-zinc-900 tracking-tight">
                  {typeof stat.value === "number"
                    ? stat.value.toLocaleString("th-TH")
                    : stat.value}
                </p>
                {stat.highlight &&
                  !loading &&
                  typeof stat.value === "number" &&
                  stat.value > 0 && (
                    <span className="relative flex h-2 w-2 ml-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  )}
              </div>
            </div>
          ))}
        </div>

        {/* Data Container (Unified Toolbar + Table) */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col">
          {/* Integrated Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-2 border-b border-zinc-200 gap-2">
            <div className="flex p-1 space-x-1">
              {(Object.keys(TAB_LABEL) as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
                    activeTab === tab
                      ? "text-zinc-900 bg-zinc-100"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                  }`}
                >
                  {TAB_LABEL[tab]}
                  <span
                    className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab
                        ? "bg-white text-zinc-600"
                        : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    {loading ? "-" : TAB_COUNT[tab]}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64 px-1 md:px-0 md:pr-1">
              <Search
                className="absolute left-3 md:left-2 top-1/2 -translate-y-1/2 text-zinc-400"
                size={14}
              />
              <input
                type="text"
                placeholder="ค้นหาด้วยอีเมล . . ."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-transparent border border-zinc-200 text-zinc-900 rounded-md pl-8 pr-8 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-zinc-400"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 md:right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-transparent border-b border-zinc-200 text-zinc-500 text-xs font-medium">
                <tr>
                  <th className="pl-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleSelectAllOnPage}
                      aria-label="เลือกผู้ใช้ทั้งหมดในหน้านี้"
                      className="w-3.5 h-3.5 rounded-sm border-zinc-300 accent-blue-600 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
                    />
                  </th>

                  <th className="px-4 py-3">
                    <button
                      onClick={() => toggleSort("email")}
                      className="flex items-center gap-1 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1 -ml-1"
                    >
                      ผู้ใช้งาน <SortIcon column="email" />
                    </button>
                  </th>

                  <th className="px-4 py-3">ผู้ให้บริการ</th>

                  <th className="px-4 py-3">
                    <button
                      onClick={() => toggleSort("isOnline")}
                      className="flex items-center gap-1 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1 -ml-1"
                    >
                      สถานะ <SortIcon column="isOnline" />
                    </button>
                  </th>

                  <th className="px-4 py-3">
                    <button
                      onClick={() => toggleSort("role")}
                      className="flex items-center gap-1 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1 -ml-1"
                    >
                      สิทธิ์ <SortIcon column="role" />
                    </button>
                  </th>

                  <th className="px-4 py-3">
                    <button
                      onClick={() => toggleSort("created_at")}
                      className="flex items-center gap-1 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1 -ml-1"
                    >
                      วันที่สมัคร <SortIcon column="created_at" />
                    </button>
                  </th>

                  <th className="pr-4 py-3 text-right w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="pl-4 py-3">
                        <div className="h-3.5 w-3.5 bg-zinc-100 rounded-sm" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-zinc-100" />
                          <div className="h-4 w-32 bg-zinc-100 rounded" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-16 bg-zinc-100 rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-20 bg-zinc-100 rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 w-14 bg-zinc-100 rounded-md" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-24 bg-zinc-100 rounded" />
                      </td>
                      <td className="pr-4 py-3">
                        <div className="h-6 w-6 ml-auto bg-zinc-100 rounded" />
                      </td>
                    </tr>
                  ))
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <EmptyState
                        hasUsers={users.length > 0}
                        searchQuery={searchQuery}
                        onClear={() => setSearchInput("")}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => {
                    const isAdmin = u.role === "admin";
                    const isGoogle = u.provider === "google";
                    const isSelected = selectedIds.has(u.id);

                    return (
                      <tr
                        key={u.id}
                        className={`group transition-colors ${isSelected ? "bg-blue-50/50" : "hover:bg-zinc-50/80"}`}
                        onClick={() => toggleSelectOne(u.id)}
                      >
                        <td className="pl-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(u.id)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select ${u.email}`}
                            className="w-3.5 h-3.5 rounded-sm border-zinc-300 accent-blue-600 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="relative">
                              <div
                                className={`w-6 h-6 rounded bg-gradient-to-br ${getAvatarGradient(u.email)} flex items-center justify-center text-[10px] font-medium uppercase shrink-0`}
                              >
                                {u.email?.charAt(0)}
                              </div>
                              {u.isOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white rounded-full" />
                              )}
                            </div>
                            <span className="font-medium text-zinc-900 truncate max-w-[200px]">
                              {u.email}
                            </span>
                            <button
                              onClick={(e) => copyEmail(e, u)}
                              className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-0.5"
                              title="Copy email"
                            >
                              {copiedId === u.id ? (
                                <Check size={13} className="text-emerald-500" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {isGoogle ? (
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                fill="#4285F4"
                                d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47c-.28 1.5-1.13 2.77-2.41 3.62v3.01h3.49c2.04-1.88 3.21-4.65 3.21-7.93l-.27-.73z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.49-2.86c-.97.65-2.21 1.04-4.44 1.04-3.42 0-6.31-2.31-7.35-5.42H1.07v3.39C3.02 21.3 7.16 24 12 24z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M4.65 13.85c-.27-.81-.42-1.67-.42-2.56 0-.89.15-1.75.42-2.56V5.34H1.07A11.97 11.97 0 0 0 0 11.29c0 1.93.46 3.76 1.07 5.27l3.58-2.71z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.1-3.1C17.95 1.19 15.24 0 12 0 7.16 0 3.02 2.7 1.07 6.62l3.58 2.67C5.69 6.18 8.58 4.75 12 4.75z"
                              />
                            </svg>
                          ) : (
                            <Mail size={16} className="text-zinc-500" />
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${u.isOnline ? "bg-emerald-500" : "bg-zinc-300"}`}
                            />
                            <span
                              className={
                                u.isOnline ? "text-zinc-900" : "text-zinc-500"
                              }
                            >
                              {u.isOnline
                                ? "ออนไลน์"
                                : timeAgo(u.last_sign_in_at)}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium ${
                              isAdmin
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-zinc-50 text-zinc-700 border border-zinc-200"
                            }`}
                          >
                            {isAdmin ? (
                              <ShieldCheck size={12} strokeWidth={2.3} />
                            ) : (
                              <User size={12} strokeWidth={2.3} />
                            )}

                            {isAdmin ? "แอดมิน" : "ผู้ใช้งาน"}
                          </span>
                        </td>

                        <td className="px-4 py-2 text-zinc-500">
                          {new Date(u.created_at).toLocaleString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        <td className="pr-4 py-3 text-right relative">
                          <button
                            onClick={(e) => toggleMenu(e, u.id)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            aria-expanded={openMenuId === u.id}
                            aria-haspopup="true"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {/* Linear-style Dropdown Menu */}
                          <AnimatePresence>
                            {openMenuId === u.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                transition={{ duration: 0.1 }}
                                className="absolute right-4 top-10 w-44 bg-white rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-zinc-200 py-1 z-50 overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {isAdmin ? (
                                  <button
                                    onClick={() => {
                                      setDialog({
                                        type: "role",
                                        ids: [u.id],
                                        emails: [u.email],
                                        newRole: "user",
                                      });
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                                  >
                                    <User size={14} className="text-zinc-400" />{" "}
                                    Demote to User
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setDialog({
                                        type: "role",
                                        ids: [u.id],
                                        emails: [u.email],
                                        newRole: "admin",
                                      });
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                                  >
                                    <Shield
                                      size={14}
                                      className="text-zinc-400"
                                    />{" "}
                                    Promote to Admin
                                  </button>
                                )}
                                <div className="h-px bg-zinc-100 my-1" />
                                <button
                                  onClick={() => {
                                    setDialog({
                                      type: "delete",
                                      ids: [u.id],
                                      emails: [u.email],
                                    });
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2
                                    size={14}
                                    className="text-red-500/70"
                                  />{" "}
                                  Delete account
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile view logic (simplified for enterprise brevity, maintaining same aesthetics) */}
          <div className="md:hidden divide-y divide-zinc-100 bg-white">
            {/* Same conditional rendering structure as desktop, adapted for mobile list */}
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 animate-pulse flex gap-3">
                  <div className="w-8 h-8 rounded bg-zinc-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-zinc-100 rounded" />
                    <div className="h-3 w-20 bg-zinc-100 rounded" />
                  </div>
                </div>
              ))
            ) : paginatedUsers.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <EmptyState
                  hasUsers={users.length > 0}
                  searchQuery={searchQuery}
                  onClear={() => setSearchInput("")}
                />
              </div>
            ) : (
              paginatedUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-4 flex flex-col gap-3 relative"
                  onClick={() => toggleSelectOne(u.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(u.id)}
                        onChange={() => toggleSelectOne(u.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded-sm border-zinc-300 accent-blue-600 text-blue-600"
                      />
                      <div
                        className={`w-8 h-8 rounded bg-gradient-to-br ${getAvatarGradient(u.email)} flex items-center justify-center text-[11px] font-medium uppercase shrink-0`}
                      >
                        {u.email?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-zinc-900 truncate max-w-[180px]">
                          {u.email}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {u.role === "admin" ? "Admin" : "User"} ·{" "}
                          {u.isOnline ? "Online" : timeAgo(u.last_sign_in_at)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => toggleMenu(e, u.id)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>

                  {/* Mobile Action Menu Overlay */}
                  {openMenuId === u.id && (
                    <div
                      className="mt-2 p-2 bg-zinc-50 rounded-lg border border-zinc-200 flex flex-col gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setDialog({
                            type: "role",
                            ids: [u.id],
                            emails: [u.email],
                            newRole: u.role === "admin" ? "user" : "admin",
                          });
                          setOpenMenuId(null);
                        }}
                        className="text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 rounded"
                      >
                        {u.role === "admin"
                          ? "Demote to User"
                          : "Promote to Admin"}
                      </button>
                      <button
                        onClick={() => {
                          setDialog({
                            type: "delete",
                            ids: [u.id],
                            emails: [u.email],
                          });
                          setOpenMenuId(null);
                        }}
                        className="text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        Delete account
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Minimal Pagination */}
          {!loading && sortedUsers.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 bg-zinc-50/50">
              <p className="text-xs text-zinc-500">
                <span className="font-medium text-zinc-900">
                  {(page - 1) * ROWS_PER_PAGE + 1}
                </span>
                -
                <span className="font-medium text-zinc-900">
                  {Math.min(page * ROWS_PER_PAGE, sortedUsers.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-zinc-900">
                  {sortedUsers.length}
                </span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Vercel-style Floating Command Bar for Bulk Actions */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
            >
              <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900 text-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-zinc-800 backdrop-blur-md">
                <span className="text-sm font-medium px-2">
                  {selectedIds.size} selected
                </span>
                <div className="w-px h-4 bg-zinc-700" />
                <button
                  onClick={() => openBulkRoleDialog("admin")}
                  className="text-xs font-medium hover:text-white text-zinc-300 hover:bg-zinc-800 px-3 py-1.5 rounded-full transition-colors"
                >
                  Make Admin
                </button>
                <button
                  onClick={() => openBulkRoleDialog("user")}
                  className="text-xs font-medium hover:text-white text-zinc-300 hover:bg-zinc-800 px-3 py-1.5 rounded-full transition-colors"
                >
                  Make User
                </button>
                <button
                  onClick={openBulkDeleteDialog}
                  className="text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 px-3 py-1.5 rounded-full transition-colors"
                >
                  Delete
                </button>
                <div className="w-px h-4 bg-zinc-700 ml-1" />
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors rounded-full"
                  aria-label="Clear selection"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dialog (Props structure kept exactly the same for compatibility) */}
        <ConfirmDialog
          open={!!dialog}
          danger={dialog?.type === "delete"}
          loading={isProcessing}
          title={
            !dialog
              ? ""
              : dialog.type === "delete"
                ? dialog.ids.length > 1
                  ? `Delete ${dialog.ids.length} users`
                  : "Delete user"
                : "Update role"
          }
          message={
            !dialog ? null : (
              <span className="text-zinc-500 block mt-2 text-sm leading-relaxed">
                {dialog.type === "delete" ? (
                  dialog.ids.length > 1 ? (
                    <>
                      You are about to permanently delete{" "}
                      <span className="font-semibold text-zinc-900">
                        {dialog.ids.length} users
                      </span>
                      . This action cannot be undone and will remove all
                      associated data.
                    </>
                  ) : (
                    <>
                      You are about to permanently delete{" "}
                      <span className="font-semibold text-zinc-900">
                        {dialog.emails[0]}
                      </span>
                      . This action cannot be undone.
                    </>
                  )
                ) : dialog.ids.length > 1 ? (
                  <>
                    Are you sure you want to change the role of{" "}
                    <span className="font-semibold text-zinc-900">
                      {dialog.ids.length} users
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-zinc-900 capitalize">
                      {dialog.newRole}
                    </span>
                    ?
                  </>
                ) : (
                  <>
                    Are you sure you want to change the role of{" "}
                    <span className="font-semibold text-zinc-900">
                      {dialog.emails[0]}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-zinc-900 capitalize">
                      {dialog.newRole}
                    </span>
                    ?
                  </>
                )}
              </span>
            )
          }
          confirmText={
            dialog?.type === "delete" ? "Delete permanently" : "Confirm"
          }
          cancelText="Cancel"
          onConfirm={handleConfirmAction}
          onCancel={() => setDialog(null)}
        />
      </main>
    </div>
  );
}

// ============================================================
// Vercel-style Empty State
// ============================================================
function EmptyState({
  hasUsers,
  searchQuery,
  onClear,
}: {
  hasUsers: boolean;
  searchQuery: string;
  onClear: () => void;
}) {
  const title = searchQuery
    ? "No users found"
    : hasUsers
      ? "No matching users"
      : "No users yet";

  const subtitle = searchQuery
    ? `Your search for "${searchQuery}" didn't match any users.`
    : hasUsers
      ? "Try selecting a different tab."
      : "When new users sign up, they will appear here.";

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="w-12 h-12 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center mb-4">
        <Search size={20} className="text-zinc-400" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">{subtitle}</p>
      {searchQuery && (
        <button
          onClick={onClear}
          className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          Clear search
        </button>
      )}
    </div>
  );
}
