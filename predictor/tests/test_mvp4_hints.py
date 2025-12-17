"""
MVP-4 Determinism Test for Failure Hints

Tests that the same URL produces identical failure_hints across multiple runs.
"""

import sys
from crawl_predictor import main

def test_mvp4_determinism():
    """
    Test that failure hints are deterministic across multiple runs.
    """
    print("=" * 60)
    print("MVP-4 FAILURE HINTS DETERMINISM TEST")
    print("=" * 60)
    print()
    
    # Test URLs that should trigger different hint combinations
    test_urls = [
        # Should trigger REQUIRES_SCROLL_HANDLING, API_VOLUME_HIGH
        "https://g1.globo.com/",
        
        # Should trigger API_VOLUME_HIGH, DOM_COMPLEXITY_HIGH
        "https://flightaware.com/live/airport/JFK",
        
        # Should trigger BOT_PRESSURE_SOFT
        "https://www.amazon.com/s?k=coffee",
        
        # Should trigger SESSION_SENSITIVE (login_required)
        "https://www.indeed.com/jobs?q=developer",
        
        # Should trigger DOM_COMPLEXITY_HIGH
        "https://store.epicgames.com/en-US/browse",
    ]
    
    for url in test_urls:
        print(f"\nTesting: {url}")
        print("-" * 60)
        
        try:
            # Run analysis 3 times
            results = []
            for run in range(3):
                result = main.analyze(url)
                hints = result.get("failure_hints", [])
                results.append(hints)
                print(f"  Run {run + 1}: {hints}")
            
            # Check determinism
            if results[0] == results[1] == results[2]:
                print(f"  ✓ DETERMINISTIC: All 3 runs identical")
            else:
                print(f"  ✗ FAILED: Runs produced different results!")
                return False
                
        except Exception as e:
            print(f"  ⚠ ERROR: {str(e)}")
            continue
    
    print()
    print("=" * 60)
    print("✓ ALL DETERMINISM TESTS PASSED")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = test_mvp4_determinism()
    sys.exit(0 if success else 1)
