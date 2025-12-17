"""
Unit tests for L-STREAM detection (SSE and WebSocket).

Tests deterministic, confirmed-only detection with evidence-based validation.
"""

import sys
sys.path.insert(0, '.')
from crawl_predictor.signals import detect_streaming


def test_sse_detection():
    """Test SSE detection via content-type header (xhr/fetch only)."""
    print("\n" + "="*60)
    print("TEST: detect_streaming() - SSE Detection")
    print("="*60)
    
    # Test 1: SSE positive (xhr with text/event-stream)
    print("\nTest 1: SSE positive - xhr with text/event-stream")
    network_events = [{
        "resource_type": "xhr",
        "url": "https://example.com/events",
        "response_headers": {"content-type": "text/event-stream"},
        "capture_index": 0
    }]
    ws_events = []
    detected, evidence = detect_streaming(network_events, ws_events)
    assert detected == True, "Should detect SSE from xhr with text/event-stream"
    assert evidence["rule_id"] == "SSE_CONTENT_TYPE"
    assert evidence["where"] == "network"
    assert evidence["url"] == "https://example.com/events"
    print(f"  ✓ Detected: {evidence}")
    
    # Test 2: SSE positive (fetch with text/event-stream)
    print("\nTest 2: SSE positive - fetch with text/event-stream")
    network_events = [{
        "resource_type": "fetch",
        "url": "https://example.com/stream",
        "response_headers": {"content-type": "text/event-stream; charset=utf-8"},
        "capture_index": 0
    }]
    detected, evidence = detect_streaming(network_events, [])
    assert detected == True
    assert evidence["rule_id"] == "SSE_CONTENT_TYPE"
    print(f"  ✓ Detected: {evidence}")
    
    # Test 3: SSE negative - xhr without text/event-stream
    print("\nTest 3: SSE negative - xhr with application/json")
    network_events = [{
        "resource_type": "xhr",
        "url": "https://example.com/data",
        "response_headers": {"content-type": "application/json"},
        "capture_index": 0
    }]
    detected, evidence = detect_streaming(network_events, [])
    assert detected == False, "Should not detect SSE with non-streaming content-type"
    assert evidence is None
    print(f"  ✓ No detection (as expected)")
    
    # Test 4: SSE scoped to xhr/fetch only (document should be ignored)
    print("\nTest 4: SSE scoped to xhr/fetch - document type ignored")
    network_events = [{
        "resource_type": "document",
        "url": "https://example.com/page",
        "response_headers": {"content-type": "text/event-stream"},
        "capture_index": 0
    }]
    detected, evidence = detect_streaming(network_events, [])
    assert detected == False, "Should NOT detect SSE from document resource type"
    assert evidence is None
    print(f"  ✓ Document type correctly ignored")
    
    # Test 5: SSE scoped to xhr/fetch only (script should be ignored)
    print("\nTest 5: SSE scoped to xhr/fetch - script type ignored")
    network_events = [{
        "resource_type": "script",
        "url": "https://example.com/app.js",
        "response_headers": {"content-type": "text/event-stream"},
        "capture_index": 0
    }]
    detected, evidence = detect_streaming(network_events, [])
    assert detected == False, "Should NOT detect SSE from script resource type"
    assert evidence is None
    print(f"  ✓ Script type correctly ignored")
    
    print("\n✅ All SSE detection tests passed!")


def test_websocket_detection():
    """Test WebSocket detection via opened events."""
    print("\n" + "="*60)
    print("TEST: detect_streaming() - WebSocket Detection")
    print("="*60)
    
    # Test 1: WebSocket positive
    print("\nTest 1: WebSocket positive - opened event detected")
    network_events = []
    ws_events = [{
        "url": "wss://example.com/socket",
        "ws_capture_index": 0
    }]
    detected, evidence = detect_streaming(network_events, ws_events)
    assert detected == True, "Should detect WebSocket from opened event"
    assert evidence["rule_id"] == "WEBSOCKET_OPENED"
    assert evidence["where"] == "network"
    assert evidence["url"] == "wss://example.com/socket"
    print(f"  ✓ Detected: {evidence}")
    
    # Test 2: WebSocket negative - no events
    print("\nTest 2: WebSocket negative - no events")
    detected, evidence = detect_streaming([], [])
    assert detected == False, "Should not detect WebSocket without events"
    assert evidence is None
    print(f"  ✓ No detection (as expected)")
    
    print("\n✅ All WebSocket detection tests passed!")


def test_priority_and_tiebreaking():
    """Test deterministic priority (SSE > WebSocket) and tie-breaking."""
    print("\n" + "="*60)
    print("TEST: detect_streaming() - Priority & Tie-Breaking")
    print("="*60)
    
    # Test 1: SSE priority over WebSocket
    print("\nTest 1: Priority - SSE > WebSocket")
    network_events = [{
        "resource_type": "xhr",
        "url": "https://example.com/events",
        "response_headers": {"content-type": "text/event-stream"},
        "capture_index": 0
    }]
    ws_events = [{
        "url": "wss://example.com/socket",
        "ws_capture_index": 0
    }]
    detected, evidence = detect_streaming(network_events, ws_events)
    assert detected == True
    assert evidence["rule_id"] == "SSE_CONTENT_TYPE", "SSE should have priority over WebSocket"
    print(f"  ✓ SSE priority respected: {evidence['rule_id']}")
    
    # Test 2: Deterministic SSE tie-breaking (multiple SSE candidates)
    print("\nTest 2: SSE tie-breaking - sort by (capture_index, url)")
    network_events = [
        {
            "resource_type": "xhr",
            "url": "https://example.com/stream-b",
            "response_headers": {"content-type": "text/event-stream"},
            "capture_index": 1
        },
        {
            "resource_type": "xhr",
            "url": "https://example.com/stream-a",
            "response_headers": {"content-type": "text/event-stream"},
            "capture_index": 0
        }
    ]
    detected, evidence = detect_streaming(network_events, [])
    assert detected == True
    # Should select capture_index=0 (earliest)
    assert evidence["url"] == "https://example.com/stream-a", "Should select earliest capture_index"
    print(f"  ✓ Tie-breaking by capture_index: {evidence['url']}")
    
    # Test 3: Deterministic SSE tie-breaking (same capture_index, sort by url)
    print("\nTest 3: SSE tie-breaking - same capture_index, sort by url")
    network_events = [
        {
            "resource_type": "xhr",
            "url": "https://example.com/stream-b",
            "response_headers": {"content-type": "text/event-stream"},
            "capture_index": 0
        },
        {
            "resource_type": "xhr",
            "url": "https://example.com/stream-a",
            "response_headers": {"content-type": "text/event-stream"},
            "capture_index": 0
        }
    ]
    detected, evidence = detect_streaming(network_events, [])
    assert detected == True
    # Should select alphabetically first URL
    assert evidence["url"] == "https://example.com/stream-a", "Should select alphabetically first URL"
    print(f"  ✓ Tie-breaking by url: {evidence['url']}")
    
    # Test 4: Deterministic WebSocket tie-breaking
    print("\nTest 4: WebSocket tie-breaking - sort by (ws_capture_index, url)")
    ws_events = [
        {
            "url": "wss://example.com/socket-b",
            "ws_capture_index": 1
        },
        {
            "url": "wss://example.com/socket-a",
            "ws_capture_index": 0
        }
    ]
    detected, evidence = detect_streaming([], ws_events)
    assert detected == True
    # Should select ws_capture_index=0 (earliest)
    assert evidence["url"] == "wss://example.com/socket-a", "Should select earliest ws_capture_index"
    print(f"  ✓ WebSocket tie-breaking: {evidence['url']}")
    
    print("\n✅ All priority and tie-breaking tests passed!")


def run_all_tests():
    """Run all unit tests."""
    print("\n" + "="*60)
    print("RUNNING ALL L-STREAM DETECTOR TESTS")
    print("="*60)
    
    try:
        test_sse_detection()
        test_websocket_detection()
        test_priority_and_tiebreaking()
        
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
