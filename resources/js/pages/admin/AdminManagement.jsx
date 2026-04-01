import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import axios from "axios";

const springTransition = { type: "spring", damping: 25, stiffness: 300 };
const smoothEase = [0.22, 1, 0.36, 1];

const getAuthHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem("admin_token") || localStorage.getItem("token")}`,
});

export default function AdminManagement() {
    // --- Data State ---
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // --- View State ---
    const [showArchived, setShowArchived] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [toast, setToast] = useState(null);

    // --- Form Modal State ---
    const [showFormModal, setShowFormModal] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
    const [currentAdmin, setCurrentAdmin] = useState(null);
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });
    const [formErrors, setFormErrors] = useState({});

    // --- Action Modal State (Archive, Restore, Delete) ---
    const [actionModal, setActionModal] = useState(null); // 'archive', 'restore', 'delete', or null
    const [selectedAdmin, setSelectedAdmin] = useState(null);

    /* ---------------- FETCH ---------------- */
    useEffect(() => {
        fetchAdmins();
    }, [showArchived]);

    const fetchAdmins = async () => {
        setLoading(true);
        const url = showArchived ? "/api/admins?archived=1" : "/api/admins";
        try {
            const response = await axios.get(url, { headers: getAuthHeader() });
            if (response.data.success) {
                setAdmins(response.data.data);
            }
        } catch (err) {
            showToast(
                err.response?.data?.message || "Failed to fetch admins",
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- UTILS ---------------- */
    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const getCurrentUserId = () => {
        return parseInt(localStorage.getItem("userId"));
    };

    const isStrongPassword = (password) => {
        const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^()_\-+=]).{8,}$/;
        return regex.test(password);
    };

    /* ---------------- FORM HANDLING ---------------- */
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const openCreateModal = () => {
        setModalMode("create");
        setFormData({
            first_name: "",
            last_name: "",
            email: "",
            password: "",
            password_confirmation: "",
        });
        setFormErrors({});
        setShowFormModal(true);
    };

    const openEditModal = (admin) => {
        setModalMode("edit");
        setCurrentAdmin(admin);
        setFormData({
            first_name:
                admin.first_name ??
                (admin.name ? admin.name.split(" ")[0] : ""),
            last_name:
                admin.last_name ??
                (admin.name ? admin.name.split(" ").slice(1).join(" ") : ""),
            email: admin.email,
            password: "",
            password_confirmation: "",
        });
        setFormErrors({});
        setShowFormModal(true);
    };

    const closeFormModal = () => {
        setShowFormModal(false);
        setTimeout(() => {
            setCurrentAdmin(null);
            setFormErrors({});
        }, 300); // wait for animation
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const errors = {};

        // Validation
        if (!formData.first_name.trim())
            errors.first_name = "First name required";
        if (!formData.email.trim()) errors.email = "Email required";

        if (modalMode === "create" || formData.password) {
            if (!isStrongPassword(formData.password)) {
                errors.password =
                    "Requires 8+ chars, letters, numbers & symbols";
            }
            if (formData.password !== formData.password_confirmation) {
                errors.password_confirmation = "Passwords do not match";
            }
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setUpdating(true);
        try {
            if (modalMode === "create") {
                const response = await axios.post("/api/admins", formData, {
                    headers: getAuthHeader(),
                });
                if (response.data.success) {
                    showToast("Admin created successfully");
                    fetchAdmins();
                    closeFormModal();
                }
            } else {
                const updateData = {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                };
                if (formData.password) {
                    updateData.password = formData.password;
                    updateData.password_confirmation =
                        formData.password_confirmation;
                }
                const response = await axios.put(
                    `/api/admins/${currentAdmin.id}`,
                    updateData,
                    {
                        headers: getAuthHeader(),
                    },
                );
                if (response.data.success) {
                    showToast("Admin updated successfully");
                    fetchAdmins();
                    closeFormModal();
                }
            }
        } catch (err) {
            showToast(
                err.response?.data?.message || "Operation failed",
                "error",
            );
        } finally {
            setUpdating(false);
        }
    };

    /* ---------------- ACTIONS ---------------- */
    const executeAction = async () => {
        if (!selectedAdmin || !actionModal) return;
        setUpdating(true);

        try {
            if (actionModal === "archive") {
                const response = await axios.post(
                    `/api/admins/${selectedAdmin.id}/archive`,
                    {},
                    { headers: getAuthHeader() },
                );
                if (response.data.success)
                    showToast("Admin archived successfully");
            } else if (actionModal === "restore") {
                const response = await axios.post(
                    `/api/admins/${selectedAdmin.id}/restore`,
                    {},
                    { headers: getAuthHeader() },
                );
                if (response.data.success)
                    showToast("Admin restored successfully");
            } else if (actionModal === "delete") {
                const response = await axios.delete(
                    `/api/admins/${selectedAdmin.id}`,
                    { headers: getAuthHeader() },
                );
                if (response.data.success)
                    showToast("Admin deleted successfully");
            }
            fetchAdmins();
            setActionModal(null);
            setSelectedAdmin(null);
        } catch (err) {
            if (err.response?.status === 403) {
                showToast(
                    "You cannot perform this action on your own account.",
                    "error",
                );
            } else {
                showToast(
                    err.response?.data?.message ||
                        `Failed to ${actionModal} admin`,
                    "error",
                );
            }
        } finally {
            setUpdating(false);
        }
    };

    /* ---------------- COMPUTED DATA ---------------- */
    let displayedAdmins = admins;
    if (searchTerm.trim() !== "") {
        const lower = searchTerm.toLowerCase();
        displayedAdmins = displayedAdmins.filter(
            (a) =>
                (a.first_name || "").toLowerCase().includes(lower) ||
                (a.last_name || "").toLowerCase().includes(lower) ||
                (a.name || "").toLowerCase().includes(lower) ||
                (a.email || "").toLowerCase().includes(lower),
        );
    }

    return (
        <div className="flex flex-col [font-family:var(--font-neue)] relative pb-10">
            {/* Header */}
            <div className="mb-6 lg:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-neutral-500">
                        Create and manage staff access to the dashboard.
                    </p>
                </div>
                {!showArchived && (
                    <button
                        onClick={openCreateModal}
                        className="h-10 px-5 rounded-xl bg-black text-white hover:bg-neutral-800 transition-all flex justify-center items-center gap-2 text-xs font-bold uppercase tracking-widest cursor-pointer shrink-0 shadow-lg shadow-black/10 active:scale-95"
                    >
                        + New Admin
                    </button>
                )}
            </div>

            {/* Toolbar: Tabs & Filters */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-6">
                {/* Tabs */}
                <div className="flex gap-3 w-full lg:w-auto shrink-0">
                    <button
                        onClick={() => {
                            setShowArchived(false);
                            setSearchTerm("");
                        }}
                        className={`flex-1 lg:flex-none rounded-xl border px-5 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                            !showArchived
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                        }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => {
                            setShowArchived(true);
                            setSearchTerm("");
                        }}
                        className={`flex-1 lg:flex-none rounded-xl border px-5 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                            showArchived
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                        }`}
                    >
                        Archived
                    </button>
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-col sm:flex-row items-center w-full flex-1 justify-end">
                    {/* Search */}
                    <motion.div
                        layout
                        className="relative w-full sm:w-64 md:w-80 shrink-0 mt-3 sm:mt-0"
                    >
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search admins..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium placeholder-neutral-400 text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 [font-family:inherit]"
                        />
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        layout
                        className="flex flex-col sm:flex-row items-center w-full sm:w-auto mt-3 sm:mt-0 sm:ml-3"
                    >
                        <AnimatePresence>
                            {searchTerm && (
                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        height: 0,
                                        width: 0,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        height: "auto",
                                        width: "auto",
                                    }}
                                    exit={{ opacity: 0, height: 0, width: 0 }}
                                    transition={{
                                        duration: 0.25,
                                        ease: smoothEase,
                                    }}
                                    className="overflow-hidden self-stretch sm:self-auto shrink-0 sm:!h-[42px]"
                                >
                                    <motion.div
                                        initial={{ x: -20 }}
                                        animate={{ x: 0 }}
                                        exit={{ x: -20 }}
                                        className="pb-3 sm:pb-0 sm:pr-3 w-full h-full"
                                    >
                                        <button
                                            onClick={() => setSearchTerm("")}
                                            className="w-full sm:w-auto text-red-400 rounded-xl bg-white border border-neutral-200 h-[42px] px-6 text-sm hover:text-red-600 font-medium transition-colors active:scale-95 cursor-pointer whitespace-nowrap flex items-center justify-center"
                                        >
                                            Clear
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            layout
                            transition={{ duration: 0.25, ease: smoothEase }}
                            onClick={fetchAdmins}
                            className="w-full sm:w-[42px] h-[42px] shrink-0 rounded-xl border border-neutral-200 bg-white text-neutral-400 hover:text-black transition-colors flex justify-center items-center cursor-pointer"
                            title="Refresh List"
                        >
                            <RefreshIcon
                                className={`w-4 h-4 shrink-0 ${loading ? "animate-spin text-black" : ""}`}
                            />
                        </motion.button>
                    </motion.div>
                </div>
            </div>

            {/* Table Area Layout Match */}
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[618px]">
                <div className="flex-1 flex flex-col rounded-2xl border border-neutral-200 bg-white relative overflow-hidden">
                    <AnimatePresence>
                        {loading && (
                            <motion.div
                                key="table-loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center p-8 gap-4 rounded-2xl"
                            >
                                <div className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full animate-spin" />
                                <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                                    Fetching Admins
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex-1 overflow-x-auto no-scrollbar">
                        {!loading && displayedAdmins.length === 0 ? (
                            <div className="flex flex-col h-full min-h-[400px] items-center justify-center text-center p-8 gap-4">
                                <UsersIcon className="w-12 h-12 text-neutral-300" />
                                <div>
                                    <p className="text-base font-bold text-neutral-900">
                                        No administrators found
                                    </p>
                                    <p className="text-sm font-medium text-neutral-500 mt-1">
                                        {searchTerm
                                            ? "Try adjusting your search query."
                                            : "There are no records in this view."}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead className="bg-neutral-50 border-b border-neutral-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="py-4 px-5 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
                                            Administrator
                                        </th>
                                        <th className="py-4 px-5 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
                                            Status
                                        </th>
                                        <th className="py-4 px-5 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase hidden md:table-cell">
                                            {showArchived
                                                ? "Archived Date"
                                                : "Date Added"}
                                        </th>
                                        <th className="py-4 px-5 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {displayedAdmins.map((admin) => {
                                        const isCurrentUser =
                                            admin.id === getCurrentUserId();
                                        const fName =
                                            admin.first_name ??
                                            (admin.name
                                                ? admin.name.split(" ")[0]
                                                : "Unknown");
                                        const lName =
                                            admin.last_name ??
                                            (admin.name
                                                ? admin.name
                                                      .split(" ")
                                                      .slice(1)
                                                      .join(" ")
                                                : "");

                                        return (
                                            <tr
                                                key={admin.id}
                                                className="group hover:bg-neutral-50 transition-colors h-[73px]"
                                            >
                                                <td className="py-4 px-5 align-middle">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fName + " " + lName)}&background=f3f4f6&color=000000&rounded=true`}
                                                            alt="Avatar"
                                                            className="w-8 h-8 rounded-full object-cover hidden sm:block border border-neutral-200"
                                                        />
                                                        <div>
                                                            <p className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                                                                {fName} {lName}
                                                                {isCurrentUser && (
                                                                    <span className="px-1.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 rounded text-[9px] uppercase tracking-wider font-black">
                                                                        You
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <p className="text-[11px] font-medium text-neutral-400 mt-0.5 tracking-wide">
                                                                {admin.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-5 align-middle">
                                                    {showArchived ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-neutral-200 bg-neutral-100 text-neutral-500">
                                                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full"></span>
                                                            Archived
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-emerald-200 bg-emerald-50 text-emerald-700">
                                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                                            Active
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-5 align-middle hidden md:table-cell text-sm font-medium text-neutral-500">
                                                    {showArchived &&
                                                    admin.archived_at
                                                        ? new Date(
                                                              admin.archived_at,
                                                          ).toLocaleDateString(
                                                              undefined,
                                                              {
                                                                  month: "short",
                                                                  day: "numeric",
                                                                  year: "numeric",
                                                              },
                                                          )
                                                        : new Date(
                                                              admin.created_at,
                                                          ).toLocaleDateString(
                                                              undefined,
                                                              {
                                                                  month: "short",
                                                                  day: "numeric",
                                                                  year: "numeric",
                                                              },
                                                          )}
                                                </td>
                                                <td className="py-4 px-5 align-middle text-right">
                                                    <div className="flex justify-end gap-2 mt-1">
                                                        {showArchived ? (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedAdmin(
                                                                            admin,
                                                                        );
                                                                        setActionModal(
                                                                            "restore",
                                                                        );
                                                                    }}
                                                                    className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-600 transition-all hover:border-blue-400 hover:text-blue-700 cursor-pointer"
                                                                >
                                                                    Restore
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedAdmin(
                                                                            admin,
                                                                        );
                                                                        setActionModal(
                                                                            "delete",
                                                                        );
                                                                    }}
                                                                    className="rounded-lg border border-red-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-600 transition-all hover:border-red-400 hover:text-red-700 cursor-pointer"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        openEditModal(
                                                                            admin,
                                                                        )
                                                                    }
                                                                    className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-700 transition-all hover:border-black hover:text-black cursor-pointer"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedAdmin(
                                                                            admin,
                                                                        );
                                                                        setActionModal(
                                                                            "archive",
                                                                        );
                                                                    }}
                                                                    disabled={
                                                                        isCurrentUser
                                                                    }
                                                                    className="rounded-lg border border-amber-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-amber-600 transition-all hover:border-amber-400 hover:text-amber-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                                                    title={
                                                                        isCurrentUser
                                                                            ? "Cannot archive yourself"
                                                                            : "Archive Admin"
                                                                    }
                                                                >
                                                                    Archive
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Summary Footer */}
                    {displayedAdmins.length > 0 && (
                        <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-100 bg-neutral-50/50 mt-auto rounded-b-2xl">
                            <p className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
                                Total: {displayedAdmins.length} Record(s)
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* CREATE / EDIT FORM MODAL */}
            {createPortal(
                <AnimatePresence>
                    {showFormModal && (
                        <motion.div
                            key="modal-form-admin"
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 [font-family:var(--font-neue)]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div
                                className="absolute inset-0 bg-black/40 cursor-pointer"
                                onClick={closeFormModal}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={springTransition}
                                className="relative w-full max-w-lg rounded-[2rem] bg-white shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]"
                            >
                                <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-100 bg-neutral-50/50 shrink-0">
                                    <h2 className="text-xl font-black tracking-tight text-neutral-900">
                                        {modalMode === "create"
                                            ? "New Administrator"
                                            : "Edit Administrator"}
                                    </h2>
                                    <button
                                        onClick={closeFormModal}
                                        className="rounded-full p-2 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-900 transition-colors cursor-pointer"
                                    >
                                        <CloseIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-8 overflow-y-auto no-scrollbar">
                                    <form
                                        id="adminForm"
                                        onSubmit={handleFormSubmit}
                                        className="space-y-6"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between">
                                                    <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                                                        First Name *
                                                    </label>
                                                    {formErrors.first_name && (
                                                        <span className="text-[10px] font-bold text-red-500 uppercase">
                                                            {
                                                                formErrors.first_name
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    name="first_name"
                                                    value={formData.first_name}
                                                    onChange={handleInputChange}
                                                    className={`w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-all hover:bg-white ${formErrors.first_name ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-neutral-200/60 bg-neutral-50/50 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"}`}
                                                    placeholder="Jane"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between">
                                                    <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                                                        Last Name
                                                    </label>
                                                </div>
                                                <input
                                                    type="text"
                                                    name="last_name"
                                                    value={formData.last_name}
                                                    onChange={handleInputChange}
                                                    className="w-full rounded-xl border border-neutral-200/60 bg-neutral-50/50 px-4 py-3 text-sm font-medium outline-none transition-all hover:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                                                    placeholder="Doe"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between">
                                                <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                                                    Email Address *
                                                </label>
                                                {formErrors.email && (
                                                    <span className="text-[10px] font-bold text-red-500 uppercase">
                                                        {formErrors.email}
                                                    </span>
                                                )}
                                            </div>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className={`w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-all hover:bg-white ${formErrors.email ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-neutral-200/60 bg-neutral-50/50 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"}`}
                                                placeholder="admin@example.com"
                                            />
                                        </div>

                                        <div className="pt-4 border-t border-neutral-100">
                                            <p className="text-[11px] font-bold tracking-[0.05em] text-neutral-400 uppercase mb-4">
                                                Security Credentials{" "}
                                                {modalMode === "edit" &&
                                                    "(Leave blank to keep current)"}
                                            </p>

                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between">
                                                        <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                                                            Password{" "}
                                                            {modalMode ===
                                                                "create" && "*"}
                                                        </label>
                                                        {formErrors.password && (
                                                            <span className="text-[10px] font-bold text-red-500 uppercase">
                                                                Invalid Password
                                                            </span>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="password"
                                                        name="password"
                                                        value={
                                                            formData.password
                                                        }
                                                        onChange={
                                                            handleInputChange
                                                        }
                                                        className={`w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-all hover:bg-white ${formErrors.password ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-neutral-200/60 bg-neutral-50/50 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"}`}
                                                        placeholder="••••••••"
                                                    />
                                                    {formErrors.password && (
                                                        <p className="text-xs text-red-500 mt-1 font-medium">
                                                            {
                                                                formErrors.password
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between">
                                                        <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                                                            Confirm Password{" "}
                                                            {modalMode ===
                                                                "create" && "*"}
                                                        </label>
                                                        {formErrors.password_confirmation && (
                                                            <span className="text-[10px] font-bold text-red-500 uppercase">
                                                                Mismatch
                                                            </span>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="password"
                                                        name="password_confirmation"
                                                        value={
                                                            formData.password_confirmation
                                                        }
                                                        onChange={
                                                            handleInputChange
                                                        }
                                                        className={`w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-all hover:bg-white ${formErrors.password_confirmation ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-neutral-200/60 bg-neutral-50/50 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"}`}
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                <div className="p-6 border-t border-neutral-100 bg-neutral-50/50 shrink-0 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={closeFormModal}
                                        className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-black cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        form="adminForm"
                                        disabled={updating}
                                        className="flex-1 rounded-xl bg-black px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-neutral-800 shadow-lg shadow-black/10 disabled:opacity-50 cursor-pointer"
                                    >
                                        {updating
                                            ? "Saving..."
                                            : modalMode === "create"
                                              ? "Create Admin"
                                              : "Save Changes"}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body,
            )}

            {/* ACTION CONFIRMATION MODAL (Archive/Restore/Delete) */}
            {createPortal(
                <AnimatePresence>
                    {actionModal && selectedAdmin && (
                        <motion.div
                            key="modal-action-admin"
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 [font-family:var(--font-neue)]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div
                                className="absolute inset-0 bg-black/40 cursor-pointer"
                                onClick={() => setActionModal(null)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={springTransition}
                                className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 border border-neutral-100 text-center pointer-events-auto shadow-2xl"
                            >
                                <div
                                    className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full ${actionModal === "delete" ? "bg-red-50 text-red-600" : actionModal === "archive" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}
                                >
                                    {actionModal === "delete" ? (
                                        <TrashIcon className="w-6 h-6" />
                                    ) : actionModal === "archive" ? (
                                        <ArchiveIcon className="w-6 h-6" />
                                    ) : (
                                        <RestoreIcon className="w-6 h-6" />
                                    )}
                                </div>
                                <h3 className="text-xl font-black text-neutral-900 mb-2 capitalize">
                                    {actionModal} Admin?
                                </h3>
                                <p className="text-sm font-medium text-neutral-500 mb-8">
                                    {actionModal === "delete"
                                        ? `This will permanently delete ${selectedAdmin.first_name || "this admin"}'s account. This cannot be undone.`
                                        : actionModal === "archive"
                                          ? `${selectedAdmin.first_name || "This admin"} will be archived and unable to log in.`
                                          : `${selectedAdmin.first_name || "This admin"} will be restored and allowed to log in again.`}
                                </p>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={executeAction}
                                        disabled={updating}
                                        className={`w-full rounded-full px-4 py-3.5 text-sm font-bold text-white transition-all disabled:opacity-50 cursor-pointer ${actionModal === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-black hover:bg-neutral-800"}`}
                                    >
                                        {updating
                                            ? "Processing..."
                                            : `Yes, ${actionModal} admin`}
                                    </button>
                                    <button
                                        onClick={() => setActionModal(null)}
                                        className="w-full rounded-full bg-transparent px-4 py-3.5 text-sm font-bold text-neutral-400 transition-all hover:text-neutral-900 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body,
            )}

            {/* TOAST NOTIFICATION */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        key="toast-alert"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={springTransition}
                        className="fixed bottom-10 right-10 z-[110] pointer-events-none [font-family:var(--font-neue)]"
                    >
                        <div
                            className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border ${toast.type === "success" ? "bg-black text-white border-black" : "bg-red-600 text-white border-red-700"}`}
                        >
                            {toast.type === "success" ? (
                                <CheckIcon className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <CloseIcon className="w-4 h-4 text-white" />
                            )}
                            <p className="text-[11px] font-bold tracking-widest uppercase mt-0.5">
                                {toast.message}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─────────────────────────────────────────
   ICONS
───────────────────────────────────────── */
function SearchIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
        </svg>
    );
}
function RefreshIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
        </svg>
    );
}
function CloseIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}
function CheckIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}
function TrashIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
    );
}
function ArchiveIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="21 8 21 21 3 21 3 8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
    );
}
function RestoreIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
        </svg>
    );
}
function UsersIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}
