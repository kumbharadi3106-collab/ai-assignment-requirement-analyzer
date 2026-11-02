/**
 * AI Assignment Requirement Analyzer - Test Cases
 *
 * These test cases are designed to verify the correctness and reliability
 * of the AI analysis workflow. Execute using the application UI or the backend API directly.
 */

const TEST_CASES = [
  {
    id: 1,
    name: "Normal Assignment - Complete Instructions",
    description: "A regular assignment with all standard elements: objectives, deliverables, constraints, deadline, and evaluation criteria.",
    input: `
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
      - All code must be original - no copying from online sources
      - Report must be written in English

      Deadline: November 30, 2024 at 11:59 PM

      Submission: Upload all files to the course portal under "Project Submission"

      Evaluation:
      - Working application: 40 marks
      - Code quality and documentation: 20 marks
      - Project report: 25 marks
      - Video demonstration: 15 marks
      Total: 100 marks
    `,
    expectedOutcome: {
      deliverables: "5 deliverables identified",
      requirements: "Multiple requirements extracted",
      deadline: "November 30, 2024 at 11:59 PM",
      constraints: "Team size, language restrictions, framework restrictions",
      evaluationCriteria: "4 criteria with marks",
      ambiguities: "Minimal - assignment is well-defined"
    },
    testType: "positive"
  },

  {
    id: 2,
    name: "Missing Deadline",
    description: "Assignment with complete instructions but no submission deadline specified.",
    input: `
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
    `,
    expectedOutcome: {
      deadline: "No deadline specified in the assignment",
      ambiguities: "Missing deadline flagged as ambiguity",
      deliverables: "Research paper identified",
      constraints: "Page limit, citation format, source requirements"
    },
    testType: "missing_info"
  },

  {
    id: 3,
    name: "Multiple Deadlines",
    description: "Assignment with multiple intermediate deadlines and a final deadline.",
    input: `
      Assignment: Group Software Project - Semester-Long Project
      Course: CS450 - Software Project Management

      Overview: You will work in groups of 3-4 to design, develop, and present a complete software solution.

      Project Phases and Deadlines:

      Phase 1 - Project Proposal: Submit a 2-page project proposal by September 15, 2024
      Phase 2 - Requirements Document: Submit detailed requirements specification by October 1, 2024
      Phase 3 - Design Review: Present your system design to the class on October 20, 2024 at 2:00 PM
      Phase 4 - Progress Demo: Demonstrate working prototype by November 10, 2024
      Phase 5 - Final Submission: Submit complete project by December 5, 2024 at 5:00 PM
      Phase 6 - Final Presentation: Present your project to the class on December 10, 2024

      Deliverables per Phase:
      - Proposal: 2-page document
      - Requirements: Full requirements specification document
      - Design review: Presentation slides + system diagrams
      - Progress demo: Working prototype + progress report
      - Final: Complete source code, documentation, test results, final report
      - Presentation: 20-minute presentation

      Team requirements: Groups of 3-4 students, register team by September 10, 2024
    `,
    expectedOutcome: {
      deadlines: "6 deadlines correctly identified",
      submissionRequirements: "Per-phase deliverables identified",
      constraints: "Team size constraint identified"
    },
    testType: "multiple_deadlines"
  },

  {
    id: 4,
    name: "Conflicting Instructions",
    description: "Assignment with contradictory submission dates and inconsistent requirements.",
    input: `
      Assignment: Database Design and Implementation
      Course: CS302 - Database Systems

      Objective: Design and implement a relational database for a hospital management system.

      The assignment is due on November 15, 2024. Please submit your work by November 20, 2024.

      Requirements:
      - Create ER diagrams
      - Implement in MySQL
      - Write SQL queries for at least 10 use cases
      - Normalize the database to 3NF
      - The database must have at least 5 tables and at least 10 tables

      Submission:
      - Submit via email to professor@university.edu
      - Submit via the online portal

      Evaluation:
      - ER Diagram: 20 marks
      - Implementation: 50 marks
      - SQL Queries: 30 marks
      Total: 90 marks (Note: grading is out of 100 marks)
    `,
    expectedOutcome: {
      deadlines: "Conflicting dates detected (Nov 15 vs Nov 20)",
      requirements: "Conflicting table count (at least 5 vs at least 10)",
      submissionRequirements: "Conflicting submission methods (email vs portal)",
      evaluationCriteria: "Marks don't add up to stated total",
      ambiguities: "Multiple conflicts flagged",
      hasConflicts: true
    },
    testType: "conflicting"
  },

  {
    id: 5,
    name: "Empty or Invalid Input",
    description: "An empty text submission or an invalid document - tests that the system rejects the input gracefully before reaching the AI.",
    input: "",
    expectedOutcome: {
      rejected: true,
      error: "Assignment text is required. Please paste your assignment instructions.",
      aiCalled: false
    },
    testType: "validation"
  },

  {
    id: 6,
    name: "Minimal/Vague Assignment",
    description: "A very brief assignment with minimal information - tests how the system handles incomplete instructions.",
    input: `
      Do a project on machine learning. It should be good.
      Submit it when done.
    `,
    expectedOutcome: {
      ambiguities: "Multiple missing fields flagged (deadline, format, deliverables, evaluation criteria, length)",
      completenessScore: "Low score (below 30)",
      deadlineStatus: "not_specified",
      actionPlan: "Generic action plan generated based on limited info"
    },
    testType: "minimal"
  }
];

/**
 * API ENDPOINT REFERENCE
 *
 * To test these cases via the REST API directly:
 *
 * POST http://localhost:5000/api/assignments/analyze
 * Content-Type: application/json
 * Body: { "title": "<test case name>", "text": "<input text>" }
 *
 * Or use the React frontend UI to paste in the test input text.
 */

module.exports = TEST_CASES;
