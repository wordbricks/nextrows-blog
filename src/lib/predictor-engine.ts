export type ScrapeabilityScore = "Full" | "Partial" | "Blocked" | "Unknown";

export interface PredictionResult {
    score: ScrapeabilityScore;
    difficulty: number; // 1-5
    signals: {
        s_axis: string;
        l_axis: string;
        ap_axis: string;
    };
    details: string[];
    logs: string[]; // Detailed debug logs
}

/**
 * Frontend-only "Lite" Predictor Engine
 * 
 * Limitations:
 * - Cannot actually crawl sites (headless/server-side required).
 * - Limited to checking CORS accessibility and URL patterns.
 * - Uses heuristics for "Structure" based on available signals.
 */
export async function predictUrl(url: string): Promise<PredictionResult> {
    const details: string[] = [];
    const logs: string[] = [];
    const addLog = (msg: string) => logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);

    let s_axis = "S-UNKNOWN";
    let l_axis = "L-STATIC";
    let ap_axis = "AP-NONE";
    let difficulty = 1;
    let score: ScrapeabilityScore = "Full";

    addLog(`Starting analysis for URL: ${url}`);

    // 1. URL Pattern Analysis
    addLog("Step 1: URL Pattern Analysis");
    const lowerUrl = url.toLowerCase();
    addLog(`Normalized URL: ${lowerUrl}`);

    // Basic heuristic: SPAs often have hash routers or specific paths, but we can't be sure without fetching.
    // We'll rely on fetch behavior.

    try {
        // 2. CORS / Accessibility Check
        addLog("Step 2: CORS / Network Accessibility Check");
        addLog("Attempting client-side fetch (GET) with mode 'cors'...");

        // This is the biggest signal in a frontend-only tool.
        // If we can fetch it, it's likely static or very open.
        // If it fails (CORS), it's likely protected or just standard cross-origin policy.
        // We treat strict CORS as a "Potential Block" / Higher Difficulty for scraping 
        // because it often implies better server configuration.

        // We try a simple HEAD request first, then GET
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            addLog("Request timed out after 5000ms");
        }, 5000); // 5s timeout

        let response;
        try {
            response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            addLog(`Fetch completed. Status: ${response.status} ${response.statusText}`);
        } catch (err: any) {
            clearTimeout(timeoutId);
            addLog(`Fetch failed. Error: ${err.message}`);
            throw err;
        }

        if (response.ok) {
            // Accessible via CORS!
            details.push("Site is CORS-open (accessible from browser JS).");
            addLog("Success: Site allows cross-origin requests from the browser.");

            const html = await response.text();
            addLog(`Received body length: ${html.length} chars`);
            const lowerHtml = html.toLowerCase();

            // 3. Simple Content Analysis (S-Axis)
            addLog("Step 3: Content Analysis (S-Axis)");
            if (lowerHtml.includes('<div id="root">') ||
                lowerHtml.includes('<div id="app">') ||
                lowerHtml.includes('react') ||
                lowerHtml.includes('next')) {
                s_axis = "S-CSR"; // Client-Side Rendered (likely)
                details.push("Detected Client-Side Rendering patterns (React/Next.js).");
                addLog("Matched S-CSR pattern: Found React/Next.js indicators in HTML.");
                difficulty += 1;
            } else {
                s_axis = "S-STATIC";
                details.push("Looks like Static HTML.");
                addLog("Classified as S-STATIC: No SPA indicators found.");
            }

            // 4. Access Protection (AP-Axis) checks in HTML
            addLog("Step 4: Access Protection (AP-Axis) Scan");
            if (lowerHtml.includes("captcha") || lowerHtml.includes("verify you are human")) {
                ap_axis = "AP-CAPTCHA";
                difficulty = 5;
                score = "Blocked";
                details.push("Detected CAPTCHA challenge in response.");
                addLog("CRITICAL: Detected 'captcha' or 'verify you are human' keywords in body.");
            } else if (lowerHtml.includes("login") && lowerHtml.includes("required")) {
                ap_axis = "AP-LOGIN";
                difficulty += 2;
                score = "Partial";
                details.push("Detected potential Login Wall.");
                addLog("Warning: Detected 'login required' pattern.");
            } else {
                addLog("No explicit protection keywords found in visible HTML.");
            }

        } else {
            // Accessible but error status
            details.push(`Site returned status ${response.status}.`);
            addLog(`Response was not OK. Status code: ${response.status}`);

            if (response.status === 403 || response.status === 401) {
                ap_axis = "AP-BOT-SCORE";
                difficulty += 2;
                score = "Partial";
                details.push("Access Denied (401/403). Likely Anti-Bot protection.");
                addLog("Classified as AP-BOT-SCORE due to 401/403 status.");
            } else if (response.status === 429) {
                ap_axis = "AP-RATE";
                difficulty += 2;
                score = "Partial";
                details.push("Rate Limited (429).");
                addLog("Classified as AP-RATE due to 429 status.");
            }
        }

    } catch (error: any) {
        // 5. Fetch Failed (Network Error or CORS Block)
        // Most real sites will block cross-origin requests.
        // In a "Lite" predictor, we interpretation this as "Standard Web Security"
        // but for scraping, it signifies you likely need a backend.

        addLog("Step 5: Error Handling / Fallback Analysis");

        if (error.name === 'AbortError') {
            details.push("Request timed out (5s). Site might be slow or blocking.");
            addLog("Analysis aborted due to timeout.");
            difficulty += 1;
        } else {
            details.push("CORS / Network Error: This site blocks browser-based access.");
            details.push("This is common for most professional websites.");
            addLog("CORS Error caught. Interpreting as standard web security protection.");

            // Enhance guess based on target
            if (lowerUrl.includes("google") || lowerUrl.includes("facebook") || lowerUrl.includes("twitter") || lowerUrl.includes("linkedin")) {
                ap_axis = "AP-BOT-SCORE";
                difficulty = 5;
                score = "Blocked";
                details.push("Known high-security target.");
                addLog(`Matched known high-security target pattern in URL: ${lowerUrl}`);
            } else {
                // Standard CORS block
                difficulty += 1;
                addLog("Increasing difficulty (+1) due to CORS block.");
            }
        }
    }

    // Cap difficulty
    difficulty = Math.min(difficulty, 5);
    addLog(`Final Difficulty Calculation: ${difficulty}/5`);

    // Final Score Logic
    if (difficulty >= 4) {
        score = score === "Blocked" ? "Blocked" : "Partial";
    }
    addLog(`Final Score: ${score}`);

    return {
        score,
        difficulty,
        signals: {
            s_axis,
            l_axis,
            ap_axis
        },
        details,
        logs
    };
}
