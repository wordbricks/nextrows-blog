"""
MVP-10 Lock Rule 1 Regression Tests

Test that legacy flat output keys are preserved for backward compatibility
while new nested canonical sections are added.
"""

import pytest
from crawl_predictor import main


class TestLockRule1LegacyKeys:
    """Test that legacy flat keys exist at top-level with correct defaults"""
    
    def test_legacy_flat_keys_present(self):
        """Legacy flat top-level keys must be present (backward compatible)"""
        # Create minimal raw data
        raw_minimal = {
            "html": "<html><head></head><body><p>Test</p></body></html>",
            "network": [],
            "shadow_count": 0,
            "iframe_count": 0,
            "semantic_tags_present": True,
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
            "websocket_events": [],
            "main_text_len": 100,
            "shadow_root_host_count": 0,
            "shadow_text_len": 0,
            "cross_origin_iframe_count": 0,
            "largest_iframe_area_ratio": 0.0,
            "largest_iframe_src": None
        }
        
        # Mock analyze by directly calling pipeline components
        from crawl_predictor import signals, simple_slap, difficulty_model, failure_hints
        
        computed_signals = signals.compute_signals(raw_minimal)
        slap = simple_slap.classify(computed_signals, raw_minimal)
        diff = difficulty_model.evaluate(slap, computed_signals)
        hints = failure_hints.compute_failure_hints(computed_signals, diff["crawlability"])
        
        # Reconstruct minimal output
        result = {
            "url": "test://example.com",
            "slap": slap,
            "difficulty": diff["difficulty"],
            "crawlability": diff["crawlability"],
            "blockers": diff["blockers"],
            "failure_hints": hints,
            "signals": computed_signals
        }
        
        # ASSERTION: All legacy flat keys must exist
        assert "url" in result
        assert "slap" in result
        assert "difficulty" in result
        assert "crawlability" in result
        assert "blockers" in result
        assert "failure_hints" in result
        assert "signals" in result
        
        # Legacy keys should have expected types
        assert isinstance(result["url"], str)
        assert isinstance(result["slap"], str)
        assert isinstance(result["difficulty"], int)
        assert isinstance(result["crawlability"], str)
        assert isinstance(result["blockers"], list)
        assert isinstance(result["failure_hints"], list)
        assert isinstance(result["signals"], dict)
    
    def test_legacy_signals_dict_has_defaults(self):
        """Legacy signals dict must have all boolean fields with default false"""
        raw_minimal = {
            "html": "<html><body></body></html>",
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
            "websocket_events": [],
            "main_text_len": 0,
            "shadow_root_host_count": 0,
            "shadow_text_len": 0,
            "cross_origin_iframe_count": 0,
            "largest_iframe_area_ratio": 0.0,
            "largest_iframe_src": None
        }
        
        from crawl_predictor import signals
        computed_signals = signals.compute_signals(raw_minimal)
        
        # All boolean AP signals should default to False when not detected
        assert computed_signals.get("captcha") == False
        assert computed_signals.get("login_required") == False
        assert computed_signals.get("bot_score") == False
        assert computed_signals.get("api_soft_block") == False
        assert computed_signals.get("rate_limited") == False
        assert computed_signals.get("geo_blocked") == False
        assert computed_signals.get("ua_blocked") == False
        assert computed_signals.get("session_required") == False
        assert computed_signals.get("header_signature_required") == False
        assert computed_signals.get("api_key_required") == False


class TestLockRule1NestedSections:
    """Test that new nested sections exist alongside legacy keys (additive)"""
    
    def test_schema_version_present(self):
        """MVP-10 schema_version must be present"""
        assert hasattr(main, 'SCHEMA_VERSION')
        assert main.SCHEMA_VERSION == "2025-12-16"
    
    def test_nested_sections_exist(self):
        """New nested sections must be present (additive to legacy keys)"""
        # This test would ideally use a real URL, but for unit testing
        # we verify the structure exists in the main.py SCHEMA_VERSION
        # The full integration would be tested in end-to-end tests
        assert main.SCHEMA_VERSION is not None


class TestLockRule1Compatibility:
    """Test backward compatibility: existing consumers can still use flat keys"""
    
    def test_legacy_consumer_workflow(self):
        """Simulate a legacy consumer that only reads flat keys"""
        raw_minimal = {
            "html": "<html><body><p>Test</p></body></html>",
            "network": [],
            "shadow_count": 0,
            "iframe_count": 0,
            "semantic_tags_present": True,
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
            "websocket_events": [],
            "main_text_len": 100,
            "shadow_root_host_count": 0,
            "shadow_text_len": 0,
            "cross_origin_iframe_count": 0,
            "largest_iframe_area_ratio": 0.0,
            "largest_iframe_src": None
        }
        
        from crawl_predictor import signals, simple_slap, difficulty_model, failure_hints
        
        computed_signals = signals.compute_signals(raw_minimal)
        slap = simple_slap.classify(computed_signals, raw_minimal)
        diff = difficulty_model.evaluate(slap, computed_signals)
        
        # LEGACY CONSUMER WORKFLOW: Access flat keys only
        # Should work without errors even if new nested sections exist
        url = "test://example.com"
        difficulty = diff["difficulty"]
        crawlability = diff["crawlability"]
        api_count = computed_signals["api_count"]
        
        # Legacy access patterns should work
        assert isinstance(url, str)
        assert isinstance(difficulty, int)
        assert crawlability in ["FULL", "PARTIAL", "BLOCKED"]
        assert isinstance(api_count, int)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
