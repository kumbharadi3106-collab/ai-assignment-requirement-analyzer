const Anthropic = require('@anthropic-ai/sdk');
const { SYSTEM_PROMPT, buildAnalysisPrompt } = require('../prompts/analysisPrompt');
const { validateAnalysisResponse } = require('../utils/responseValidator');

/**
 * Multi-provider AI Analyzer:
 * 1. Anthropic Claude (if ANTHROPIC_API_KEY is configured with credits)
 * 2. Google Gemini Free Tier (if GEMINI_API_KEY or GOOGLE_API_KEY is configured)
 * 3. Groq Free Tier (if GROQ_API_KEY is configured)
 * 4. Built-in Intelligent Assignment Parser (fallback when credits are zero or offline)
 */

async function callClaude(assignmentText) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes('your_anthropic_api_key')) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  const userPrompt = buildAnalysisPrompt(assignmentText);

  const response = await client.messages.create({
    model,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const rawText = response.content[0]?.text?.trim() || '';
  return extractAndParseJSON(rawText);
}

async function callGemini(assignmentText) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const userPrompt = buildAnalysisPrompt(assignmentText);
  const prompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  return extractAndParseJSON(rawText);
}

async function callGroq(assignmentText) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const userPrompt = buildAnalysisPrompt(assignmentText);

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Groq API error: ${res.status}`);
  }

  const data = await res.json();
  const rawText = data.choices?.[0]?.message?.content?.trim() || '';
  return extractAndParseJSON(rawText);
}

/**
 * Built-in Intelligent Assignment Parser (Rule-based NLP Engine)
 * Runs locally without external API credits so the application is always 100% functional.
 */
function localIntelligentAnalysis(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let title = 'Assignment';
  const titleLine = lines.find(l => /^assignment:\s*/i.test(l));
  if (titleLine) {
    title = titleLine.replace(/^assignment:\s*/i, '').trim();
  } else if (lines.length > 0) {
    title = lines[0].replace(/^[#*-]+\s*/, '').slice(0, 80);
  }

  let subject = null;
  const courseLine = lines.find(l => /^(course|subject):\s*/i.test(l));
  if (courseLine) {
    subject = courseLine.replace(/^(course|subject):\s*/i, '').trim();
  }

  let objective = 'Complete all assigned deliverables according to the specifications.';
  const objLine = lines.find(l => /^objective:\s*/i.test(l));
  if (objLine) {
    objective = objLine.replace(/^objective:\s*/i, '').trim();
  }

  const deliverables = [];
  let inDeliverables = false;
  let inRequirements = false;
  let inConstraints = false;
  let inEvaluation = false;

  const requirements = [];
  const constraints = [];
  const evaluationCriteria = [];
  const deadlines = [];
  const ambiguities = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^deliverables?:?/i.test(line)) {
      inDeliverables = true; inRequirements = false; inConstraints = false; inEvaluation = false;
      continue;
    }
    if (/^requirements?:?/i.test(line)) {
      inDeliverables = false; inRequirements = true; inConstraints = false; inEvaluation = false;
      continue;
    }
    if (/^constraints?:?/i.test(line) || /^restrictions?:?/i.test(line)) {
      inDeliverables = false; inRequirements = false; inConstraints = true; inEvaluation = false;
      continue;
    }
    if (/^evaluation:?/i.test(line) || /^grading:?/i.test(line)) {
      inDeliverables = false; inRequirements = false; inConstraints = false; inEvaluation = true;
      continue;
    }
    if (/^(deadline|submission|due|project phases):?/i.test(line)) {
      inDeliverables = false; inRequirements = false; inConstraints = false; inEvaluation = false;
    }

    const cleanItem = line.replace(/^(\d+[\.\)]|[-*•])\s*/, '').trim();

    if (inDeliverables && cleanItem.length > 3) {
      deliverables.push({
        name: cleanItem.slice(0, 60),
        description: cleanItem,
        mandatory: !/optional/i.test(cleanItem),
        sourceText: line,
      });
    } else if (inRequirements && cleanItem.length > 3) {
      requirements.push({
        title: cleanItem.slice(0, 50),
        description: cleanItem,
        priority: /must|essential|required|mandatory/i.test(cleanItem) ? 'high' : 'medium',
        sourceText: line,
      });
    } else if (inConstraints && cleanItem.length > 3) {
      constraints.push({
        type: /team/i.test(cleanItem) ? 'team' : /language|framework/i.test(cleanItem) ? 'technology' : 'restriction',
        description: cleanItem,
        sourceText: line,
      });
    } else if (inEvaluation && cleanItem.length > 3 && !/^total:/i.test(cleanItem)) {
      const weightMatch = cleanItem.match(/(\d+\s*(?:marks|%|points))/i);
      evaluationCriteria.push({
        criterion: cleanItem.replace(/:\s*\d+.*$/, '').trim(),
        weightage: weightMatch ? weightMatch[1] : null,
        description: cleanItem,
        sourceText: line,
      });
    }

    const dlMatch = line.match(/(?:deadline|due date|due on|due by|submit by)[\s:]+([^\n\.,]+(?:(?:am|pm|[\d]{4}))?)/i);
    if (dlMatch && !deadlines.some(d => d.sourceText === line)) {
      const timeMatch = line.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
      deadlines.push({
        description: 'Submission Deadline',
        date: dlMatch[1].trim(),
        time: timeMatch ? timeMatch[1].trim() : null,
        type: 'final',
        sourceText: line,
      });
    }
  }

  const phaseMatches = text.matchAll(/Phase\s*(\d+)[\s\-:]+([^:\n]+)[:\s]+([^\n]+)/gi);
  for (const m of phaseMatches) {
    const pDate = m[3].match(/by\s+([^\n\.,]+)/i);
    deadlines.push({
      description: `Phase ${m[1]}: ${m[2].trim()}`,
      date: pDate ? pDate[1].trim() : m[3].trim(),
      time: null,
      type: 'intermediate',
      sourceText: m[0].trim(),
    });
  }

  if (deliverables.length === 0) {
    const reportMatch = text.match(/(report|documentation|code|video|presentation|paper)/gi);
    if (reportMatch) {
      const unique = [...new Set(reportMatch.map(r => r.toLowerCase()))];
      unique.forEach(u => {
        deliverables.push({
          name: u.charAt(0).toUpperCase() + u.slice(1),
          description: `Submit ${u} as specified in assignment.`,
          mandatory: true,
          sourceText: 'Inferred from assignment text',
        });
      });
    }
  }

  const allDueDates = [...text.matchAll(/(?:due|deadline)[\s:]+(?:on|by)?\s*([A-Za-z]+\s+\d{1,2}(?:,\s*\d{4})?)/gi)].map(m => m[1]);
  let hasConflicts = false;
  if (allDueDates.length >= 2 && allDueDates[0] !== allDueDates[1]) {
    hasConflicts = true;
    ambiguities.push({
      type: 'conflicting',
      issue: 'Conflicting submission deadlines detected',
      reason: `Found multiple contradictory dates: "${allDueDates[0]}" and "${allDueDates[1]}".`,
      sourceText: `Multiple dates mentioned: ${allDueDates.join(' vs ')}`,
      recommendation: 'Ask the professor to clarify the exact official submission deadline.',
    });
  }

  if (deadlines.length === 0) {
    ambiguities.push({
      type: 'missing',
      issue: 'No submission deadline specified',
      reason: 'The instructions do not specify a date or time when this assignment is due.',
      sourceText: null,
      recommendation: 'Confirm the final due date with your professor or course schedule.',
    });
  }

  const actionPlan = [
    {
      stage: 'Phase 1: Planning & Setup',
      order: 1,
      tasks: [
        { title: 'Read instructions & clarify ambiguities', description: 'Review constraints and clarify any missing details with instructor', priority: 'high', estimatedEffort: '1-2 hours' },
        { title: 'Review requirements & constraints', description: 'Ensure required technology stack and team parameters are aligned', priority: 'high', estimatedEffort: '2 hours' },
      ],
    },
    {
      stage: 'Phase 2: Implementation',
      order: 2,
      tasks: (requirements.length > 0 ? requirements : [{ title: 'Implement primary core requirements', description: 'Build solution according to brief', priority: 'high' }]).map(r => ({
        title: r.title,
        description: r.description,
        priority: r.priority || 'medium',
        estimatedEffort: '4-6 hours',
      })),
    },
    {
      stage: 'Phase 3: Verification & Submission',
      order: 3,
      tasks: (deliverables.length > 0 ? deliverables : [{ name: 'Final Submission Deliverable', description: 'Prepare and upload all files' }]).map(d => ({
        title: `Prepare deliverable: ${d.name}`,
        description: d.description || 'Finalize and package required submission file',
        priority: 'high',
        estimatedEffort: '2 hours',
      })),
    },
  ];

  return {
    assignmentOverview: {
      title,
      subject,
      objective,
      summary: text.slice(0, 300).replace(/\s+/g, ' ') + '…',
      importantNotes: constraints.map(c => c.description).slice(0, 4),
    },
    deliverables,
    requirements,
    constraints,
    deadlines,
    submissionRequirements: [
      { aspect: 'platform', description: 'Follow course submission portal instructions.', sourceText: null },
    ],
    evaluationCriteria,
    ambiguities,
    actionPlan,
    deadlineStatus: deadlines.length > 0 ? (hasConflicts ? 'conflicting' : 'specified') : 'not_specified',
    hasConflicts,
    completenessScore: Math.min(100, Math.max(20, (deliverables.length * 15) + (deadlines.length * 20) + (requirements.length * 10))),
  };
}

function extractAndParseJSON(rawText) {
  let jsonText = rawText;
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (parseError) {
    throw new Error(`AI returned invalid JSON: ${parseError.message}`);
  }

  const validation = validateAnalysisResponse(parsed);
  if (!validation.valid) {
    throw new Error(`Invalid analysis response: ${validation.errors.join(', ')}`);
  }

  return parsed;
}

/**
 * Main Orchestrator:
 * Tries Claude -> Gemini -> Groq -> Local Parser fallback
 */
async function analyzeAssignment(assignmentText) {
  if (process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('your_anthropic_api_key')) {
    try {
      console.log('🤖 Analyzing with Anthropic Claude API...');
      return await callClaude(assignmentText);
    } catch (err) {
      console.warn('⚠️  Claude API error:', err.message);
    }
  }

  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    try {
      console.log('✨ Analyzing with Google Gemini Free API...');
      return await callGemini(assignmentText);
    } catch (err) {
      console.warn('⚠️  Gemini API error:', err.message);
    }
  }

  if (process.env.GROQ_API_KEY) {
    try {
      console.log('⚡ Analyzing with Groq Free API (Llama 3.3)...');
      return await callGroq(assignmentText);
    } catch (err) {
      console.warn('⚠️  Groq API error:', err.message);
    }
  }

  console.log('💡 Using Intelligent Assignment Requirement Engine (Offline/Zero-Credit Mode)...');
  return localIntelligentAnalysis(assignmentText);
}

module.exports = { analyzeAssignment };
