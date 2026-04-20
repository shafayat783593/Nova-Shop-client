"use client";

import React, { useEffect, useState } from 'react';
import api from '@/app/lib/api';
import { useRouter } from 'next/navigation';
import { Edit2, Trash2, Plus, CheckCircle, AlertCircle, X } from 'lucide-react';

export default function ManageBanners() {
    const [banners, setBanners] = useState([]);
    const [toast, setToast] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const router = useRouter();

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const res = await api.get('/api/banners');
            setBanners(res.data);
        } catch (err) {
            console.error("Failed to fetch banners", err);
        }
    };

    const deleteBanner = async (id) => {
        const isConfirmed = window.confirm("Are you sure you want to delete this banner?");
        if (!isConfirmed) return;

        try {
            await api.delete(`/api/banners/${id}`);
            showToast("success", "Banner deleted successfully!");
            fetchBanners();
        } catch (err) {
            showToast("error", "Failed to delete banner.");
        }
    };

    return (
        <div className="p-8 bg-bg min-h-screen">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-white text-sm font-semibold transition-all ${toast.type === "success" ? "bg-success" : "bg-danger"}`}>
                    {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {toast.msg}
                    <button onClick={() => setToast(null)} className="ml-2"><X size={15} /></button>
                </div>
            )}

            <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-display text-heading">Manage Banners</h2>
                <button
                    onClick={() => router.push('/admin/homeAdmin/createbanner')}
                    className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                >
                    <Plus size={18} /> Add New Banner
                </button>
            </div>

            <div className="bg-card border border-accent-10 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-accent-10 text-body">
                            <th className="p-4">Image</th>
                            <th className="p-4">Title</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {banners.map((b) => (
                            <tr key={b._id} className="border-b border-accent-10 text-heading">
                                <td className="p-4">
                                    <img src={b.imageUrl} className="h-12 w-20 object-cover rounded" alt="Banner" />
                                </td>
                                <td className="p-4">{b.title}</td>
                                <td className="p-4 flex gap-4">
                                    <button
                                        onClick={() => router.push(`/admin/homeAdmin/createbanner/managebanner/${b._id}`)}
                                        className="text-primary hover:text-accent transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    {deletingId === b._id ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => deleteBanner(b._id)}
                                                className="text-success text-xs font-bold"
                                            >
                                                Confirm?
                                            </button>
                                            <button
                                                onClick={() => setDeletingId(null)}
                                                className="text-body text-xs"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setDeletingId(b._id)}
                                            className="text-danger hover:opacity-80 transition-opacity"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}