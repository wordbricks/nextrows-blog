"""
Simple SLAP classifier - MVP-5 rule-based only.
MVP-2: Added S-PROGRESSIVE, L-INTERACTIVE, enhanced AP-BOT-SCORE.
MVP-3: Refined CSR/SSR and STATIC/INTERACTIVE boundary classification.
MVP-5: Strengthened AP and S classification accuracy with stricter evidence requirements.
No heuristics, no ML, no LLM - deterministic only.
"""

from typing import Dict, Any
from .signals import TEXT_THRESHOLD


def classify(signals: Dict[str, Any], raw: Dict[str, Any]) -> str:
    """
    Classify page using S-L-AP axes with deterministic rules only.
    
    MVP-2 ENHANCEMENTS:
    - S-PROGRESSIVE: Framework-based progressive rendering
    - L-INTERACTIVE: Interactive loading patterns
    - AP-BOT-SCORE: Enhanced with API soft-block detection
    
    MVP-3 ENHANCEMENTS:
    - S-AXIS: CSR/SSR boundary refined using initial_text_length
    - L-AXIS: STATIC/INTERACTIVE boundary refined using api_count_after_scroll
    
    MVP-5 ENHANCEMENTS:
    - S-PROGRESSIVE: Require initial_text_length >= TEXT_THRESHOLD (data-containing, not layout-only)
    - S-SHADOW: Require initial_text_length < 200 (core data hidden, not just UI styling)
    - AP-BOT-SCORE: Stricter single-session evidence requirements
    - AP-LOGIN: Enhanced confirmed-only assignment, no header/footer false positives
    - AP-AXIS: Comprehensive inline comments for all classifications
    
    S-AXIS (Structure):
    ==================
    IF semantic_tags == True AND api_count > 5 AND framework_detected == True AND initial_text_length >= 750  →  S-PROGRESSIVE (MVP-5 ENHANCED)
    ELIF shadow > 0 AND semantic_tags == False AND initial_text_length < 200  →  S-SHADOW (MVP-5 ENHANCED)
    ELIF semantic_tags == True AND api_count == 0 → S-STATIC
    ELIF semantic_tags == False AND api_count > 0 → S-CSR
    ELIF semantic_tags == True AND api_count > 0:
        IF initial_text_length < TEXT_THRESHOLD → S-CSR (MVP-3 REFINED)
        ELSE → S-SSR (MVP-3 REFINED)
    ELSE → S-UNKNOWN
    
    L-AXIS (Loading):
    =================
    IF is_streaming == True → L-STREAM (NEW - Priority 1)
    ELIF api_count == 0 AND api_count_after_scroll > 0 → L-INTERACTIVE (MVP-3 REFINED - infinite scroll)
    ELIF interactive_loading == True AND api_count == 0 → L-INTERACTIVE (text-based fallback)
    ELIF api_count > 0 → L-API
    ELSE → L-STATIC
    
    AP-AXIS (Access Protection):
    ============================
    IF captcha == True → AP-CAPTCHA
    ELIF login_required == True → AP-LOGIN (MVP-5 ENHANCED - confirmed-only)
    ELIF bot_score == True OR api_soft_block == True → AP-BOT-SCORE (MVP-5 ENHANCED - stricter evidence)
    ELSE → AP-NONE
    
    Args:
        signals: Computed signals dictionary
        raw: Raw browser data (not used in MVP)
        
    Returns:
        SLAP classification string: "S-XXX, L-XXX, AP-XXX"
    """
    # Extract signals (use .get() for safe access)
    shadow = signals.get("shadow", 0)
    semantic_tags = signals.get("semantic_tags", False)
    api_count = signals.get("api_count", 0)
    framework_detected = signals.get("framework_detected", False)
    interactive_loading = signals.get("interactive_loading", False)
    # MVP-3 new signals
    initial_text_length = signals.get("initial_text_length", 0)
    api_count_after_scroll = signals.get("api_count_after_scroll", 0)
    
    # S-axis classification (MVP-6 ENHANCED - S-VIRTUALIZED added)
    # Priority order for S-axis categories
    
    # Priority 1: S-PROGRESSIVE (MVP-5 ENHANCED - requires meaningful initial content)
    # Trigger: Framework detected AND significant API usage AND actual data content in initial HTML
    # Enhancement: Require initial_text_length >= TEXT_THRESHOLD to prevent layout-only HTML classification
    if semantic_tags and api_count > 5 and framework_detected and initial_text_length >= TEXT_THRESHOLD:
        s_class = "S-PROGRESSIVE"
    
    # Priority 2: S-VIRTUALIZED (MVP-6 NEW)
    # Trigger: DOM node churn detected (bounded growth despite API activity)
    # Evidence: Scroll triggers APIs but DOM count stays bounded → node replacement (virtualization)
    elif signals.get("virtualized_dom", False):
        s_class = "S-VIRTUALIZED"
    
    # Priority 3: S-SHADOW-IFRAME (MVP-9 NEW)
    # Trigger: Core content confirmed in cross-origin iframe OR accessible shadow DOM
    # Evidence: Deterministic rule priority (IFRAME_CORE_CONTENT > SHADOW_CORE_CONTENT)
    elif signals.get("shadow_iframe_confirmed", False):
        s_class = "S-SHADOW-IFRAME"
    
    # Priority 4: S-SHADOW (MVP-5 ENHANCED - false positive reduction)
    # Trigger: Shadow DOM exists AND no semantic tags AND minimal initial text
    # Enhancement: Require initial_text_length < 200 to confirm core data is hidden in shadow DOM
    # Rationale: Styling-only shadow usage still shows normal content in initial_text_length
    elif shadow > 0 and not semantic_tags and initial_text_length < 200:
        s_class = "S-SHADOW"
    
    # Priority 4: S-STATIC (existing)
    elif semantic_tags and api_count == 0:
        s_class = "S-STATIC"
    # Priority 4: S-CSR (existing)
    elif not semantic_tags and api_count > 0:
        s_class = "S-CSR"
    # Priority 5: S-SSR/CSR boundary refinement (MVP-3)
    elif semantic_tags and api_count > 0:
        # Use initial text length to distinguish CSR from SSR
        if initial_text_length < TEXT_THRESHOLD:
            s_class = "S-CSR"  # Sparse initial text → client-side rendered
        else:
            s_class = "S-SSR"  # Meaningful initial text → server-side rendered
    # Fallback
    else:
        s_class = "S-UNKNOWN"
    
    # L-axis classification (L-STREAM added as Priority 1)
    # Priority 1: L-STREAM (NEW - highest priority)
    # Trigger: SSE or WebSocket streaming detected
    if signals.get("is_streaming", False):
        l_class = "L-STREAM"
    # Priority 2: L-INTERACTIVE via scroll-triggered APIs (MVP-3 - infinite scroll detection)
    elif api_count == 0 and api_count_after_scroll > 0:
        l_class = "L-INTERACTIVE"
    # Priority 3: L-INTERACTIVE via text patterns (MVP-2 fallback)
    elif interactive_loading and api_count == 0:
        l_class = "L-INTERACTIVE"
    # Priority 4: L-API (existing)
    elif api_count > 0:
        l_class = "L-API"
    # Priority 5: L-STATIC (existing)
    else:
        l_class = "L-STATIC"
    
    # AP-axis classification (NEW: AP-RATE, AP-GEO, AP-UA added)
    # Priority order: AP-CAPTCHA > AP-LOGIN > AP-RATE > AP-GEO > AP-UA > AP-SESSION > AP-HEADERSIG > AP-KEY > AP-BOT-SCORE > AP-NONE
    # Note: All AP boolean signals remain in signals dict (parallel to subcategory) for LLM use
    
    # Priority 1: AP-CAPTCHA - Explicit CAPTCHA challenge detected
    # Trigger: Confirmed CAPTCHA challenge text in HTML
    if signals.get("captcha", False):
        ap_class = "AP-CAPTCHA"
    
    # Priority 2: AP-LOGIN - Login wall detected
    # Trigger: Confirmed login wall message (main content replaced)
    elif signals.get("login_required", False):
        ap_class = "AP-LOGIN"
    
    # Priority 3: AP-RATE - Rate limiting detected (NEW)
    # Trigger: HTTP 429, Retry-After header, X-RateLimit-Remaining=0, or rate limit text
    elif signals.get("rate_limited", False):
        ap_class = "AP-RATE"
    
    # Priority 4: AP-GEO - Geographic blocking detected (NEW)
    # Trigger: Explicit geo-blocking phrases in HTML or network responses
    elif signals.get("geo_blocked", False):
        ap_class = "AP-GEO"
    
    # Priority 5: AP-UA - User-agent/browser blocking detected (NEW)
    # Trigger: Explicit browser/client blocking phrases
    elif signals.get("ua_blocked", False):
        ap_class = "AP-UA"
    
    # Priority 6: AP-SESSION - Session token/cookie required (MVP-6)
    # Trigger: Page loads + APIs return 200 + empty data (strict false-positive prevention)
    # All conditions: initial_text_length >= 750, api_count >= 2, no CAPTCHA/LOGIN
    elif signals.get("session_required", False):
        ap_class = "AP-SESSION"
    
    # Priority 7: AP-HEADERSIG - Request signature required (MVP-6)
    # Trigger: 401/403 with explicit signature/nonce/timestamp error messages
    elif signals.get("header_signature_required", False):
        ap_class = "AP-HEADERSIG"
    
    # Priority 8: AP-KEY - API key required (MVP-6)
    # Trigger: 401/403 with explicit "API key" error messages
    elif signals.get("api_key_required", False):
        ap_class = "AP-KEY"
    
    # Priority 9: AP-BOT-SCORE - Soft bot blocking (MVP-5)
    # Trigger: Explicit blocking message OR confirmed empty API response patterns in HTML
    # Enhancement: Stricter single-session evidence requirements
    elif signals.get("bot_score", False) or signals.get("api_soft_block", False):
        ap_class = "AP-BOT-SCORE"
    
    # Priority 10: AP-NONE - No access protection detected
    else:
        ap_class = "AP-NONE"
    
    return f"{s_class}, {l_class}, {ap_class}"

