"""
Difficulty and crawlability evaluation - Rule-based only.
No heuristics, only deterministic scoring.
"""

from typing import Dict, Any, List


def evaluate(slap_label: str, signals: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluate difficulty and crawlability based on SLAP classification and signals.
    
    RULES:
    ======
    
    ❶ Hard blockers (override all other rules):
       - AP-CAPTCHA → difficulty 5, crawlability BLOCKED
       - AP-LOGIN → difficulty 4, crawlability PARTIAL
       - AP-BOT-SCORE → difficulty 4, crawlability PARTIAL
    
    ❷ Base difficulty (if no hard blockers):
       - Start at 1
       - +1 if api_count > 0
       - +1 if shadow > 0
       - +1 if iframe_count > 3
       - Max difficulty = 5
    
    ❸ Crawlability mapping:
       - difficulty 1-3 → FULL
       - difficulty 4 → PARTIAL
       - difficulty 5 → BLOCKED
    
    Args:
        slap_label: SLAP classification string (e.g., "S-STATIC, L-STATIC, AP-NONE")
        signals: Computed signals dictionary
        
    Returns:
        Dictionary with:
        - difficulty: int (1-5)
        - crawlability: str ("FULL" | "PARTIAL" | "BLOCKED")
        - blockers: List[str] (populated if AP triggered)
    """
    # Extract AP classification from SLAP label
    ap_part = slap_label.split(", ")[2]  # Get "AP-XXX"
    
    blockers: List[str] = []
    
    # ❶ Hard blockers override
    if "AP-CAPTCHA" in ap_part:
        return {
            "difficulty": 5,
            "crawlability": "BLOCKED",
            "blockers": ["CAPTCHA"]
        }
    
    if "AP-LOGIN" in ap_part:
        return {
            "difficulty": 4,
            "crawlability": "PARTIAL",
            "blockers": ["LOGIN"]
        }
    
    if "AP-BOT-SCORE" in ap_part:
        return {
            "difficulty": 4,
            "crawlability": "PARTIAL",
            "blockers": ["BOT"]
        }
    
    # ❷ No hard blockers - compute difficulty progressively
    difficulty = 1
    
    # Add difficulty for API usage
    if signals["api_count"] > 0:
        difficulty += 1
    
    # Add difficulty for shadow DOM
    if signals["shadow"] > 0:
        difficulty += 1
    
    # Add difficulty for excessive iframes
    if signals["iframe"] > 3:
        difficulty += 1
    
    # Clip difficulty between 1 and 5
    difficulty = max(1, min(5, difficulty))
    
    # ❸ Determine crawlability
    if difficulty in [1, 2, 3]:
        crawlability = "FULL"
    elif difficulty == 4:
        crawlability = "PARTIAL"
    else:  # difficulty == 5
        crawlability = "BLOCKED"
    
    return {
        "difficulty": difficulty,
        "crawlability": crawlability,
        "blockers": blockers
    }
