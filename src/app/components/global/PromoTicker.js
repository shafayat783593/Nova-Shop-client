// ─── PromoTicker ─────────────────────────────────────────────────────────────
// Auto-scrolling marquee ticker strip (for top of homepage)
// Usage: <PromoTicker />

import api from "@/app/lib/api";
import { useEffect, useState } from "react";

export function PromoTicker() {
    const [promos, setPromos] = useState([]);

    useEffect(() => {
        api.get("/promotions/active")
            .then(({ data }) => setPromos(data.data || []))
            .catch(() => { });
    }, []);

    if (promos.length === 0) return null;

    const items = [...promos, ...promos]; // duplicate for seamless loop

    return (
        <div className="w-full overflow-hidden bg-[var(--color-primary)] py-2">
            <div
                className="flex gap-8 whitespace-nowrap"
                style={{
                    animation: "ticker 20s linear infinite",
                }}
            >
                {items.map((p, i) => {
                    const label = getDiscountLabel(p);
                    return (
                        <span key={`${p._id}-${i}`} className="text-white text-sm font-semibold flex items-center gap-2">
                            <Zap size={13} className="text-[var(--color-accent)]" />
                            {p.name}
                            {label && <span className="text-[var(--color-accent)] font-black">{label}</span>}
                        </span>
                    );
                })}
            </div>

            <style>{`
                @keyframes ticker {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
}