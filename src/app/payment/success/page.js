"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Package, ArrowRight, Home } from "lucide-react";

export default function PaymentSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center space-y-6">

                {/* Icon */}
                <div className="w-24 h-24 mx-auto rounded-full bg-green-500/15 flex items-center justify-center">
                    <CheckCircle2 size={48} className="text-green-500" />
                </div>

                <div>
                    <h1 className="text-heading text-2xl font-black mb-2">Order Placed!</h1>
                    <p className="text-body text-sm">
                        Your order has been confirmed. We'll send you an invoice email shortly.
                    </p>
                    {orderId && (
                        <div className="mt-3 inline-block bg-[var(--accent-opacity)] px-4 py-2 rounded-xl">
                            <p className="text-body text-xs font-semibold">Order ID</p>
                            <p className="text-heading font-black text-lg tracking-wider">{orderId}</p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => router.push("/orders")}
                        className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
                    >
                        <Package size={15} /> Track Order
                    </button>
                    <button
                        onClick={() => router.push("/")}
                        className="flex-1 py-3 rounded-xl border border-accent-10 text-heading font-semibold text-sm hover:bg-[var(--accent-opacity)] transition-colors flex items-center justify-center gap-2"
                    >
                        <Home size={15} /> Home
                    </button>
                </div>
            </div>
        </div>
    );
}