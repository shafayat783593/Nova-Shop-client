"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api";

export function PromoTicker() {
    const [items, setItems] = useState([]);
    const router = useRouter();

    useEffect(() => {
        api.get("/api/promotions/active")
            .then(({ data }) => {
                const promos = data?.data || [];
                const texts = promos
                    .filter(p => p.description || p.name)
                    .map(p => ({
                        label: p.type === "free_shipping" ? "FREE SHIP"
                            : p.type === "bxgy" ? "BOGO"
                                : p.discountType === "percent" ? `${p.value}% OFF`
                                    : "DEAL",
                        text: p.description || p.name,
                    }));
                if (texts.length === 0) {
                    setItems([]);
                } else {
                    setItems([...texts, ...texts]);
                }
            })
            .catch(() => {
                setItems([]);
            });
    }, []);

    if (!items.length) return null;

    return (
        <div
            onClick={() => router.push("/deals")}
            className="w-full overflow-hidden cursor-pointer h-8 flex items-center nb-font bg-primary"
        >
            <div className="nb-ticker-wrapper">
                {items.map((item, i) => (
                    <span key={i} className="nb-ticker-item">
                        <span className="nb-ticker-label">{item.label}</span>
                        <span className="nb-ticker-text">{item.text}</span>
                        <span className="nb-ticker-dot" />
                    </span>
                ))}
            </div>

            <style>{`
        .nb-ticker-wrapper {
          display: flex;
          align-items: center;
          white-space: nowrap;
          animation: nb-ticker-move 30s linear infinite;
          width: max-content;
        }
        .nb-ticker-wrapper:hover {
          animation-play-state: paused;
        }
        .nb-ticker-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 28px;
          font-size: 11.5px;
          font-weight: 700;
          color: var(--accent);
          letter-spacing: 0.02em;
        }
        .nb-ticker-label {
          background: rgba(255,255,255,0.12);
          color: var(--accent);
          font-size: 9.5px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.07em;
        }
        .nb-ticker-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          flex-shrink: 0;
        }
        @keyframes nb-ticker-move {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
        </div>
    );
}