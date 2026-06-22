// src/app/admin/users/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Search, ShieldAlert, ShieldCheck, UserX, Users } from "lucide-react";
import { getAllUsers, updateUserRole, deleteUserAccount } from "@/actions/users";
import ConfirmDialog from "../../../component/ConfirmDialog";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog States
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "role" | "delete";
    userId: string;
    email: string;
    newRole?: "admin" | "user";
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchUsersData();
  }, []);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (error: any) {
      toast.error(error.message || "ไม่สามารถโหลดข้อมูลผู้ใช้งานได้");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    setIsProcessing(true);

    try {
      if (confirmDialog.type === "role" && confirmDialog.newRole) {
        await updateUserRole(confirmDialog.userId, confirmDialog.newRole);
        toast.success(`เปลี่ยนสิทธิ์ ${confirmDialog.email} เป็น ${confirmDialog.newRole} แล้ว`);
      } else if (confirmDialog.type === "delete") {
        await deleteUserAccount(confirmDialog.userId);
        toast.success(`ลบผู้ใช้งาน ${confirmDialog.email} ออกจากระบบแล้ว`);
      }
      await fetchUsersData(); // โหลดข้อมูลใหม่
    } catch (error: any) {
      toast.error(error.message || "ทำรายการไม่สำเร็จ");
    } finally {
      setIsProcessing(false);
      setConfirmDialog(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => 
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <svg className="animate-spin h-10 w-10 text-emerald-600" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <main className="max-w-6xl mx-auto pt-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">จัดการผู้ใช้งาน</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">แต่งตั้งผู้ดูแลระบบ หรือ ลบบัญชีผู้ใช้งานในระบบ</p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="ค้นหาด้วยอีเมล..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none shadow-sm"
          />
        </motion.div>

        {/* Users Table / Grid */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">ผู้ใช้งาน (Email)</th>
                  <th className="px-6 py-4">สถานะ (Role)</th>
                  <th className="px-6 py-4">วันที่สมัคร</th>
                  <th className="px-6 py-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const role = u.app_metadata?.role || "user";
                  const isAdmin = role === "admin";
                  
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase shrink-0">
                            {u.email?.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-900">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${isAdmin ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {isAdmin ? <ShieldCheck size={14} /> : <Users size={14} />}
                          {isAdmin ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(u.created_at).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        {isAdmin ? (
                          <button
                            onClick={() => setConfirmDialog({ type: "role", userId: u.id, email: u.email, newRole: "user" })}
                            className="text-amber-500 hover:text-amber-600 font-medium transition-colors"
                          >
                            ปลดจาก Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmDialog({ type: "role", userId: u.id, email: u.email, newRole: "admin" })}
                            className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                          >
                            ตั้งเป็น Admin
                          </button>
                        )}
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => setConfirmDialog({ type: "delete", userId: u.id, email: u.email })}
                          className="text-red-500 hover:text-red-600 font-medium transition-colors"
                        >
                          ลบบัญชี
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dialog ยืนยัน */}
        <ConfirmDialog
          open={!!confirmDialog}
          danger={confirmDialog?.type === "delete"}
          loading={isProcessing}
          title={confirmDialog?.type === "delete" ? "ยืนยันการลบบัญชีผู้ใช้" : "ยืนยันการเปลี่ยนสิทธิ์"}
          message={
            <span className="text-slate-600">
              {confirmDialog?.type === "delete" ? (
                <>คุณกำลังจะลบบัญชี <span className="font-semibold text-slate-900">{confirmDialog.email}</span> ข้อมูลทั้งหมดของผู้ใช้นี้อาจได้รับผลกระทบ ต้องการลบอย่างถาวรหรือไม่?</>
              ) : (
                <>คุณต้องการเปลี่ยนสิทธิ์ของ <span className="font-semibold text-slate-900">{confirmDialog?.email}</span> ให้เป็น <span className="font-semibold text-emerald-600 uppercase">{confirmDialog?.newRole}</span> ใช่หรือไม่?</>
              )}
            </span>
          }
          confirmText={confirmDialog?.type === "delete" ? "ลบบัญชีถาวร" : "ยืนยันการเปลี่ยนสิทธิ์"}
          cancelText="ยกเลิก"
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmDialog(null)}
        />
      </main>
    </div>
  );
}