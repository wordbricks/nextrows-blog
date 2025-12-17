"""
MVP-8 Fix: Unit tests for STREAMING_REQUIRED hint correction.

Tests that STREAMING_REQUIRED triggers only when:
- is_streaming == True
- AND crawlability is "PARTIAL" or "BLOCKED"

Does NOT trigger when crawlability is "FULL".
"""

import sys
sys.path.insert(0, '.')
from crawl_predictor.failure_hints import compute_failure_hints


def test_streaming_required_fix():
    """Test STREAMING_REQUIRED triggers only on PARTIAL/BLOCKED crawlability."""
    print("\n" + "="*60)
    print("TEST: STREAMING_REQUIRED Fix (MVP-8)")
    print("="*60)
    
    # Base signals with streaming detected
    base_signals = {
        "is_streaming": True,
        "api_count": 0,
        "api_count_after_scroll": 0,
        "api_soft_block": False,
        "bot_score": False,
        "login_required": False,
        "initial_text_length": 1000,
        "shadow": 0,
        "iframe": 0,
        "rate_limited": False,
        "geo_blocked": False,
        "ua_blocked": False
    }
    
    # Test 1: streaming=True + crawlability=FULL → NO STREAMING_REQUIRED
    print("\nTest 1: streaming=True + crawlability=FULL")
    hints = compute_failure_hints(base_signals, "FULL")
    assert "STREAMING_REQUIRED" not in hints, \
        "STREAMING_REQUIRED should NOT be emitted when crawlability is FULL"
    print(f"  ✓ Hints: {hints}")
    print(f"  ✓ STREAMING_REQUIRED correctly NOT present")
    
    # Test 2: streaming=True + crawlability=PARTIAL → STREAMING_REQUIRED
    print("\nTest 2: streaming=True + crawlability=PARTIAL")
    hints = compute_failure_hints(base_signals, "PARTIAL")
    assert "STREAMING_REQUIRED" in hints, \
        "STREAMING_REQUIRED SHOULD be emitted when crawlability is PARTIAL"
    print(f"  ✓ Hints: {hints}")
    print(f"  ✓ STREAMING_REQUIRED correctly present")
    
    # Test 3: streaming=True + crawlability=BLOCKED → STREAMING_REQUIRED
    print("\nTest 3: streaming=True + crawlability=BLOCKED")
    hints = compute_failure_hints(base_signals, "BLOCKED")
    assert "STREAMING_REQUIRED" in hints, \
        "STREAMING_REQUIRED SHOULD be emitted when crawlability is BLOCKED"
    print(f"  ✓ Hints: {hints}")
    print(f"  ✓ STREAMING_REQUIRED correctly present")
    
    # Test 4: streaming=False + crawlability=PARTIAL → NO STREAMING_REQUIRED
    print("\nTest 4: streaming=False + crawlability=PARTIAL")
    signals_no_streaming = base_signals.copy()
    signals_no_streaming["is_streaming"] = False
    hints = compute_failure_hints(signals_no_streaming, "PARTIAL")
    assert "STREAMING_REQUIRED" not in hints, \
        "STREAMING_REQUIRED should NOT be emitted when streaming is not detected"
    print(f"  ✓ Hints: {hints}")
    print(f"  ✓ STREAMING_REQUIRED correctly NOT present (no streaming)")
    
    # Test 5: streaming=False + crawlability=BLOCKED → NO STREAMING_REQUIRED
    print("\nTest 5: streaming=False + crawlability=BLOCKED")
    hints = compute_failure_hints(signals_no_streaming, "BLOCKED")
    assert "STREAMING_REQUIRED" not in hints, \
        "STREAMING_REQUIRED should NOT be emitted when streaming is not detected"
    print(f"  ✓ Hints: {hints}")
    print(f"  ✓ STREAMING_REQUIRED correctly NOT present (no streaming)")
    
    print("\n✅ All STREAMING_REQUIRED fix tests passed!")


def test_other_hints_unaffected():
    """Verify other hints still work correctly after the fix."""
    print("\n" + "="*60)
    print("TEST: Other Hints Unaffected by Fix")
    print("="*60)
    
    # Test that other hints still trigger correctly
    signals = {
        "is_streaming": False,
        "api_count": 35,  # Should trigger API_VOLUME_HIGH
        "api_count_after_scroll": 5,  # Should trigger REQUIRES_SCROLL_HANDLING
        "api_soft_block": True,  # Should trigger BOT_PRESSURE_SOFT
        "bot_score": False,
        "login_required": False,
        "initial_text_length": 1000,
        "shadow": 60,  # Should trigger DOM_COMPLEXITY_HIGH
        "iframe": 5,
        "rate_limited": False,
        "geo_blocked": False,
        "ua_blocked": False
    }
    
    hints = compute_failure_hints(signals, "FULL")
    
    print(f"\nHints generated: {hints}")
    
    assert "REQUIRES_SCROLL_HANDLING" in hints, "REQUIRES_SCROLL_HANDLING should be present"
    assert "API_VOLUME_HIGH" in hints, "API_VOLUME_HIGH should be present"
    assert "BOT_PRESSURE_SOFT" in hints, "BOT_PRESSURE_SOFT should be present"
    assert "DOM_COMPLEXITY_HIGH" in hints, "DOM_COMPLEXITY_HIGH should be present"
    assert "STREAMING_REQUIRED" not in hints, "STREAMING_REQUIRED should NOT be present"
    
    print("✓ All expected hints present")
    print("✓ STREAMING_REQUIRED correctly absent")
    print("\n✅ Other hints unaffected by fix!")


def run_all_tests():
    """Run all unit tests."""
    print("\n" + "="*60)
    print("RUNNING MVP-8 STREAMING_REQUIRED FIX TESTS")
    print("="*60)
    
    try:
        test_streaming_required_fix()
        test_other_hints_unaffected()
        
        print("\n" + "="*60)
        print("✅ ALL MVP-8 TESTS PASSED!")
        print("="*60)
        return True
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    import sys
    success = run_all_tests()
    sys.exit(0 if success else 1)
