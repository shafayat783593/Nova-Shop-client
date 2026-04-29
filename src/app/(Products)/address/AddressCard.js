"use client";

import { useState } from "react";
import { MapPin, Phone, Pencil, Trash2, Star, Home, Building2, MoreHorizontal, Loader2 } from "lucide-react";

const LABEL_ICONS = { Home, Office: Building2, Other: MoreHorizontal };

// ─── AddressCard ──────────────────────────────────────────────────────────────
// selectable = true → shows radio/select style (used in checkout)
// onEdit, onDelete, onSetDefault, onSelect props
export default function AddressCard({
    address,
    selected = false,
    selectable = false,
    onSelect,
    onEdit,
    onDelete,
    onSetDefault,
    deleteLoading = false,
}) {
    const LabelIcon = LABEL_ICONS[address.label] || MapPin;

    return (
        <div
            className={`relative rounded-2xl border p-4 transition-all duration-200
                ${selectable ? "cursor-pointer" : ""}
                ${selected
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-sm"
                    : "border-accent-10 bg-card hover:border-[var(--color-primary)]/30"
                }`}
            onClick={selectable ? onSelect : undefined}
        >
            {/* Default badge */}
            {address.isDefault && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full">
                    <Star size={10} fill="currentColor" /> Default
                </span>
            )}

            {/* Selectable radio dot */}
            {selectable && (
                <div className={`absolute top-4 left-4 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                    ${selected ? "border-[var(--color-primary)]" : "border-accent-10"}`}
                >
                    {selected && (
                        <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                    )}
                </div>
            )}

            <div className={selectable ? "pl-7" : ""}>
                {/* Label + Name */}
                <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-body bg-[var(--accent-opacity)] px-2 py-0.5 rounded-lg">
                        <LabelIcon size={11} /> {address.label}
                    </span>
                    <span className="text-heading font-bold text-sm">{address.fullName}</span>
                </div>

                {/* Address details */}
                <div className="space-y-1">
                    <p className="text-body text-sm flex items-start gap-1.5">
                        <MapPin size={13} className="mt-0.5 flex-shrink-0 text-[var(--color-primary)]" />
                        <span>
                            {address.addressLine}, {address.area},{" "}
                            {address.district}, {address.division}
                            {address.postalCode && ` - ${address.postalCode}`}
                        </span>
                    </p>
                    <p className="text-body text-sm flex items-center gap-1.5">
                        <Phone size={13} className="flex-shrink-0 text-[var(--color-primary)]" />
                        {address.phone}
                    </p>
                </div>

                {/* Action buttons (only shown in non-selectable / manage mode) */}
                {!selectable && (
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-accent-10">
                        {!address.isDefault && onSetDefault && (
                            <button
                                onClick={onSetDefault}
                                className="text-xs text-body hover:text-[var(--color-primary)] transition-colors flex items-center gap-1"
                            >
                                <Star size={12} /> Set default
                            </button>
                        )}
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="text-xs text-body hover:text-[var(--color-primary)] transition-colors flex items-center gap-1"
                            >
                                <Pencil size={12} /> Edit
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                disabled={deleteLoading}
                                className="text-xs text-body hover:text-[var(--color-danger)] transition-colors flex items-center gap-1 disabled:opacity-50 ml-auto"
                            >
                                {deleteLoading
                                    ? <Loader2 size={12} className="animate-spin" />
                                    : <Trash2 size={12} />
                                }
                                Delete
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}