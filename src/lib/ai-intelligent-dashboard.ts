import OpenAI from 'openai'
import { extractData } from './data-agent'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const ANALYST_PROMPT = `
You are the Lead Strategic UI Analyst for the ER-Review platform.
Generate a professional analysis and a visual Artifact (Chart, Table, or Scorecard) based on the provided RAW DATA.

**VISUALIZATION RULES:**
1. **Trend Charts**: If the data has a date/time column (e.g., "createdDate", "date"), use it for the "labels" array.
2. **Snapshot Data**: Even if the data has only ONE row, you MUST visualize it (e.g., a Bar Chart with one bar or a Scorecard).
3. **Data Mapping**: Look closely at the field names in the RAW DATA. Use them exactly as keys.
4. **Labels & Datasets**: The "labels" array and each "data" array in "datasets" MUST have the exact same length.

**RESPONSE FORMAT:**
- Professional markdown analysis (including a summary of the data found).
- A JSON block wrapped in \`\`\`json\`\`\` code blocks.
- JSON structure:
{
  "type": "chart" | "table" | "scorecard",
  "title": "string",
  "description": "string",
  "chartType": "bar" | "line" | "pie" | "area",
  "data": { 
    "labels": ["Label1", "Label2"], 
    "datasets": [{ "label": "Metric Name", "data": [val1, val2] }]
  }, 
  "insights": [{ "title": "...", "description": "...", "type": "warning" | "opportunity" | "action" }],
  "followUpQuestions": ["string"]
}
`.trim()

export async function processDashboardQuery(message: string, history: { role: 'user' | 'assistant', content: string }[]) {
    // 1. DATA EXTRACTION AGENT (A2A)
    const extractionResult = await extractData(message)

    const dataContext = extractionResult.error
        ? `ERROR FETCHING DATA: ${extractionResult.error}`
        : `RAW DATA FROM DATABASE: ${JSON.stringify(extractionResult.data, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2)}`

    // 2. ANALYST AGENT (Final synthesis)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (openai.responses as any).create({
        model: 'gpt-5.2',
        input: [
            { role: 'developer', content: ANALYST_PROMPT },
            ...history.map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: `USER REQUEST: "${message}"\n\n${dataContext}` }
        ],
        text: { format: { type: 'text' } }
    })

    const content = response.output_text || response.choices?.[0]?.message?.content || ""

    let artifact: any = null
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
    if (jsonMatch && jsonMatch[1]) {
        try {
            artifact = JSON.parse(jsonMatch[1])
        } catch (e) {
            console.error('Failed to parse AI artifact:', e)
        }
    }

    const cleanText = content.replace(/```json[\s\S]*?```/, '').trim()

    return {
        text: cleanText,
        artifact,
        debug: {
            query: extractionResult.query,
            error: extractionResult.error,
            attempts: extractionResult.attempts
        }
    }
}
