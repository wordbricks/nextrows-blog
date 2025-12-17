"""
MVP-3 Determinism Test
Verifies that the same URL always produces identical results.
"""

from crawl_predictor import main
import json


def run_determinism_test(url: str, iterations: int = 3):
    """Run analysis multiple times and verify results are identical."""
    print(f"\nTesting determinism for: {url}")
    print(f"Running {iterations} iterations...\n")
    
    results = []
    for i in range(iterations):
        print(f"Iteration {i+1}...")
        result = main.analyze(url)
        results.append(result)
    
    # Compare all results
    first_result = results[0]
    all_identical = True
    
    for i, result in enumerate(results[1:], start=2):
        # Compare critical fields
        if result["slap"] != first_result["slap"]:
            print(f"❌ SLAP classification differs in iteration {i}")
            print(f"   Expected: {first_result['slap']}")
            print(f"   Got: {result['slap']}")
            all_identical = False
        
        if result["difficulty"] != first_result["difficulty"]:
            print(f"❌ Difficulty differs in iteration {i}")
            all_identical = False
        
        if result["crawlability"] != first_result["crawlability"]:
            print(f"❌ Crawlability differs in iteration {i}")
            all_identical = False
        
        # Compare MVP-3 signals
        if result["signals"]["initial_text_length"] != first_result["signals"]["initial_text_length"]:
            print(f"❌ initial_text_length differs in iteration {i}")
            all_identical = False
        
        if result["signals"]["api_count_after_scroll"] != first_result["signals"]["api_count_after_scroll"]:
            print(f"❌ api_count_after_scroll differs in iteration {i}")
            all_identical = False
    
    if all_identical:
        print("✅ All iterations produced IDENTICAL results")
        print(f"\nResult:")
        print(f"  SLAP: {first_result['slap']}")
        print(f"  Difficulty: {first_result['difficulty']}")
        print(f"  Crawlability: {first_result['crawlability']}")
        print(f"  Initial Text Length: {first_result['signals']['initial_text_length']}")
        print(f"  API Count After Scroll: {first_result['signals']['api_count_after_scroll']}")
    else:
        print("\n❌ DETERMINISM TEST FAILED")
    
    return all_identical


if __name__ == "__main__":
    # Test with a simple, stable URL
    test_url = "https://example.com"
    
    print("=" * 70)
    print("MVP-3 Determinism Test")
    print("=" * 70)
    
    success = run_determinism_test(test_url, iterations=3)
    
    if success:
        print("\n✅ DETERMINISM TEST PASSED")
    else:
        print("\n❌ DETERMINISM TEST FAILED")
