"""
Browser module - Rule-based signal collection only.
Uses Playwright to load URLs and extract observable facts.
"""

from playwright.sync_api import sync_playwright
from typing import Dict, List, Any, Tuple
import time

# MVP-5.1: Timing constants for bounded observation windows
INITIAL_WINDOW_MS = 2000  # 2s after networkidle for initial API capture
SCROLL_WINDOW_MS = 1500    # 1.5s after each scroll for scroll-triggered APIs


def matches_noise_pattern(url: str) -> bool:
    """
    Check if URL matches known analytics/tracking noise patterns.
    
    MVP-5.1: Filter out non-data requests to stabilize api_count.
    Returns True if URL should be excluded from API endpoint counting.
    """
    noise_keywords = [
        'analytics', 'tracking', 'telemetry', 'beacon',
        'google-analytics.com', 'doubleclick.net', 'mixpanel.com',
        'facebook.com/tr', 'clarity.ms', 'hotjar.com',
        'googletagmanager.com', 'segment.io', 'amplitude.com'
    ]
    noise_paths = ['/log/', '/track/', '/event/', '/pixel/', '/imp/', '/stats/']
    
    url_lower = url.lower()
    return any(keyword in url_lower for keyword in noise_keywords) or \
           any(path in url_lower for path in noise_paths)


def load_url(url: str) -> Dict[str, Any]:
    """
    Load a URL using Playwright and extract observable signals.
    
    Single-pass load only. No multi-pass reload, no hydration analysis, no diffing.
    Only observable facts are collected.
    
    MVP-3 ENHANCEMENTS:
    - Captures initial DOM text length (before scrolling)
    - Performs deterministic scroll actions (50%, 100% with 1s waits)
    - Tracks API requests triggered after scroll
    
    MVP-5.1 ENHANCEMENTS:
    - Filters noise (analytics/tracking) from API detection
    - Uses bounded capture windows for deterministic observation
    - Tracks resource_type (xhr/fetch) for filtered counting
    - Returns (url, method) tuples for de-duplication in signals.py
    
    L-STREAM ENHANCEMENTS:
    - Captures WebSocket opened events with deterministic ordering
    - Tracks WebSocket URLs (unique, first-seen, bounded to 20)
    - Enables SSE and WebSocket streaming detection
    
    Args:
        url: The URL to load
        
    Returns:
        Dictionary containing:
        - url: The loaded URL
        - html: Page HTML content
        - network: List of network requests [{url, method, status}, ...]
        - shadow_count: Number of shadow roots detected
        - iframe_count: Number of iframes (frames - 1)
        - semantic_tags_present: Whether semantic tags exist (h1/article/section/p)
        - api_endpoints: List of API endpoint URLs
        - status_codes: List of HTTP status codes
        - initial_dom_text_length: int (NEW - MVP-3) - Initial DOM text length before scroll
        - api_endpoints_after_scroll: List[str] (NEW - MVP-3) - API endpoints triggered after scroll
        - websocket_opened_count: int (NEW - L-STREAM) - Count of WebSocket connections
        - websocket_urls: List[str] (NEW - L-STREAM) - Unique WebSocket URLs (bounded to 20)
        - websocket_events: List[Dict] (NEW - L-STREAM) - WebSocket events with ws_capture_index
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page = context.new_page()
        
        # Track network requests
        network_log = []
        api_endpoints = []  # MVP-5.1: List of (url, method) tuples for de-duplication
        status_codes = []
        
        # FIX 1: Session-scoped capture index (resets to 0 per run, no module-global leakage)
        capture_index = 0
        
        # L-STREAM: Track WebSocket events (session-scoped, deterministic)
        websocket_urls = []  # Unique URLs in first-seen order, bounded to 20
        websocket_events = []  # Full event metadata with ws_capture_index
        ws_capture_index = 0  # Monotonic counter for deterministic ordering
        
        def handle_response(response):
            """Capture network responses."""
            nonlocal capture_index  # FIX 1: Access session-scoped counter
            
            try:
                request = response.request
                
                # FIX 2: Always append xhr/fetch events regardless of status
                # Only capture xhr/fetch to reduce noise, but capture ALL statuses
                if request.resource_type not in ["xhr", "fetch"]:
                    return  # Skip non-xhr/fetch resources
                
                status = response.status
                content_type = response.headers.get("content-type", "")
                
                # FIX 1: Increment capture_index for every xhr/fetch response in capture order
                current_capture_index = capture_index
                capture_index += 1
                
                # Capture timestamp (kept for compatibility, but NOT used for tie-breaking)
                ts_ms = int(time.time() * 1000)
                
                # Capture response body size and byte-bounded preview
                # DETERMINISM: Use body()[:N] then decode with fallback, NOT .text() char slicing
                response_preview = ""
                body_size = -1
                try:
                    body_bytes = response.body()
                    body_size = len(body_bytes)
                    
                    # Byte-bounded preview capture (exactly 4096 bytes)
                    # FIX 2: Status does NOT prevent event recording, only affects preview capture
                    if "text" in content_type or "json" in content_type or "xml" in content_type:
                        preview_bytes = body_bytes[:4096]
                        # Safe decode: UTF-8 with latin-1 fallback for determinism
                        try:
                            response_preview = preview_bytes.decode('utf-8')
                        except UnicodeDecodeError:
                            response_preview = preview_bytes.decode('latin-1')
                except Exception:
                    body_size = -1
                    response_preview = ""
                
                # Network entry contract (required for signals.py)
                # MVP-5.1: Added resource_type for filtered API detection
                # MVP-6: Added response_headers, response_preview, request_headers for AP detection
                # DETERMINISM: Normalize header keys to lowercase for case-insensitive matching
                # FIX 1: Added capture_index field
                network_entry = {
                    "url": response.url,
                    "method": request.method,
                    "status": status,
                    "body_size": body_size,
                    "content_type": content_type,
                    "resource_type": request.resource_type,
                    "response_headers": {k.lower(): v for k, v in response.headers.items()},  # Lowercase keys
                    "response_preview": response_preview,  # Byte-bounded from body()
                    "request_headers": {k.lower(): v for k, v in request.headers.items()},  # Lowercase keys
                    "ts_ms": ts_ms,  # Timestamp (kept for compatibility, NOT used for tie-breaking)
                    "capture_index": current_capture_index  # FIX 1: Session-scoped monotonic counter
                }
                
                # FIX 2: Always append xhr/fetch events to network_log regardless of status
                network_log.append(network_entry)
                status_codes.append(status)
                
                # MVP-5.1: Detect API endpoints - FILTERED for stability
                # Only count XHR/Fetch data APIs, exclude analytics/tracking noise
                is_data_api = (
                    request.resource_type in ["xhr", "fetch"] and
                    "application/json" in content_type.lower() and
                    status == 200 and
                    body_size >= 50 and
                    not matches_noise_pattern(response.url)
                )
                
                if is_data_api:
                    # Store (url, method) tuple for de-duplication in signals.py
                    api_endpoints.append((response.url, request.method))
            except Exception:
                pass
        
        page.on("response", handle_response)
        
        # L-STREAM: Capture WebSocket opened events
        def handle_websocket(ws):
            """Capture WebSocket connection events."""
            nonlocal ws_capture_index
            
            try:
                ws_url = ws.url
                
                # Store unique URLs in first-seen order (bounded to 20)
                if ws_url not in websocket_urls:
                    if len(websocket_urls) < 20:
                        websocket_urls.append(ws_url)
                
                # Store event with metadata for deterministic selection
                current_ws_index = ws_capture_index
                ws_capture_index += 1
                
                websocket_events.append({
                    "url": ws_url,
                    "ws_capture_index": current_ws_index
                })
            except Exception:
                pass  # Silently ignore WebSocket capture errors
        
        page.on("websocket", handle_websocket)
        
        # Navigate to URL (single pass only)
        try:
            page.goto(url, wait_until="networkidle", timeout=30000)
        except Exception as e:
            print(f"Warning: Navigation issue - {e}")
            # Continue anyway to extract what we can
        
        # MVP-5.1: Bounded initial capture window (wait for late requests)
        page.wait_for_timeout(INITIAL_WINDOW_MS)
        
        # Work Item 2: DOM snapshot readiness gate (deterministic, single-pass)
        # Lock-in Fix 2: Separate readiness failure from measurement errors
        dom_ready = False
        dom_ready_rule = None
        readiness_gate_timeout = False
        
        try:
            # Wait for readiness condition (fixed 1500ms max)
            page.wait_for_function(
                """() => {
                    return document.body != null && 
                           (document.readyState === 'interactive' || document.readyState === 'complete');
                }""",
                timeout=1500
            )
            # Then wait for exactly one requestAnimationFrame tick
            page.evaluate("() => new Promise(resolve => requestAnimationFrame(resolve))")
            dom_ready = True
            dom_ready_rule = "READY_STATE_AND_BODY"
        except Exception:
            # Timeout or condition not met (legitimate for slow pages)
            # Lock-in Fix 2: This is NOT a measurement error
            dom_ready = False
            readiness_gate_timeout = True
        
        # Lock-in Fix 3: First-failure policy for measurement errors
        measurement_error = False
        measurement_error_kind = None
        measurement_error_stage = None
        
        # MVP-3: Capture initial DOM text length
        # Lock-in Fix 3: Wrap with error handling (non-fatal)
        try:
            initial_dom_text_length = page.evaluate("() => document.body ? document.body.innerText.length : 0")
        except Exception as e:
            initial_dom_text_length = 0
            if not measurement_error:
                measurement_error = True
                measurement_error_kind = type(e).__name__
                measurement_error_stage = "INITIAL_DOM_METRICS"
        
        # MVP-6: Capture DOM metrics for virtualization detection
        try:
            dom_count_initial = page.evaluate("() => document.querySelectorAll('*').length")
        except Exception as e:
            dom_count_initial = 0
            if not measurement_error:
                measurement_error = True
                measurement_error_kind = type(e).__name__
                measurement_error_stage = "INITIAL_DOM_METRICS"
        
        # MVP-6: Capture sample class names for obfuscation signal
        try:
            sample_classes_initial = page.evaluate("""
                () => {
                    const contentNodes = Array.from(document.querySelectorAll('article, section, div[class*="content"], div[class*="item"], li'));
                    return contentNodes.slice(0, 20).map(node => node.className).filter(c => c);
                }
            """)
        except Exception as e:
            sample_classes_initial = []
            if not measurement_error:
                measurement_error = True
                measurement_error_kind = type(e).__name__
                measurement_error_stage = "INITIAL_DOM_METRICS"
        
        # MVP-3/5.1: Capture initial API endpoints (before scrolling)
        api_endpoints_initial = list(api_endpoints)
        
        # MVP-3/5.1: Perform deterministic scroll actions with bounded windows
        try:
            # Scroll to 50% of page height
            page.evaluate("window.scrollTo(0, document.body.scrollHeight * 0.5)")
            page.wait_for_timeout(SCROLL_WINDOW_MS)  # MVP-5.1: Bounded window
            
            # Scroll to 100% of page height
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(SCROLL_WINDOW_MS)  # MVP-5.1: Bounded window
        except Exception as e:
            print(f"Warning: Scroll action issue - {e}")
        
        # MVP-3/5.1: Calculate API endpoints triggered after scroll (delta only)
        api_endpoints_after_scroll = [ep for ep in api_endpoints if ep not in api_endpoints_initial]
        
        # MVP-6: Capture DOM metrics after scroll for virtualization detection
        try:
            dom_count_after_scroll = page.evaluate("() => document.querySelectorAll('*').length")
        except Exception as e:
            dom_count_after_scroll = 0
            if not measurement_error:
                measurement_error = True
                measurement_error_kind = type(e).__name__
                measurement_error_stage = "SCROLL_DOM_METRICS"
        
        # MVP-6: Capture class names after scroll for stability comparison
        try:
            sample_classes_after_scroll = page.evaluate("""
                () => {
                    const contentNodes = Array.from(document.querySelectorAll('article, section, div[class*="content"], div[class*="item"], li'));
                    return contentNodes.slice(0, 20).map(node => node.className).filter(c => c);
                }
            """)
        except Exception as e:
            sample_classes_after_scroll = []
            if not measurement_error:
                measurement_error = True
                measurement_error_kind = type(e).__name__
                measurement_error_stage = "SCROLL_DOM_METRICS"
        
        # MVP-9: Capture main_text_len (deterministic, whitespace-normalized)
        # Capture after scroll actions when DOM is stable
        # Lock-in Fix 3: Wrap with error handling (non-fatal)
        try:
            # HARDENING: Explicit String() wrapper to guarantee concrete string return
            main_text_raw = page.evaluate("() => String(document.body.innerText || '')")
        except Exception as e:
            main_text_raw = ""
            if not measurement_error:
                measurement_error = True
                measurement_error_kind = type(e).__name__
                measurement_error_stage = "MAIN_TEXT"
        
        # SAFE FALLBACK: Record type anomaly instead of crashing
        # If page.evaluate() returns non-string, use safe fallback for crawlability pipeline
        if not isinstance(main_text_raw, str):
            main_text_raw = ""  # Safe fallback
            main_text_type_error = True
            main_text_type_error_kind = "NON_STRING"  # Deterministic fixed value
        else:
            main_text_type_error = False
            main_text_type_error_kind = None
        
        # Collapse whitespace deterministically
        import re
        main_text_normalized = re.sub(r"\s+", " ", main_text_raw).strip()
        main_text_len = len(main_text_normalized)
        
        # Extract HTML content
        html = page.content()
        
        # MVP-9: Enhanced shadow root detection with text extraction
        # Lock-in Fix 3: Wrap with error handling (non-fatal)
        # Lock-in Fix 4: Add JS guards to prevent runtime throws
        try:
            shadow_metrics = page.evaluate("""
                () => {
                    let shadowRootHostCount = 0;
                    let shadowTextLen = 0;
                    const MAX_TEXT_PER_HOST = 10000;  // Cap per host to avoid runaway
                    
                    const walk = (node) => {
                        // Lock-in Fix 4: Guard against null/undefined
                        if (!node) return;
                        
                        if (node.shadowRoot) {
                            shadowRootHostCount++;
                            
                            // Extract text from accessible (open) shadow roots
                            try {
                                const shadowText = node.shadowRoot.innerText || node.shadowRoot.textContent || '';
                                // Cap individual shadow text to prevent runaway
                                const cappedText = shadowText.substring(0, MAX_TEXT_PER_HOST);
                                shadowTextLen += cappedText.length;
                            } catch (e) {
                                // Shadow root is closed/inaccessible, skip text extraction
                            }
                            
                            walk(node.shadowRoot);
                        }
                        // Lock-in Fix 4: Guard against missing children property
                        const children = node.children || [];
                        for (let child of children) {
                            walk(child);
                        }
                    };
                    
                    // Lock-in Fix 4: Guard against missing document.body
                    if (document.body) {
                        walk(document.body);
                    }
                    return {shadowRootHostCount, shadowTextLen};
                }
            """)
        except Exception as e:
            shadow_metrics = {"shadowRootHostCount": 0, "shadowTextLen": 0}
            if not measurement_error:
                measurement_error = True
                measurement_error_kind = type(e).__name__
                measurement_error_stage = "SHADOW_METRICS"
        
        shadow_root_host_count = shadow_metrics["shadowRootHostCount"]
        shadow_text_len = shadow_metrics["shadowTextLen"]
        shadow_count = shadow_root_host_count  # Backward compatibility
        
        # MVP-9: Enhanced iframe detection with cross-origin and area ratio metrics
        # Lock-in Fix 3: Wrap with error handling (non-fatal)
        # Lock-in Fix 4: Add JS guards to prevent runtime throws
        try:
            iframe_metrics = page.evaluate("""
                () => {
                    const pageUrl = window.location.href;
                    const pageOrigin = window.location.origin;
                    const iframes = Array.from(document.querySelectorAll('iframe'));
                    
                    let crossOriginCount = 0;
                    let largestRatio = 0;
                    let largestSrc = null;
                    
                    const viewportW = window.innerWidth;
                    const viewportH = window.innerHeight;
                    const viewportArea = viewportW * viewportH;
                    
                    // HARDENING: Quantize ratio to avoid floating-point equality instability
                    const quantizeRatio = (ratio) => {
                        // Round to 6 decimal places for deterministic comparison
                        return Math.round(ratio * 1000000) / 1000000;
                    };
                    
                    // Collect iframe candidates with same largest ratio for tie-breaking
                    let candidatesAtMaxRatio = [];
                    
                    iframes.forEach(iframe => {
                        const src = iframe.src || '';
                        
                        // Cross-origin check: non-empty, not about:blank, different origin
                        if (src && src !== 'about:blank' && src !== '') {
                            try {
                                const iframeUrl = new URL(src, pageUrl);
                                if (iframeUrl.origin !== pageOrigin) {
                                    crossOriginCount++;
                                }
                            } catch (e) {
                                // Invalid URL, skip
                            }
                        }
                        
                        // Area ratio calculation
                        // Lock-in Fix 4: Guard against undefined/null rect and invalid dimensions
                        const rect = iframe.getBoundingClientRect();
                        if (!rect) {
                            return; // Skip this iframe
                        }
                        
                        // Lock-in Fix 4: Ensure width and height are finite numbers
                        const width = (typeof rect.width === 'number' && isFinite(rect.width)) ? rect.width : 0;
                        const height = (typeof rect.height === 'number' && isFinite(rect.height)) ? rect.height : 0;
                        
                        // Lock-in Fix 4: Clamp negative values to 0
                        const safeWidth = Math.max(0, width);
                        const safeHeight = Math.max(0, height);
                        
                        const iframeArea = safeWidth * safeHeight;
                        let ratio = 0;
                        
                        if (viewportArea > 0 && iframeArea >= 0) {
                            ratio = iframeArea / viewportArea;
                        }
                        
                        // HARDENING: Use quantized ratio for comparison
                        const quantizedRatio = quantizeRatio(ratio);
                        const quantizedLargest = quantizeRatio(largestRatio);
                        
                        // Track largest ratio with tie-breaking
                        if (quantizedRatio > quantizedLargest) {
                            largestRatio = ratio;  // Store original ratio
                            candidatesAtMaxRatio = [{src, ratio}];
                        } else if (quantizedRatio === quantizedLargest && quantizedRatio > 0) {
                            candidatesAtMaxRatio.push({src, ratio});
                        }
                    });
                    
                    // Deterministic tie-breaking: lexicographically smallest src
                    if (candidatesAtMaxRatio.length > 0) {
                        candidatesAtMaxRatio.sort((a, b) => a.src.localeCompare(b.src));
                        largestSrc = candidatesAtMaxRatio[0].src;
                    }
                    
                    return {
                        iframeCount: iframes.length,
                        crossOriginIframeCount: crossOriginCount,
                        largestIframeAreaRatio: largestRatio,
                        largestIframeSrc: largestSrc
                    };
                }
            """)
        except Exception as e:
            iframe_metrics = {
                "iframeCount": 0,
                "crossOriginIframeCount": 0,
                "largestIframeAreaRatio": 0.0,
                "largestIframeSrc": None
            }
            if not measurement_error:
                measurement_error = True
                measurement_error_kind = type(e).__name__
                measurement_error_stage = "IFRAME_METRICS"
        
        iframe_count = iframe_metrics["iframeCount"]
        cross_origin_iframe_count = iframe_metrics["crossOriginIframeCount"]
        largest_iframe_area_ratio = iframe_metrics["largestIframeAreaRatio"]
        largest_iframe_src = iframe_metrics["largestIframeSrc"]

        
        # Detect semantic tags (h1, article, section, p)
        semantic_tags = ["h1", "article", "section", "p"]
        semantic_tags_present = any(
            page.locator(tag).count() > 0 for tag in semantic_tags
        )
        
        browser.close()
        
        return {
            "url": url,
            "html": html,
            "network": network_log,
            "shadow_count": shadow_count,  # DEPRECATED: Use shadow_root_host_count
            "iframe_count": iframe_count,
            "semantic_tags_present": semantic_tags_present,
            "api_endpoints": api_endpoints,
            "status_codes": status_codes,
            # MVP-3 additions
            "initial_dom_text_length": initial_dom_text_length,
            "api_endpoints_after_scroll": api_endpoints_after_scroll,
            # MVP-6 additions
            "dom_count_initial": dom_count_initial,
            "dom_count_after_scroll": dom_count_after_scroll,
            "sample_classes_initial": sample_classes_initial,
            "sample_classes_after_scroll": sample_classes_after_scroll,
            # L-STREAM additions
            "websocket_opened_count": len(websocket_events),
            "websocket_urls": websocket_urls,
            "websocket_events": websocket_events,
            # MVP-9 additions (S-SHADOW-IFRAME)
            "main_text_len": main_text_len,
            "main_text_type_error": main_text_type_error,  # NEW: Type anomaly signal
            "main_text_type_error_kind": main_text_type_error_kind,  # NEW: Error kind (NON_STRING or None)
            "shadow_root_host_count": shadow_root_host_count,
            "shadow_text_len": shadow_text_len,
            "cross_origin_iframe_count": cross_origin_iframe_count,
            "largest_iframe_area_ratio": largest_iframe_area_ratio,
            "largest_iframe_src": largest_iframe_src,
            # Work Item 2: DOM readiness gate signals (additive)
            "dom_ready": dom_ready,
            "dom_ready_rule": dom_ready_rule,
            "readiness_gate_timeout": readiness_gate_timeout,  # Lock-in Fix 2
            # Work Item 3: Measurement error signals (additive, first-failure policy)
            "measurement_error": measurement_error,
            "measurement_error_kind": measurement_error_kind,
            "measurement_error_stage": measurement_error_stage
        }
