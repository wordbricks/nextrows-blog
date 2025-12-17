"use client";

import { useState } from "react";
import { predictUrl, PredictionResult } from "@/lib/predictor-engine";
import { cn } from "@/utils/cn";
import Container from "@/app/(client)/_components/container";

export default function PredictorPage() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PredictionResult | null>(null);
    const [error, setError] = useState("");
    const [showDebug, setShowDebug] = useState(false);

    const handlePredict = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        // Add protocol if missing
        let targetUrl = url;
        if (!targetUrl.startsWith("http")) {
            targetUrl = "https://" + targetUrl;
            setUrl(targetUrl);
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const prediction = await predictUrl(targetUrl);
            setResult(prediction);
        } catch (err) {
            setError("An unexpected error occurred while analyzing the URL.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <div className="max-w-2xl mx-auto py-20 min-h-[60vh]">
                <div className="text-center mb-12 relative">
                    <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-4 animate-fade-in">
                        Scraping Feasibility Check
                    </h1>
                    <p className="text-lg text-stone-600 dark:text-stone-400">
                        Analyze a URL to estimate its scrapability and identify potential blockers.
                    </p>
                </div>

                <form onSubmit={handlePredict} className="relative mb-8 animate-fade-in duration-600">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Enter URL to check (e.g., https://example.com)..."
                            className="flex-1 px-5 py-4 text-lg rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "px-8 py-4 text-lg font-semibold text-white bg-orange-600 rounded-xl shadow-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed",
                                loading && "animate-pulse"
                            )}
                        >
                            {loading ? "Analyzing..." : "Check"}
                        </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
                        <span className="text-sm text-stone-500 dark:text-stone-400 py-1">Try:</span>
                        {[
                            { label: "Lobste.rs", url: "https://lobste.rs/" },
                            { label: "Amazon Bestsellers", url: "https://www.amazon.com/gp/bestsellers/?ref_=nav_cs_bestsellers" },
                            { label: "CVS", url: "https://www.cvs.com/" },
                            { label: "GetGPT", url: "https://getgpt.app/" },
                            { label: "NextRows Blog", url: "https://nextrows.com/blog" }
                        ].map((sample) => (
                            <button
                                key={sample.url}
                                type="button"
                                onClick={() => setUrl(sample.url)}
                                className="text-sm px-3 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                                disabled={loading}
                            >
                                {sample.label}
                            </button>
                        ))}
                    </div>
                </form>

                {error && (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 mb-8 text-center animate-fade-in">
                        {error}
                    </div>
                )}

                {/* SEO Content - Hidden when results are shown */}
                {!result && !loading && (
                    <div className="mt-24 max-w-3xl mx-auto text-center space-y-12 animate-fade-in text-stone-600 dark:text-stone-400">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                How the Scraping Predictor Works
                            </h2>
                            <p className="text-lg leading-relaxed">
                                This free tool analyzes web pages directly from your browser to estimate how difficult they are to scrape.
                                It checks for common anti-bot signals, structural complexity, and network policies (CORS) to give you a
                                feasibility score before you write a single line of code.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                            <div className="space-y-2">
                                <h3 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    Structure Analysis
                                </h3>
                                <p className="text-sm">
                                    Detects if the site uses simple HTML or complex Single Page Application (SPA) frameworks like React or Next.js.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                    Protection Checks
                                </h3>
                                <p className="text-sm">
                                    Identifies potential blockers such as Login walls, CAPTCHAs, and rate-limiting measures.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                    Network Policies
                                </h3>
                                <p className="text-sm">
                                    Evaluates CORS headers and response codes to determine if the site allows external access.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {result && (
                    <div className="space-y-6 animate-fade-in duration-800">
                        {/* Main Score Card */}
                        <div className={cn(
                            "p-8 rounded-2xl border shadow-xl text-center",
                            result.score === "Full" ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" :
                                result.score === "Partial" ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800" :
                                    "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                        )}>
                            <h2 className="text-xl font-medium text-stone-600 dark:text-stone-400 mb-2">Scrapeability Score</h2>
                            <div className={cn(
                                "text-5xl font-bold mb-4",
                                result.score === "Full" ? "text-green-600 dark:text-green-400" :
                                    result.score === "Partial" ? "text-yellow-600 dark:text-yellow-400" :
                                        "text-red-600 dark:text-red-400"
                            )}>
                                {result.score}
                            </div>
                            <p className="text-stone-600 dark:text-stone-300 max-w-md mx-auto">
                                Difficulty Level: <span className="font-semibold">{result.difficulty}/5</span>
                            </p>
                        </div>

                        {/* Signals Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="group relative px-6 py-6 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm hover-lift cursor-help">
                                <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Structure</h3>
                                <p className="text-xl font-bold text-stone-800 dark:text-stone-200">{result.signals.s_axis}</p>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-stone-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center shadow-lg">
                                    Refers to valid HTML structure tags like &lt;article&gt; or &lt;section&gt;.
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-800"></div>
                                </div>
                            </div>
                            <div className="group relative p-6 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm hover-lift cursor-help">
                                <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Loading</h3>
                                <p className="text-xl font-bold text-stone-800 dark:text-stone-200">{result.signals.l_axis}</p>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-stone-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center shadow-lg">
                                    Indicates if content is static or involves complex loading patterns (like infinite scroll).
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-800"></div>
                                </div>
                            </div>
                            <div className="group relative p-6 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm hover-lift cursor-help">
                                <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Protection</h3>
                                <p className="text-xl font-bold text-stone-800 dark:text-stone-200">{result.signals.ap_axis}</p>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-stone-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center shadow-lg">
                                    Highlights anti-bot measures like Captchas, Login walls, or Rate limiting.
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-800"></div>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Details */}
                        <div className="p-6 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Analysis Details</h3>
                                {/* Debug Toggle - Inside Analysis Details */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-stone-500 font-medium uppercase tracking-wider">Debug</span>
                                    <button
                                        onClick={() => setShowDebug(!showDebug)}
                                        className={cn(
                                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
                                            showDebug ? "bg-orange-600" : "bg-stone-200 dark:bg-stone-700"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                                showDebug ? "translate-x-6" : "translate-x-1"
                                            )}
                                        />
                                    </button>
                                </div>
                            </div>
                            <ul className="space-y-2">
                                {result.details.map((detail, idx) => (
                                    <li key={idx} className="flex items-start">
                                        <svg className="w-5 h-5 text-stone-400 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-stone-700 dark:text-stone-300">{detail}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Debug Log Section - Inside Analysis Details */}
                            {showDebug && result.logs && (
                                <div className="mt-6 p-4 rounded-lg bg-stone-900 text-stone-200 font-mono text-xs border border-stone-800 shadow-inner overflow-hidden animate-fade-in">
                                    <h3 className="text-sm font-bold text-orange-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                        </svg>
                                        Execution Trace
                                    </h3>
                                    <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
                                        {result.logs.map((log, idx) => (
                                            <div key={idx} className="border-l-2 border-stone-700 pl-3 py-0.5">
                                                <span className="opacity-50 mr-3 select-none">{log.split(']')[0]}]</span>
                                                <span>{log.split(']').slice(1).join(']')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {result.difficulty <= 3 && (
                            <div className="flex justify-center pt-8">
                                <a
                                    href={`https://nextrows.com?source=predictor&url=${encodeURIComponent(url)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-8 py-4 text-lg font-bold text-stone-900 bg-white border border-stone-200 rounded-full shadow-lg hover:bg-stone-50 hover:scale-105 transition-all transform dark:bg-stone-800 dark:text-white dark:border-stone-700 dark:hover:bg-stone-700"
                                >
                                    Scrape this site on NextRows →
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Container >
    );
}
