"""
MVP-5.1 Network Determinism Test

Verifies that network-derived signals (api_count, api_count_after_scroll)
are deterministic across multiple runs on complex, real-world URLs.

Tests challenging URLs with:
- Heavy analytics/tracking (news sites)
- Dynamic loading (SPAs)
- A/B testing (e-commerce)
"""

import sys
sys.path.insert(0, 'c:\\Users\\Laptop\\Desktop\\1\\codes\\Nextrows3')

from crawl_predictor import main


def test_network_determinism():
    """Test determinism on URLs with heavy analytics, dynamic loading, A/B testing."""
    
    test_cases = [
        # News sites - heavy analytics/tracking
        {
            "url": "https://edition.cnn.com/world",
            "category": "News (heavy analytics)",
            "iterations": 5
        },
        {
            "url": "https://www.nytimes.com/section/technology",
            "category": "News (paywall + analytics)",
            "iterations": 5
        },
        
        # Large SPAs - dynamic loading
        {
            "url": "https://www.tiktok.com/tag/funny",
            "category": "SPA (dynamic content)",
            "iterations": 5
        },
        
        # Simpler test cases (more likely to pass)
        {
            "url": "https://www.amazon.com/s?k=coffee",
            "category": "E-commerce (A/B testing)",
            "iterations": 3
        },
        
        # Baseline - should always pass
        {
            "url": "https://example.com",
            "category": "Baseline (trivial page)",
            "iterations": 3
        },
    ]
    
    all_passed = True
    summary = {"passed": 0, "failed": 0, "total": len(test_cases)}
    
    for test_case in test_cases:
        url = test_case["url"]
        category = test_case["category"]
        iterations = test_case["iterations"]
        
        print(f"\nTesting: {url}")
        print(f"Category: {category}")
        print(f"Iterations: {iterations}")
        print("-" * 60)
        
        results = []
        errors = 0
        for i in range(iterations):
            try:
                result = main.analyze(url)
                api_count = result["signals"]["api_count"]
                api_count_after_scroll = result["signals"]["api_count_after_scroll"]
                slap = result["slap"]
                results.append((api_count, api_count_after_scroll, slap))
                print(f"  Run {i+1}: api_count={api_count}, api_after_scroll={api_count_after_scroll}, slap={slap}")
            except Exception as e:
                print(f"  Run {i+1}: ERROR - {str(e)[:100]}")
                errors += 1
                all_passed = False
                continue
        
        # Check determinism
        if errors > 0:
            print(f"  ⚠ ERRORS: {errors}/{iterations} runs failed")
            summary["failed"] += 1
        elif len(results) == iterations and len(set(results)) == 1:
            print(f"  ✓ DETERMINISTIC: All {iterations} runs identical")
            summary["passed"] += 1
        else:
            print(f"  ✗ FAILED: Non-deterministic results detected")
            print(f"    Unique results: {len(set(results))} (expected 1)")
            # Show first 3 unique results
            for idx, result in enumerate(list(set(results))[:3]):
                print(f"      Variant {idx+1}: {result}")
            all_passed = False
            summary["failed"] += 1
    
    return all_passed, summary


if __name__ == "__main__":
    print("=" * 60)
    print("MVP-5.1 NETWORK DETERMINISM TEST")
    print("=" * 60)
    
    success, summary = test_network_determinism()
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total test cases: {summary['total']}")
    print(f"Passed: {summary['passed']}")
    print(f"Failed: {summary['failed']}")
    print(f"Pass rate: {summary['passed']}/{summary['total']} ({100*summary['passed']//summary['total'] if summary['total'] > 0 else 0}%)")
    
    if success:
        print("\n✓ ALL NETWORK DETERMINISM TESTS PASSED")
        sys.exit(0)
    else:
        print("\n⚠ SOME TESTS FAILED OR SHOWED NON-DETERMINISM")
        print("This is expected for MVP-5.1 validation - review results above")
        sys.exit(1)
