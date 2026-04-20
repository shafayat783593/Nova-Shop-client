"use client";

import React, { useEffect, useState } from 'react';
import api from '@/app/lib/api';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Edit2, Trash2, Plus, CheckCircle, AlertCircle, X } from 'lucide-react';

export default function ManageBanners() {
    const [banners, setBanners] = useState([]);
    const [toast, setToast] = useState(null);
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

    const deleteBanner = (id) => {
        setToast({
            type: "confirm",
            msg: "Are you sure you want to delete this banner?",
            onConfirm: async () => {
                try {
                    await api.delete(`/api/banners/${id}`);
                    showToast("success", "Banner deleted successfully!");
                    fetchBanners();
                } catch (err) {
                    showToast("error", "Failed to delete banner.");
                }
            },
            onCancel: () => setToast(null)
        });
    };

    return (
        <div className="p-8 bg-bg min-h-screen">

            {/* ✅ Toast (GLOBAL - table er baire) */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 px-5 py-4 rounded-xl shadow-xl text-white text-sm font-semibold 
                ${toast.type === "success" ? "bg-success" : toast.type === "error" ? "bg-danger" : "bg-gray-800"}`}>

                    <div className="flex items-center gap-3">
                        {toast.type === "success" && <CheckCircle size={18} />}
                        {toast.type === "error" && <AlertCircle size={18} />}
                        {toast.type === "confirm" && <AlertCircle size={18} />}
                        <span>{toast.msg}</span>
                    </div>

                    {/* Confirm Buttons */}
                    {toast.type === "confirm" && (
                        <div className="flex gap-3 mt-3 justify-end">
                            <button
                                onClick={() => {
                                    toast.onConfirm();
                                    setToast(null);
                                }}
                                className="bg-green-500 px-3 py-1 rounded text-xs"
                            >
                                Yes
                            </button>
                            <button
                                onClick={toast.onCancel}
                                className="bg-gray-500 px-3 py-1 rounded text-xs"
                            >
                                No
                            </button>
                        </div>
                    )}

                    {/* Close Button */}
                    {toast.type !== "confirm" && (
                        <button
                            onClick={() => setToast(null)}
                            className="absolute top-2 right-2"
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-display text-heading">Manage Banners</h2>
                <button
                    onClick={() => router.push('/admin/homeAdmin/managebanner/createbanner')}
                    className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                >
                    <Plus size={18} /> Add New Banner
                </button>
            </div>

            {/* Table */}
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
                                    {/* ✅ Next.js Image */}
                                    <Image
                                        src={b.imageUrl}
                                        alt="Banner"
                                        width={80}
                                        height={48}
                                        className="object-cover rounded"
                                    />
                                </td>
                                <td className="p-4">{b.title}</td>
                                <td className="p-4 flex gap-4">
                                    <button
                                        onClick={() => router.push(`/admin/homeAdmin/managebanner/${b._id}`)}
                                        className="text-primary hover:text-accent transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </button>

                                    <button
                                        onClick={() => deleteBanner(b._id)}
                                        className="text-danger hover:opacity-80 transition-opacity"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}