"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/app/lib/api';
import useCloudinaryUpload from '@/utils/useCloudinaryUpload';
import { Upload, X, Loader2 } from 'lucide-react';
import { FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';

export default function EditBannerPage() {
    const { id } = useParams();
    const router = useRouter();
    const { uploadSingle, uploading, progress } = useCloudinaryUpload();

    const [toast, setToast] = useState(null);

    const [formData, setFormData] = useState({ title: '', description: '', imageUrl: '', link: '' });
    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    };
    useEffect(() => {
        const fetchBanner = async () => {
            try {
                const res = await api.get(`/api/banners/${id}`);
                setFormData(res.data);
            } catch (err) {
                console.error("Error fetching banner", err);
            }
        };
        fetchBanner();
    }, [id]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const result = await uploadSingle(file, { folder: 'banners' });
            setFormData({ ...formData, imageUrl: result.url });

        } catch (err) {
            showToast("error", err.message || "Upload failed");

            console.error("Upload failed", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/api/banners/${id}`, formData);
            showToast("success", "Banner updated successfully!");

            router.push('/admin/homeAdmin/createbanner/managebanner');
        } catch (err) {
            showToast("error", err?.response?.data?.message || "Failed to update banner");
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-8 bg-card rounded-3xl border border-accent-10">
            {/* Toast Notification */}
            {toast && (
                <div
                    className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-white text-sm font-semibold transition-all ${toast.type === "success" ? "bg-green-600" : "bg-red-600"
                        }`}
                >
                    {toast.type === "success" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
                    {toast.msg}
                    <button onClick={() => setToast(null)} className="ml-2">
                        <FiX size={15} />
                    </button>
                </div>
            )}
            <h2 className="text-2xl font-display text-heading mb-6">Edit Banner</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title Input */}
                <input
                    className="w-full p-3 rounded-lg border border-accent-10 bg-bg text-heading"
                    placeholder="Banner Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />

                {/* Description Textarea */}
                <textarea
                    className="w-full p-3 rounded-lg border border-accent-10 bg-bg text-heading"
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />

                {/* Image Upload/Preview Section */}
                <div className="border-2 border-dashed border-accent-10 p-6 rounded-lg text-center bg-bg">
                    {formData.imageUrl ? (
                        <div className="relative inline-block">
                            <img src={formData.imageUrl} alt="preview" className="h-32 w-auto rounded border border-accent-10" />
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                className="absolute -top-2 -right-2 p-1 bg-danger text-white rounded-full hover:opacity-80"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <label className="cursor-pointer flex flex-col items-center">
                            <Upload className="text-primary mb-2" />
                            <span className="text-body text-sm">Click to change banner image</span>
                            <input type="file" className="hidden" onChange={handleFileChange} />
                        </label>
                    )}
                    {uploading && <p className="text-primary text-sm mt-2">Uploading: {progress}%</p>}
                </div>

                <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-secondary transition-all flex items-center justify-center gap-2"
                >
                    {uploading ? <Loader2 className="animate-spin" /> : "Update Banner"}
                </button>
            </form>
        </div>
    );
}