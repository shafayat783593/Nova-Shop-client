"use client";

import React, { useState } from 'react';
import api from '@/app/lib/api';
import { Upload, Loader2, Save, X } from 'lucide-react';
import useCloudinaryUpload from '@/utils/useCloudinaryUpload';
import { FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function CreateBannerPage() {
    const { uploadSingle, uploading, error: uploadError } = useCloudinaryUpload();

    const [formData, setFormData] = useState({ title: '', description: '', link: '', imageUrl: '' });
    const [progress, setProgress] = useState(0);
    const [toast, setToast] = useState(null);
const router = useRouter();
    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // Cloudinary তে আপলোড
            const result = await uploadSingle(file, {
                folder: 'banners',
                onProgress: (p) => setProgress(p),
            });
            setFormData({ ...formData, imageUrl: result.url });
        } catch (err) {
            showToast("error", err.message || "Upload failed");

            console.error("Upload failed", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/banners/add', formData);
            
            showToast("success", "Banner created successfully!");

            setFormData({ title: '', description: '', link: '', imageUrl: '' });
            router.push('/admin/homeAdmin/createbanner/managebanner');
            setProgress(0);
        } catch (err) {
            showToast("error", err?.response?.data?.message || "Failed to create banner");
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
            
            <h2 className="text-2xl font-display text-heading mb-6">Create New Banner</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    className="w-full p-3 rounded-lg border border-accent-10 bg-bg text-heading"
                    placeholder="Banner Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />

                <textarea
                    className="w-full p-3 rounded-lg border border-accent-10 bg-bg text-heading"
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />

                {/* File Upload Section */}
                <div className="border-2 border-dashed border-accent-10 p-6 rounded-lg text-center">
                    {!formData.imageUrl ? (
                        <label className="cursor-pointer flex flex-col items-center">
                            <Upload className="text-primary mb-2" />
                            <span className="text-body">Click to upload banner image</span>
                            <input type="file" className="hidden" onChange={handleFileChange} />
                        </label>
                    ) : (
                        <div className="relative">
                            <img src={formData.imageUrl} alt="preview" className="h-32 mx-auto rounded" />
                            <button onClick={() => setFormData({ ...formData, imageUrl: '' })} className="absolute top-0 right-0 p-1 bg-danger text-white rounded-full"><X size={14} /></button>
                        </div>
                    )}
                    {uploading && <p className="text-primary text-sm mt-2">Uploading: {progress}%</p>}
                </div>

                <button
                    disabled={uploading}
                    className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-secondary flex items-center justify-center gap-2"
                >
                    {uploading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    Save Banner
                </button>
            </form>
        </div>
    );
}