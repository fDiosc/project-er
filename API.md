# ER Review System - API Documentation

This document provides comprehensive documentation for all API endpoints in the ER Review System.

> [!NOTE]
> This documentation is synchronized with the **GPT-5.2 Enhanced** version of the product.

*Last updated: 2026-02-02*

## 🔐 Authentication

All API endpoints (except `/api/auth/login`) require authentication via JWT token in one of the following ways:

1. **Authorization Header**: `Authorization: Bearer <token>`
2. **Cookie**: `auth_token=<token>`
3. **Query Parameter**: `?token=<token>`

## 📊 Response Format

### Success Response
```json
{
  "data": <response_data>,
  "items": <list_data>, // For paginated or plural results
  "message": "Success message (optional)"
}
```

### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description"
  }
}
```

## 🔑 Authentication Endpoints

### POST /api/auth/login
Authenticate user and receive JWT token.

### POST /api/auth/verify
Verify JWT token validity.

## 📋 ER Management Endpoints

### GET /api/ers
List ERs with filtering, pagination, and sorting.

**Query Parameters:**
- `q` (string): Full-text search across subject, description, etc.
- `companyId` (string | array): Filter by one or more company IDs.
- `status` (string | array): Filter by status (OPEN, IN_REVIEW, ACCEPTED, REJECTED, etc.).
- `releaseId` (string | array): Filter by Release.
- `devStatusId` (string | array): Filter by Development Status.
- `minTotal`, `maxTotal` (number): Filter by calculated total score.
- `page`, `pageSize` (number): Pagination control.
- `sort` (string): Sort field (prefix with `-` for descending).

### POST /api/ers
Create a new ER.

### GET /api/ers/[id]
Get detailed information about a specific ER.

### PUT /api/ers/[id]
Update ER information.

### PUT /api/ers/[id]/scores
Update ER scores specifically.

### POST /api/ers/generate-prd
Consolidate multiple ERs into a single PRD.
**Request Body:** `{ "erIds": ["id1", "id2", ...] }`

## 🧠 AI & Intelligent Analysis

### POST /api/ai-analysis
Generate a custom AI strategic analysis for a set of ERs.
**Request Body:** `{ "erIds": ["id1", ...], "prompt": "Your analysis question" }`

### GET /api/ai-analysis
List historical AI analysis reports.

### POST /api/intelligent-dashboard/chat
Interactive AI chat with the backlog context.
**Request Body:** `{ "message": "...", "history": [...] }`

## 🔄 Integrations

### POST /api/integrations/zendesk/sync
Synchronize data from Zendesk.
**Request Body:**
```json
{
  "autoRejectMissing": boolean,
  "autoAcceptMapped": boolean,
  "runAI": boolean
}
```

## 🏢 Organization & Taxonomy

### GET /api/companies
Get list of all companies.

### GET /api/releases
Get list of all Releases.

### GET /api/dev-statuses
Get list of all Development Statuses.

### GET /api/themes
Get list of all ER Themes (for clustering).

## 📊 Dashboard Endpoints

### GET /api/dashboard/summary
Get aggregate metrics for the dashboard.

### GET /api/dashboard/release-summary
Get summary specifically sliced by releases.

## ⚙️ Settings Endpoints

### GET /api/settings/weights
Get score calculation weights.

### PUT /api/settings/weights
Update score calculation weights.

## 🔍 Data Models

### ER Model
```typescript
interface ER {
  id: string
  externalId?: string
  subject: string
  status: ERStatus
  scores: {
    strategic: number
    impact: number
    technical: number
    resource: number
    market: number
    total: number
  }
  aiSummary?: string
  aiSuggestedScores?: Json
  // ... relations to Company, Release, DevStatus, Tags
}
```

## 📈 Score Calculation

The total score is calculated using the formula:
```
Total = Strategic + Impact + Market + Technical + (5 - Resource)
```
**Note:** Resource score is inverted (5-Resource) per current product requirements.

## ⚠️ Error Codes

- `CONFIG_ERROR`: Missing or invalid configuration (e.g., Zendesk).
- `VALIDATION_ERROR`: Zod schema validation failed.
- `AI_ERROR`: GPT-5.2 analysis failed.
- `FETCH_ERROR`: Database retrieval failure.

## 🔒 Security Notes

- **JWT (jose)**: Secure token management compatible with Edge Runtime.
- **Middleware Protection**: All `/api/*` routes are protected by `src/middleware.ts`.
- **Zscaler/VPN Compatibility**: Zendesk sync uses a `curl` bridge to bypass local SSL interference.