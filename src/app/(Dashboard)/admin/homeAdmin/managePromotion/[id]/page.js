"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/app/lib/api";
import { Zap, ArrowLeft, Loader2 } from "lucide-react";
import PromotionForm from "../components/PromotionFrom";

// Helper: convert ObjectId arrays back to comma-separated strings for the form
// ─── UpdatePromotion/page.js — updated prepareDefaults ───────────────────────
// scope.products and scope.excludeProducts are now string[] (ObjectIds)
// bxgy.productIds is now string[] (ObjectIds)
// Replace the old prepareDefaults function with this one:

function prepareDefaults(p) {
    if (!p) return {};
    return {
        ...p,
        scope: {
            // categories: keep as comma-separated string for the text input
            categories: Array.isArray(p.scope?.categories)
                ? p.scope.categories.join(", ")
                : p.scope?.categories || "",

            // products: array of id strings (populated objects → extract _id)
            products: (p.scope?.products || []).map((x) =>
                typeof x === "object" ? x._id : x
            ),

            // excludeProducts: same
            excludeProducts: (p.scope?.excludeProducts || []).map((x) =>
                typeof x === "object" ? x._id : x
            ),
        },
        bxgy: {
            buy: p.bxgy?.buy ?? "",
            get: p.bxgy?.get ?? "",
            // productIds: array of id strings
            productIds: (p.bxgy?.productIds || []).map((x) =>
                typeof x === "object" ? x._id : x
            ),
        },
        value: p.value ?? "",
        usageLimit: p.usageLimit ?? "",
        perUserLimit: p.perUserLimit ?? "",
        conditions: {
            minCartValue: p.conditions?.minCartValue ?? "",
            userRoles: p.conditions?.userRoles || [],
            firstOrderOnly: p.conditions?.firstOrderOnly || false,
            paymentMethod: p.conditions?.paymentMethod || "",
        },
        startDate: p.startDate ? p.startDate.slice(0, 16) : "",
        endDate: p.endDate ? p.endDate.slice(0, 16) : "",
    };
}

export default function UpdatePromotion() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id;

    const [defaults, setDefaults] = useState(null);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const { data } = await api.get(`/api/promotions/${id}`);
                setDefaults(prepareDefaults(data.data));
            } catch {
                setError("Promotion not found");
            } finally {
                setFetchLoading(false);
            }
        })();
    }, [id]);

    const handleSubmit = async (data) => {
        setSubmitLoading(true);
        setError(null);
        try {
            await api.put(`/api/promotions/${id}`, data);
            router.push("/admin/homeAdmin/managePromotion");
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to update promotion";
            const errs = err.response?.data?.errors;
            setError(errs ? errs.map((e) => `${e.field}: ${e.message}`).join(" · ") : msg);
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg p-6 lg:p-8">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <button
                        onClick={() => router.push("/admin/homeAdmin/managePromotion")}
                        className="flex items-center gap-1.5 text-body text-sm hover:text-heading transition-colors mb-4"
                    >
                        <ArrowLeft size={15} /> Back to Promotions
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[var(--color-secondary)]/15">
                            <Zap size={22} className="text-[var(--color-secondary)]" />
                        </div>
                        <div>
                            <h1 className="text-heading text-2xl font-bold font-display">Update Promotion</h1>
                            <p className="text-body text-sm">Edit existing promotion details</p>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-4 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-sm">
                        {error}
                    </div>
                )}

                {/* Loading */}
                {fetchLoading ? (
                    <div className="flex items-center justify-center py-20 gap-3 text-body">
                        <Loader2 size={22} className="animate-spin" />
                        Loading promotion…
                    </div>
                ) : defaults ? (
                    <PromotionForm
                        defaultValues={defaults}
                        onSubmit={handleSubmit}
                        submitLabel="Save Changes"
                        loading={submitLoading}
                    />
                ) : null}
            </div>
        </div>
    );
}