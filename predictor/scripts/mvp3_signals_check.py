"""
MVP-3 Signal Validation Test
Verifies that new MVP-3 signals are captured correctly.
"""

from crawl_predictor import main
import json


def test_mvp3_signals(url: str, expected_category: str = None):
    """Test that MVP-3 signals are captured and valid."""
    print(f"\nTesting MVP-3 signals for: {url}")
    
    result = main.analyze(url)
    signals = result["signals"]
    
    # Validate signal types and ranges
    errors = []
    
    # Test 1: initial_text_length is non-negative integer
    initial_text_length = signals.get("initial_text_length")
    if not isinstance(initial_text_length, int):
        errors.append(f"initial_text_length is not int: {type(initial_text_length)}")
    elif initial_text_length < 0:
        errors.append(f"initial_text_length is negative: {initial_text_length}")
    
    # Test 2: api_count_after_scroll is non-negative integer
    api_count_after_scroll = signals.get("api_count_after_scroll")
    if not isinstance(api_count_after_scroll, int):
        errors.append(f"api_count_after_scroll is not int: {type(api_count_after_scroll)}")
    elif api_count_after_scroll < 0:
        errors.append(f"api_count_after_scroll is negative: {api_count_after_scroll}")
    
    # Print results
    print(f"  SLAP: {result['slap']}")
    print(f"  Initial Text Length: {initial_text_length}")
    print(f"  API Count After Scroll: {api_count_after_scroll}")
    print(f"  Difficulty: {result['difficulty']}")
    
    if errors:
        print("  ❌ Validation errors:")
        for error in errors:
            print(f"     - {error}")
        return False
    else:
        print("  ✅ All signals valid")
        
        # Additional check for expected category
        if expected_category:
            if expected_category in result['slap']:
                print(f"  ✅ Expected category '{expected_category}' found")
            else:
                print(f"  ⚠️  Expected category '{expected_category}' not found")
                print(f"     Got: {result['slap']}")
        
        return True


if __name__ == "__main__":
    print("=" * 70)
    print("MVP-3 Signal Validation Test")
    print("=" * 70)
    
    test_cases = [
        ("https://example.com", "S-STATIC"),  # Should be static
        ("https://en.wikipedia.org/wiki/Web_scraping", "S-SSR"),  # Rich initial content
    ]
    
    all_passed = True
    
    for url, expected in test_cases:
        passed = test_mvp3_signals(url, expected)
        if not passed:
            all_passed = False
        print()
    
    if all_passed:
        print("✅ ALL SIGNAL VALIDATION TESTS PASSED")
    else:
        print("❌ SOME SIGNAL VALIDATION TESTS FAILED")
