"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { XCircle, RotateCcw, Home } from "lucide-react";

const REASON_MESSAGES = {
    cancelled: "You cancelled the payment.",
    payment_failed: "Your payment could not be processed.",
    validation_failed: "Payment validation failed.",
    order_not_found: "Order not found.",
    server_error: "A server error occurred.",
    invalid: "Payment was marked invalid.",
};

export default function PaymentFailedPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reason = searchParams.get("reason") || "payment_failed";

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center space-y-6">

                <div className="w-24 h-24 mx-auto rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center">
                    <XCircle size={48} className="text-[var(--color-danger)]" />
                </div>

                <div>
                    <h1 className="text-heading text-2xl font-black mb-2">Payment Failed</h1>
                    <p className="text-body text-sm">
                        {REASON_MESSAGES[reason] || "Something went wrong with your payment."}
                    </p>
                    <p className="text-body text-xs mt-2">
                        Your order has been saved. You can retry payment from My Orders.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => router.push("/Myorder")}
                        className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
                    >
                        <RotateCcw size={15} /> My Orders
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