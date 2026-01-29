import { z } from 'zod'
import { ERStatus } from '@prisma/client'

// Score validation (0-5 range)
export const scoreSchema = z.number().min(0).max(5).optional()

// ER status enum validation
export const erStatusSchema = z.nativeEnum(ERStatus)

// Company validation
export const companySchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1).max(255),
})

// ER creation schema
export const createERSchema = z.object({
  subject: z.string().min(1).max(500),
  overview: z.string().optional(),
  description: z.string().optional(),
  externalId: z.string().optional(),
  companyId: z.string().cuid(),
  status: erStatusSchema.optional(),
  priorityLabel: z.string().optional(),
  submittedPriority: z.string().optional(),
  sentiment: z.string().optional(),
  committedVersion: z.string().optional(),
  releaseId: z.string().cuid().optional(),
  devStatusId: z.string().cuid().optional(),
  requestedAt: z.coerce.date().optional(),
  strategic: scoreSchema,
  impact: scoreSchema,
  technical: scoreSchema,
  resource: scoreSchema,
  market: scoreSchema,
})

// ER update schema
export const updateERSchema = z.object({
  subject: z.string().min(1).max(500).optional(),
  overview: z.string().optional(),
  description: z.string().optional(),
  companyId: z.string().cuid().optional(),
  status: erStatusSchema.optional(),
  priorityLabel: z.string().optional(),
  submittedPriority: z.string().optional(),
  sentiment: z.string().optional(),
  committedVersion: z.string().optional(),
  releaseId: z.string().cuid().optional(),
  devStatusId: z.string().cuid().optional(),
  requestedAt: z.coerce.date().optional(),
})

// Score update schema
export const updateScoresSchema = z.object({
  strategic: scoreSchema,
  impact: scoreSchema,
  technical: scoreSchema,
  resource: scoreSchema,
  market: scoreSchema,
})

// ER query filters schema
export const erFiltersSchema = z.object({
  q: z.string().optional(),
  companyId: z.union([z.string().cuid(), z.array(z.string().cuid())]).optional(),
  status: z.union([erStatusSchema, z.array(erStatusSchema)]).optional(),
  releaseId: z.union([z.string().cuid(), z.array(z.string().cuid())]).optional(),
  devStatusId: z.union([z.string().cuid(), z.array(z.string().cuid())]).optional(),
  minTotal: z.coerce.number().optional(),
  maxTotal: z.coerce.number().optional(),
  tags: z.array(z.string()).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10),
  sort: z.string().optional(),
})

// Score weights schema
export const scoreWeightsSchema = z.object({
  strategic: z.number().default(1.0),
  impact: z.number().default(1.0),
  market: z.number().default(1.0),
  technical: z.number().default(-1.0),
  resource: z.number().default(-1.0),
})

// CSV import schema
export const csvImportSchema = z.object({
  upsertBy: z.enum(['externalId', 'subject+company']).default('externalId'),
  statusMapping: z.record(z.string(), erStatusSchema),
})

// Comment schema
export const commentSchema = z.object({
  body: z.string().min(1).max(1000),
  authorId: z.string().optional(),
})

// Tag schema
export const tagSchema = z.object({
  label: z.string().min(1).max(100),
})

// Default score weights - Updated to match Excel formula
export const DEFAULT_SCORE_WEIGHTS = {
  strategic: 1.0,
  impact: 1.0,
  market: 1.0,
  technical: 1.0, // Direct value
  resource: 1.0,  // Will be inverted in calculation (5-resource)
}

// Score calculation function - Corrected formula
// Formula: Strategic + Impact + Market + Technical + (if Resource is empty then 0, else 5-Resource)
export function calculateTotalScore(
  scores: {
    strategic?: number | null
    impact?: number | null
    technical?: number | null
    resource?: number | null
    market?: number | null
  },
  weights = DEFAULT_SCORE_WEIGHTS
): number {
  const strategic = (scores.strategic ?? 0) * weights.strategic
  const impact = (scores.impact ?? 0) * weights.impact
  const market = (scores.market ?? 0) * weights.market
  const technical = (scores.technical ?? 0) * weights.technical

  // Resource: if empty then 0, else 5-Resource (inverting resource requirements)
  const resource = scores.resource != null ? (5 - scores.resource) * weights.resource : 0

  return Math.round(strategic + impact + market + technical + resource)
}