"""
Main pipeline orchestrator.
Coordinates browser → signals → SLAP → difficulty evaluation.
"""

from typing import Dict, Any
from . import browser, signals, simple_slap, difficulty_model, failure_hints

# MVP-10: Schema version for output stability
SCHEMA_VERSION = "2025-12-16"


def analyze(url: str) -> Dict[str, Any]:
    """
    Analyze a URL and predict its crawlability using rule-based logic.
    
    Pipeline:
    1. Load URL and extract raw data (browser.py)
    2. Compute signals (signals.py)
    3. Classify using SLAP (simple_slap.py)
    4. Evaluate difficulty and crawlability (difficulty_model.py)
    5. Compute failure hints (failure_hints.py) - MVP-4
    
    Args:
        url: The URL to analyze
        
    Returns:
        Dictionary with analysis results:
        - url: str (input URL)
        - slap: str (SLAP classification: "S-XXX, L-XXX, AP-XXX")
        - difficulty: int (1-5)
        - crawlability: str ("FULL" | "PARTIAL" | "BLOCKED")
        - blockers: List[str] (blocking factors)
        - failure_hints: List[str] (crawl risk hints) - MVP-4
        - signals: Dict (all computed signals)
    """
    # Work Item 1: URL normalization (deterministic, confirmed-only)
    # If URL has no scheme, prepend https:// deterministically
    input_url_raw = url
    url_normalized = False
    url_normalization_rule = None
    
    if "://" not in url:
        url = "https://" + url
        url_normalized = True
        url_normalization_rule = "ADD_HTTPS_SCHEME"
    
    # Step 1: Load URL and extract raw data
    raw = browser.load_url(url)
    
    # Step 2: Compute signals
    computed_signals = signals.compute_signals(raw)
    
    # Step 3: Classify using SLAP
    slap = simple_slap.classify(computed_signals, raw)
    
    # Parse SLAP for downstream use
    slap_parts = slap.split(", ")
    s_cat = slap_parts[0] if len(slap_parts) > 0 else "S-UNKNOWN"
    l_cat = slap_parts[1] if len(slap_parts) > 1 else "L-STATIC"
    ap_cat = slap_parts[2] if len(slap_parts) > 2 else "AP-NONE"
    
    # Work Item 4: structure_unknown_reason (Lock-in Fix 5: corrected priority)
    # This signal explains WHY structure is unknown when it is unknown
    # Lock-in Fix 6: This does NOT modify crawlability
    structure_unknown_reason = None
    
    if s_cat == "S-UNKNOWN":
        # Lock-in Fix 5: Corrected deterministic priority order
        # Hard blockers: AP categories that prevent observation
        hard_blockers = {"AP-CAPTCHA", "AP-LOGIN", "AP-RATE", "AP-GEO", "AP-UA", 
                        "AP-KEY", "AP-HEADERSIG", "AP-SESSION"}
        
        if ap_cat in hard_blockers:
            structure_unknown_reason = "BLOCKED_BEFORE_OBSERVATION"
        elif computed_signals.get("measurement_error", False):
            # Lock-in Fix 5: MEASUREMENT_ERROR before NO_CONTENT_OBSERVED
            # This prevents mislabeling when measurement error causes text lengths to be 0
            structure_unknown_reason = "MEASUREMENT_ERROR"
        elif not computed_signals.get("content_observed", False):
            structure_unknown_reason = "NO_CONTENT_OBSERVED"
        else:
            structure_unknown_reason = "INSUFFICIENT_STRUCTURE_EVIDENCE"
    
    # Add structure_unknown_reason to signals for output
    computed_signals["structure_unknown_reason"] = structure_unknown_reason
    
    # Step 4: Evaluate difficulty and crawlability
    diff = difficulty_model.evaluate(slap, computed_signals)
    
    # Step 5: Compute failure hints (MVP-4)
    # This is done AFTER SLAP/difficulty to ensure non-intrusiveness
    # Pass crawlability for STREAMING_REQUIRED logic (MVP-8 fix)
    hints = failure_hints.compute_failure_hints(computed_signals, diff["crawlability"])
    
    # Step 6: Build and return result
    # MVP-10 Lock Rule 1: Preserve legacy flat keys AND add nested canonical sections
    
    # Extract AP evidence if present
    ap_evidence = None
    if ap_cat == "AP-RATE":
        ap_evidence = computed_signals.get("rate_limit_evidence")
    elif ap_cat == "AP-GEO":
        ap_evidence = computed_signals.get("geo_block_evidence")
    elif ap_cat == "AP-UA":
        ap_evidence = computed_signals.get("ua_block_evidence")
    elif "L-STREAM" in l_cat:
        # For L-STREAM, evidence is in streaming_evidence
        pass
    
    # Build nested canonical sections (MVP-10)
    structure_section = {
        "subcategory": s_cat,
        "signals": {
            "shadow": computed_signals.get("shadow", 0),
            "iframe": computed_signals.get("iframe", 0),
            "semantic_tags": computed_signals.get("semantic_tags", False),
            "framework_detected": computed_signals.get("framework_detected", False),
            "virtualized_dom": computed_signals.get("virtualized_dom", False),
            "shadow_iframe_confirmed": computed_signals.get("shadow_iframe_confirmed", False),
            "class_instability": computed_signals.get("class_instability", False)  # Signal only, not subcategory
        },
        "evidence": computed_signals.get("shadow_iframe_evidence")
    }
    
    loading_section = {
        "subcategory": l_cat,
        "signals": {
            "api_count": computed_signals.get("api_count", 0),
            "api_count_after_scroll": computed_signals.get("api_count_after_scroll", 0),
            "interactive_loading": computed_signals.get("interactive_loading", False),
            "is_streaming": computed_signals.get("is_streaming", False)
        },
        "evidence": computed_signals.get("streaming_evidence")
    }
    
    access_protection_section = {
        "subcategory": ap_cat,
        "signals": {
            "captcha": computed_signals.get("captcha", False),
            "login_required": computed_signals.get("login_required", False),
            "bot_score": computed_signals.get("bot_score", False),
            "api_soft_block": computed_signals.get("api_soft_block", False),
            "rate_limited": computed_signals.get("rate_limited", False),
            "geo_blocked": computed_signals.get("geo_blocked", False),
            "ua_blocked": computed_signals.get("ua_blocked", False),
            "session_required": computed_signals.get("session_required", False),
            "header_signature_required": computed_signals.get("header_signature_required", False),
            "api_key_required": computed_signals.get("api_key_required", False)
        },
        "evidence": ap_evidence
    }
    
    # LOCK RULE 1: Return BOTH legacy flat keys (unchanged) AND new nested sections (additive)
    return {
        # NEW: Schema version and nested sections (MVP-10)
        "schema_version": SCHEMA_VERSION,
        "structure": structure_section,
        "loading": loading_section,
        "access_protection": access_protection_section,
        
        # LEGACY: Preserve all existing flat top-level keys (backward compatible)
        "url": url,
        "slap": slap,
        "difficulty": diff["difficulty"],
        "crawlability": diff["crawlability"],
        "blockers": diff["blockers"],
        "failure_hints": hints,
        "signals": computed_signals,
        # Work Item 1: URL normalization signals (additive)
        "input_url_raw": input_url_raw,
        "url_normalized": url_normalized,
        "url_normalization_rule": url_normalization_rule
    }
