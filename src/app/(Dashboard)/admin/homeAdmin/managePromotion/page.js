"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/api';
import { Edit2, Trash2, Plus, CheckCircle, AlertCircle, X, ToggleLeft, ToggleRight } from 'lucide-react';

export default function ManagePromotions() {
    const [promotions, setPromotions] = useState([]);
    const [toast, setToast] = useState(null);
    const router = useRouter();

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            const res = await api.get('/api/promotions');
            setPromotions(res.data);
        } catch (err) {
            console.error("Failed to fetch promotions", err);
        }
    };

    // স্ট্যাটাস পরিবর্তনের ফাংশন
    const toggleStatus = async (promo) => {
        try {
            await api.put(`/api/promotions/${promo._id}`, { ...promo, isActive: !promo.isActive });
            showToast("success", "Status updated successfully!");
            fetchPromotions();
        } catch (err) {
            showToast("error", "Failed to update status.");
        }
    };

    const deletePromotion = async (id) => {
        try {
            await api.delete(`/api/promotions/${id}`);
            showToast("success", "Promotion deleted!");
            fetchPromotions();
        } catch (err) {
            showToast("error", "Failed to delete.");
        }
    };

    return (
        <div className="p-8 bg-bg min-h-screen">
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-white text-sm font-semibold transition-all ${toast.type === "success" ? "bg-success" : "bg-danger"}`}>
                    {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {toast.msg}
                    <button onClick={() => setToast(null)} className="ml-2"><X size={15} /></button>
                </div>
            )}

            <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-display text-heading">Manage Promotions</h2>
                <button
                    onClick={() => router.push('/admin/homeAdmin/managePromotion/createPromotion')}
                    className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus size={18} /> Add New
                </button>
            </div>

            <div className="bg-card border border-accent-10 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-accent-10 text-body">
                            <th className="p-4">Promotion Text</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {promotions.map((p) => (
                            <tr key={p._id} className="border-b border-accent-10 text-heading">
                                <td className="p-4">{p.text}</td>
                                <td className="p-4">
                                    <button onClick={() => toggleStatus(p)} className="text-primary">
                                        {p.isActive ? <ToggleRight size={28} className="text-success" /> : <ToggleLeft size={28} className="text-danger" />}
                                    </button>
                                </td>
                                <td className="p-4 flex gap-4">
                                    <button onClick={() => router.push(`/admin/homeAdmin/managePromotion/${p._id}`)} className="text-primary hover:text-accent"><Edit2 size={18} /></button>
                                    <button onClick={() => deletePromotion(p._id)} className="text-danger hover:opacity-80"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}