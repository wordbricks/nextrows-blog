"""
MVP-4: Deterministic Failure Hint Layer

Provides explanatory hints about where and why crawling is likely to fail
or become expensive for Nextrows. This layer is:
- Non-intrusive (does not affect SLAP or difficulty)
- Fully deterministic (same inputs always produce same outputs)
- Rule-based only (no ML, no probabilistic inference)
"""

from typing import Dict, List, Any

# Import TEXT_THRESHOLD constant from signals.py for consistency
from .signals import TEXT_THRESHOLD


def compute_failure_hints(signals: Dict[str, Any], crawlability: str) -> List[str]:
    """
    Compute deterministic failure hints based on observable signals.
    
    This function evaluates 5 rule-based conditions and returns hints
    explaining potential crawl difficulties. Hints are ordered and additive
    (multiple can apply).
    
    CRITICAL CONSTRAINTS:
    - Must be fully deterministic
    - Must NOT affect SLAP classification
    - Must NOT affect difficulty score
    - Uses only already-computed signals
    
    Args:
        signals: Dictionary of computed signals from signals.compute_signals()
        crawlability: Crawlability status ("FULL" | "PARTIAL" | "BLOCKED")
        
    Returns:
        Ordered list of hint strings. Empty list if no risks detected.
        
    Possible hints:
        - "REQUIRES_SCROLL_HANDLING": Page uses infinite scroll or lazy-loading
        - "API_VOLUME_HIGH": High API fan-out increases cost/timeout risk
        - "BOT_PRESSURE_SOFT": Repeated crawling likely to hit bot defenses
        - "SESSION_SENSITIVE": Page behavior depends on session continuity
        - "DOM_COMPLEXITY_HIGH": Selector instability, fragile extraction
        - "RATE_LIMITED": Rate limiting detected
        - "GEO_BLOCKED": Geographic blocking detected
        - "UA_BLOCKED": User-agent/browser blocking detected
        - "STREAMING_REQUIRED": Streaming (SSE/WebSocket) AND crawlability is PARTIAL/BLOCKED
    """
    hints = []
    
    # Extract signals
    api_count = signals.get("api_count", 0)
    api_count_after_scroll = signals.get("api_count_after_scroll", 0)
    api_soft_block = signals.get("api_soft_block", False)
    bot_score = signals.get("bot_score", False)
    login_required = signals.get("login_required", False)
    initial_text_length = signals.get("initial_text_length", 0)
    shadow = signals.get("shadow", 0)
    iframe = signals.get("iframe", 0)
    
    # Rule 1: REQUIRES_SCROLL_HANDLING
    # Trigger: api_count_after_scroll > 0
    # Meaning: Page uses infinite scroll or lazy-loaded pagination
    #          A crawler must handle scrolling or pagination logic
    if api_count_after_scroll > 0:
        hints.append("REQUIRES_SCROLL_HANDLING")
    
    # Rule 2: API_VOLUME_HIGH
    # Trigger: api_count >= 30
    # Meaning: High API fan-out
    #          Increased cost, timeout, or rate-limit sensitivity
    if api_count >= 30:
        hints.append("API_VOLUME_HIGH")
    
    # Rule 3: BOT_PRESSURE_SOFT
    # Trigger: api_soft_block == True OR bot_score == True
    # Meaning: Crawling works now
    #          Repeated or scaled crawling likely to hit bot defenses
    if api_soft_block or bot_score:
        hints.append("BOT_PRESSURE_SOFT")
    
    # Rule 4: SESSION_SENSITIVE
    # Trigger: login_required == True
    #          OR (api_count > 10 AND initial_text_length < TEXT_THRESHOLD)
    # Meaning: Page behavior depends heavily on session continuity
    #          Session loss may break data access
    # 
    # Note: The second condition (api_count > 10 AND initial_text_length < TEXT_THRESHOLD)
    #       detects session-dependent rendering (CSR with high API dependency),
    #       not authentication. This pattern indicates the page relies heavily on
    #       session-aware API responses for content.
    if login_required or (api_count > 10 and initial_text_length < TEXT_THRESHOLD):
        hints.append("SESSION_SENSITIVE")
    
    # Rule 5: DOM_COMPLEXITY_HIGH
    # Trigger: shadow >= 50 OR iframe >= 20
    # Meaning: Selector instability
    #          Extraction logic likely to be fragile
    if shadow >= 50 or iframe >= 20:
        hints.append("DOM_COMPLEXITY_HIGH")
    
    # Rule 6: RATE_LIMITED (NEW)
    # Trigger: rate_limited == True
    # Meaning: Page is currently rate limited
    #          Repeated or scaled crawling will fail until rate limit resets
    if signals.get("rate_limited", False):
        hints.append("RATE_LIMITED")
    
    # Rule 7: GEO_BLOCKED (NEW)
    # Trigger: geo_blocked == True
    # Meaning: Content not accessible from current geographic location
    #          Crawler may need VPN or proxy in allowed regions
    if signals.get("geo_blocked", False):
        hints.append("GEO_BLOCKED")
    
    # Rule 8: UA_BLOCKED (NEW)
    # Trigger: ua_blocked == True
    # Meaning: Browser/client not supported by the site
    #          Crawler user-agent may be rejected; may need UA spoofing
    if signals.get("ua_blocked", False):
        hints.append("UA_BLOCKED")
    
    # Rule 9: STREAMING_REQUIRED (MVP-8 FIX)
    # Trigger: is_streaming == True AND crawlability in ["PARTIAL", "BLOCKED"]
    # Meaning: Page uses real-time streaming (SSE/WebSocket) AND extraction is limited
    #          Crawlers must handle streaming protocols in a restricted environment
    if signals.get("is_streaming", False) and crawlability in ["PARTIAL", "BLOCKED"]:
        hints.append("STREAMING_REQUIRED")
    
    return hints

