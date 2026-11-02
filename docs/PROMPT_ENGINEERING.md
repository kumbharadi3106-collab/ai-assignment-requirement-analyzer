# Prompt Engineering Documentation

## Overview

The AI Assignment Requirement Analyzer uses carefully engineered prompts to ensure Claude extracts accurate, structured, and verifiable information from assignment briefs. This document explains the prompt design decisions, structure, and refinements.

---

## Prompt Version History

| Version | Change | Reason |
|---|---|---|
| v1.0 | Basic extraction prompt, free-form JSON | Initial implementation |
| v2.0 | Added JSON-only instruction, 8-stage analysis, ambiguity type field, completenessScore, source text requirements, explicit anti-hallucination rules | Improved reliability and structure |

---

## System Prompt Design

### Role Definition
```
You are an AI Assignment Requirement Analyzer. Your role is to carefully read 
and analyze student assignment instructions, then extract and organize all the 
important information into a structured format.
```

**Rationale:** Giving Claude a clear, specific role improves output consistency. The system prompt defines what Claude is (a requirement extractor) rather than what it should do (which is in the user prompt).

### Core Behavioral Rules (System Prompt)
```
CRITICAL RULES:
1. Never invent deadlines, marks, or requirements not in the assignment
2. Never assume information - if it's not stated, mark it as "Not specified"
3. Always include the source text (original quote) for important extracted items
4. If instructions conflict, flag the conflict - don't choose one silently
5. Label your suggestions clearly as AI suggestions, not official requirements
6. Return ONLY valid JSON - no explanations before or after the JSON
```

**Rationale:** These rules directly address the most common AI failure modes:
- Hallucination (inventing deadlines)
- Silent resolution of conflicts
- Mixing AI suggestions with official requirements
- Returning text instead of JSON

---

## Task Decomposition — 8 Analysis Stages

Rather than asking Claude to "analyze this assignment," the prompt breaks the task into 8 explicit stages. This mirrors chain-of-thought prompting and significantly improves accuracy on complex assignments.

| Stage | Task |
|---|---|
| 1 | Understand the overall assignment — what is it asking students to do? |
| 2 | Identify all deliverables — what must students submit? |
| 3 | Extract all requirements and tasks |
| 4 | Extract all constraints and restrictions |
| 5 | Extract all deadlines — be precise, never invent dates |
| 6 | Extract submission requirements and evaluation criteria |
| 7 | Identify unclear, missing, or conflicting information |
| 8 | Create an actionable step-by-step plan |

**Rationale:** Breaking complex analysis into sequential stages reduces the chance of Claude skipping important categories. Each stage has a clear focus, which improves recall of specific information types.

---

## Output Format Design

### Why Structured JSON?

The prompt explicitly requires JSON output rather than prose. This provides:
- Reliable parsing on the backend
- Consistent data structure across all analyses
- Ability to validate required fields programmatically
- Direct mapping to database schema

### JSON Schema Design Decisions

**Deadlines — date field is null-safe:**
```json
{
  "date": null,        // null if no date mentioned — never a fabricated date
  "time": null,        // null if no time mentioned
  "type": "final"      // categorizes deadline type
}
```
This forces Claude to leave `date` as `null` when no date is present, rather than generating a plausible-sounding date.

**Ambiguities — typed field:**
```json
{
  "type": "missing" | "unclear" | "conflicting"
}
```
Distinguishing between missing information, unclear instructions, and conflicting instructions helps students know what action to take (ask for clarification vs. re-read the brief).

**Requirements — source text field:**
```json
{
  "sourceText": "exact quote from assignment"
}
```
Including the original quote lets students verify that the AI extracted information correctly. This is a responsible AI practice — it makes the AI's reasoning transparent.

**completenessScore:**
```json
{
  "completenessScore": 85
}
```
A 0–100 score indicating how complete the assignment brief is. Helps students know immediately whether the brief has enough information.

---

## Anti-Hallucination Techniques

### 1. Explicit prohibition + null instructions
```
"date": "string or null - exact date as written, null if not specified"
```
Telling Claude exactly what to return when information is absent prevents it from guessing.

### 2. Source text requirement
Requiring `sourceText` for each extracted item forces Claude to ground its output in the actual assignment text. If it cannot find a source quote, it cannot confidently claim the requirement exists.

### 3. Stage 7 — explicit conflict detection stage
By explicitly telling Claude to look for conflicts in a dedicated stage, it finds contradictions it would miss if asked to simply "extract requirements."

### 4. JSON-only instruction in system prompt
```
Return ONLY valid JSON - no explanations before or after the JSON
```
This eliminates the risk of Claude wrapping the JSON in prose that breaks parsing.

### 5. Backend regex extraction fallback
```javascript
const jsonMatch = rawText.match(/\{[\s\S]*\}/);
```
Even if Claude adds a small note before the JSON, the backend extracts the JSON block correctly.

---

## Prompt Refinements — v1 to v2

### Problem 1: Claude sometimes returned explanatory text before the JSON

**v1 Prompt:** "Return a JSON object with this structure:"

**v2 Fix:** Added to system prompt: "Return ONLY valid JSON - no explanations before or after the JSON." Also added regex extraction fallback in `claudeService.js`.

### Problem 2: Deadlines field was sometimes missing entirely

**v1 Prompt:** Did not explicitly list all required fields.

**v2 Fix:** Added `deadlineStatus` field (`"specified"` | `"not_specified"` | `"conflicting"`) and made the backend validator initialize missing arrays as empty rather than failing.

### Problem 3: Ambiguities were not categorized

**v1 Prompt:** Ambiguities returned as a flat string.

**v2 Fix:** Added `"type": "missing" | "unclear" | "conflicting"` to the ambiguity schema. This enables the frontend to show different visual indicators for different problem types.

### Problem 4: AI suggestions mixed with official requirements

**v1 Prompt:** Did not distinguish between extracted facts and AI suggestions.

**v2 Fix:** Added explicit rule: "Label your suggestions clearly as AI suggestions, not official requirements." Action plan tasks now include `estimatedEffort` clearly labelled as an AI estimate.

---

## Choosing the Model

**Model used:** `claude-3-5-sonnet-20241022` (configurable via `ANTHROPIC_MODEL` environment variable)

**Rationale:**
- Claude 3.5 Sonnet has strong instruction-following for structured JSON output
- Sufficient context window for long assignment briefs
- Fast enough for interactive use (< 10 seconds for most assignments)
- Model can be changed without code modification via environment variable

**max_tokens:** 8000 — sufficient for complete structured analysis of any normal assignment brief.

