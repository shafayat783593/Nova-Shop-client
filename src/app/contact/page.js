"use client";

import React, { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from "lucide-react";
import axios from "axios"; // সরাসরি axios ইম্পোর্ট করা হয়েছে

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      // আপনার ব্যাকএন্ডের ফুল ইউআরএল (যেমন: http://localhost:5000/api/contact) অথবা রিলেটিভ পাথ
      await axios.post(`${NEXT_PUBLIC_BACKEND_URL}/api/contact`, formData);
      
      setIsSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (error) {
      console.error("Failed to send message:", error);
      // ব্যাকএন্ড থেকে আসা নির্দিষ্ট এরর মেসেজ দেখানোর চেষ্টা করবে
      const msg = error.response?.data?.message || "Something went wrong. Please try again later.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-bg min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans animate-fade-in">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16 animate-slide-up">
          <h1 className="text-display text-4xl sm:text-5xl font-extrabold text-heading mb-4">
            Contact NovaShop
          </h1>
          <p className="text-body text-lg max-w-2xl mx-auto">
            Have a question, feedback, or need urgent assistance? Our team is ready to help you anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Info Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-accent-10 space-y-8">
              <h2 className="text-display text-2xl font-bold text-heading">
                Contact Information
              </h2>

              <div className="space-y-6">
                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-[var(--color-accent)]/20 text-[var(--color-primary)] dark:text-[var(--accent)]">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-heading">Call Us</h3>
                    <p className="text-body text-sm mt-1">+8801890486365</p>
                    <p className="text-body text-sm">+8801610665069</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-[var(--color-accent)]/20 text-[var(--color-primary)] dark:text-[var(--accent)]">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-heading">Email Us</h3>
                    <p className="text-body text-sm mt-1">shafayat783@gmail.com</p>
                    <p className="text-body text-sm">info@novashop.com</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-[var(--color-accent)]/20 text-[var(--color-primary)] dark:text-[var(--accent)]">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-heading">Our Office</h3>
                    <p className="text-body text-sm mt-1">
                      Mlimani City Mall, 1st Floor
                    </p>
                    <p className="text-body text-sm">Dar es Salaam, Tanzania</p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-[var(--color-accent)]/20 text-[var(--color-primary)] dark:text-[var(--accent)]">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-heading">Working Hours</h3>
                    <p className="text-body text-sm mt-1">Monday - Saturday:</p>
                    <p className="text-body text-sm font-medium text-heading">
                      08:00 AM - 08:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-accent-10">
              <h2 className="text-display text-2xl font-bold text-heading mb-6">
                Send Us a Message
              </h2>

              {isSubmitted && (
                <div className="mb-6 p-4 rounded-xl bg-[var(--color-success)]/10 border border-[var(--color-success)] text-[var(--color-success)] flex items-center gap-3 animate-slide-up">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">
                    Thank you! Your message has been received. We will get back to you shortly.
                  </p>
                </div>
              )}

              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500 text-red-500 flex items-center gap-3">
                  <p className="text-sm font-medium">{errorMessage}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-sm font-semibold text-heading">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-accent-10 bg-bg text-heading focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] text-sm"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-sm font-semibold text-heading">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-accent-10 bg-bg text-heading focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] text-sm"
                      placeholder="mail@example.com"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="subject" className="text-sm font-semibold text-heading">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-accent-10 bg-bg text-heading focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] text-sm"
                    placeholder="e.g., Order Tracking, Payment Issue, etc."
                  />
                </div>

                {/* Message */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="text-sm font-semibold text-heading">
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-accent-10 bg-bg text-heading focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] text-sm resize-none"
                    placeholder="Write your message here..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] dark:bg-[var(--accent)] dark:hover:bg-[var(--accent-hover)] text-white dark:text-black font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {isLoading ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}