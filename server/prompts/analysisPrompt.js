// Prompt Version: v2.0
// Last Updated: 2024
// Changes from v1: Added explicit JSON-only instruction, improved ambiguity detection, added source text requirements

const SYSTEM_PROMPT = `You are an AI Assignment Requirement Analyzer. Your role is to carefully read and analyze student assignment instructions, then extract and organize all the important information into a structured format.

Your analysis must be:
- Accurate: Only extract information explicitly stated in the assignment
- Complete: Don't miss any requirements, deadlines, or constraints
- Honest: Clearly distinguish between what is stated vs what is unclear or missing
- Helpful: Organize information in a way that helps students understand what they need to do

CRITICAL RULES:
1. Never invent deadlines, marks, or requirements not in the assignment
2. Never assume information - if it's not stated, mark it as "Not specified"
3. Always include the source text (original quote) for important extracted items
4. If instructions conflict, flag the conflict - don't choose one silently
5. Label your suggestions clearly as AI suggestions, not official requirements
6. Return ONLY valid JSON - no explanations before or after the JSON`;

function buildAnalysisPrompt(assignmentText) {
  return `Analyze the following assignment instructions and extract all important information.

ASSIGNMENT TEXT:
"""
${assignmentText}
"""

ANALYSIS STAGES:
Stage 1: Understand the overall assignment - what is it asking students to do?
Stage 2: Identify all deliverables - what must students submit?
Stage 3: Extract all requirements and tasks - what must students do?
Stage 4: Extract all constraints - what restrictions apply?
Stage 5: Extract all deadlines - be precise, never invent dates
Stage 6: Extract submission and evaluation details
Stage 7: Identify unclear, missing, or conflicting information
Stage 8: Create an actionable step-by-step plan

Return a single JSON object with this exact structure. Do not include any text before or after the JSON:

{
  "assignmentOverview": {
    "title": "string - assignment title if mentioned, otherwise derive from context",
    "subject": "string or null - course/subject if mentioned",
    "objective": "string - main goal of the assignment",
    "summary": "string - 2-3 sentence summary of the assignment",
    "importantNotes": ["array of critical instructions students must know"]
  },
  "deliverables": [
    {
      "name": "string - deliverable name",
      "description": "string - what this deliverable is",
      "mandatory": true or false,
      "sourceText": "string - exact quote from assignment"
    }
  ],
  "requirements": [
    {
      "title": "string - requirement title",
      "description": "string - detailed description",
      "priority": "high" or "medium" or "low",
      "sourceText": "string - exact quote from assignment"
    }
  ],
  "constraints": [
    {
      "type": "string - e.g. language, format, length, team, tool",
      "description": "string - the constraint",
      "sourceText": "string - exact quote"
    }
  ],
  "deadlines": [
    {
      "description": "string - what this deadline is for",
      "date": "string or null - exact date as written, null if not specified",
      "time": "string or null - time if specified",
      "type": "final" or "intermediate" or "presentation" or "other",
      "sourceText": "string - exact quote"
    }
  ],
  "submissionRequirements": [
    {
      "aspect": "string - e.g. format, platform, naming, files",
      "description": "string - the requirement",
      "sourceText": "string - exact quote or null if not mentioned"
    }
  ],
  "evaluationCriteria": [
    {
      "criterion": "string - what is being evaluated",
      "weightage": "string or null - marks/percentage if specified",
      "description": "string - how it will be evaluated",
      "sourceText": "string - exact quote or null"
    }
  ],
  "ambiguities": [
    {
      "type": "missing" or "unclear" or "conflicting",
      "issue": "string - what is the problem",
      "reason": "string - why this is ambiguous or missing",
      "sourceText": "string or null - relevant quote if applicable",
      "recommendation": "string - what student should ask the professor"
    }
  ],
  "actionPlan": [
    {
      "stage": "string - stage name e.g. 'Research Phase'",
      "order": number,
      "tasks": [
        {
          "title": "string - task title",
          "description": "string - what to do",
          "priority": "high" or "medium" or "low",
          "estimatedEffort": "string or null - AI estimate only, label clearly as estimate"
        }
      ]
    }
  ],
  "deadlineStatus": "specified" or "not_specified" or "conflicting",
  "hasConflicts": true or false,
  "completenessScore": number between 0-100 representing how complete the assignment instructions are
}`;
}

module.exports = { SYSTEM_PROMPT, buildAnalysisPrompt };
