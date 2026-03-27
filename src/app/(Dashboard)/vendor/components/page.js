'use client';
import api from '@/app/lib/api';
import { useState } from 'react';

export default function ShopInfoForm({ existingShop }) {
    const [formData, setFormData] = useState(existingShop || {});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/shop/submit-info', formData);
            alert("Shop information submitted for approval!");
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-xl bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-bold mb-4">Shop Information</h2>
            <input
                type="text" placeholder="Shop Name"
                className="w-full mb-3 p-3 border rounded-xl"
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                required
            />
            {/* আরও ইনপুট যেমন Address, Phone ইত্যাদি এখানে দিন */}
            <button
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold"
            >
                {loading ? "Submitting..." : "Submit for Approval"}
            </button>
        </form>
    );
}