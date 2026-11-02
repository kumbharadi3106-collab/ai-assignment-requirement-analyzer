/**
 * Automated Test Runner for AI Assignment Requirement Analyzer
 * Runs validation, database persistence, and workflow checks.
 */

const assert = require('assert');
const path = require('path');
const db = require('../database/db');
const { validateAnalysisResponse } = require('../utils/responseValidator');
const { generateCSV, generatePDFBuffer } = require('../services/exportService');
const TEST_CASES = require('./testCases');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function runAll() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING AI ASSIGNMENT REQUIREMENT ANALYZER TEST SUITE');
  console.log('======================================================\n');

  // --- Group 1: 5 Required Test Cases Configuration ---
  console.log('📋 Suite 1: Test Cases Definition Verification');
  runTest('Test Case 1 (Normal Assignment) configured with expected deliverables', () => {
    const tc1 = TEST_CASES.find(t => t.id === 1);
    assert(tc1, 'Test case 1 must exist');
    assert(tc1.input.includes('Web Application Development Project'));
    assert(tc1.expectedOutcome.deliverables);
  });

  runTest('Test Case 2 (Missing Deadline) configured with null/unspecified expectation', () => {
    const tc2 = TEST_CASES.find(t => t.id === 2);
    assert(tc2, 'Test case 2 must exist');
    assert(tc2.expectedOutcome.deadline.includes('No deadline specified'));
  });

  runTest('Test Case 3 (Multiple Deadlines) configured with multiple milestone checks', () => {
    const tc3 = TEST_CASES.find(t => t.id === 3);
    assert(tc3, 'Test case 3 must exist');
    assert(tc3.input.includes('Phase 1'));
    assert(tc3.input.includes('Phase 6'));
  });

  runTest('Test Case 4 (Conflicting Instructions) configured with contradictory dates/specs', () => {
    const tc4 = TEST_CASES.find(t => t.id === 4);
    assert(tc4, 'Test case 4 must exist');
    assert(tc4.expectedOutcome.conflicts || tc4.testType === 'conflicting');
  });

  runTest('Test Case 5 (Empty/Invalid Input) configured with empty input rejection', () => {
    const tc5 = TEST_CASES.find(t => t.id === 5);
    assert(tc5, 'Test case 5 must exist');
    assert.strictEqual(tc5.input.trim(), '');
  });

  // --- Group 2: Output Validation & Anti-Hallucination Safeguards ---
  console.log('\n🛡️  Suite 2: AI Response Validator & Safety Checks');
  runTest('Validator accepts valid structured AI output', () => {
    const sampleValid = {
      assignmentOverview: { title: 'Test', objective: 'Obj', summary: 'Summary' },
      deliverables: [{ name: 'Code', mandatory: true, sourceText: 'Submit code' }],
      requirements: [{ title: 'Req 1', priority: 'high', sourceText: 'Req quote' }],
      constraints: [{ type: 'language', description: 'NodeJS', sourceText: 'Use node' }],
      deadlines: [{ description: 'Final Due', date: '2024-12-01', time: '23:59', sourceText: 'Due Dec 1' }],
      submissionRequirements: [{ aspect: 'portal', description: 'Upload zip', sourceText: 'portal upload' }],
      evaluationCriteria: [{ criterion: 'Quality', weightage: '40%', description: 'Code quality' }],
      ambiguities: [],
      actionPlan: [{ stage: 'Stage 1', tasks: [{ title: 'Setup project', priority: 'high' }] }],
      completenessScore: 90
    };
    const res = validateAnalysisResponse(sampleValid);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.errors.length, 0);
  });

  runTest('Validator catches missing required fields safely', () => {
    const broken = { assignmentOverview: {} };
    const res = validateAnalysisResponse(broken);
    assert.strictEqual(res.valid, false);
    assert(res.errors.length > 0);
  });

  runTest('Validator ensures missing optional arrays default to safe empty arrays', () => {
    const partial = {
      assignmentOverview: { title: 'T', summary: 'S' },
      deliverables: [],
      requirements: [],
      actionPlan: [{ stage: 'Stage 1', tasks: [] }]
    };
    const res = validateAnalysisResponse(partial);
    assert.strictEqual(res.valid, true);
    assert(Array.isArray(res.data.deadlines));
    assert(Array.isArray(res.data.constraints));
    assert(Array.isArray(res.data.ambiguities));
  });

  // --- Group 3: Database & Persistence ---
  console.log('\n💾 Suite 3: SQLite Database Persistence & Operations');
  let testAssignmentId = null;

  runTest('Database persists new assignment correctly', () => {
    const insert = db.prepare(`
      INSERT INTO assignments (title, original_text, subject, analysis_json, deadline, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    const mockAnalysis = {
      assignmentOverview: { title: 'Unit Test Assignment', summary: 'Sample summary' },
      deliverables: [{ name: 'Test Doc', mandatory: true }],
      requirements: [{ title: 'Test Req', priority: 'high' }],
      deadlines: [{ description: 'Due date', date: '2026-12-31' }],
      actionPlan: []
    };
    const result = insert.run(
      'Unit Test Assignment',
      'This is raw text for automated testing.',
      'CS101',
      JSON.stringify(mockAnalysis),
      '2026-12-31'
    );
    testAssignmentId = result.lastInsertRowid;
    assert(testAssignmentId > 0, 'Insert should produce a valid ID');

    const fetched = db.prepare('SELECT * FROM assignments WHERE id = ?').get(testAssignmentId);
    assert.strictEqual(fetched.title, 'Unit Test Assignment');
    assert.strictEqual(fetched.deadline, '2026-12-31');
  });

  runTest('Task generation and toggle status persists in SQLite', () => {
    assert(testAssignmentId, 'Must have assignment ID');
    const insertTask = db.prepare(`
      INSERT INTO tasks (assignment_id, title, description, priority, status, stage, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'pending', 'Phase 1', datetime('now'), datetime('now'))
    `);
    const tRes = insertTask.run(testAssignmentId, 'Setup Environment', 'Install node modules', 'high');
    const taskId = tRes.lastInsertRowid;

    // Verify initial status
    const taskBefore = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    assert.strictEqual(taskBefore.status, 'pending');

    // Toggle to completed
    db.prepare("UPDATE tasks SET status = 'completed', updated_at = datetime('now') WHERE id = ?").run(taskId);
    const taskAfter = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    assert.strictEqual(taskAfter.status, 'completed');
  });

  runTest('Cascading delete removes assignment and its associated tasks/deliverables', () => {
    assert(testAssignmentId, 'Must have assignment ID');
    db.prepare('DELETE FROM assignments WHERE id = ?').run(testAssignmentId);

    const checkAssignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(testAssignmentId);
    assert.strictEqual(checkAssignment, undefined, 'Assignment should be deleted');

    const checkTasks = db.prepare('SELECT * FROM tasks WHERE assignment_id = ?').all(testAssignmentId);
    assert.strictEqual(checkTasks.length, 0, 'Associated tasks should be cascaded and deleted');
  });

  // --- Group 4: Export Generation ---
  console.log('\n📄 Suite 4: Export Generation (CSV & PDF)');
  runTest('CSV export produces valid structured CSV text', () => {
    const mockAssignment = { title: 'Test Assignment', deadline: '2024-11-30', created_at: '2024-11-01' };
    const mockAnalysis = {
      assignmentOverview: { subject: 'CS101', summary: 'Overview summary' },
      deliverables: [{ name: 'Report', description: 'Final report', mandatory: true }],
      requirements: [{ title: 'Code', priority: 'high', description: 'Write clean code' }],
      deadlines: [{ description: 'Submission', date: '2024-11-30' }],
      constraints: [{ type: 'format', description: 'PDF format only' }],
      evaluationCriteria: [{ criterion: 'Quality', weightage: '50%' }]
    };
    const csv = generateCSV(mockAssignment, mockAnalysis);
    assert(typeof csv === 'string', 'CSV should be a string');
    assert(csv.includes('"Section","Field","Value"'));
    assert(csv.includes('Test Assignment'));
    assert(csv.includes('Final report'));
  });

  await runAsyncTest('PDF export generates valid PDF binary buffer', async () => {
    const mockAssignment = { title: 'Export PDF Test', deadline: '2024-12-15', created_at: '2024-11-01' };
    const mockAnalysis = {
      assignmentOverview: { subject: 'CS202', summary: 'Summary for PDF' },
      deliverables: [{ name: 'Prototype', mandatory: true, description: 'Live prototype' }],
      requirements: [{ title: 'Backend', priority: 'high', description: 'REST API' }],
      deadlines: [{ description: 'Demo date', date: '2024-12-15', time: '10:00 AM' }],
      constraints: [],
      actionPlan: [{ stage: 'Implementation', tasks: [{ title: 'Setup DB' }] }]
    };
    const pdfBuf = await generatePDFBuffer(mockAssignment, mockAnalysis);
    assert(Buffer.isBuffer(pdfBuf), 'Should return a Buffer');
    assert(pdfBuf.length > 500, 'PDF buffer should contain meaningful data');
    // PDF header magic bytes: %PDF-
    assert.strictEqual(pdfBuf.subarray(0, 5).toString('ascii'), '%PDF-');
  });

  // --- Summary ---
  console.log('\n======================================================');
  console.log(`📊 TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
  } else {
    console.log(`⚠️  ${totalTests - passedTests} TESTS FAILED.`);
    process.exit(1);
  }
  console.log('======================================================\n');
}

runAll().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

