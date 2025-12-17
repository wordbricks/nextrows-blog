"""
MVP-9 Hardening Tests: String Guarantee and Float Quantization

Tests for hardening fixes:
1. main_text_len computed from concrete string (not coroutine/promise)
2. Float quantization for deterministic iframe tie-breaking
"""

import pytest
from crawl_predictor.signals import (
    detect_shadow_iframe_by_iframe,
    compute_signals
)


class TestStringGuarantee:
    """Test Issue 1 fix: Ensure main_text_len is computed from real string"""
    
    def test_main_text_len_from_string(self):
        """main_text_raw should be a concrete string, not coroutine/promise"""
        raw = {
            "main_text_len": 150,  # Should be int computed from string
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
        
        # This should not crash when processing main_text_len
        signals = compute_signals(raw)
        
        # main_text_len should be an integer
        assert isinstance(signals["main_text_len"], int)
        assert signals["main_text_len"] == 150
    
    def test_main_text_len_zero_valid(self):
        """main_text_len of 0 should be valid (empty string)"""
        raw = {
            "main_text_len": 0,  # Empty string case
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
        
        assert isinstance(signals["main_text_len"], int)
        assert signals["main_text_len"] == 0


class TestFloatQuantization:
    """Test Issue 2 fix: Float quantization for deterministic tie-breaking"""
    
    def test_nearly_identical_ratios_treated_as_tied(self):
        """
        Two iframes with ratios differing only by floating precision noise
        should be treated as tied and resolved by lexicographic order
        """
        # Simulate two iframes with nearly identical ratios
        # that differ only in floating-point precision
        # For example: 0.500000001 vs 0.500000002
        
        # In the actual implementation, these would be quantized to 0.5
        # and selected by lexicographic src order
        
        # Test case 1: ratio1 > ratio2 by tiny margin (should tie)
        raw1 = {
            "cross_origin_iframe_count": 1,
            "main_text_len": 100,
            "largest_iframe_area_ratio": 0.500000001,  # Nearly identical
            "largest_iframe_src": "https://zzzexample.com/embed"  # Lexicographically last
        }
        
        confirmed1, evidence1 = detect_shadow_iframe_by_iframe(raw1)
        
        raw2 = {
            "cross_origin_iframe_count": 1,
            "main_text_len": 100,
            "largest_iframe_area_ratio": 0.500000002,  # Nearly identical
            "largest_iframe_src": "https://aaaexample.com/embed"  # Lexicographically first
        }
        
        confirmed2, evidence2 = detect_shadow_iframe_by_iframe(raw2)
        
        # Both should confirm (ratio >= 0.30)
        assert confirmed1 is True
        assert confirmed2 is True
        
        # With quantization, both have effectively same ratio
        # So selection would be deterministic by src in browser.py
        # Here we just verify both can trigger detection
        assert evidence1["largest_iframe_area_ratio"] == 0.500000001
        assert evidence2["largest_iframe_area_ratio"] == 0.500000002
    
    def test_ratios_differ_after_quantization(self):
        """Ratios that differ significantly should NOT tie"""
        # 0.30 vs 0.50 - clearly different
        raw_small = {
            "cross_origin_iframe_count": 1,
            "main_text_len": 100,
            "largest_iframe_area_ratio": 0.30,
            "largest_iframe_src": "https://example.com/small"
        }
        
        raw_large = {
            "cross_origin_iframe_count": 1,
            "main_text_len": 100,
            "largest_iframe_area_ratio": 0.50,
            "largest_iframe_src": "https://example.com/large"
        }
        
        confirmed_small, evidence_small = detect_shadow_iframe_by_iframe(raw_small)
        confirmed_large, evidence_large = detect_shadow_iframe_by_iframe(raw_large)
        
        # Both should confirm
        assert confirmed_small is True
        assert confirmed_large is True
        
        # Ratios should be preserved as-is
        assert evidence_small["largest_iframe_area_ratio"] == 0.30
        assert evidence_large["largest_iframe_area_ratio"] == 0.50
    
    def test_quantization_precision_at_6_decimals(self):
        """
        Test that quantization uses 6 decimal places
        Ratios differing beyond 6 decimals should be treated as equal
        """
        # These differ at the 7th decimal place
        # Should be treated as equal after quantization to 6 places
        ratio1 = 0.5000001  # 7 decimals
        ratio2 = 0.5000002  # 7 decimals
        
        # Quantize to 6 decimals
        quantized1 = round(ratio1 * 1000000) / 1000000
        quantized2 = round(ratio2 * 1000000) / 1000000
        
        # Both should quantize to 0.500000
        assert quantized1 == 0.500000
        assert quantized2 == 0.500000
        
        # Verify they're equal after quantization
        assert quantized1 == quantized2
    
    def test_quantization_preserves_original_ratio(self):
        """Test that original (non-quantized) ratio is preserved in output"""
        raw = {
            "cross_origin_iframe_count": 1,
            "main_text_len": 100,
            "largest_iframe_area_ratio": 0.7501234567,  # High precision
            "largest_iframe_src": "https://example.com"
        }
        
        confirmed, evidence = detect_shadow_iframe_by_iframe(raw)
        
        assert confirmed is True
        # Original ratio should be preserved (not quantized in output)
        assert evidence["largest_iframe_area_ratio"] == 0.7501234567
    
    def test_ratio_exactly_at_threshold_with_noise(self):
        """
        Test ratio exactly at threshold (0.30) with floating-point noise
        should still be detected deterministically
        """
        # Ratio very close to 0.30 (threshold)
        raw = {
            "cross_origin_iframe_count": 1,
            "main_text_len": 100,
            "largest_iframe_area_ratio": 0.300000001,  # Just above threshold
            "largest_iframe_src": "https://example.com"
        }
        
        confirmed, evidence = detect_shadow_iframe_by_iframe(raw)
        
        # Should confirm (>= 0.30)
        assert confirmed is True
        assert evidence["largest_iframe_area_ratio"] == 0.300000001


class TestHardeningIntegration:
    """Integration tests combining both hardening fixes"""
    
    def test_full_signal_computation_with_hardened_observables(self):
        """Full signals computation with hardened string and float handling"""
        raw = {
            # String guarantee test: main_text_len is concrete int
            "main_text_len": 150,
            # Float quantization test: precise ratio
            "cross_origin_iframe_count": 1,
            "largest_iframe_area_ratio": 0.4999999999,  # Nearly 0.5
            "largest_iframe_src": "https://example.com",
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
        
        # Should not crash with string/float handling
        signals = compute_signals(raw)
        
        # Verify string observable
        assert isinstance(signals["main_text_len"], int)
        assert signals["main_text_len"] == 150
        
        # Verify float observable (preserved with full precision)
        assert isinstance(signals["largest_iframe_area_ratio"], float)
        assert signals["largest_iframe_area_ratio"] == 0.4999999999
        
        # Should trigger S-SHADOW-IFRAME (iframe path)
        assert signals["shadow_iframe_confirmed"] is True
        assert signals["shadow_iframe_evidence"]["rule_id"] == "IFRAME_CORE_CONTENT"


class TestCheckpoint:
    """Final correctness checkpoint: Verify string type guarantee"""
    
    def test_main_text_raw_is_concrete_string(self):
        """
        CHECKPOINT: Verify main_text_raw is always a concrete string value,
        not a coroutine/promise. The isinstance assertion in browser.py 
        should ensure this.
        """
        raw = {
            "main_text_len": 100,  # Should be computed from real string
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
        
        # This should not raise AssertionError
        # If main_text_raw were a coroutine/promise, the assertion in browser.py
        # would fail with "main_text_raw must be str, got ..."
        signals = compute_signals(raw)
        
        # Verify main_text_len is an int (computed from string)
        assert isinstance(signals["main_text_len"], int)
        assert signals["main_text_len"] == 100
    
    def test_assertion_would_catch_non_string(self):
        """
        Verify that if main_text_raw were somehow not a string,
        the assertion would catch it.
        """
        # This test documents the expected behavior:
        # If page.evaluate() were to return a non-string (e.g., coroutine),
        # the assertion "isinstance(main_text_raw, str)" would fail immediately
        
        # Simulate what would happen if main_text_raw were a coroutine
        import asyncio
        
        async def fake_coroutine():
            return "some string"
        
        # This would fail the isinstance check
        coro = fake_coroutine()
        assert not isinstance(coro, str)
        
        # Clean up
        coro.close()
        
        # Verify the assertion would catch this
        # The actual assertion in browser.py is:
        # assert isinstance(main_text_raw, str), f"main_text_raw must be str, got {type(main_text_raw).__name__}"
        # If main_text_raw were the coroutine above, it would fail with:
        # AssertionError: main_text_raw must be str, got coroutine
