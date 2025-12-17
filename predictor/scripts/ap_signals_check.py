"""
Unit tests for new AP signal detectors: rate_limit, geo_block, ua_block.

Tests deterministic, confirmed-only detection with evidence-based validation.
"""

import sys
sys.path.insert(0, '.')
from crawl_predictor.signals import detect_rate_limit, detect_geo_block, detect_ua_block



def test_detect_rate_limit():
    """Test rate limiting detection across all trigger conditions."""
    print("\n" + "="*60)
    print("TEST: detect_rate_limit()")
    print("="*60)
    
    # Test 1: HTTP 429 status (priority 1)
    print("\nTest 1: HTTP 429 status")
    events = [{
        "resource_type": "xhr",
        "url": "https://api.example.com/data",
        "status": 429,
        "response_headers": {},
        "response_preview": "",
        "ts_ms": 1000
    }]
    detected, evidence = detect_rate_limit(events)
    assert detected == True, "Should detect rate limit from HTTP 429"
    assert evidence["rule_id"] == "RATE_429", f"Expected RATE_429, got {evidence['rule_id']}"
    assert evidence["status"] == 429
    print(f"  ✓ Detected: {evidence}")
    
    # Test 2: Retry-After header (priority 2)
    print("\nTest 2: Retry-After header")
    events = [{
        "resource_type": "fetch",
        "url": "https://api.example.com/data",
        "status": 200,
        "response_headers": {"retry-after": "60"},  # lowercase key
        "response_preview": "",
        "ts_ms": 1000
    }]
    detected, evidence = detect_rate_limit(events)
    assert detected == True, "Should detect rate limit from Retry-After header"
    assert evidence["rule_id"] == "RATE_RETRY_AFTER"
    assert evidence["header_name"] == "retry-after"
    assert evidence["header_value"] == "60"
    print(f"  ✓ Detected: {evidence}")
    
    # Test 3: X-RateLimit-Remaining == "0" (priority 3)
    print("\nTest 3: X-RateLimit-Remaining == 0")
    events = [{
        "resource_type": "xhr",
        "url": "https://api.example.com/data",
        "status": 200,
        "response_headers": {"x-ratelimit-remaining": "0"},  # lowercase key
        "response_preview": "",
        "ts_ms": 1000
    }]
    detected, evidence = detect_rate_limit(events)
    assert detected == True, "Should detect rate limit from X-RateLimit-Remaining"
    assert evidence["rule_id"] == "RATE_LIMIT_HEADER"
    print(f"  ✓ Detected: {evidence}")
    
    # Test 4: Rate limit text in response (priority 4)
    print("\nTest 4: Rate limit text in response body")
    events = [{
        "resource_type": "xhr",
        "url": "https://api.example.com/data",
        "status": 200,
        "response_headers": {},
        "response_preview": '{"error": "Rate limit exceeded. Please try again later."}',
        "ts_ms": 1000
    }]
    detected, evidence = detect_rate_limit(events)
    assert detected == True, "Should detect rate limit from body text"
    assert evidence["rule_id"] == "RATE_TEXT"
    assert "rate limit" in evidence["snippet"].lower()
    print(f"  ✓ Detected: {evidence}")
    
    # Test 5: No rate limiting (negative case)
    print("\nTest 5: No rate limiting")
    events = [{
        "resource_type": "xhr",
        "url": "https://api.example.com/data",
        "status": 200,
        "response_headers": {},
        "response_preview": '{"data": [1, 2, 3]}',
        "ts_ms": 1000
    }]
    detected, evidence = detect_rate_limit(events)
    assert detected == False, "Should not detect rate limit"
    assert evidence is None
    print(f"  ✓ No detection (as expected)")
    
    # Test 6: Priority ordering (429 wins over header)
    print("\nTest 6: Deterministic priority (429 > header)")
    events = [
        {
            "resource_type": "xhr",
            "url": "https://api.example.com/b",
            "status": 200,
            "response_headers": {"retry-after": "60"},
            "response_preview": "",
            "ts_ms": 1000
        },
        {
            "resource_type": "xhr",
            "url": "https://api.example.com/a",
            "status": 429,
            "response_headers": {},
            "response_preview": "",
            "ts_ms": 2000
        }
    ]
    detected, evidence = detect_rate_limit(events)
    assert detected == True
    assert evidence["rule_id"] == "RATE_429", "429 should have priority over header"
    print(f"  ✓ Priority order respected: {evidence['rule_id']}")
    
    print("\n✅ All rate_limit tests passed!")


def test_detect_geo_block():
    """Test geographic blocking detection."""
    print("\n" + "="*60)
    print("TEST: detect_geo_block()")
    print("="*60)
    
    # Test 1: HTML "not available in your region"
    print("\nTest 1: HTML geo-blocking phrase")
    html = "<html><body><h1>Not available in your region</h1></body></html>"
    events = []
    detected, evidence = detect_geo_block(html, events)
    assert detected == True, "Should detect geo block from HTML"
    assert evidence["where"] == "html"
    assert "region" in evidence["snippet"].lower()
    print(f"  ✓ Detected: {evidence}")
    
    # Test 2: HTML "access denied from your location"
    print("\nTest 2: HTML location-based blocking")
    html = "<div>Access denied from your location. This content is restricted.</div>"
    detected, evidence = detect_geo_block(html, [])
    assert detected == True
    assert "location" in evidence["snippet"].lower()
    print(f"  ✓ Detected: {evidence}")
    
    # Test 3: "service not available" WITH geo context
    print("\nTest 3: Generic phrase WITH geo context")
    html = "<p>This service is not available in your country at this time.</p>"
    detected, evidence = detect_geo_block(html, [])
    assert detected == True, "Should detect when geo context present"
    print(f"  ✓ Detected: {evidence}")
    
    # Test 4: "service not available" WITHOUT geo context (should NOT trigger)
    print("\nTest 4: Generic phrase WITHOUT geo context")
    html = "<p>This service is not available at this time. Please try again later.</p>"
    detected, evidence = detect_geo_block(html, [])
    assert detected == False, "Should NOT detect without geo context"
    print(f"  ✓ No detection (as expected - no geo context)")
    
    # Test 5: Network response geo block
    print("\nTest 5: Network response geo-blocking")
    html = "<html><body>Normal page</body></html>"
    events = [{
        "resource_type": "xhr",
        "url": "https://api.example.com/video",
        "response_preview": '{"error": "Content not available in your country"}',
        "ts_ms": 1000
    }]
    detected, evidence = detect_geo_block(html, events)
    assert detected == True
    assert evidence["where"] == "network"
    assert evidence["url"] == "https://api.example.com/video"
    print(f"  ✓ Detected: {evidence}")
    
    # Test 6: Priority (HTML > network)
    print("\nTest 6: Priority (HTML > network)")
    html = "<div>This content is not available in your region.</div>"
    events = [{
        "resource_type": "xhr",
        "url": "https://api.example.com/data",
        "response_preview": '{"error": "Access denied from your location"}',
        "ts_ms": 1000
    }]
    detected, evidence = detect_geo_block(html, events)
    assert detected == True
    assert evidence["where"] == "html", "HTML should have priority over network"
    print(f"  ✓ HTML priority respected")
    
    # Test 7: No geo blocking
    print("\nTest 7: No geo blocking")
    html = "<html><body>Normal content</body></html>"
    detected, evidence = detect_geo_block(html, [])
    assert detected == False
    assert evidence is None
    print(f"  ✓ No detection (as expected)")
    
    print("\n✅ All geo_block tests passed!")


def test_detect_ua_block():
    """Test user-agent/browser blocking detection."""
    print("\n" + "="*60)
    print("TEST: detect_ua_block()")
    print("="*60)
    
    # Test 1: HTML "unsupported browser"
    print("\nTest 1: HTML unsupported browser")
    html = "<div class='warning'>Your browser is not supported. Please update your browser.</div>"
    events = []
    detected, evidence = detect_ua_block(html, events)
    assert detected == True
    assert evidence["where"] == "html"
    assert evidence["rule_id"] in ["UA_BROWSER_UNSUPPORTED", "UA_UPDATE_REQUIRED"]
    print(f"  ✓ Detected: {evidence}")
    
    # Test 2: HTML "unsupported client"
    print("\nTest 2: HTML unsupported client")
    html = "<p>Unsupported client. Please use a modern browser.</p>"
    detected, evidence = detect_ua_block(html, [])
    assert detected == True
    assert evidence["rule_id"] == "UA_CLIENT_UNSUPPORTED"
    print(f"  ✓ Detected: {evidence}")
    
    # Test 3: Network response UA block
    print("\nTest 3: Network response UA blocking")
    html = "<html><body>Normal page</body></html>"
    events = [{
        "resource_type": "fetch",
        "url": "https://api.example.com/data",
        "response_preview": '{"error": "Browser not supported"}',
        "ts_ms": 1000
    }]
    detected, evidence = detect_ua_block(html, events)
    assert detected == True
    assert evidence["where"] == "network"
    print(f"  ✓ Detected: {evidence}")
    
    # Test 4: Priority (HTML > network)
    print("\nTest 4: Priority (HTML > network)")
    html = "<h1>Unsupported browser detected</h1>"
    events = [{
        "resource_type": "xhr",
        "url": "https://api.example.com/check",
        "response_preview": '{"error": "Update your browser"}',
        "ts_ms": 1000
    }]
    detected, evidence = detect_ua_block(html, events)
    assert detected == True
    assert evidence["where"] == "html", "HTML should have priority"
    print(f"  ✓ HTML priority respected")
    
    # Test 5: No UA blocking
    print("\nTest 5: No UA blocking")
    html = "<html><body>Welcome to our site</body></html>"
    detected, evidence = detect_ua_block(html, [])
    assert detected == False
    assert evidence is None
    print(f"  ✓ No detection (as expected)")
    
    print("\n✅ All ua_block tests passed!")


def run_all_tests():
    """Run all unit tests."""
    print("\n" + "="*60)
    print("RUNNING ALL AP SIGNAL DETECTOR TESTS")
    print("="*60)
    
    try:
        test_detect_rate_limit()
        test_detect_geo_block()
        test_detect_ua_block()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED!")
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
