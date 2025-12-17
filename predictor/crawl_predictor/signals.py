"""
Signal processing - Deterministic boolean/count signals only.
No heuristics, no fuzzy logic. Only rules that ALWAYS hold.
"""

from typing import Dict, List, Any
from urllib.parse import urlparse

# MVP-3 Constants for boundary clarification
TEXT_THRESHOLD = 750  # chars - SSR pages typically have more initial text than CSR


def _get_deterministic_sort_key(candidate: Dict[str, Any]) -> tuple:
    """
    FIX 3: Extract deterministic sort key from candidate event.
    
    Sort by (capture_index, method, host, path) for stable, reproducible ordering.
    Removes dependence on wall-clock time (ts_ms).
    
    Args:
        candidate: Event dict with url, method (optional), capture_index (optional)
        
    Returns:
        Tuple (capture_index, method_normalized, host, path) for sorting
    """
    url = candidate.get("url", "")
    method = candidate.get("method", "GET").upper()  # Normalize to uppercase
    capture_index = candidate.get("capture_index", 0)  # Default to 0 if missing
    
    # Parse URL to extract host and path
    try:
        parsed = urlparse(url)
        host = parsed.hostname or ""
        path = parsed.path or "/"
    except Exception:
        host = ""
        path = ""
    
    return (capture_index, method, host, path)


def _normalize_evidence(evidence: Dict[str, Any]) -> Dict[str, Any]:
    """
    MVP-10 Lock Rule 2: Normalize evidence to stable shape.
    
    Ensures all evidence objects have the exact same field set with null defaults.
    Prevents schema drift and partial adoption of evidence fields.
    
    Required fields (always present):
    - rule_id: str (required, identifies the rule that triggered)
    - where: str ("html" | "network", required)
    - url: str | None (None for HTML-based evidence)
    - status: int | None (HTTP status code, None if N/A)
    - header_name str | None (Header name for header-based evidence, None otherwise)
    - header_value: str | None (Header value, None if N/A)
    - snippet: str | None (Text snippet, None if N/A)
    
    Args:
        evidence: Partial evidence dict from detector (may be missing fields)
        
    Returns:
        Normalized evidence dict with all required fields (None for missing values)
    """
    if evidence is None:
        return None
    
    # Ensure all required fields are present with null defaults
    normalized = {
        "rule_id": evidence.get("rule_id", "UNKNOWN"),
        "where": evidence.get("where", "unknown"),
        "url": evidence.get("url"),
        "status": evidence.get("status"),
        "header_name": evidence.get("header_name") or evidence.get("header"),  # Legacy compat
        "header_value": evidence.get("header_value"),
        "snippet": evidence.get("snippet")
    }
    
    # If header was provided as "name: value" string, parse it
    if normalized["header_name"] and ":" in str(normalized["header_name"]) and not normalized["header_value"]:
        parts = normalized["header_name"].split(":", 1)
        normalized["header_name"] = parts[0].strip()
        normalized["header_value"] = parts[1].strip() if len(parts) > 1 else None
    
    # Preserve any additional fields (e.g., S-SHADOW-IFRAME specific fields)
    for key, value in evidence.items():
        if key not in normalized:
            normalized[key] = value
    
    return normalized


def normalize_api_url(url: str, method: str) -> tuple:
    """
    Normalize API URL for de-duplication.
    
    MVP-5.1: Reduce variance from querystring/fragment changes.
    Group by (method, hostname, pathname) to treat same endpoint as one API.
    
    Args:
        url: Full API endpoint URL
        method: HTTP method (GET, POST, etc.)
        
    Returns:
        Tuple of (method, hostname, pathname) for de-duplication key
    """
    parsed = urlparse(url)
    return (method.upper(), parsed.hostname or "", parsed.path or "/")


def detect_semantic_tags(html: str) -> bool:
    """
    Detect presence of semantic HTML tags.
    
    Rule: Check for h1, article, section, p tags in HTML.
    """
    semantic_indicators = ["<h1", "<article", "<section", "<p"]
    return any(indicator in html.lower() for indicator in semantic_indicators)


def detect_captcha(html: str) -> bool:
    """
    Detect CAPTCHA challenges - VERY EXPLICIT ONLY.
    
    STRICT RULES:
    - Must match explicit challenge messages
    - Hidden recaptcha scripts DO NOT count
    
    Keyword patterns:
    - "verify you are not a robot"
    - "select all images"
    - "unusual traffic"
    - "automated queries"
    - "please stand by"
    - "hcaptcha"
    - "recaptcha challenge"
    
    Args:
        html: Page HTML content
        
    Returns:
        True if explicit CAPTCHA challenge detected
    """
    html_lower = html.lower()
    
    captcha_keywords = [
        "verify you are not a robot",
        "select all images",
        "unusual traffic",
        "automated queries",
        "please stand by",
        "hcaptcha",
        "recaptcha challenge"
    ]
    
    return any(keyword in html_lower for keyword in captcha_keywords)


def detect_login_required(html: str) -> bool:
    """
    Detect login walls - CONFIRMED-ONLY ASSIGNMENT.
    
    MVP-5 ENHANCEMENT: Stricter keyword matching to avoid header/footer false positives.
    
    STRICT RULES:
    - Only detect when main content has been REPLACED by login wall
    - DO NOT match: header/footer "Sign In" buttons, normal pages with login links
    
    Confirmed login wall keywords (require context indicating blockage):
    - "sign in to continue"
    - "please log in"
    - "you must log in"
    - "login required"
    - "continue with your account"
    
    IMPORTANT: These patterns imply the user cannot access content without logging in.
    Presence of a login button in the header does NOT trigger AP-LOGIN.
    
    Args:
        html: Page HTML content
        
    Returns:
        True if login wall detected with confirmed evidence
    """
    html_lower = html.lower()
    
    # RULE: Check for explicit login wall phrases (confirmed blocking)
    # Trigger: Main content replaced by login requirement message
    login_wall_keywords = [
        "sign in to continue",
        "please log in",
        "you must log in",
        "login required",
        "continue with your account"
    ]
    
    if any(keyword in html_lower for keyword in login_wall_keywords):
        # AP-LOGIN triggered: Confirmed login wall detected in HTML
        return True
    
    # No confirmed login wall detected
    return False


def detect_bot_score_block(html: str, network: List[Dict]) -> bool:
    """
    Detect soft bot blocking - SINGLE-SESSION EVIDENCE ONLY.
    
    MVP-5 ENHANCEMENT: Stricter evidence requirements, no probabilistic inference.
    
    STRICT RULES - Assign AP-BOT-SCORE only when:
    1. Explicit soft-block messages in HTML (confirmed text on page):
       - "unusual traffic"
       - "automated queries"
       - "bot detection"
       - "too many requests"
       - "access denied"
       - "verify your request"
    
    OR
    
    2. Empty API response patterns visible in HTML (embedded JSON data):
       - '"items":[]'
       - '"results":[]'
       - '"data":[]'
    
    IMPORTANT: Each trigger must be browser-observable in this single session.
    Do NOT infer bot-blocking based on:
    - Response headers alone
    - Absence of data (unless explicit empty array patterns)
    - Likelihood or scale assumptions
    
    Args:
        html: Page HTML content
        network: Network request log (currently unused for stricter single-session evidence)
        
    Returns:
        True if bot blocking detected with confirmed evidence
    """
    html_lower = html.lower()
    
    # RULE 1: Check for explicit soft-block messages in page HTML
    # Trigger: User-visible blocking message on the page
    bot_block_keywords = [
        "unusual traffic",
        "automated queries",
        "bot detection",
        "too many requests",
        "access denied",
        "verify your request"
    ]
    
    if any(keyword in html_lower for keyword in bot_block_keywords):
        # AP-BOT-SCORE triggered: Explicit blocking message detected in HTML
        return True
    
    # RULE 2: Check for empty API response patterns embedded in HTML
    # Trigger: Confirmed empty data structures visible in page source (e.g., '__NEXT_DATA__' with empty arrays)
    empty_result_patterns = [
        '"items":[]',
        '"results":[]',
        '"data":[]'
    ]
    
    if any(pattern in html for pattern in empty_result_patterns):
        # AP-BOT-SCORE triggered: Empty API response pattern found in HTML
        return True
    
    # No confirmed single-session evidence of bot blocking
    return False


def detect_session_required(html: str, network: List[Dict], signals: Dict[str, Any]) -> bool:
    """
    Detect session-based access restriction.
    
    MVP-6: STRICT false-positive prevention with ALL conditions required.
    
    Triggers ONLY when ALL conditions met:
    - Page HTML loads successfully (initial_text_length >= TEXT_THRESHOLD)
    - api_count >= 2 (multiple API requests made)
    - API requests return HTTP 200 (not 401/403)
    - API responses contain empty/restricted data patterns
    - No CAPTCHA detected
    - No login wall detected
    
    Args:
        html: Page HTML content
        network: Network request log
        signals: Already computed signals (for initial_text_length, api_count, captcha, login)
        
    Returns:
        True if session requirement detected with confirmed evidence
    """
    # Strict conditions to prevent false positives
    initial_text_length = signals.get("initial_text_length", 0)
    api_count = signals.get("api_count", 0)
    captcha = signals.get("captcha", False)
    login_required = signals.get("login_required", False)
    
    # All conditions must be true
    if initial_text_length < TEXT_THRESHOLD:
        return False  # HTML shell, not meaningful content
    
    if api_count < 2:
        return False  # Not enough API activity
    
    if captcha or login_required:
        return False  # Other access protections detected
    
    # Check for successful API responses with empty data
    has_empty_api = False
    for entry in network:
        if (entry.get("resource_type") in ["xhr", "fetch"] and
            entry.get("status") == 200 and
            "json" in entry.get("content_type", "").lower()):
            
            preview = entry.get("response_preview", "")
            # Check for empty data patterns
            if ('"items":[]' in preview or 
                '"results":[]' in preview or 
                '"data":[]' in preview or
                '"content":[]' in preview):
                has_empty_api = True
                break
    
    return has_empty_api


def detect_header_signature_required(network: List[Dict]) -> bool:
    """
    Detect header signature requirement.
    
    MVP-6: Confirmed-only, explicit error messages required.
    
    Triggers ONLY when:
    - API requests fail with 401/403
    - Response explicitly mentions missing/invalid signature/nonce/timestamp/hmac
    
    Args:
        network: Network request log
        
    Returns:
        True if signature requirement detected with confirmed evidence
    """
    signature_keywords = [
        'signature', 'sign', 'nonce', 'timestamp',
        'x-signature', 'x-sign', 'hmac', 'hash'
    ]
    
    error_phrases = [
        'missing signature', 'invalid signature',
        'signature required', 'signature mismatch',
        'missing nonce', 'invalid nonce',
        'missing timestamp', 'invalid timestamp',
        'missing hmac', 'invalid hmac'
    ]
    
    for entry in network:
        if (entry.get("resource_type") in ["xhr", "fetch"] and
            entry.get("status") in [401, 403]):
            
            preview = entry.get("response_preview", "").lower()
            headers = entry.get("response_headers", {})
            
            # Check response body for explicit error messages
            if any(phrase in preview for phrase in error_phrases):
                return True
            
            # Check response headers for signature-related errors
            auth_header = headers.get("www-authenticate", "").lower()
            if any(keyword in auth_header for keyword in signature_keywords):
                return True
    
    return False


def detect_api_key_required(network: List[Dict]) -> bool:
    """
    Detect API key requirement.
    
    MVP-6: Confirmed-only, explicit error messages required.
    
    Triggers ONLY when:
    - API requests fail with 401/403
    - Response explicitly mentions missing/invalid API key
    
    Args:
        network: Network request log
        
    Returns:
        True if API key requirement detected with confirmed evidence
    """
    for entry in network:
        if (entry.get("resource_type") in ["xhr", "fetch"] and
            entry.get("status") in [401, 403]):
            
            preview = entry.get("response_preview", "").lower()
            
            # Require explicit API key mention in error message
            if ('api' in preview and 'key' in preview):
                # More specific check: "api key" or "apikey" must appear
                if 'api key' in preview or 'apikey' in preview or 'api_key' in preview:
                    return True
    
    return False


def detect_rate_limit(events: List[Dict]) -> tuple:
    """
    Detect rate limiting - CONFIRMED-ONLY, single-session evidence.
    
    STRICT RULES (deterministic priority):
    1. HTTP 429 status (priority 1)
    2. Retry-After header present (priority 2)
    3. X-RateLimit-Remaining == "0" (priority 3)
    4. Response body contains rate limit keywords (priority 4)
    
    DETERMINISM: If multiple events match, use hard-coded priority rules.
    Within same priority, sort by (ts_ms, url) and pick first.
    
    Args:
        events: Network request log (list of dicts)
        
    Returns:
        Tuple of (bool, evidence_dict or None)
        evidence_dict format:
        {
            "rule_id": str,  # Which rule fired
            "where": "network",
            "url": str,
            "status": int,
            "header": str | None,
            "snippet": str | None
        }
    """
    # Collect candidates by priority
    candidates_p1 = []  # HTTP 429
    candidates_p2 = []  # Retry-After header
    candidates_p3 = []  # X-RateLimit-Remaining == "0"
    candidates_p4 = []  # Body text match
    
    for entry in events:
        if entry.get("resource_type") not in ["xhr", "fetch"]:
            continue
        
        url = entry.get("url", "")
        status = entry.get("status", 0)
        headers = entry.get("response_headers", {})  # Already lowercase from browser.py
        preview = entry.get("response_preview", "")
        ts_ms = entry.get("ts_ms", 0)
        
        # Priority 1: HTTP 429 status
        if status == 429:
            candidates_p1.append({
                "rule_id": "RATE_429",
                "where": "network",
                "url": url,
                "status": status,
                "header": None,
                "snippet": None,
                "capture_index": entry.get("capture_index", 0),  # FIX 3: Add for sorting
                "method": entry.get("method", "GET")  # FIX 3: Add for sorting
            })
        
        # Priority 2: Retry-After header (lowercase key)
        if "retry-after" in headers:
            candidates_p2.append({
                "rule_id": "RATE_RETRY_AFTER",
                "where": "network",
                "url": url,
                "status": status,
                "header": f"retry-after: {headers['retry-after']}",
                "snippet": None,
                "capture_index": entry.get("capture_index", 0),  # FIX 3: Add for sorting
                "method": entry.get("method", "GET")  # FIX 3: Add for sorting
            })
        
        # Priority 3: X-RateLimit-Remaining == "0" (lowercase key)
        if "x-ratelimit-remaining" in headers and headers["x-ratelimit-remaining"] == "0":
            candidates_p3.append({
                "rule_id": "RATE_LIMIT_HEADER",
                "where": "network",
                "url": url,
                "status": status,
                "header": f"x-ratelimit-remaining: 0",
                "snippet": None,
                "capture_index": entry.get("capture_index", 0),  # FIX 3: Add for sorting
                "method": entry.get("method", "GET")  # FIX 3: Add for sorting
            })
        
        # Priority 4: Body text match (case-insensitive)
        preview_lower = preview.lower()
        rate_keywords = ["rate limit", "too many requests", "throttl"]
        for keyword in rate_keywords:
            if keyword in preview_lower:
                # Extract snippet (max 100 chars around match)
                idx = preview_lower.index(keyword)
                start = max(0, idx - 30)
                end = min(len(preview), idx + 70)
                snippet = preview[start:end].strip()
                
                candidates_p4.append({
                    "rule_id": "RATE_TEXT",
                    "where": "network",
                    "url": url,
                    "status": status,
                    "header": None,
                    "snippet": snippet,
                    "ts_ms": ts_ms, # Keep for internal sorting if needed, but not for final output
                    "capture_index": entry.get("capture_index", 0),  # FIX 3: Add for sorting
                    "method": entry.get("method", "GET")  # FIX 3: Add for sorting
                })
                break  # Only one snippet per entry
    
    # FIX 3: Deterministic selection using strengthened tie-break keys
    # Sort by (capture_index, method, host, path) NOT (ts_ms, url)
    for candidates in [candidates_p1, candidates_p2, candidates_p3, candidates_p4]:
        if candidates:
            # FIX 3: Sort using deterministic key function
            candidates.sort(key=_get_deterministic_sort_key)
            evidence = candidates[0].copy()
            # Remove internal fields from output
            for field in ["ts_ms", "capture_index", "method"]:
                evidence.pop(field, None)
            
            # MVP-10 Lock Rule 2: Normalize evidence shape
            # Convert legacy 'header' field to 'header_name' if needed
            if "header" in evidence and "header_name" not in evidence:
                evidence["header_name"] = evidence.pop("header")
                evidence["header_value"] = None  # Will be parsed in normalization
            
            return (True, _normalize_evidence(evidence))
    
    # No rate limiting detected
    return (False, None)


def detect_geo_block(html_text: str, events: List[Dict]) -> tuple:
    """
    Detect geographic blocking - CONFIRMED-ONLY, single-session evidence.
    
    STRICT RULES:
    - Check for explicit geo-blocking phrases in HTML or network responses
    - "service is not available" ONLY triggers if geo-context terms present
    - DO NOT infer from HTTP 403 alone
    
    DETERMINISM: HTML matches have priority over network matches.
    Within same priority, sort by (ts_ms, url) for network, or use first HTML match.
    
    Args:
        html_text: Page HTML content
        events: Network request log
        
    Returns:
        Tuple of (bool, evidence_dict or None)
        evidence_dict format:
        {
            "rule_id": str,
            "where": "html" | "network",
            "url": str | None,
            "snippet": str
        }
    """
    html_lower = html_text.lower()
    
    # Priority 1: Check HTML for geo-blocking phrases
    geo_phrases = [
        "not available in your region",
        "not available in your country",
        "access denied from your location"
    ]
    
    for phrase in geo_phrases:
        if phrase in html_lower:
            # Extract snippet (max 100 chars around match)
            idx = html_lower.index(phrase)
            start = max(0, idx - 20)
            end = min(len(html_text), idx + 80)
            snippet = html_text[start:end].strip()
            
            evidence = {
                "rule_id": "GEO_HTML_REGION" if "region" in phrase else "GEO_HTML_LOCATION",
                "where": "html",
                "url": None,
                "status": None,
                "header_name": None,
                "header_value": None,
                "snippet": snippet
            }
            return (True, _normalize_evidence(evidence))
    
    # Check for generic "service is not available" WITH geo-context
    if "service is not available" in html_lower or "service not available" in html_lower:
        geo_context_terms = ["region", "country", "location"]
        if any(term in html_lower for term in geo_context_terms):
            # Find the phrase
            phrase = "service is not available" if "service is not available" in html_lower else "service not available"
            idx = html_lower.index(phrase)
            start = max(0, idx - 20)
            end = min(len(html_text), idx + 80)
            snippet = html_text[start:end].strip()
            
            evidence = {
                "rule_id": "GEO_HTML_REGION",
                "where": "html",
                "url": None,
                "status": None,
                "header_name": None,
                "header_value": None,
                "snippet": snippet
            }
            return (True, _normalize_evidence(evidence))
    
    # Priority 2: Check network responses for geo-blocking phrases
    network_candidates = []
    
    for entry in events:
        if entry.get("resource_type") not in ["xhr", "fetch"]:
            continue
        
        preview = entry.get("response_preview", "")
        preview_lower = preview.lower()
        url = entry.get("url", "")
        ts_ms = entry.get("ts_ms", 0)
        
        # Check all geo phrases
        all_geo_phrases = geo_phrases + ["service is not available", "service not available"]
        for phrase in all_geo_phrases:
            if phrase in preview_lower:
                # For generic "service not available", require geo-context
                if "service" in phrase and "not available" in phrase:
                    geo_context_terms = ["region", "country", "location"]
                    if not any(term in preview_lower for term in geo_context_terms):
                        continue  # Skip this generic phrase without context
                
                # Extract snippet
                idx = preview_lower.index(phrase)
                start = max(0, idx - 20)
                end = min(len(preview), idx + 80)
                snippet = preview[start:end].strip()
                
                network_candidates.append({
                    "rule_id": "GEO_NETWORK",
                    "where": "network",
                    "url": url,
                    "status": entry.get("status"),
                    "header_name": None,
                    "header_value": None,
                    "snippet": snippet,
                    "capture_index": entry.get("capture_index", 0),  # FIX 3: Add for sorting
                    "method": entry.get("method", "GET")  # FIX 3: Add for sorting
                })
                break  # Only one snippet per entry
    
    # FIX 3: Deterministic selection using strengthened tie-break keys
    if network_candidates:
        network_candidates.sort(key=_get_deterministic_sort_key)
        evidence = network_candidates[0].copy()
        # Remove internal fields from output
        for field in ["capture_index", "method"]:
            evidence.pop(field, None)
        return (True, _normalize_evidence(evidence))
    
    # No geo blocking detected
    return (False, None)


def detect_ua_block(html_text: str, events: List[Dict]) -> tuple:
    """
    Detect user-agent/browser blocking - CONFIRMED-ONLY, single-session evidence.
    
    STRICT RULES:
    - Check for explicit browser/client blocking phrases
    - HTML matches have priority over network matches
    
    DETERMINISM: HTML > network, then sort by (ts_ms, url) for network.
    
    Args:
        html_text: Page HTML content
        events: Network request log
        
    Returns:
        Tuple of (bool, evidence_dict or None)
        evidence_dict format:
        {
            "rule_id": str,
            "where": "html" | "network",
            "url": str | None,
            "snippet": str
        }
    """
    html_lower = html_text.lower()
    
    # Priority 1: Check HTML for UA blocking phrases
    ua_phrases = [
        "unsupported browser",
        "browser not supported",
        "update your browser",
        "unsupported client"
    ]
    
    for phrase in ua_phrases:
        if phrase in html_lower:
            # Extract snippet (max 100 chars around match)
            idx = html_lower.index(phrase)
            start = max(0, idx - 20)
            end = min(len(html_text), idx + 80)
            snippet = html_text[start:end].strip()
            
            # Determine rule_id based on phrase
            if "unsupported browser" in phrase:
                rule_id = "UA_BROWSER_UNSUPPORTED"
            elif "unsupported client" in phrase:
                rule_id = "UA_CLIENT_UNSUPPORTED"
            else:
                rule_id = "UA_UPDATE_REQUIRED"
            
            evidence = {
                "rule_id": rule_id,
                "where": "html",
                "url": None,
                "status": None,
                "header_name": None,
                "header_value": None,
                "snippet": snippet
            }
            return (True, _normalize_evidence(evidence))
    
    # Priority 2: Check network responses for UA blocking phrases
    network_candidates = []
    
    for entry in events:
        if entry.get("resource_type") not in ["xhr", "fetch"]:
            continue
        
        preview = entry.get("response_preview", "")
        preview_lower = preview.lower()
        url = entry.get("url", "")
        ts_ms = entry.get("ts_ms", 0)
        
        # Check all UA phrases
        for phrase in ua_phrases:
            if phrase in preview_lower:
                # Extract snippet
                idx = preview_lower.index(phrase)
                start = max(0, idx - 20)
                end = min(len(preview), idx + 80)
                snippet = preview[start:end].strip()
                
                # Determine rule_id
                if "unsupported browser" in phrase:
                    rule_id = "UA_BROWSER_UNSUPPORTED"
                elif "unsupported client" in phrase:
                    rule_id = "UA_CLIENT_UNSUPPORTED"
                else:
                    rule_id = "UA_UPDATE_REQUIRED"
                
                network_candidates.append({
                    "rule_id": rule_id,
                    "where": "network",
                    "url": url,
                    "status": entry.get("status"),
                    "header_name": None,
                    "header_value": None,
                    "snippet": snippet,
                    "capture_index": entry.get("capture_index", 0),  # FIX 3: Add for sorting
                    "method": entry.get("method", "GET")  # FIX 3: Add for sorting
                })
                break  # Only one snippet per entry
    
    # FIX 3: Deterministic selection using strengthened tie-break keys
    if network_candidates:
        network_candidates.sort(key=_get_deterministic_sort_key)
        evidence = network_candidates[0].copy()
        # Remove internal fields from output
        for field in ["capture_index", "method"]:
            evidence.pop(field, None)
        return (True, _normalize_evidence(evidence))
    
    # No UA blocking detected
    return (False, None)


def detect_virtualized_dom(raw: Dict, signals: Dict[str, Any]) -> bool:
    """
    Detect DOM virtualization (list virtualization, windowing).
    
    MVP-6: Single-session observation of node churn behavior.
    
    Triggers when:
    - Scroll triggers APIs (api_count_after_scroll >= 2)
    - DOM node count remains bounded (-20% to +20% growth)
    - Indicates virtual scrolling (remove old nodes, add new ones)
    
    Args:
        raw: Raw browser data with DOM counts
        signals: Already computed signals (for api_count_after_scroll)
        
    Returns:
        True if virtualized DOM detected
    """
    dom_initial = raw.get("dom_count_initial", 0)
    dom_after = raw.get("dom_count_after_scroll", 0)
    api_after_scroll = signals.get("api_count_after_scroll", 0)
    
    # Check for bounded node count despite scroll + API activity
    if api_after_scroll >= 2 and dom_after > 0 and dom_initial > 0:
        dom_growth_pct = ((dom_after - dom_initial) / dom_initial * 100)
        
        # Bounded growth despite API activity suggests node replacement (virtualization)
        if -20 < dom_growth_pct < 20:
            return True
    
    return False


def detect_class_instability(raw: Dict) -> bool:
    """
    Detect CSS class instability (obfuscation signal, NOT classification).
    
    MVP-6: Signal collection only - DO NOT map to S-OBFUSCATED in this MVP.
    
    Detects patterns suggesting randomized/obfuscated class names:
    - Long alphanumeric strings (>15 chars)
    - High digit density (>30%)
    
    Args:
        raw: Raw browser data with class snapshots
        
    Returns:
        True if class instability detected (signal only)
    """
    classes_initial = raw.get("sample_classes_initial", [])
    
    if not classes_initial or len(classes_initial) < 3:
        return False
    
    # Check for randomized class patterns (long random strings)
    def is_randomized(class_str):
        # Check for long (>15 char) alphanumeric strings with high digit density
        tokens = class_str.split()
        for token in tokens:
            if len(token) > 15 and sum(c.isdigit() for c in token) > len(token) * 0.3:
                return True
        return False
    
    randomized_count = sum(1 for cls in classes_initial if is_randomized(cls))
    
    # If >50% of classes look randomized → likely obfuscated
    if randomized_count > len(classes_initial) * 0.5:
        return True
    
    return False


def detect_shadow_iframe_by_iframe(raw: Dict) -> tuple:
    """
    Detect S-SHADOW-IFRAME via cross-origin iframe confirmation.
    
    MVP-9: Rule Path A - Cross-origin iframe confirmation
    
    STRICT RULES (all conditions must be true):
    - cross_origin_iframe_count >= 1
    - main_text_len <= 200
    - largest_iframe_area_ratio >= 0.30
    
    Args:
        raw: Raw browser data with iframe metrics
        
    Returns:
        Tuple of (bool, evidence_dict or None)
        evidence_dict format:
        {
            "rule_id": "IFRAME_CORE_CONTENT",
            "cross_origin_iframe_count": int,
            "main_text_len": int,
            "largest_iframe_area_ratio": float,
            "largest_iframe_src": str | None
        }
    """
    cross_origin_iframe_count = raw.get("cross_origin_iframe_count", 0)
    main_text_len = raw.get("main_text_len", 0)
    largest_iframe_area_ratio = raw.get("largest_iframe_area_ratio", 0.0)
    largest_iframe_src = raw.get("largest_iframe_src", None)
    
    # All conditions must be true
    if (cross_origin_iframe_count >= 1 and
        main_text_len <= 200 and
        largest_iframe_area_ratio >= 0.30):
        
        evidence = {
            "rule_id": "IFRAME_CORE_CONTENT",
            "where": "html",
            "url": None,
            "status": None,
            "header_name": None,
            "header_value": None,
            "snippet": None,
            # S-SHADOW-IFRAME specific fields
            "cross_origin_iframe_count": cross_origin_iframe_count,
            "main_text_len": main_text_len,
            "largest_iframe_area_ratio": largest_iframe_area_ratio,
            "largest_iframe_src": largest_iframe_src
        }
        return (True, _normalize_evidence(evidence))
    
    return (False, None)


def detect_shadow_iframe_by_shadow(raw: Dict) -> tuple:
    """
    Detect S-SHADOW-IFRAME via shadow DOM confirmation.
    
    MVP-9: Rule Path B - Shadow DOM confirmation (open shadow only)
    
    STRICT RULES (all conditions must be true):
    - shadow_root_host_count >= 1
    - shadow_text_len >= 200 (computed only from accessible/open shadow roots)
    - main_text_len <= 200
    
    LOCKED DECISION 2: Use main_text_len <= 200 (NOT key_selectors_missing)
    
    Args:
        raw: Raw browser data with shadow metrics
        
    Returns:
        Tuple of (bool, evidence_dict or None)
        evidence_dict format:
        {
            "rule_id": "SHADOW_CORE_CONTENT",
            "shadow_root_host_count": int,
            "shadow_text_len": int,
            "main_text_len": int
        }
    """
    shadow_root_host_count = raw.get("shadow_root_host_count", 0)
    shadow_text_len = raw.get("shadow_text_len", 0)
    main_text_len = raw.get("main_text_len", 0)
    
    # All conditions must be true
    if (shadow_root_host_count >= 1 and
        shadow_text_len >= 200 and
        main_text_len <= 200):
        
        evidence = {
            "rule_id": "SHADOW_CORE_CONTENT",
            "where": "html",
            "url": None,
            "status": None,
            "header_name": None,
            "header_value": None,
            "snippet": None,
            # S-SHADOW-IFRAME specific fields
            "shadow_root_host_count": shadow_root_host_count,
            "shadow_text_len": shadow_text_len,
            "main_text_len": main_text_len
        }
        return (True, _normalize_evidence(evidence))
    
    return (False, None)


def detect_framework(html: str) -> bool:
    """
    Detect JavaScript framework keywords in HTML.
    
    STRICT RULES:
    - Simple string search only (not execution-based)
    - Keywords: "react", "next", "__NEXT_DATA__", "vue"
    - Case-insensitive
    
    Args:
        html: Page HTML content
        
    Returns:
        True if any framework keyword detected
    """
    html_lower = html.lower()
    
    framework_keywords = [
        "react",
        "next",
        "__next_data__",
        "vue"
    ]
    
    return any(keyword in html_lower for keyword in framework_keywords)


def detect_interactive_loading(html: str) -> bool:
    """
    Detect interactive loading patterns in visible HTML text.
    
    STRICT RULES:
    - Keywords for interactive pagination/infinite scroll
    - Patterns: "load more", "next page", "infinite scroll", "show more", "more results"
    - Case-insensitive
    
    Args:
        html: Page HTML content
        
    Returns:
        True if any interactive loading pattern detected
    """
    html_lower = html.lower()
    
    interactive_keywords = [
        "load more",
        "next page",
        "infinite scroll",
        "show more",
        "more results"
    ]
    
    return any(keyword in html_lower for keyword in interactive_keywords)


def detect_streaming(network_events: List[Dict], ws_events: List[Dict]) -> tuple:
    """
    Detect streaming patterns (SSE or WebSocket) - CONFIRMED-ONLY, single-session evidence.
    
    STRICT RULES (deterministic priority):
    1. SSE via content-type header (priority 1)
       - SCOPE: Only xhr/fetch resource types
       - Check for "text/event-stream" in content-type header (case-insensitive)
    2. WebSocket opened events (priority 2)
       - Check for any WebSocket connection opened
    
    DETERMINISM: SSE > WebSocket
    Within same rule, sort by (capture_index, url) for SSE or (ws_capture_index, url) for WS.
    
    Args:
        network_events: Network request log (list of dicts)
        ws_events: WebSocket event log (list of dicts with url, ws_capture_index)
        
    Returns:
        Tuple of (bool, evidence_dict or None)
        evidence_dict format:
        {
            "rule_id": str,  # "SSE_CONTENT_TYPE" or "WEBSOCKET_OPENED"
            "where": "network",
            "url": str
        }
    """
    # Priority 1: SSE detection (xhr/fetch only)
    sse_candidates = []
    
    for entry in network_events:
        # SCOPE: Only check xhr/fetch, not document/script/stylesheet/etc.
        if entry.get("resource_type") not in ["xhr", "fetch"]:
            continue
        
        # Check for text/event-stream content-type (case-insensitive)
        headers = entry.get("response_headers", {})  # Already lowercase from browser.py
        content_type = headers.get("content-type", "")
        
        if "text/event-stream" in content_type.lower():
            sse_candidates.append({
                "rule_id": "SSE_CONTENT_TYPE",
                "where": "network",
                "url": entry.get("url", ""),
                "capture_index": entry.get("capture_index", 0)
            })
    
    # Deterministic SSE selection: sort by (capture_index, url) and pick first
    if sse_candidates:
        sse_candidates.sort(key=lambda x: (x["capture_index"], x["url"]))
        evidence = {
            "rule_id": sse_candidates[0]["rule_id"],
            "where": sse_candidates[0]["where"],
            "url": sse_candidates[0]["url"],
            "status": None,
            "header_name": None,
            "header_value": None,
            "snippet": None
        }
        return (True, _normalize_evidence(evidence))
    
    # Priority 2: WebSocket detection
    ws_candidates = []
    
    for ws_event in ws_events:
        ws_candidates.append({
            "rule_id": "WEBSOCKET_OPENED",
            "where": "network",
            "url": ws_event.get("url", ""),
            "status": None,
            "header_name": None,
            "header_value": None,
            "snippet": None,
            "ws_capture_index": ws_event.get("ws_capture_index", 0)
        })
    
    # Deterministic WebSocket selection: sort by (ws_capture_index, url) and pick first
    if ws_candidates:
        ws_candidates.sort(key=lambda x: (x["ws_capture_index"], x["url"]))
        evidence = {
            "rule_id": ws_candidates[0]["rule_id"],
            "where": ws_candidates[0]["where"],
            "url": ws_candidates[0]["url"],
            "status": None,
            "header_name": None,
            "header_value": None,
            "snippet": None
        }
        return (True, _normalize_evidence(evidence))
    
    # No streaming detected
    return (False, None)


def detect_api_soft_block(network: List[Dict]) -> bool:
    """
    Detect soft-blocking via tiny/empty JSON API responses.
    
    STRICT RULES (to reduce false positives):
    - Only consider JSON API responses (content_type contains "application/json")
    - URL must contain one of: "items", "results", "feed", "search"
    - HTTP status must be 200
    - Response body_size must be < 50 bytes
    
    Args:
        network: Network request log
        
    Returns:
        True if any soft-blocked API endpoint detected
    """
    api_keywords = ["items", "results", "feed", "search"]
    
    for entry in network:
        url = entry.get("url", "")
        status = entry.get("status", 0)
        body_size = entry.get("body_size", -1)
        content_type = entry.get("content_type", "")
        
        # Check if this is a core API endpoint
        is_api_endpoint = any(keyword in url.lower() for keyword in api_keywords)
        is_json = "application/json" in content_type.lower()
        is_success = status == 200
        is_tiny = 0 <= body_size < 50
        
        # All conditions must be met
        if is_api_endpoint and is_json and is_success and is_tiny:
            return True
    
    return False


def compute_signals(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compute all signals from raw browser data.
    
    Returns only deterministic boolean/count values.
    No heuristics, no guessing.
    
    MVP-2 ENHANCEMENTS:
    - Added framework_detected for S-PROGRESSIVE classification
    - Added interactive_loading for L-INTERACTIVE classification
    - Added api_soft_block for enhanced AP-BOT-SCORE detection
    
    MVP-3 ENHANCEMENTS:
    - Added initial_text_length for CSR/SSR boundary clarification
    - Added api_count_after_scroll for STATIC/INTERACTIVE boundary clarification
    
    Args:
        raw: Raw data dictionary from browser.load_url()
        
    Returns:
        Dictionary with computed signals:
        - semantic_tags: bool (whether semantic HTML tags present)
        - api_count: int (number of API endpoints detected)
        - captcha: bool (explicit CAPTCHA challenge detected)
        - login_required: bool (login wall detected)
        - bot_score: bool (bot blocking detected)
        - shadow: int (shadow root count)
        - iframe: int (iframe count)
        - framework_detected: bool (NEW - framework keywords detected)
        - interactive_loading: bool (NEW - interactive loading patterns detected)
        - api_soft_block: bool (NEW - tiny JSON API responses detected)
        - initial_text_length: int (NEW - MVP-3 - initial DOM text length)
        - api_count_after_scroll: int (NEW - MVP-3 - API requests after scroll)
    """
    html = raw["html"]
    network = raw["network"]
    
    # MVP-5.1: De-duplicate API endpoints by normalized URL
    # API endpoints are now (url, method) tuples from browser.py
    api_endpoints_raw = raw["api_endpoints"]  # List of (url, method) tuples
    api_normalized = {}
    for url, method in api_endpoints_raw:
        key = normalize_api_url(url, method)
        if key not in api_normalized:
            api_normalized[key] = url  # Keep first occurrence for debugging
    
    api_after_scroll_raw = raw.get("api_endpoints_after_scroll", [])
    api_after_scroll_normalized = {}
    for url, method in api_after_scroll_raw:
        key = normalize_api_url(url, method)
        if key not in api_after_scroll_normalized:
            api_after_scroll_normalized[key] = url
    
    # Compute base signals first (needed for MVP-6 session detection)
    base_signals = {
        "semantic_tags": raw["semantic_tags_present"],
        "api_count": len(api_normalized),
        "captcha": detect_captcha(html),
        "login_required": detect_login_required(html),
        "bot_score": detect_bot_score_block(html, network),
        "shadow": raw["shadow_count"],
        "iframe": raw["iframe_count"],
        "framework_detected": detect_framework(html),
        "interactive_loading": detect_interactive_loading(html),
        "api_soft_block": detect_api_soft_block(network),
        "initial_text_length": raw.get("initial_dom_text_length", 0),
        "api_count_after_scroll": len(api_after_scroll_normalized)
    }
    
    # MVP-6: Add new signals (some require base_signals as input)
    # NEW: AP-RATE, AP-GEO, AP-UA signals with evidence
    rate_limited, rate_evidence = detect_rate_limit(network)
    geo_blocked, geo_evidence = detect_geo_block(html, network)
    ua_blocked, ua_evidence = detect_ua_block(html, network)
    
    # L-STREAM: Detect streaming patterns (SSE or WebSocket)
    ws_events = raw.get("websocket_events", [])
    is_streaming, streaming_evidence = detect_streaming(network, ws_events)
    
    base_signals.update({
        # AP signals (confirmed-only)
        "session_required": detect_session_required(html, network, base_signals),
        "header_signature_required": detect_header_signature_required(network),
        "api_key_required": detect_api_key_required(network),
        # NEW AP signals with evidence
        "rate_limited": rate_limited,
        "rate_limit_evidence": rate_evidence,
        "geo_blocked": geo_blocked,
        "geo_block_evidence": geo_evidence,
        "ua_blocked": ua_blocked,
        "ua_block_evidence": ua_evidence,
        # S signals
        "virtualized_dom": detect_virtualized_dom(raw, base_signals),
        "class_instability": detect_class_instability(raw),  # Signal only, not classified
        # L-STREAM signals
        "is_streaming": is_streaming,
        "streaming_evidence": streaming_evidence
    })
    
    # MVP-9: S-SHADOW-IFRAME detection with deterministic priority
    # Call both detection paths
    iframe_confirmed, iframe_evidence = detect_shadow_iframe_by_iframe(raw)
    shadow_confirmed, shadow_evidence = detect_shadow_iframe_by_shadow(raw)
    
    # LOCKED DECISION 1: When both confirm, prefer IFRAME_CORE_CONTENT
    # Always output raw observables + both booleans, but subcategory evidence follows priority
    shadow_iframe_confirmed = False
    shadow_iframe_evidence = None
    
    if iframe_confirmed and shadow_confirmed:
        # Both paths confirm - use iframe path evidence (deterministic priority)
        shadow_iframe_confirmed = True
        shadow_iframe_evidence = iframe_evidence
    elif iframe_confirmed:
        # Only iframe path confirms
        shadow_iframe_confirmed = True
        shadow_iframe_evidence = iframe_evidence
    elif shadow_confirmed:
        # Only shadow path confirms
        shadow_iframe_confirmed = True
        shadow_iframe_evidence = shadow_evidence
    
    # Add S-SHADOW-IFRAME signals to output
    base_signals.update({
        # S-SHADOW-IFRAME signals
        "shadow_iframe_confirmed": shadow_iframe_confirmed,
        "shadow_iframe_evidence": shadow_iframe_evidence,
        "shadow_iframe_by_iframe": iframe_confirmed,  # Raw boolean for both paths
        "shadow_iframe_by_shadow": shadow_confirmed,  # Raw boolean for both paths
        # Raw observables (always present)
        "main_text_len": raw.get("main_text_len", 0),
        "main_text_type_error": raw.get("main_text_type_error", False),  # NEW: Type anomaly signal
        "main_text_type_error_kind": raw.get("main_text_type_error_kind", None),  # NEW: Error kind
        "shadow_root_host_count": raw.get("shadow_root_host_count", 0),
        "shadow_text_len": raw.get("shadow_text_len", 0),
        "cross_origin_iframe_count": raw.get("cross_origin_iframe_count", 0),
        "largest_iframe_area_ratio": raw.get("largest_iframe_area_ratio", 0.0),
        "largest_iframe_src": raw.get("largest_iframe_src", None),
        # Work Item 2: DOM readiness signals (passthrough from raw)
        "dom_ready": raw.get("dom_ready", False),
        "dom_ready_rule": raw.get("dom_ready_rule", None),
        "readiness_gate_timeout": raw.get("readiness_gate_timeout", False),
        # Work Item 3: Measurement error signals (passthrough from raw)
        "measurement_error": raw.get("measurement_error", False),
        "measurement_error_kind": raw.get("measurement_error_kind", None),
        "measurement_error_stage": raw.get("measurement_error_stage", None)
    })
    
    # Work Item 4: content_observed signal (deterministic, confirmed-only)
    # Lock-in Fix 6: This does NOT modify crawlability; it's a visibility signal only
    content_observed = False
    content_observed_rule = None
    
    # Deterministic priority order
    if base_signals.get("main_text_len", 0) >= 80:
        content_observed = True
        content_observed_rule = "MAIN_TEXT"
    elif base_signals.get("shadow_text_len", 0) >= 80:
        content_observed = True
        content_observed_rule = "SHADOW_TEXT"
    elif base_signals.get("shadow_iframe_confirmed", False):
        content_observed = True
        content_observed_rule = "SHADOW_IFRAME"
    
    base_signals["content_observed"] = content_observed
    base_signals["content_observed_rule"] = content_observed_rule
    
    return base_signals

