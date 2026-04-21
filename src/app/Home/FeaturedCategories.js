"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/app/lib/api';
import {
    Shirt, Smartphone, ShoppingBag,
    Laptop, Headphones, Watch, Tag
} from 'lucide-react'; // lucide-react ইমপোর্ট

// ক্যাটাগরি অনুযায়ী Lucide আইকন ম্যাপ
const iconMap = {
    "Men": <Shirt size={28} />,
    "Women": <ShoppingBag size={28} />,
    "Electronics": <Smartphone size={28} />,
    "Accessories": <Watch size={28} />,
    "Laptops": <Laptop size={28} />,
    "Audio": <Headphones size={28} />
};

const FeaturedCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await api.get('/api/products/categories');
                console.log("Fetched categories:", data);
                setCategories(data.data);
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading) return null; 

    return (
        <section className="py-12 px-6">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-display text-heading mb-8 text-center">
                    Featured Categories
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {categories.map((cat, index) => (
                        <motion.div
                            key={cat}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            className="bg-card p-6 rounded-2xl flex flex-col items-center justify-center gap-4 border border-accent-10 cursor-pointer shadow-sm hover:shadow-lg transition-all"
                        >
                            <div className="text-secondary">
                                {iconMap[cat] || <Tag size={28} />}
                            </div>
                            <span className="text-heading font-medium text-sm md:text-base text-center">
                                {cat}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedCategories;