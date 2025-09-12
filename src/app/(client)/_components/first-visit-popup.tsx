"use client";

import { useState, useEffect } from "react";
import { cn } from "@/utils/cn";

export default function FirstVisitPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [otherText, setOtherText] = useState("");

  useEffect(() => {
    const checkAndShowPopup = async () => {
      // Check if user has already seen the popup in localStorage
      const hasSeenPopup = localStorage.getItem("hasSeenPopup");
      if (hasSeenPopup) {
        return; // User has already seen it in this browser
      }

      try {
        // Get user's IP address using a free API
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipResponse.json();
        
        // Create a unique identifier based on IP
        const userIdentifier = `nextrows_visitor_${ip.replace(/\./g, '_')}`;
        
        // Check if this IP has been seen before in localStorage
        // In production, you'd check this against a backend database
        const knownVisitors = localStorage.getItem("knownVisitors") || "[]";
        const visitorsArray = JSON.parse(knownVisitors);
        
        if (visitorsArray.includes(userIdentifier)) {
          // This IP has visited before, don't show popup
          localStorage.setItem("hasSeenPopup", "true");
          return;
        }
        
        // New visitor, show popup after a delay
        const timer = setTimeout(() => {
          setIsOpen(true);
          // Add to known visitors
          visitorsArray.push(userIdentifier);
          localStorage.setItem("knownVisitors", JSON.stringify(visitorsArray));
        }, 1500);
        
        return () => clearTimeout(timer);
      } catch (error) {
        // If IP detection fails, fall back to localStorage only
        console.error("IP detection failed:", error);
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    };

    checkAndShowPopup();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save response and mark popup as seen
    const response = selectedOption === "other" ? `Other: ${otherText}` : selectedOption;
    localStorage.setItem("hasSeenPopup", "true");
    localStorage.setItem("referralSource", response);
    
    // Get the label for the selected option
    const optionLabels: Record<string, string> = {
      google: "Google Search",
      social: "Social Media",
      friend: "Friend or Colleague",
      ai: "Recommended by AI",
      other: otherText || "Other"
    };
    
    const responseLabel = selectedOption === "other" 
      ? `Other: ${otherText}` 
      : optionLabels[selectedOption];
    
    // Try to get IP for tracking
    let userIP = "unknown";
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();
      userIP = ip;
    } catch (error) {
      console.error("Could not get IP:", error);
    }
    
    // Send to Formspree
    try {
      await fetch("https://formspree.io/f/xkgvyygp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Blog Visitor",
          email: "noreply@nextrows.com",
          subject: "Referral Source",
          message: `How they discovered NextRows: ${responseLabel}\nIP: ${userIP}`,
          referralSource: responseLabel,
          visitorIP: userIP,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error("Failed to send referral source:", error);
    }
    
    setIsOpen(false);
  };

  const handleClose = () => {
    localStorage.setItem("hasSeenPopup", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-stone-900 rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
              Welcome to NextRows Blog! 👋
            </h2>
            <p className="text-stone-600 dark:text-stone-400">
              We'd love to know how you discovered us
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              {[
                { value: "google", label: "Google Search" },
                { value: "social", label: "Social Media" },
                { value: "friend", label: "Friend or Colleague" },
                { value: "ai", label: "Recommended by AI" },
                { value: "other", label: "Other" }
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center p-3 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="referral"
                    value={option.value}
                    checked={selectedOption === option.value}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="ml-3 text-stone-700 dark:text-stone-300">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>

            {selectedOption === "other" && (
              <input
                type="text"
                placeholder="Please specify..."
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={!selectedOption || (selectedOption === "other" && !otherText)}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
                  (!selectedOption || (selectedOption === "other" && !otherText)) && "bg-stone-300 text-stone-500 cursor-not-allowed",
                  selectedOption && (selectedOption !== "other" || !!otherText) && "bg-orange-600 text-white hover:bg-orange-700"
                )}
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
