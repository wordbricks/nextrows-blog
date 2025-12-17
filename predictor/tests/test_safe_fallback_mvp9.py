"""
MVP-9 Safe Fallback Tests: Type Error Signal Recording

Tests for safe fallback behavior when page.evaluate() returns non-string:
1. Normal case: page.evaluate() returns string → main_text_type_error = False
2. Anomaly case: non-string return → safe fallback, main_text_type_error = True
3. Non-regression: existing S-SHADOW-IFRAME tests still pass
"""

import pytest
from crawl_predictor.signals import compute_signals
from crawl_predictor.simple_slap import classify


class TestSafeFallbackNormal:
    """Test normal operation: string returns, no type error"""
    
    def test_normal_string_no_type_error(self):
        """When main_text_raw is string, main_text_type_error should be False"""
        raw = {
            "main_text_len": 150,  # Computed from string
            "main_text_type_error": False,  # Normal operation
            "main_text_type_error_kind": None,  # No error
            "cross_origin_iframe_count": 0,
            "largest_iframe_area_ratio": 0.0,
            "largest_iframe_src": None,
            "shadow_root_host_count": 0,
            "shadow_text_len": 0,
            # Required fields
            "html": "<html></html>",
            "network": [],
            "shadow_count": 0,
            "iframe_count": 0,
            "semantic_tags_present": False,
            "api_endpoints": [],
            "status_codes": [],
            "initial_dom_text_length": 150,
            "api_endpoints_after_scroll": [],
            "dom_count_initial": 50,
            "dom_count_after_scroll": 50,
            "sample_classes_initial": [],
            "sample_classes_after_scroll": [],
            "websocket_opened_count": 0,
            "websocket_urls": [],
            "websocket_events": []
        }
        
        signals = compute_signals(raw)
        
        # Verify normal operation
        assert signals["main_text_len"] == 150
        assert signals["main_text_type_error"] is False
        assert signals["main_text_type_error_kind"] is None
    
    def test_empty_string_is_valid(self):
        """Empty string is valid (not a type error)"""
        raw = {
            "main_text_len": 0,  # Empty string
            "main_text_type_error": False,  # Not an error
            "main_text_type_error_kind": None,
            "cross_origin_iframe_count": 0,
            "largest_iframe_area_ratio": 0.0,
            "largest_iframe_src": None,
            "shadow_root_host_count": 0,
            "shadow_text_len": 0,
            # Required fields
            "html": "<html></html>",
            "network": [],
            "shadow_count": 0,
            "iframe_count": 0,
            "semantic_tags_present": False,
            "api_endpoints": [],
            "status_codes": [],
            "initial_dom_text_length": 0,
            "api_endpoints_after_scroll": [],
            "dom_count_initial": 10,
            "dom_count_after_scroll": 10,
            "sample_classes_initial": [],
            "sample_classes_after_scroll": [],
            "websocket_opened_count": 0,
            "websocket_urls": [],
            "websocket_events": []
        }
        
        signals = compute_signals(raw)
        
        assert signals["main_text_len"] == 0
        assert signals["main_text_type_error"] is False
        assert signals["main_text_type_error_kind"] is None


class TestSafeFallbackAnomaly:
    """Test anomaly case: non-string returns trigger safe fallback"""
    
    def test_non_string_triggers_safe_fallback(self):
        """When page.evaluate() returns non-string, should not crash"""
        # Simulate non-string return from page.evaluate()
        raw = {
            "main_text_len": 0,  # Fallback to empty string → len = 0
            "main_text_type_error": True,  # Type anomaly detected
            "main_text_type_error_kind": "NON_STRING",  # Deterministic error kind
            "cross_origin_iframe_count": 0,
            "largest_iframe_area_ratio": 0.0,
            "largest_iframe_src": None,
            "shadow_root_host_count": 0,
            "shadow_text_len": 0,
            # Required fields
            "html": "<html></html>",
            "network": [],
            "shadow_count": 0,
            "iframe_count": 0,
            "semantic_tags_present": False,
            "api_endpoints": [],
            "status_codes": [],
            "initial_dom_text_length": 0,
            "api_endpoints_after_scroll": [],
            "dom_count_initial": 0,
            "dom_count_after_scroll": 0,
            "sample_classes_initial": [],
            "sample_classes_after_scroll": [],
            "websocket_opened_count": 0,
            "websocket_urls": [],
            "websocket_events": []
        }
        
        # Should not crash when processing
        signals = compute_signals(raw)
        
        # Verify safe fallback behavior
        assert signals["main_text_len"] == 0  # Fallback to ""
        assert signals["main_text_type_error"] is True
        assert signals["main_text_type_error_kind"] == "NON_STRING"
    
    def test_type_error_signal_is_deterministic(self):
        """Type error signal should be deterministic (fixed value)"""
        raw = {
            "main_text_len": 0,
            "main_text_type_error": True,
            "main_text_type_error_kind": "NON_STRING",  # Must be fixed value
            "cross_origin_iframe_count": 0,
            "largest_iframe_area_ratio": 0.0,
            "largest_iframe_src": None,
            "shadow_root_host_count": 0,
            "shadow_text_len": 0,
            # Required fields
            "html": "<html></html>",
            "network": [],
            "shadow_count": 0,
            "iframe_count": 0,
            "semantic_tags_present": False,
            "api_endpoints": [],
            "status_codes": [],
            "initial_dom_text_length": 0,
            "api_endpoints_after_scroll": [],
            "dom_count_initial": 0,
            "dom_count_after_scroll": 0,
            "sample_classes_initial": [],
            "sample_classes_after_scroll": [],
            "websocket_opened_count": 0,
            "websocket_urls": [],
            "websocket_events": []
        }
        
        signals = compute_signals(raw)
        
        # Error kind must be deterministic fixed string
        assert isinstance(signals["main_text_type_error_kind"], str)
        assert signals["main_text_type_error_kind"] == "NON_STRING"
        # No dynamic error messages allowed
        assert "coroutine" not in signals["main_text_type_error_kind"].lower()
        assert "promise" not in signals["main_text_type_error_kind"].lower()


class TestNonRegression:
    """Verify existing S-SHADOW-IFRAME classification still works"""
    
    def test_iframe_classification_with_normal_text(self):
        """S-SHADOW-IFRAME classification should work with normal text"""
        raw = {
            # Iframe confirmation conditions
            "cross_origin_iframe_count": 1,
            "main_text_len": 100,  # Normal string-derived value
            "largest_iframe_area_ratio": 0.50,
            "largest_iframe_src": "https://example.com",
            # No type error
            "main_text_type_error": False,
            "main_text_type_error_kind": None,
            # Other fields
            "shadow_root_host_count": 0,
            "shadow_text_len": 0,
            # Required fields
            "html": "<html></html>",
            "network": [],
            "shadow_count": 0,
            "iframe_count": 1,
            "semantic_tags_present": False,
            "api_endpoints": [],
            "status_codes": [],
            "initial_dom_text_length": 100,
            "api_endpoints_after_scroll": [],
            "dom_count_initial": 50,
            "dom_count_after_scroll": 50,
            "sample_classes_initial": [],
            "sample_classes_after_scroll": [],
            "websocket_opened_count": 0,
            "websocket_urls": [],
            "websocket_events": []
        }
        
        signals = compute_signals(raw)
        classification = classify(signals, raw)
        
        # Should classify as S-SHADOW-IFRAME
        assert signals["shadow_iframe_confirmed"] is True
        assert "S-SHADOW-IFRAME" in classification
        
        # Type error signal should be False (normal operation)
        assert signals["main_text_type_error"] is False
    
    def test_shadow_classification_with_type_error(self):
        """
        If type error occurs but shadow_text_len is available,
        shadow path might still trigger (depends on main_text_len threshold)
        """
        raw = {
            # Shadow path (would normally trigger)
            "shadow_root_host_count": 1,
            "shadow_text_len": 300,
            # Type error: main_text_len = 0 (fallback)
            "main_text_len": 0,  # Falls to 0 after type error
            "main_text_type_error": True,  # Anomaly detected
            "main_text_type_error_kind": "NON_STRING",
            # Iframe path (not triggered)
            "cross_origin_iframe_count": 0,
            "largest_iframe_area_ratio": 0.0,
            "largest_iframe_src": None,
            # Required fields
            "html": "<html></html>",
            "network": [],
            "shadow_count": 1,
            "iframe_count": 0,
            "semantic_tags_present": False,
            "api_endpoints": [],
            "status_codes": [],
            "initial_dom_text_length": 0,
            "api_endpoints_after_scroll": [],
            "dom_count_initial": 20,
            "dom_count_after_scroll": 20,
            "sample_classes_initial": [],
            "sample_classes_after_scroll": [],
            "websocket_opened_count": 0,
            "websocket_urls": [],
            "websocket_events": []
        }
        
        signals = compute_signals(raw)
        
        # Shadow path: shadow_root_host_count >= 1, shadow_text_len >= 200, main_text_len <= 200
        # main_text_len = 0 (after fallback) satisfies main_text_len <= 200
        # So shadow path SHOULD trigger
        assert signals["shadow_iframe_confirmed"] is True
        assert signals["shadow_iframe_evidence"]["rule_id"] == "SHADOW_CORE_CONTENT"
        
        # But type error is recorded for downstream awareness
        assert signals["main_text_type_error"] is True
        assert signals["main_text_type_error_kind"] == "NON_STRING"
    
    def test_type_error_does_not_prevent_iframe_classification(self):
        """
        Type error should not prevent classification if other conditions met
        (informational signal only)
        """
        raw = {
            # Iframe path conditions met
            "cross_origin_iframe_count": 1,
            "main_text_len": 0,  # Fallback value (still <= 200)
            "largest_iframe_area_ratio": 0.60,
            "largest_iframe_src": "https://example.com",
            # Type error present
            "main_text_type_error": True,
            "main_text_type_error_kind": "NON_STRING",
            # Shadow path
            "shadow_root_host_count": 0,
            "shadow_text_len": 0,
            # Required fields
            "html": "<html></html>",
            "network": [],
            "shadow_count": 0,
            "iframe_count": 1,
            "semantic_tags_present": False,
            "api_endpoints": [],
            "status_codes": [],
            "initial_dom_text_length": 0,
            "api_endpoints_after_scroll": [],
            "dom_count_initial": 30,
            "dom_count_after_scroll": 30,
            "sample_classes_initial": [],
            "sample_classes_after_scroll": [],
            "websocket_opened_count": 0,
            "websocket_urls": [],
            "websocket_events": []
        }
        
        signals = compute_signals(raw)
        
        # Iframe path: cross_origin >= 1, main_text_len <= 200, ratio >= 0.30
        # All conditions satisfied (main_text_len = 0 after fallback)
        assert signals["shadow_iframe_confirmed"] is True
        assert signals["shadow_iframe_evidence"]["rule_id"] == "IFRAME_CORE_CONTENT"
        
        # Type error recorded but doesn't block classification
        assert signals["main_text_type_error"] is True


class TestBackwardCompatibility:
    """Verify output schema remains backward compatible"""
    
    def test_new_fields_are_additive(self):
        """New fields should be additive, not breaking existing schema"""
        raw = {
            "main_text_len": 100,
            "main_text_type_error": False,
            "main_text_type_error_kind": None,
            # All existing required fields
            "cross_origin_iframe_count": 0,
            "largest_iframe_area_ratio": 0.0,
            "largest_iframe_src": None,
            "shadow_root_host_count": 0,
            "shadow_text_len": 0,
            "html": "<html></html>",
            "network": [],
            "shadow_count": 0,
            "iframe_count": 0,
            "semantic_tags_present": False,
            "api_endpoints": [],
            "status_codes": [],
            "initial_dom_text_length": 100,
            "api_endpoints_after_scroll": [],
            "dom_count_initial": 50,
            "dom_count_after_scroll": 50,
            "sample_classes_initial": [],
            "sample_classes_after_scroll": [],
            "websocket_opened_count": 0,
            "websocket_urls": [],
            "websocket_events": []
        }
        
        signals = compute_signals(raw)
        
        # All existing MVP-9 fields should still be present
        assert "main_text_len" in signals
        assert "shadow_root_host_count" in signals
        assert "shadow_text_len" in signals
        assert "cross_origin_iframe_count" in signals
        assert "largest_iframe_area_ratio" in signals
        assert "largest_iframe_src" in signals
        
        # New fields added
        assert "main_text_type_error" in signals
        assert "main_text_type_error_kind" in signals
