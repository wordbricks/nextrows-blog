"""
Test configuration and fixtures for crawl_predictor tests.

Ensures deterministic import paths for all test modules.
"""

import sys
from pathlib import Path

# Add project root to sys.path for deterministic imports
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
