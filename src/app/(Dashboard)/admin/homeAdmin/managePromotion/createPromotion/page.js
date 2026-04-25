"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api";
import { Zap, ArrowLeft } from "lucide-react";
import PromotionForm from "../components/PromotionFrom";

export default function CreatePromotion() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    const handleSubmit = async (data) => {
        setLoading(true);
        setError(null);
        try {
            await api.post("/api/promotions", data);
            router.push("/admin/homeAdmin/managePromotion");
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to create promotion";
            const errs = err.response?.data?.errors;
            setError(errs ? errs.map((e) => `${e.field}: ${e.message}`).join(" · ") : msg);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-bg p-6 lg:p-8">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <button
                        onClick={() => router.push("/admin/promotions")}
                        className="flex items-center gap-1.5 text-body text-sm hover:text-heading transition-colors mb-4"
                    >
                        <ArrowLeft size={15} /> Back to Promotions
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[var(--color-primary)]/15">
                            <Zap size={22} className="text-[var(--color-primary)]" />
                        </div>
                        <div>
                            <h1 className="text-heading text-2xl font-bold font-display">Create Promotion</h1>
                            <p className="text-body text-sm">Set up a new discount or campaign</p>
                        </div>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="p-4 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-sm">
                        {error}
                    </div>
                )}

                {/* Form */}
                <PromotionForm
                    onSubmit={handleSubmit}
                    submitLabel="Create Promotion"
                    loading={loading}
                />
            </div>
        </div>
    );
}