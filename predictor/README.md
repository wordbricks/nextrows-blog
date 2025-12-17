# Crawl Predictor - Single-URL Execution Engine

## 📦 Package Overview

A **minimal, deterministic crawlability predictor** for **single URLs** using only observable browser signals.

**Scope**: Pure execution engine - Analyzes one URL at a time, no dataset-wide logic.

**No heuristics. No ML. No LLM. No guessing. No multi-URL analysis.**

**Current Version**: MVP-10 (Schema: 2025-12-16)
- ✅ SLAP classification (Structure, Loading, Access Protection)
- ✅ Difficulty scoring (1-5)
- ✅ Failure Hints - Explains where/why crawling may fail
- ✅ **Production-hardened** - Stable schema, normalized evidence, backward compatible
- ✅ **Execution-only design** - All signals exist purely for crawlability/difficulty/strategy decisions

---

## 🏗️ Architecture

```
crawl_predictor/
├── __init__.py           # Package initialization
├── browser.py            # Single-pass URL loading (Playwright)
├── signals.py            # Deterministic signal detection
├── simple_slap.py        # SLAP classification (S-L-AP)
├── difficulty_model.py   # Rule-based difficulty scoring
├── failure_hints.py      # MVP-4: Crawl risk annotation
└── main.py               # Pipeline orchestrator

run.py                    # CLI entry point
run_batch.py              # Batch processing
```

---

## 🔧 Installation

```bash
pip install playwright
playwright install chromium
```

---

## 🚀 Usage

### Single URL Analysis

```bash
python run.py https://example.com
```

**Output (MVP-10):**
```json
{
  "schema_version": "2025-12-16",
  "structure": {
    "subcategory": "S-STATIC",
    "signals": {"shadow": 0, "iframe": 0, "semantic_tags": true, ...},
    "evidence": null
  },
  "loading": {
    "subcategory": "L-STATIC",
    "signals": {"api_count": 0, "is_streaming": false, ...},
    "evidence": null
  },
  "access_protection": {
    "subcategory": "AP-NONE",
    "signals": {"captcha": false, "rate_limited": false, ...},
    "evidence": null
  },
  "url": "https://example.com",
  "slap": "S-STATIC, L-STATIC, AP-NONE",
  "difficulty": 1,
  "crawlability": "FULL",
  "blockers": [],
  "failure_hints": [],
  "signals": {"semantic_tags": true, "api_count": 0, ...}
}
```

### Batch Processing

```bash
python run_batch.py
```

Processes all URLs in `dataset.csv` and generates:
- `results_TIMESTAMP.csv` - Spreadsheet format
- `results_TIMESTAMP.json` - Full JSON output

---

## 📊 Classification Rules

### S-Axis (Structure)

**MVP-5 Enhanced - Stricter boundary rules:**

1. **S-PROGRESSIVE**: `framework_detected == True AND semantic_tags == True AND api_count > 5 AND initial_text_length >= TEXT_THRESHOLD (750)` - MVP-5: Requires meaningful content
2. **S-SHADOW**: `shadow > 0 AND semantic_tags == False AND initial_text_length < 200` - MVP-5: Requires minimal text (data hiding)
3. **S-STATIC**: `semantic_tags == True AND api_count == 0 AND NOT framework_detected`
4. **S-CSR**: `semantic_tags == True AND api_count > 0 AND initial_text_length < TEXT_THRESHOLD (750)`
5. **S-SSR**: `semantic_tags == True AND api_count > 0 AND initial_text_length >= TEXT_THRESHOLD`
6. **S-UNKNOWN**: Otherwise

### L-Axis (Loading)

**MVP-3 Enhanced:**

- **L-INTERACTIVE**: `api_count == 0 AND interactive_loading == True`
- **L-API**: `api_count > 0 OR api_count_after_scroll > 0`
- **L-STATIC**: Otherwise

### AP-Axis (Access Protection)

**Priority order:**

1. **AP-CAPTCHA**: Explicit CAPTCHA challenge detected
2. **AP-LOGIN**: Login wall detected
3. **AP-BOT-SCORE**: Bot blocking detected OR API soft-blocking (`api_soft_block == True`)
4. **AP-NONE**: No protection detected

---

## 🚨 Failure Hints (MVP-4)

**New Layer**: Deterministic, rule-based hints explaining crawl risk surface.

| Hint | Trigger | Meaning |
|------|---------|---------|
| **REQUIRES_SCROLL_HANDLING** | `api_count_after_scroll > 0` | Page uses infinite scroll or lazy-loading |
| **API_VOLUME_HIGH** | `api_count >= 30` | High API fan-out, cost/timeout risk |
| **BOT_PRESSURE_SOFT** | `api_soft_block OR bot_score` | Repeated crawling likely to trigger defenses |
| **SESSION_SENSITIVE** | `login_required OR (api_count > 10 AND initial_text_length < 750)` | Session continuity critical for data access |
| **DOM_COMPLEXITY_HIGH** | `shadow >= 50 OR iframe >= 20` | Selector instability, fragile extraction |

**Key Properties:**
- ✅ Multiple hints can apply simultaneously
- ✅ Empty array if no risks detected
- ✅ Does NOT affect SLAP or difficulty scores
- ✅ Fully deterministic (same URL → same hints)

---

## 🎯 Signal Detection Rules

### CAPTCHA Detection (STRICT)

**Only matches explicit challenges:**
- "verify you are not a robot"
- "select all images"
- "unusual traffic"
- "automated queries"
- "please stand by"
- "hcaptcha"
- "recaptcha challenge"

❌ **Hidden recaptcha scripts DO NOT count**

### Login Wall Detection

**Only matches when main content is replaced:**
- "sign in to continue"
- "please log in"
- "you must log in"
- "login required"
- "continue with your account"

❌ **Header/footer login links DO NOT count**

### Bot Score Detection

**Triggered by:**

1. Explicit soft-block messages:
   - "unusual traffic"
   - "automated queries"
   - "bot detection"
   - "too many requests"
   - "access denied"
   - "verify your request"

2. Empty API responses:
   - `"items":[]`
   - `"results":[]`
   - `"data":[]`

### API Soft-Blocking (MVP-2)

**Stricter rules to reduce false positives:**
- Content-Type: `application/json`
- URL contains: `items`, `results`, `feed`, `search`
- HTTP Status: `200`
- Body size: `< 50 bytes`

---

## 📈 Difficulty Scoring

### Hard Blockers (Override)

| AP Type | Difficulty | Crawlability |
|---------|-----------|--------------
| **AP-CAPTCHA** | 5 | BLOCKED |
| **AP-LOGIN** | 4 | PARTIAL |
| **AP-BOT-SCORE** | 4 | PARTIAL |

### Progressive Scoring (No Blockers)

**Base**: `difficulty = 1`

**Add +1 if:**
- `api_count > 0`
- `shadow > 0`
- `iframe > 3`

**Max**: `difficulty = 5`

### Crawlability Mapping

| Difficulty | Crawlability |
|-----------|--------------
| 1-3 | FULL |
| 4 | PARTIAL |
| 5 | BLOCKED |

---

## 📊 Example Output (MVP-4)

### Complex Page with Multiple Hints

```json
{
  "url": "https://www.nytimes.com/section/technology",
  "slap": "S-PROGRESSIVE, L-API, AP-NONE",
  "difficulty": 3,
  "crawlability": "FULL",
  "blockers": [],
  "failure_hints": [
    "REQUIRES_SCROLL_HANDLING",
    "API_VOLUME_HIGH",
    "DOM_COMPLEXITY_HIGH"
  ],
  "signals": {
    "api_count": 44,
    "api_count_after_scroll": 7,
    "iframe": 27
  }
}
```

### Session-Sensitive Page

```json
{
  "url": "https://store.epicgames.com/en-US/browse",
  "slap": "S-STATIC, L-INTERACTIVE, AP-LOGIN",
  "difficulty": 4,
  "crawlability": "PARTIAL",
  "blockers": ["LOGIN"],
  "failure_hints": [
    "SESSION_SENSITIVE",
    "DOM_COMPLEXITY_HIGH"
  ],
  "signals": {
    "login_required": true,
    "shadow": 122
  }
}
```

---

## 📋 Module Details

### `browser.py`

**Function**: `load_url(url: str) -> dict`

**Returns:**
- `url`: Loaded URL
- `html`: Page HTML content
- `network`: Network request log
- `shadow_count`: Shadow root count
- `iframe_count`: Iframe count
- `semantic_tags_present`: Semantic tag detection
- `api_endpoints`: API endpoint URLs
- `initial_dom_text_length`: MVP-3 - Initial text length
- `api_endpoints_after_scroll`: MVP-3 - APIs after scroll

**Note**: Single-pass load with deterministic scroll probe. **Operates on one URL at a time - no cross-URL dependencies.**

### `signals.py`

**Function**: `compute_signals(raw) -> dict`

**Returns all MVP-3 signals:**
- `semantic_tags`, `api_count`, `captcha`, `login_required`, `bot_score`
- `shadow`, `iframe`
- `framework_detected`, `interactive_loading`, `api_soft_block` (MVP-2)
- `initial_text_length`, `api_count_after_scroll` (MVP-3)

### `failure_hints.py` (MVP-4)

**Function**: `compute_failure_hints(signals) -> List[str]`

**Returns**: Ordered list of failure hint strings (empty if no risks).

### `simple_slap.py`

**Function**: `classify(signals, raw) -> str`

**Returns**: `"S-XXX, L-XXX, AP-XXX"`

### `difficulty_model.py`

**Function**: `evaluate(slap_label, signals) -> dict`

**Returns:**
- `difficulty`: int (1-5)
- `crawlability`: str ("FULL" | "PARTIAL" | "BLOCKED")
- `blockers`: List[str]

### `main.py`

**Function**: `analyze(url: str) -> dict`

**Pipeline (MVP-4):**
1. Load URL → raw data
2. Compute signals
3. Classify SLAP
4. Evaluate difficulty
5. **Compute failure hints** (non-intrusive)

**Returns:** Complete analysis result with failure hints.

---

## 🧪 Testing

### Determinism Test
```bash
python tests/test_determinism.py
```
Verifies same URL produces identical results across runs.

### MVP-3 Signals Test
```bash
python tests/test_mvp3_signals.py
```
Tests CSR/SSR and STATIC/INTERACTIVE boundary clarification.

### MVP-4 Hints Test
```bash
python tests/test_mvp4_hints.py
```
Validates failure hints determinism and rule triggers.

---

## 📝 Dependencies

- **Python 3.7+**
- **playwright** - Browser automation

---

## 🎯 Design Philosophy

**Single-URL Execution Engine** means:
1. ✅ **Deterministic**: Same input → same output
2. ✅ **Transparent**: Every decision is traceable
3. ✅ **Observable**: Only measurable facts from single URL
4. ✅ **No guessing**: If uncertain → S-UNKNOWN
5. ✅ **No ML**: Pure logic rules
6. ✅ **Execution-only**: All signals serve crawlability/difficulty/strategy decisions
7. ✅ **Single-URL scope**: No dataset-wide analysis, no prevalence tracking, no multi-URL reasoning

**What this system does:**
- Answers 4 questions for a single URL in a single session:
  1. How difficult is this page to crawl?
  2. Is crawling feasible in this session?
  3. If not feasible, what is the blocking reason?
  4. What extraction strategy is required?

**What this system does NOT do:**
- ❌ Multi-URL analysis or aggregation
- ❌ Dataset-wide prevalence tracking
- ❌ Governance or promotion decisions
- ❌ Human-facing interpretability beyond execution needs

This predictor is **intentionally simple** to maintain reliability and predictability.

---

## 🗂️ Version History

### MVP-10 (Current - 2025-12-16)
- ✅ **Production hardening** - Stable schema versioning ("2025-12-16")
- ✅ **Lock Rule 1**: Backward compatible output (legacy flat keys + new nested sections)
- ✅ **Lock Rule 2**: Evidence normalization enforced everywhere
- ✅ **Schema stability**: All evidence objects have 7 required fields (rule_id, where, url, status, header_name, header_value, snippet)
- ✅ **Zero breaking changes**: Existing consumers continue working unchanged

### MVP-6.5
- ✅ **Documentation clarity** - Explicitly stated execution-only scope
- ✅ **Confirmed**: Code already operates on single URLs with no governance logic
- ✅ **Removed**: All references to dataset-wide analysis from documentation

### MVP-5
- ✅ Strengthened AP-BOT-SCORE detection (stricter single-session evidence)
- ✅ Enhanced AP-LOGIN precision (confirmed-only assignment)
- ✅ Tightened S-PROGRESSIVE boundary (requires `initial_text_length >= 750`)
- ✅ Reduced S-SHADOW false positives (requires `initial_text_length < 200`)
- ✅ Comprehensive inline comments for all classification rules

### MVP-4
- ✅ Failure hints layer
- ✅ 5 deterministic crawl risk annotations
- ✅ Non-intrusive (no SLAP/difficulty impact)

### MVP-3
- ✅ CSR/SSR boundary clarification (`initial_text_length`)
- ✅ STATIC/INTERACTIVE refinement (`api_count_after_scroll`)
- ✅ S-PROGRESSIVE classification
- ✅ L-INTERACTIVE classification

### MVP-2
- ✅ Framework detection
- ✅ Interactive loading patterns
- ✅ API soft-blocking detection
- ✅ Enhanced AP-BOT-SCORE

### MVP-1
- ✅ Basic SLAP classification
- ✅ Difficulty scoring
- ✅ Core signal detection

---

## 🔧 S-UNKNOWN Reduction (Latest Enhancement)

**Date**: 2025-12-16  
**Status**: Fully Implemented

### Objective

Reduce S-UNKNOWN occurrences through better DOM observation, diagnostic signals, and explicit failure categorization.

### Implementation

#### 1. URL Normalization
- Auto-prepends `https://` to URLs without schemes
- **Signals**: `input_url_raw`, `url_normalized`, `url_normalization_rule`

#### 2. DOM Readiness Gate
- Waits for `document.body` and `readyState` before measurements (1500ms timeout)
- **Signals**: `dom_ready`, `dom_ready_rule`, `readiness_gate_timeout`

#### 3. Non-Fatal Measurements
- All `page.evaluate()` calls wrapped with error handling
- First-failure policy for deterministic error tracking
- **Signals**: `measurement_error`, `measurement_error_kind`, `measurement_error_stage`

#### 4. Content Diagnostics
- **`content_observed`**: Boolean (main_text_len ≥ 80 OR shadow_text_len ≥ 80 OR shadow_iframe_confirmed)
- **`structure_unknown_reason`**: Explains S-UNKNOWN classifications:
  1. `BLOCKED_BEFORE_OBSERVATION` - Hard AP blockers prevented measurement
  2. `MEASUREMENT_ERROR` - DOM evaluation errors
  3. `NO_CONTENT_OBSERVED` - Page loaded but no content detected
  4. `INSUFFICIENT_STRUCTURE_EVIDENCE` - Ambiguous structure signals

### Schema Changes

**12 New Signals** (all additive, backward compatible):
1. `input_url_raw` - Original user-provided URL
2. `url_normalized` - Boolean: normalization applied
3. `url_normalization_rule` - Rule used
4. `dom_ready` - Boolean: readiness condition met
5. `dom_ready_rule` - Rule used
6. `readiness_gate_timeout` - Boolean: timeout occurred
7. `measurement_error` - Boolean: any evaluate failed
8. `measurement_error_kind` - Exception class name
9. `measurement_error_stage` - Which measurement failed first
10. `content_observed` - Boolean: content presence detected
11. `content_observed_rule` - Which rule triggered
12. `structure_unknown_reason` - Why S-UNKNOWN when it occurs

### Testing

**Unit Tests**: `tests/test_s_unknown_hardening.py` - 20 comprehensive tests

**Standalone Scripts** (in `scripts/` directory):
- `scripts/determinism_check.py` - Verifies same URL → same output
- `scripts/mvp3_signals_check.py` - Validates MVP-3 signal types
- `scripts/ap_signals_check.py` - Tests AP signal detectors

Run standalone scripts directly:
```bash
python scripts/determinism_check.py
python scripts/mvp3_signals_check.py
python scripts/ap_signals_check.py
```

---

## 📄 License

MIT
