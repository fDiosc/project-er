import { ER, Company, ERStatus, Tag, Setting, Release, DevelopmentStatus } from '@prisma/client'

// ER with related data for the frontend
export type ERWithCompany = ER & {
  company: Company
  tags: Array<{ tag: Tag }>
  _count?: {
    comments: number
  }
}

// ER DTO used in API responses
export type ERDto = {
  id: string
  externalId?: string
  subject: string
  company: { id: string; name: string }
  status: ERStatus
  priorityLabel?: string
  submittedPriority?: string
  sentiment?: string
  committedVersion?: string
  release?: { id: string; name: string }
  devStatus?: { id: string; name: string }
  releaseId?: string
  devStatusId?: string
  requestedAt?: string
  updatedAtCsv?: string
  scores: {
    strategic?: number
    impact?: number
    technical?: number
    resource?: number
    market?: number
    total: number
  }
  overview?: string
  description?: string
  createdAt: string
  updatedAt: string
  // Integration fields
  source?: ERSource
  lastSyncAt?: string
  externalUpdatedAt?: string
  zendeskTicketUrl?: string
  aiSummary?: string
  aiSuggestedScores?: {
    strategic: number
    impact: number
    market: number
    technical: number
    resource: number
  }
  themeId?: string
}

export type ERSource = 'CSV' | 'ZENDESK'


export type DashboardSummary = {
  totalER: number
  byStatus: Record<ERStatus, number>
  acceptedRate: number
  avgScore: {
    overall: number
    accepted: number
    rejected: number
  }
  byCompany: Array<{
    company: string
    total: number
    accepted: number
    rejected: number
    inReview: number
    open: number
  }>
  trendDaily: Array<{
    date: string
    created: number
    accepted: number
    rejected: number
  }>
  scoreBuckets: Record<string, number>
  // New metrics
  avgDaysToDecision: number
  bySource: Record<string, number> // 'CSV' | 'ZENDESK'
  topTags: Array<{ tag: string; count: number }>
  topERs: Array<{
    id: string
    subject: string
    company: string
    totalScore: number
    status: ERStatus
  }>
  // Strategic insights
  scoreInflation?: {
    strategic: number
    impact: number
    market: number
    technical: number
    resource: number
  }
  neglectedHighScores?: Array<{
    id: string
    subject: string
    company: string
    totalScore: number
    daysOld: number
  }>
  rejectionDrivers?: Array<{ tag: string; count: number }>
}

// Filter types for the ER table
export type ERFilters = {
  q?: string
  companyId?: string
  status?: ERStatus
  minTotal?: number
  maxTotal?: number
  tags?: string[]
  page?: number
  pageSize?: number
  sort?: string
}

// Score weights configuration
export type ScoreWeights = {
  strategic: number
  impact: number
  market: number
  technical: number
  resource: number
}

// CSV import types
export type CSVImportOptions = {
  upsertBy: 'externalId' | 'subject+company'
  statusMapping: Record<string, ERStatus>
}

// API response wrapper
export type APIResponse<T = unknown> = {
  data?: T
  error?: {
    code: string
    message: string
    hint?: string
  }
}

// Paginated response
export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Additional types for the frontend
export type Comment = {
  id: string
  erId: string
  authorId?: string
  body: string
  createdAt: string
}

export type Audit = {
  id: string
  erId: string
  actorId?: string
  action: string
  payload?: unknown
  createdAt: string
}

export { ERStatus, type Company, type ER, type Tag, type Setting, type Release, type DevelopmentStatus }