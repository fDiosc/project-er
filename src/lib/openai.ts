import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable')
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export type AISummaryResponse = {
    summary: string
    scores: {
        strategic: number
        impact: number
        market: number
        technical: number
        resource: number
    }
    reasoning: string
}

export type SimilarERResponse = {
    similarERs: {
        id: string
        subject: string
        externalId?: string | null
        zendeskTicketUrl?: string | null
        similarityScore: number // 0-100
        functionalReasoning: string
    }[]
}

export type ConsolidatedPRDResponse = {
    title: string
    summary: string
    requirements: {
        title: string
        description: string
        priority: 'MUST' | 'SHOULD' | 'COULD'
    }[]
    suggestedScores: {
        strategic: number
        impact: number
        market: number
        technical: number
        resource: number
    }
}

export async function analyzeERContext(
    subject: string,
    description: string,
    comments: string[]
): Promise<AISummaryResponse> {
    const contextText = `
Subject: ${subject}
Description: ${description}
Recent Comments:
${comments.map((c, i) => `${i + 1}. ${c}`).join('\n')}
`.trim()

    const systemPrompt = `
You are a Product Management Assistant. Your task is to analyze an Enhancement Request (ER).
Generate a concise 2-sentence summary of the "Why" and suggest prioritization scores (0-5).

Scores:
- Strategic: Alignment with business goals.
- Impact: Value to the customer.
- Market: Revenue/Sales potential.
- Technical: Feasibility (5 is easiest).
- Resource: Effort (1 is low effort, 5 is high effort).

IMPORTANT: Return a JSON object with:
{
  "summary": "...",
  "scores": { "strategic": X, "impact": X, "market": X, "technical": X, "resource": X },
  "reasoning": "..."
}
`.trim()

    // Use the new Responses API as per GPT-5.2 documentation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (openai.responses as any).create({
        model: 'gpt-5.2',
        input: [
            { role: 'developer', content: systemPrompt },
            { role: 'user', content: contextText }
        ],
        reasoning: {
            effort: 'none' // Low latency for simple summarization
        },
        text: {
            verbosity: 'medium',
            format: { type: 'json_object' }
        }
    })

    try {
        // Assuming the response structure based on the documentation provided
        const content = response.output_text || response.choices?.[0]?.message?.content
        return JSON.parse(content)
    } catch (error) {
        console.error('Failed to parse AI response:', error)
        throw new Error('AI analysis failed to return valid JSON')
    }
}

export async function findSimilarERs(
    targetER: { id: string; subject: string; description: string; aiSummary?: string | null },
    backlog: { id: string; subject: string; description: string; aiSummary?: string | null }[]
): Promise<SimilarERResponse> {
    const systemPrompt = `
You are a Senior Product Analyst. Your task is to find functionally similar Enhancement Requests (ERs) in a backlog.
Focus on the functional intersection: ERs that solve the same core problem or would be implemented as part of the same feature.

IGNORE:
- Generic terms like "Login" unless they share the same specific issue (e.g., both mention "Zscaler certificate issue").
- Grammatical differences or different terminology for the same thing (e.g., "Solution" vs "Article").

RETURN a JSON object with a list of up to 10 candidates that have at least 60% functional similarity:
{
  "similarERs": [
    { "id": "...", "subject": "...", "similarityScore": 85, "functionalReasoning": "Both ERs require maintaining the original author field during revision cycles to avoid audit confusion." }
  ]
}
`.trim()

    const contextText = `
TARGET ER:
ID: ${targetER.id}
Subject: ${targetER.subject}
Summary/Description: ${targetER.aiSummary || targetER.description}

BACKLOG TO COMPARE:
${backlog.slice(0, 50).map(er => `ID: ${er.id} | Subject: ${er.subject} | Summary: ${er.aiSummary || er.description.substring(0, 200)}`).join('\n---\n')}
`.trim()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (openai.responses as any).create({
        model: 'gpt-5.2',
        input: [
            { role: 'developer', content: systemPrompt },
            { role: 'user', content: contextText }
        ],
        text: { format: { type: 'json_object' } }
    })

    const content = response.output_text || response.choices?.[0]?.message?.content
    return JSON.parse(content)
}

export async function generateConsolidatedPRD(
    ers: { subject: string; description: string; aiSummary?: string | null }[]
): Promise<ConsolidatedPRDResponse> {
    const systemPrompt = `
You are a Senior Technical Product Manager. Your task is to consolidate multiple similar Enhancement Requests into a single cohesive Product Requirements Document (PRD).

Analyze the functional intersection and extract unique requirements that, if implemented together, would satisfy all the requests in the group.

RETURN a JSON object:
{
  "title": "Clear and concise feature title",
  "summary": "High-level summary of the consolidated feature",
  "requirements": [
    { "title": "Requirement name", "description": "Detailed functional spec", "priority": "MUST|SHOULD|COULD" }
  ],
  "suggestedScores": { "strategic": X, "impact": X, "market": X, "technical": X, "resource": X }
}

IMPORTANT: All suggested scores MUST be between 0 and 5. Do NOT sum the scores of the individual ERs; provide a single score that represents the entire consolidated theme.
`.trim()

    const contextText = ers.map((er, i) => `
ER #${i + 1}:
Subject: ${er.subject}
Description: ${er.aiSummary || er.description}
`).join('\n---\n')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (openai.responses as any).create({
        model: 'gpt-5.2',
        input: [
            { role: 'developer', content: systemPrompt },
            { role: 'user', content: contextText }
        ],
        text: { format: { type: 'json_object' } }
    })

    const content = response.output_text || response.choices?.[0]?.message?.content
    return JSON.parse(content)
}

export type CustomAnalysisResponse = {
    title: string
    report: string
}

export async function generateCustomAnalysis(
    userInput: string,
    ers: { subject: string; description: string; aiSummary?: string | null }[]
): Promise<CustomAnalysisResponse> {
    const systemPrompt = `
You are a Senior Product Strategist. Your task is to perform a custom analysis on a set of Enhancement Requests (ERs) based on a specific user request.

Analyze the provided ERs and answer the user's question or perform the comparison/analysis requested.
Your output must be a professional report in Markdown format.

RETURN a JSON object:
{
  "title": "A descriptive title for this specific analysis",
  "report": "The full analysis report in Markdown format"
}
`.trim()

    const contextText = `
USER REQUEST: ${userInput}

ERS TO ANALYZE:
${ers.map((er, i) => `
ER #${i + 1}:
Subject: ${er.subject}
Description: ${er.aiSummary || er.description}
`).join('\n---\n')}
`.trim()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (openai.responses as any).create({
        model: 'gpt-5.2',
        input: [
            { role: 'developer', content: systemPrompt },
            { role: 'user', content: contextText }
        ],
        text: { format: { type: 'json_object' } }
    })

    const content = response.output_text || response.choices?.[0]?.message?.content
    return JSON.parse(content)
}
