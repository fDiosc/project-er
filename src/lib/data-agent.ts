import { prisma } from './db'
import { validateQuery } from './query-safety'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const SCHEMA_CONTEXT = `
TABLES:
- Company (id, name, createdAt, updatedAt)
- ER (id, externalId, subject, overview, description, companyId, status, priorityLabel, submittedPriority, sentiment, committedVersion, requestedAt, updatedAtCsv, strategic, impact, technical, resource, market, totalCached, externalStatus, externalStatusAlt, externalRequestStatus, releaseId, devStatusId, source, lastSyncAt, externalUpdatedAt, zendeskTicketUrl, aiSummary, aiSuggestedScores, createdAt, updatedAt, themeId)
- Release (id, name, createdAt, updatedAt)
- DevelopmentStatus (id, name, createdAt, updatedAt)
- Tag (id, label)
- ERTag (erId, tagId)
- Comment (id, erId, authorId, body, createdAt)
- ERTheme (id, title, description, requirements, createdAt, updatedAt, suggestedScores)

ENUMS:
- ERStatus: OPEN, IN_REVIEW, ACCEPTED, REJECTED, DELIVERED, MANUAL_REVIEW, ACCEPT, REJECT
- ERSource: CSV, ZENDESK

RELATIONSHIPS:
- ER.companyId -> Company.id
- ER.releaseId -> Release.id
- ER.devStatusId -> DevelopmentStatus.id
- ER.themeId -> ERTheme.id
- ERTag -> joins ER and Tag
`.trim()

const CODER_AGENT_PROMPT = `
You are a SQL Coder specializing in SQLite.
Your goal is to write a single SELECT query based on the requirements and the SCHEMA_CONTEXT.

**RULES:**
1. ONLY output the SQL code (no markdown, no explanations).
2. Use EXACT table and column names from SCHEMA_CONTEXT.
3. Enum values are UPPERCASE (e.g., 'ACCEPTED').
4. Use quoted aliases for casing (e.g., AS "avgScore").
5. Handle NULLs with COALESCE if needed.

SCHEMA:
${SCHEMA_CONTEXT}
`.trim()

const DOCTOR_AGENT_PROMPT = `
You are a Database Doctor. An agent tried to run a SQL query but it failed.
Your task is to analyze the error and the failed query against the SCHEMA_CONTEXT, then provide a CORRECTION PLAN for the Coder.

**OUTPUT FORMAT:**
- A concise explanation of the mistake.
- Clear instructions on how to fix it (referencing the correct tables/columns).
- DO NOT write the SQL yourself. Just the correction instructions.

SCHEMA:
${SCHEMA_CONTEXT}
`.trim()

const MAX_RETRIES = 3

export async function extractData(request: string): Promise<{ data: any[]; query: string; error?: string; attempts: number }> {
    let currentQuery = ""
    let attempts = 0
    let lastError = ""
    let correctionInstructions = ""

    while (attempts < MAX_RETRIES) {
        attempts++

        // 1. GENERATE (OR REGENERATE) SQL
        const coderInput = [
            { role: 'developer', content: CODER_AGENT_PROMPT },
            { role: 'user', content: `Original Request: ${request}` }
        ]

        if (correctionInstructions) {
            coderInput.push({
                role: 'user',
                content: `Your previous query failed with this error: "${lastError}".\nFOLLOW THIS CORRECTION PLAN: ${correctionInstructions}`
            })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const coderResponse = await (openai.responses as any).create({
            model: 'gpt-5.2',
            input: coderInput,
            text: { format: { type: 'text' } }
        })

        currentQuery = (coderResponse.output_text || coderResponse.choices?.[0]?.message?.content || "").trim()

        if (!currentQuery) break

        // 2. SAFETY CHECK
        const validation = validateQuery(currentQuery)
        if (!validation.safe) {
            lastError = `Security Block: ${validation.error}`
            correctionInstructions = "The query was blocked by our safety engine. Ensure you only use SELECT and follow read-only rules."
            continue
        }

        // 3. EXECUTE
        try {
            const result = await prisma.$queryRawUnsafe(currentQuery)
            return { data: result as any[], query: currentQuery, attempts }
        } catch (e: any) {
            lastError = e.message || "Unknown SQL Error"
            console.warn(`Attempt ${attempts} failed: ${lastError}`)

            // 4. ANALYZE ERROR (The Doctor)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const doctorResponse = await (openai.responses as any).create({
                model: 'gpt-5.2',
                input: [
                    { role: 'developer', content: DOCTOR_AGENT_PROMPT },
                    { role: 'user', content: `FAILED QUERY: ${currentQuery}\nERROR: ${lastError}` }
                ],
                text: { format: { type: 'text' } }
            })

            correctionInstructions = doctorResponse.output_text || doctorResponse.choices?.[0]?.message?.content || "Fix the syntax and table names."
        }
    }

    return {
        data: [],
        query: currentQuery,
        error: lastError || "Failed to generate a valid working query after multiple attempts.",
        attempts
    }
}
