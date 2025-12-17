"""
Batch processing script for crawl_predictor.
Reads URLs from dataset.csv and generates analysis results.
"""

import csv
import json
from datetime import datetime
from crawl_predictor.main import analyze


def run_batch(input_file: str, output_file: str):
    """
    Process URLs from input CSV and save results to output CSV.
    
    Args:
        input_file: Path to CSV file with URLs (one per line)
        output_file: Path to output CSV file
    """
    results = []
    
    # Read URLs from CSV
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        urls = [row[0].strip() for row in reader if row]
    
    print(f"Found {len(urls)} URLs to process")
    print("=" * 70)
    
    # Process each URL
    for idx, url in enumerate(urls, 1):
        print(f"\n[{idx}/{len(urls)}] Processing: {url}")
        
        try:
            # Run analysis
            result = analyze(url)
            results.append(result)
            
            # Print summary
            print(f"  ✓ SLAP: {result['slap']}")
            print(f"  ✓ Difficulty: {result['difficulty']}/5")
            print(f"  ✓ Crawlability: {result['crawlability']}")
            if result['blockers']:
                print(f"  ✓ Blockers: {', '.join(result['blockers'])}")
                
        except Exception as e:
            print(f"  ✗ Error: {str(e)}")
            # Add error result
            results.append({
                "url": url,
                "slap": "ERROR",
                "difficulty": 0,
                "crawlability": "ERROR",
                "blockers": [str(e)],
                "signals": {}
            })
    
    print("\n" + "=" * 70)
    print(f"Processing complete. Saving results to {output_file}")
    
    # Save to CSV
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['url', 'slap', 'difficulty', 'crawlability', 'blockers', 
                      'semantic_tags', 'api_count', 'captcha', 'login_required', 
                      'bot_score', 'shadow', 'iframe',
                      'framework_detected', 'interactive_loading', 'api_soft_block']  # MVP-2
        
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for result in results:
            signals = result.get('signals', {})
            row = {
                'url': result['url'],
                'slap': result['slap'],
                'difficulty': result['difficulty'],
                'crawlability': result['crawlability'],
                'blockers': '; '.join(result.get('blockers', [])),
                'semantic_tags': signals.get('semantic_tags', ''),
                'api_count': signals.get('api_count', ''),
                'captcha': signals.get('captcha', ''),
                'login_required': signals.get('login_required', ''),
                'bot_score': signals.get('bot_score', ''),
                'shadow': signals.get('shadow', ''),
                'iframe': signals.get('iframe', ''),
                # MVP-2 signals
                'framework_detected': signals.get('framework_detected', ''),
                'interactive_loading': signals.get('interactive_loading', ''),
                'api_soft_block': signals.get('api_soft_block', '')
            }
            writer.writerow(row)
    
    # Also save full JSON
    json_output = output_file.replace('.csv', '.json')
    with open(json_output, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    
    print(f"✓ CSV saved: {output_file}")
    print(f"✓ JSON saved: {json_output}")
    
    # Print statistics
    print("\n" + "=" * 70)
    print("STATISTICS")
    print("=" * 70)
    
    crawlability_counts = {}
    difficulty_counts = {}
    
    for result in results:
        crawl = result['crawlability']
        diff = result['difficulty']
        
        crawlability_counts[crawl] = crawlability_counts.get(crawl, 0) + 1
        difficulty_counts[diff] = difficulty_counts.get(diff, 0) + 1
    
    print("\nCrawlability Distribution:")
    for status, count in sorted(crawlability_counts.items()):
        percentage = (count / len(results)) * 100
        print(f"  {status:10s}: {count:3d} ({percentage:5.1f}%)")
    
    print("\nDifficulty Distribution:")
    for level, count in sorted(difficulty_counts.items()):
        percentage = (count / len(results)) * 100
        print(f"  Level {level}: {count:3d} ({percentage:5.1f}%)")
    
    print("\n" + "=" * 70)


if __name__ == "__main__":
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_batch("dataset.csv", f"results_{timestamp}.csv")
