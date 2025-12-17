"""
MVP-10 Lock Rule 2 Regression Tests

Test that all evidence objects have stable shape with required fields.
Ensures _normalize_evidence() is applied everywhere.
"""

import pytest
from crawl_predictor import signals


class TestLockRule2EvidenceShape:
    """Test that all evidence objects have required keys with null defaults"""
    
    def test_normalize_evidence_helper_exists(self):
        """_normalize_evidence helper must exist"""
        assert hasattr(signals, '_normalize_evidence')
    
    def test_normalize_evidence_adds_missing_fields(self):
        """_normalize_evidence must add all required fields with null defaults"""
        # Minimal evidence (partial)
        partial_evidence = {
            "rule_id": "TEST_RULE",
            "where": "network"
        }
        
        normalized = signals._normalize_evidence(partial_evidence)
        
        # All required fields must be present
        assert "rule_id" in normalized
        assert "where" in normalized
        assert "url" in normalized
        assert "status" in normalized
        assert "header_name" in normalized
        assert "header_value" in normalized
        assert "snippet" in normalized
        
        # Missing fields should be None
        assert normalized["url"] is None
        assert normalized["status"] is None
        assert normalized["header_name"] is None
        assert normalized["header_value"] is None
        assert normalized["snippet"] is None
    
    def test_normalize_evidence_preserves_existing_fields(self):
        """_normalize_evidence must preserve existing field values"""
        full_evidence = {
            "rule_id": "RATE_429",
            "where": "network",
            "url": "https://example.com/api",
            "status": 429,
            "header_name": "retry-after",
            "header_value": "60",
            "snippet": "Rate limit exceeded"
        }
        
        normalized = signals._normalize_evidence(full_evidence)
        
        # All fields should be preserved
        assert normalized["rule_id"] == "RATE_429"
        assert normalized["where"] == "network"
        assert normalized["url"] == "https://example.com/api"
        assert normalized["status"] == 429
        assert normalized["header_name"] == "retry-after"
        assert normalized["header_value"] == "60"
        assert normalized["snippet"] == "Rate limit exceeded"
    
    def test_normalize_evidence_handles_null(self):
        """_normalize_evidence must handle None input safely"""
        normalized = signals._normalize_evidence(None)
        assert normalized is None
    
    def test_normalize_evidence_parses_header_string(self):
        """_normalize_evidence must parse 'header: value' format"""
        evidence_with_header_string = {
            "rule_id": "RATE_RETRY_AFTER",
            "where": "network",
            "header_name": "retry-after: 120"
        }
        
        normalized = signals._normalize_evidence(evidence_with_header_string)
        
        # Should split header into name and value
        assert normalized["header_name"] == "retry-after"
        assert normalized["header_value"] == "120"


class TestLockRule2AllDetectors:
    """Test that ALL evidence-emitting detectors use _normalize_evidence()"""
    
    def test_detect_rate_limit_evidence_normalized(self):
        """detect_rate_limit must return normalized evidence"""
        network_events = [{
            "resource_type": "xhr",
            "url": "https://example.com/api",
            "method": "GET",
            "status": 429,
            "response_headers": {},
            "response_preview": "",
            "capture_index": 0
        }]
        
        is_rate_limited, evidence = signals.detect_rate_limit(network_events)
        
        assert is_rate_limited is True
        assert evidence is not None
        
        # Verify all required fields present
        assert "rule_id" in evidence
        assert "where" in evidence
        assert "url" in evidence
        assert "status" in evidence
        assert "header_name" in evidence
        assert "header_value" in evidence
        assert "snippet" in evidence
    
    def test_detect_geo_block_evidence_normalized(self):
        """detect_geo_block must return normalized evidence"""
        html_text = "This service is not available in your region."
        network_events = []
        
        is_geo_blocked, evidence = signals.detect_geo_block(html_text, network_events)
        
        assert is_geo_blocked is True
        assert evidence is not None
        
        # Verify all required fields present
        assert "rule_id" in evidence
        assert "where" in evidence
        assert "url" in evidence
        assert "status" in evidence
        assert "header_name" in evidence
        assert "header_value" in evidence
        assert "snippet" in evidence
        
        # For HTML-based evidence
        assert evidence["where"] == "html"
        assert evidence["url"] is None
    
    def test_detect_ua_block_evidence_normalized(self):
        """detect_ua_block must return normalized evidence"""
        html_text = "Your browser is not supported. Please update your browser."
        network_events = []
        
        is_ua_blocked, evidence = signals.detect_ua_block(html_text, network_events)
        
        assert is_ua_blocked is True
        assert evidence is not None
        
        # Verify all required fields present
        assert "rule_id" in evidence
        assert "where" in evidence
        assert "url" in evidence
        assert "status" in evidence
        assert "header_name" in evidence
        assert "header_value" in evidence
        assert "snippet" in evidence
    
    def test_detect_streaming_evidence_normalized(self):
        """detect_streaming must return normalized evidence"""
        network_events = [{
            "resource_type": "xhr",
            "url": "https://example.com/events",
            "response_headers": {"content-type": "text/event-stream"},
            "capture_index": 0
        }]
        ws_events = []
        
        is_streaming, evidence = signals.detect_streaming(network_events, ws_events)
        
        assert is_streaming is True
        assert evidence is not None
        
        # Verify all required fields present
        assert "rule_id" in evidence
        assert "where" in evidence
        assert "url" in evidence
        assert "status" in evidence
        assert "header_name" in evidence
        assert "header_value" in evidence
        assert "snippet" in evidence
    
    def test_detect_shadow_iframe_by_iframe_evidence_normalized(self):
        """detect_shadow_iframe_by_iframe must return normalized evidence"""
        raw = {
            "cross_origin_iframe_count": 1,
            "main_text_len": 100,
            "largest_iframe_area_ratio": 0.5,
            "largest_iframe_src": "https://external.com/embed"
        }
        
        confirmed, evidence = signals.detect_shadow_iframe_by_iframe(raw)
        
        assert confirmed is True
        assert evidence is not None
        
        # Verify all required fields present
        assert "rule_id" in evidence
        assert "where" in evidence
        assert "url" in evidence
        assert "status" in evidence
        assert "header_name" in evidence
        assert "header_value" in evidence
        assert "snippet" in evidence
        
        # Verify S-SHADOW-IFRAME specific fields preserved
        assert "cross_origin_iframe_count" in evidence
        assert "largest_iframe_area_ratio" in evidence
    
    def test_detect_shadow_iframe_by_shadow_evidence_normalized(self):
        """detect_shadow_iframe_by_shadow must return normalized evidence"""
        raw = {
            "shadow_root_host_count": 1,
            "shadow_text_len": 500,
            "main_text_len": 100
        }
        
        confirmed, evidence = signals.detect_shadow_iframe_by_shadow(raw)
        
        assert confirmed is True
        assert evidence is not None
        
        # Verify all required fields present
        assert "rule_id" in evidence
        assert "where" in evidence
        assert "url" in evidence
        assert "status" in evidence
        assert "header_name" in evidence
        assert "header_value" in evidence
        assert "snippet" in evidence
        
        # Verify S-SHADOW-IFRAME specific fields preserved
        assert "shadow_root_host_count" in evidence
        assert "shadow_text_len" in evidence


class TestLockRule2NoOmittedKeys:
    """Test that no evidence object omits any required key"""
    
    def test_all_evidence_objects_complete(self):
        """Iterate over all evidence objects and assert no missing keys"""
        # Required fields for all evidence objects
        required_fields = {
            "rule_id", "where", "url", "status", 
            "header_name", "header_value", "snippet"
        }
        
        test_cases = [
            # Rate limit evidence
            ({
                "resource_type": "xhr",
                "url": "https://example.com/api",
                "method": "GET",
                "status": 429,
                "response_headers": {},
                "response_preview": "",
                "capture_index": 0
            }, signals.detect_rate_limit, []),
            
            # Geo block evidence
            ("This service is not available in your region.", 
             signals.detect_geo_block, []),
            
            # UA block evidence
            ("Your browser is not supported.", 
             signals.detect_ua_block, [])
        ]
        
        for test_input, detector_func, extra_args in test_cases:
            if isinstance(test_input, str):
                # HTML-based detector
                detected, evidence = detector_func(test_input, *extra_args)
            else:
                # Network-based detector
                detected, evidence = detector_func([test_input])
            
            if detected and evidence:
                # Verify all required fields present
                for field in required_fields:
                    assert field in evidence, \
                        f"{detector_func.__name__} evidence missing field: {field}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
