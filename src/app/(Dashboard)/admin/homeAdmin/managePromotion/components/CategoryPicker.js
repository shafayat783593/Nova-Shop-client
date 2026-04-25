"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/app/lib/api";
import { Search, X, Check, ChevronDown, Loader2, ListTree } from "lucide-react";

export default function CategoryPicker({ value = [], onChange, placeholder = "Search categories…", label }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);
    const searchRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Fetch categories
    const fetchCategories = useCallback(async (q) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ isActive: "true" });
            if (q) params.set("search", q);
            const { data } = await api.get(`/api/products/getCategoriesPromotion?${params}`);
            console.log(data)
            setCategories(data.data || []);
        } catch {
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!open) return;
        const delay = setTimeout(() => fetchCategories(search), 300);
        return () => clearTimeout(delay);
    }, [search, open, fetchCategories]);

    // Sync selected objects
    useEffect(() => {
        setSelectedCategories(categories.filter((c) => value.includes(c._id)));
    }, [value, categories]);

    const toggle = (category) => {
        const isSelected = value.includes(category._id);
        onChange(isSelected ? value.filter((id) => id !== category._id) : [...value, category._id]);
    };

    return (
        <div ref={containerRef} className="relative">
            {label && <label className="text-heading text-sm font-semibold block mb-1.5">{label}</label>}

            <div onClick={() => setOpen(!open)} className="min-h-[42px] w-full px-3 py-2 flex flex-wrap gap-1.5 items-center cursor-pointer bg-bg border border-accent-10 rounded-xl">
                {selectedCategories.length === 0 ? (
                    <span className="text-body text-sm">{placeholder}</span>
                ) : (
                    selectedCategories.map((c) => (
                        <span key={c._id} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)] text-xs font-semibold">
                            {c.name}
                            <button type="button" onClick={(e) => { e.stopPropagation(); onChange(value.filter(id => id !== c._id)); }}><X size={11} /></button>
                        </span>
                    ))
                )}
                <ChevronDown size={15} className={`ml-auto text-body transition-transform ${open ? "rotate-180" : ""}`} />
            </div>

            {open && (
                <div className="absolute z-50 mt-2 w-full bg-card border border-accent-10 rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-3 border-b border-accent-10">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-body" />
                            <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search category name..." className="w-full pl-8 pr-3 py-2 text-sm bg-bg border border-accent-10 rounded-xl outline-none focus:border-[var(--color-primary)]" />
                        </div>
                    </div>
                    <ul className="max-h-60 overflow-y-auto divide-y divide-[var(--accent-opacity)]">
                        {loading ? <li className="py-4 text-center"><Loader2 className="animate-spin mx-auto" size={18} /></li> :
                            categories.map((c) => (
                                <li key={c._id} onClick={() => toggle(c)} className={`flex items-center justify-between px-3 py-2.5 cursor-pointer ${value.includes(c._id) ? "bg-[var(--color-primary)]/8" : "hover:bg-[var(--accent-opacity)]"}`}>
                                    <span className="text-sm font-medium">{c.name}</span>
                                    {value.includes(c._id) && <Check size={14} className="text-[var(--color-primary)]" />}
                                </li>
                            ))}
                    </ul>
                </div>
            )}
        </div>
    );
}