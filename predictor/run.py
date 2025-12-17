"""
CLI entry point for crawl_predictor package.

Usage:
    python run.py https://example.com

Output:
    JSON result (pretty-printed)
"""

import argparse
import json
from crawl_predictor.main import analyze


def main():
    """
    Main CLI function.
    Accepts URL as argument and prints JSON result.
    """
    parser = argparse.ArgumentParser(
        description="Analyze URL crawlability using rule-based SLAP predictor"
    )
    parser.add_argument(
        "url",
        type=str,
        help="URL to analyze"
    )
    
    args = parser.parse_args()
    
    print(f"Analyzing: {args.url}")
    print("-" * 60)
    
    # Run analysis
    result = analyze(args.url)
    
    # Print JSON output (pretty-print)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
