"""
MVP-9: Unit tests for S-SHADOW-IFRAME classification.

Tests confirm-only, deterministic behavior:
- Iframe confirmation path
- Shadow confirmation path  
- No false promotion from mere presence
- Deterministic tie-breaking
- Deterministic priority when both confirm

LOCKED DECISIONS:
1. IFRAME_CORE_CONTENT wins over SHADOW_CORE_CONTENT
2. Use main_text_len <= 200 (NOT key_selectors_missing)
"""

import pytest
from crawl_predictor.signals import (
    detect_shadow_iframe_by_iframe,
    detect_shadow_iframe_by_shadow,
    compute_signals
)
from crawl_predictor.simple_slap import classify


class TestShadowIframeByIframe:
    """Test iframe confirmation path (Rule Path A)"""
    
    def test_iframe_confirmed_positive(self):
        """All conditions met → should classify"""
        raw = {
            "cross_origin_iframe_count": 1,
            "main_text_len": 100,
            "largest_iframe_area_ratio": 0.50,
            "largest_iframe_src": "https://example.com/embed"
        }
        
        confirmed, evidence = detect_shadow_iframe_by_iframe(raw)
        
        assert confirmed is True
        assert evidence["rule_id"] == "IFRAME_CORE_CONTENT"
        assert evidence["cross_origin_iframe_count"] == 1
        assert evidence["main_text_len"] == 100
        assert evidence["largest_iframe_area_ratio"] == 0.50
        assert evidence["largest_iframe_src"] == "https://example.com/embed"
    
    def test_iframe_negative_main_text_too_high(self):
        """main_text_len > 200 → should NOT classify"""
        raw = {
            "cross_origin_iframe_count": 1,
            "main_text_len": 500,  # Above threshold
            "largest_iframe_area_ratio": 0.50,
            "largest_iframe_src": "https://example.com/embed"
        }
        
        confirmed, evidence = detect_shadow_iframe_by_iframe(raw)
        
        assert confirmed is False
        assert evidence is None
    
    def test_iframe_negative_area_ratio_too_low(self):
        """largest_iframe_area_ratio < 0.30 → should NOT classify"""
        raw = {
            "cross_origin_iframe_count": 1,
            "main_text_len": 100,
            "largest_iframe_area_ratio": 0.20,  # Below threshold
            "largest_iframe_src": "https://example.com/embed"
        }
        
        confirmed, evidence = detect_shadow_iframe_by_iframe(raw)
        
        assert confirmed is False
        assert evidence is None
    
    def test_iframe_negative_no_cross_origin(self):
        """cross_origin_iframe_count = 0 → should NOT classify"""
        raw = {
            "cross_origin_iframe_count": 0,  # No cross-origin iframes
            "main_text_len": 100,
            "largest_iframe_area_ratio": 0.50,
            "largest_iframe_src": None
        }
        
        confirmed, evidence = detect_shadow_iframe_by_iframe(raw)
        
        assert confirmed is False
        assert evidence is None
    
    def test_iframe_boundary_exact_thresholds(self):
        """Exact threshold values → should classify"""
        raw = {
            "cross_origin_iframe_count": 1,
            "main_text_len": 200,  # Exactly at threshold
            "largest_iframe_area_ratio": 0.30,  # Exactly at threshold
            "largest_iframe_src": "https://example.com/embed"
        }
        
        confirmed, evidence = detect_shadow_iframe_by_iframe(raw)
        
        assert confirmed is True
        assert evidence["rule_id"] == "IFRAME_CORE_CONTENT"


class TestShadowIframeByShadow:
    """Test shadow DOM confirmation path (Rule Path B)"""
    
    def test_shadow_confirmed_positive(self):
        """All conditions met → should classify"""
        raw = {
            "shadow_root_host_count": 1,
            "shadow_text_len": 300,
            "main_text_len": 100
        }
        
        confirmed, evidence = detect_shadow_iframe_by_shadow(raw)
        
        assert confirmed is True
        assert evidence["rule_id"] == "SHADOW_CORE_CONTENT"
        assert evidence["shadow_root_host_count"] == 1
        assert evidence["shadow_text_len"] == 300
        assert evidence["main_text_len"] == 100
    
    def test_shadow_negative_closed_shadow(self):
        """shadow_text_len = 0 (closed shadow) → should NOT classify"""
        raw = {
            "shadow_root_host_count": 1,
            "shadow_text_len": 0,  # Closed/inaccessible shadow
            "main_text_len": 100
        }
        
        confirmed, evidence = detect_shadow_iframe_by_shadow(raw)
        
        assert confirmed is False
        assert evidence is None
    
    def test_shadow_negative_insufficient_shadow_text(self):
        """shadow_text_len < 200 → should NOT classify"""
        raw = {
            "shadow_root_host_count": 1,
            "shadow_text_len": 150,  # Below threshold
            "main_text_len": 100
        }
        
        confirmed, evidence = detect_shadow_iframe_by_shadow(raw)
        
        assert confirmed is False
        assert evidence is None
    
    def test_shadow_negative_main_text_too_high(self):
        """main_text_len > 200 → should NOT classify (LOCKED DECISION 2)"""
        raw = {
            "shadow_root_host_count": 1,
            "shadow_text_len": 300,
            "main_text_len": 250  # Above threshold
        }
        
        confirmed, evidence = detect_shadow_iframe_by_shadow(raw)
        
        assert confirmed is False
        assert evidence is None
    
    def test_shadow_boundary_exact_thresholds(self):
        """Exact threshold values → should classify"""
        raw = {
            "shadow_root_host_count": 1,
            "shadow_text_len": 200,  # Exactly at threshold
            "main_text_len": 200    # Exactly at threshold
        }
        
        confirmed, evidence = detect_shadow_iframe_by_shadow(raw)
        
        assert confirmed is True
        assert evidence["rule_id"] == "SHADOW_CORE_CONTENT"


class TestNoFalsePromotion:
    """Test that mere presence does not trigger classification"""
    
    def test_iframe_presence_alone_insufficient(self):
        """iframe_count > 0 alone should NOT classify"""
        raw = {
            "iframe_count": 2,
            "cross_origin_iframe_count": 0,  # Not cross-origin
            "main_text_len": 100,
            "largest_iframe_area_ratio": 0.10,  # Below threshold
            "shadow_root_host_count": 0
        }
        
        iframe_confirmed, _ = detect_shadow_iframe_by_iframe(raw)
        shadow_confirmed, _ = detect_shadow_iframe_by_shadow(raw)
        
        assert iframe_confirmed is False
        assert shadow_confirmed is False
    
    def test_shadow_presence_alone_insufficient(self):
        """shadow_root_host_count > 0 alone should NOT classify"""
        raw = {
            "shadow_root_host_count": 1,
            "shadow_text_len": 0,  # No accessible text
            "main_text_len": 500,  # High main text
            "cross_origin_iframe_count": 0
        }
        
        iframe_confirmed, _ = detect_shadow_iframe_by_iframe(raw)
        shadow_confirmed, _ = detect_shadow_iframe_by_shadow(raw)
        
        assert iframe_confirmed is False
        assert shadow_confirmed is False


class TestDeterministicPriority:
    """Test LOCKED DECISION 1: IFRAME_CORE_CONTENT > SHADOW_CORE_CONTENT"""
    
    def test_both_rules_confirm_iframe_wins(self):
        """When both iframe and shadow confirm, evidence uses iframe path"""
        raw = {
            # Iframe path conditions (all met)
            "cross_origin_iframe_count": 2,
            "largest_iframe_area_ratio": 0.60,
            "largest_iframe_src": "https://example.com/embed",
            # Shadow path conditions (all met)
            "shadow_root_host_count": 1,
            "shadow_text_len": 500,
            # Shared condition
            "main_text_len": 150,
            # Other required fields
            "html": "<html></html>",
            "network": [],
            "shadow_count": 1,
            "iframe_count": 2,
            "semantic_tags_present": False,
            "api_endpoints": [],
            "status_codes": [],
            "initial_dom_text_length": 150,
            "api_endpoints_after_scroll": [],
            "dom_count_initial": 100,
            "dom_count_after_scroll": 100,
            "sample_classes_initial": [],
            "sample_classes_after_scroll": [],
            "websocket_opened_count": 0,
            "websocket_urls": [],
            "websocket_events": []
        }
        
        signals = compute_signals(raw)
        
        # Both paths should confirm individually
        assert signals["shadow_iframe_by_iframe"] is True
        assert signals["shadow_iframe_by_shadow"] is True
        
        # Combined confirmation should be true
        assert signals["shadow_iframe_confirmed"] is True
        
        # Evidence should use IFRAME path (LOCKED DECISION 1)
        assert signals["shadow_iframe_evidence"]["rule_id"] == "IFRAME_CORE_CONTENT"
        assert "cross_origin_iframe_count" in signals["shadow_iframe_evidence"]
        assert "largest_iframe_area_ratio" in signals["shadow_iframe_evidence"]
    
    def test_classification_with_both_confirmed(self):
        """Full classification test when both paths confirm"""
        raw = {
            # Iframe path met
            "cross_origin_iframe_count": 1,
            "largest_iframe_area_ratio": 0.40,
            "largest_iframe_src": "https://example.com",
            # Shadow path met
            "shadow_root_host_count": 1,
            "shadow_text_len": 300,
            # Shared
            "main_text_len": 100,
            # Required fields for compute_signals
            "html": "<html></html>",
            "network": [],
            "shadow_count": 1,
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
        assert "S-SHADOW-IFRAME" in classification


class TestIntegration:
    """Integration tests with full signal computation and classification"""
    
    def test_iframe_path_full_integration(self):
        """End-to-end test for iframe confirmation path"""
        raw = {
            "cross_origin_iframe_count": 1,
            "main_text_len": 80,
            "largest_iframe_area_ratio": 0.75,
            "largest_iframe_src": "https://player.vimeo.com/video/123",
            "shadow_root_host_count": 0,
            "shadow_text_len": 0,
            # Required fields
            "html": "<html><iframe src='https://player.vimeo.com/video/123'></iframe></html>",
            "network": [],
            "shadow_count": 0,
            "iframe_count": 1,
            "semantic_tags_present": False,
            "api_endpoints": [],
            "status_codes": [],
            "initial_dom_text_length": 80,
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
        classification = classify(signals, raw)
        
        assert signals["shadow_iframe_confirmed"] is True
        assert signals["shadow_iframe_evidence"]["rule_id"] == "IFRAME_CORE_CONTENT"
        assert "S-SHADOW-IFRAME" in classification
    
    def test_shadow_path_full_integration(self):
        """End-to-end test for shadow confirmation path"""
        raw = {
            "shadow_root_host_count": 2,
            "shadow_text_len": 1000,
            "main_text_len": 50,
            "cross_origin_iframe_count": 0,
            "largest_iframe_area_ratio": 0.0,
            "largest_iframe_src": None,
            # Required fields
            "html": "<html><div></div></html>",
            "network": [],
            "shadow_count": 2,
            "iframe_count": 0,
            "semantic_tags_present": False,
            "api_endpoints": [],
            "status_codes": [],
            "initial_dom_text_length": 50,
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
        classification = classify(signals, raw)
        
        assert signals["shadow_iframe_confirmed"] is True
        assert signals["shadow_iframe_evidence"]["rule_id"] == "SHADOW_CORE_CONTENT"
        assert "S-SHADOW-IFRAME" in classification
    
    def test_priority_vs_s_shadow(self):
        """S-SHADOW-IFRAME should have priority over S-SHADOW"""
        # Case where both S-SHADOW-IFRAME and S-SHADOW conditions could match
        raw = {
            # S-SHADOW-IFRAME conditions (met)
            "cross_origin_iframe_count": 1,
            "largest_iframe_area_ratio": 0.50,
            "largest_iframe_src": "https://example.com",
            "main_text_len": 150,
            # S-SHADOW conditions (also met: shadow > 0, no semantic tags, initial_text < 200)
            "shadow_root_host_count": 1,
            "shadow_text_len": 100,  # Not enough for S-SHADOW-IFRAME shadow path
            # Required fields
            "html": "<html></html>",
            "network": [],
            "shadow_count": 1,
            "iframe_count": 1,
            "semantic_tags_present": False,
            "api_endpoints": [],
            "status_codes": [],
            "initial_dom_text_length": 150,
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
        classification = classify(signals, raw)
        
        # Should prioritize S-SHADOW-IFRAME over S-SHADOW
        assert "S-SHADOW-IFRAME" in classification
        assert signals["shadow_iframe_confirmed"] is True
