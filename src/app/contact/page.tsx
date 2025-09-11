"use client";

import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    
    try {
      const response = await fetch("https://formspree.io/f/xkgvyygp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus("success");
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: ""
        });
        
        // Reset status after 3 seconds
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="bg-stone-50 dark:bg-stone-950 min-h-screen py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-stone-900 dark:text-stone-100 mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-stone-600 dark:text-stone-400">
              Have a question about NextRows? We'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Contact Info Cards */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-lg shadow-md text-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">Email</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm">support@nextrows.com</p>
            </div>

            <div className="bg-white dark:bg-stone-900 p-6 rounded-lg shadow-md text-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">Office</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm">San Francisco, CA</p>
            </div>

            <div className="bg-white dark:bg-stone-900 p-6 rounded-lg shadow-md text-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">Response Time</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm">Within 24 hours</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white dark:bg-stone-900 p-8 md:p-12 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-6">Send us a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-stone-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-stone-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-stone-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="sales">Sales Question</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-2 border border-stone-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  placeholder="Tell us how we can help..."
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  {status === "success" && (
                    <p className="text-green-600 dark:text-green-400">Message sent successfully!</p>
                  )}
                  {status === "error" && (
                    <p className="text-red-600 dark:text-red-400">Something went wrong. Please try again.</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                    status === "sending"
                      ? "bg-stone-400 text-stone-200 cursor-not-allowed"
                      : "bg-orange-600 text-white hover:bg-orange-700"
                  }`}
                >
                  {status === "sending" ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>

          {/* FAQ Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-6 text-center">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-stone-900 p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">
                  What is NextRows?
                </h3>
                <p className="text-stone-600 dark:text-stone-400 text-sm">
                  NextRows is a no-code web scraping tool that helps you extract data from websites without writing any code.
                </p>
              </div>
              
              <div className="bg-white dark:bg-stone-900 p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">
                  How can I get started?
                </h3>
                <p className="text-stone-600 dark:text-stone-400 text-sm">
                  Simply sign up for a free account and follow our getting started guide to begin extracting data immediately.
                </p>
              </div>
              
              <div className="bg-white dark:bg-stone-900 p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">
                  Do you offer a free trial?
                </h3>
                <p className="text-stone-600 dark:text-stone-400 text-sm">
                  Yes! Your first few extractions are on us. We're confident that once you experience how easy NextRows makes data extraction, you'll be eager to upgrade for unlimited access.
                </p>
              </div>
              
              <div className="bg-white dark:bg-stone-900 p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">
                  Can I export my data?
                </h3>
                <p className="text-stone-600 dark:text-stone-400 text-sm">
                  Absolutely! You can export your data in multiple formats including CSV and XLS.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}