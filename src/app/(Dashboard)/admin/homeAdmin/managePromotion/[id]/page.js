"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/app/lib/api';
import { Save, AlertCircle, CheckCircle, X } from 'lucide-react';

export default function EditPromotionPage() {
    const { id } = useParams();
    const router = useRouter();
    const [formData, setFormData] = useState({ text: '', link: '', isActive: true });
    const [toast, setToast] = useState(null);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    };

    // নির্দিষ্ট প্রমোশন ডাটা ফেচ করা
    useEffect(() => {
        const fetchPromotion = async () => {
            try {
                const res = await api.get(`/api/promotions/${id}`);
                setFormData(res.data);
            } catch (err) {
                showToast("error", "Failed to load promotion data.");
            }
        };
        fetchPromotion();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/api/promotions/${id}`, formData);
            showToast("success", "Promotion updated successfully!");
            setTimeout(() => router.push('/admin/homeAdmin/managePromotion'), 1500);
        } catch (err) {
            showToast("error", "Failed to update promotion.");
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

            <div className="max-w-2xl mx-auto bg-card p-8 rounded-3xl border border-accent-10">
                <h2 className="text-2xl font-display text-heading mb-6">Edit Promotion</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        className="w-full p-3 rounded-lg border border-accent-10 bg-bg text-heading"
                        placeholder="Promotion Text"
                        value={formData.text}
                        onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                        required
                    />

                    <input
                        className="w-full p-3 rounded-lg border border-accent-10 bg-bg text-heading"
                        placeholder="Link"
                        value={formData.link}
                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    />

                    <div className="flex items-center gap-3 text-body">
                        <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-5 h-5 accent-primary"
                        />
                        <span>Set as Active</span>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-secondary transition-all flex items-center justify-center gap-2"
                    >
                        <Save size={20} />
                        Update Promotion
                    </button>
                </form>
            </div>
        </div>
    );
}