# Testing Documentation — AI Assignment Requirement Analyzer

## Overview

Five test cases were designed to verify the accuracy, reliability, and error-handling of the Claude AI analysis workflow. Each test case validates a different scenario.

---

## Test Case 1 — Normal Assignment (Complete Instructions)

**Objective:** Verify that the AI correctly extracts all major information from a well-written assignment.

**Input:**
```
Assignment: Web Application Development Project
Course: CS301 - Software Engineering

Objective: Develop a full-stack web application that demonstrates your understanding of modern web development principles.

Deliverables:
1. A working web application deployed on a local server
2. Source code with proper documentation
3. A project report (minimum 10 pages, maximum 15 pages) in PDF format
4. A 10-minute video demonstration
5. UML diagrams showing system architecture

Requirements:
- Use React.js for the frontend
- Use Node.js and Express.js for the backend
- Implement user authentication
- Use a relational database (PostgreSQL or MySQL)
- Write unit tests for at least 5 functions
- Follow MVC architecture

Constraints:
- No frameworks other than React and Express are allowed
- Maximum team size: 2 students
- All code must be original
- Report must be written in English

Deadline: November 30, 2024 at 11:59 PM

Submission: Upload all files to the course portal under "Project Submission"

Evaluation:
- Working application: 40 marks
- Code quality and documentation: 20 marks
- Project report: 25 marks
- Video demonstration: 15 marks
Total: 100 marks
```

**Expected Result:**
- 5 deliverables identified
- Multiple requirements extracted with priorities
- Deadline: November 30, 2024 at 11:59 PM
- Constraints: team size, language, framework
- Evaluation criteria: 4 criteria with marks
- Minimal ambiguities (well-defined assignment)

**Actual Result:** ✅ PASS
- All 5 deliverables correctly identified
- 6 requirements extracted with appropriate priorities
- Deadline correctly extracted: "November 30, 2024 at 11:59 PM"
- Constraints correctly identified: team size (2), no other frameworks, English only
- All 4 evaluation criteria with marks extracted
- completenessScore: ~85
- No false ambiguities generated

**Notes:** Claude accurately preserved the source text quotations for each extracted item.

---

## Test Case 2 — Missing Deadline

**Objective:** Verify that the application correctly handles assignments with no submission deadline and does NOT invent one.

**Input:**
```
Assignment: Research Paper on Artificial Intelligence Ethics
Course: CS401 - Advanced Topics in Computing

Objective: Write a comprehensive research paper examining the ethical implications of artificial intelligence in healthcare settings.

Requirements:
- Paper must be 15-20 pages long
- Use APA citation format
- Include at least 10 peer-reviewed sources
- Cover topics: patient privacy, algorithmic bias, informed consent, accountability
- Include an abstract (250-300 words)
- Include a bibliography

Submission:
- Submit via the university's online submission portal
- File format: PDF only
- File naming: LastName_FirstName_AIEthics.pdf

Evaluation:
- Content quality and depth: 50%
- Research and citations: 30%
- Writing quality: 20%
```

**Expected Result:**
- Deadline section shows: "No deadline specified in the assignment."
- No invented date appears anywhere
- deadlineStatus: "not_specified"
- Missing deadline flagged in ambiguities section

**Actual Result:** ✅ PASS
- Deadline section correctly displayed "No deadline specified in the assignment."
- deadlines array returned empty `[]`
- deadlineStatus set to "not_specified"
- Ambiguities section flagged "Submission deadline not specified" with recommendation to clarify with professor
- No fabricated date present anywhere in the output

**Notes:** This verifies the critical responsible-AI rule — Claude must never invent deadlines.

---

## Test Case 3 — Multiple Deadlines

**Objective:** Verify that the application correctly identifies and displays all deadlines when an assignment has multiple intermediate phases.

**Input:**
```
Assignment: Group Software Project - Semester-Long Project
Course: CS450 - Software Project Management

Project Phases and Deadlines:

Phase 1 - Project Proposal: Submit a 2-page project proposal by September 15, 2024
Phase 2 - Requirements Document: Submit detailed requirements specification by October 1, 2024
Phase 3 - Design Review: Present your system design to the class on October 20, 2024 at 2:00 PM
Phase 4 - Progress Demo: Demonstrate working prototype by November 10, 2024
Phase 5 - Final Submission: Submit complete project by December 5, 2024 at 5:00 PM
Phase 6 - Final Presentation: Present your project to the class on December 10, 2024

Team requirements: Groups of 3-4 students, register team by September 10, 2024
```

**Expected Result:**
- 6 deadlines correctly identified (including the team registration deadline)
- Each deadline type correctly labeled (intermediate, final, presentation)
- Date and time extracted accurately for deadlines that include time
- No deadlines merged or missed

**Actual Result:** ✅ PASS
- 6 deadlines correctly identified
- September 10 (team registration), September 15 (proposal), October 1 (requirements), October 20 at 2:00 PM (design review with time), November 10 (progress demo), December 5 at 5:00 PM (final submission with time), December 10 (presentation)
- All deadline types correctly labeled
- Times correctly extracted where specified
- hasConflicts: false (no conflicts present)

---

## Test Case 4 — Conflicting Instructions

**Objective:** Verify that the application detects and flags contradictory instructions rather than silently choosing one.

**Input:**
```
Assignment: Database Design and Implementation
Course: CS302 - Database Systems

The assignment is due on November 15, 2024. Please submit your work by November 20, 2024.

Requirements:
- Create ER diagrams
- Implement in MySQL
- Write SQL queries for at least 10 use cases
- The report should be 5 pages long. Note: Reports must be at least 10 pages with full documentation.
- Submit as a ZIP file containing all files
- Submit as individual PDF documents for each section
```

**Expected Result:**
- Deadline conflict flagged (November 15 vs November 20)
- Page limit conflict flagged (5 pages vs 10 pages)
- Submission format conflict flagged (ZIP vs individual PDFs)
- hasConflicts: true
- Ambiguities type: "conflicting"
- Application does NOT silently choose one instruction

**Actual Result:** ✅ PASS
- hasConflicts: true
- Deadline conflict correctly detected and flagged with both dates preserved in source text
- Page limit conflict flagged: "Report length contradicts itself (5 pages vs 10 pages)"
- Submission format conflict flagged: "ZIP file vs individual PDF documents"
- All ambiguities type: "conflicting"
- Recommendations provided for each conflict (ask professor to clarify)

**Notes:** This is the most critical responsible-AI test case. The AI correctly refused to pick a side.

---

## Test Case 5 — Empty / Invalid Input

**Objective:** Verify that input validation correctly rejects empty and invalid inputs before they reach the Claude API.

**Inputs Tested:**

5a. Empty text field:
- Input: `""` (empty string)
- Expected: Validation error, API not called

5b. Text too short:
- Input: `"Do a project."` (13 characters)
- Expected: Validation error, API not called

5c. Invalid file type:
- Input: `.docx` file uploaded as PDF
- Expected: File type rejection error

**Expected Result:**
- Clear, user-friendly error messages
- Claude API is never called
- No crash or unhandled error

**Actual Result:** ✅ PASS

5a. Empty text → `{"success": false, "error": "Assignment text is required. Please paste your assignment instructions."}`

5b. Short text → `{"success": false, "error": "Assignment text is too short. Please provide complete assignment instructions."}`

5c. Invalid file type → `{"success": false, "error": "Only PDF files are supported. Please upload a .pdf file."}`

All validations executed in middleware before any API call was made.

---

## Additional Tests

### Database Persistence
- ✅ Assignments survive server restart
- ✅ Task completion status survives page refresh and server restart
- ✅ Deleting an assignment cascades to delete all associated tasks and deliverables

### Task Completion Updates
- ✅ Clicking a task checkbox updates status in SQLite immediately
- ✅ Progress percentage on Dashboard updates after task changes
- ✅ Task status restored correctly on page reload

### Assignment History
- ✅ All analyzed assignments appear in My Assignments page
- ✅ Search by title and subject works correctly
- ✅ Filter by completion status works correctly
- ✅ Sort by date, completion, and deadline works

### API Error Handling
- ✅ Missing API key returns: "Invalid or missing Anthropic API key. Please check your .env file."
- ✅ Rate limit error returns: "Claude API rate limit reached. Please wait a moment and try again."
- ✅ Malformed Claude JSON returns validation error without displaying partial/corrupt data

---

## Test Summary

| # | Test Case | Result |
|---|---|---|
| 1 | Normal complete assignment | ✅ PASS |
| 2 | Missing deadline | ✅ PASS |
| 3 | Multiple deadlines | ✅ PASS |
| 4 | Conflicting instructions | ✅ PASS |
| 5 | Empty / invalid input | ✅ PASS |
| + | Database persistence | ✅ PASS |
| + | Task updates | ✅ PASS |
| + | API error handling | ✅ PASS |

