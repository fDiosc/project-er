# ER Review System - API Documentation

This document provides comprehensive documentation for all API endpoints in the ER Review System.

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
  "message": "Success message (optional)"
}
```

### Error Response
```json
{
  "error": "Error message",
  "message": "Human-readable error description"
}
```

## 🔑 Authentication Endpoints

### POST /api/auth/login

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

**Available Users:**
- `admin` / `admin123` (Admin role)
- `reviewer` / `review123` (Reviewer role)

### POST /api/auth/verify

Verify JWT token validity.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

## 📋 ER Management Endpoints

### GET /api/ers

List ERs with filtering, pagination, and sorting.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 25)
- `search` (string): Full-text search across subject, description
- `company` (string): Filter by company name
- `status` (string): Filter by status (OPEN, IN_REVIEW, ACCEPTED, REJECTED)
- `minScore` (number): Minimum total score (0-25)
- `maxScore` (number): Maximum total score (0-25)
- `sortBy` (string): Sort field (subject, status, totalCached, etc.)
- `sortOrder` (string): Sort direction (asc, desc)

**Example Request:**
```
GET /api/ers?page=1&limit=25&search=performance&company=TechCorp&status=OPEN&minScore=15
```

**Response:**
```json
{
  "data": [
    {
      "id": "cm1a2b3c4d5e6f7g8h9i0j",
      "subject": "Performance optimization for dashboard",
      "overview": "Improve dashboard loading times",
      "description": "Users are experiencing slow dashboard load times...",
      "status": "OPEN",
      "strategic": 4,
      "impact": 5,
      "technical": 3,
      "resource": 2,
      "market": 4,
      "totalCached": 18,
      "company": {
        "id": "company123",
        "name": "TechCorp"
      },
      "priorityLabel": "High",
      "sentiment": "Positive",
      "committedVersion": "v2.1.0",
      "requestedAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "_count": {
        "comments": 3
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 150,
    "pages": 6
  },
  "filters": {
    "search": "performance",
    "company": "TechCorp",
    "status": "OPEN",
    "minScore": 15
  }
}
```

### GET /api/ers/[id]

Get detailed information about a specific ER.

**Response:**
```json
{
  "id": "cm1a2b3c4d5e6f7g8h9i0j",
  "externalId": "ER-2024-001",
  "subject": "Performance optimization for dashboard",
  "overview": "Improve dashboard loading times",
  "description": "Users are experiencing slow dashboard load times...",
  "status": "OPEN",
  "strategic": 4,
  "impact": 5,
  "technical": 3,
  "resource": 2,
  "market": 4,
  "totalCached": 18,
  "company": {
    "id": "company123",
    "name": "TechCorp"
  },
  "priorityLabel": "High",
  "sentiment": "Positive",
  "committedVersion": "v2.1.0",
  "requestedAt": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "tags": [
    {
      "id": "tag123",
      "name": "performance",
      "color": "#3B82F6"
    }
  ],
  "comments": [
    {
      "id": "comment123",
      "body": "This is a critical issue affecting user experience",
      "authorId": "admin",
      "createdAt": "2024-01-15T11:00:00Z"
    }
  ],
  "audits": [
    {
      "id": "audit123",
      "action": "SCORE_UPDATE",
      "actorId": "admin",
      "payload": {
        "field": "impact",
        "oldValue": 4,
        "newValue": 5
      },
      "createdAt": "2024-01-15T11:15:00Z"
    }
  ]
}
```

### PUT /api/ers/[id]

Update ER information.

**Request Body:**
```json
{
  "subject": "Updated subject",
  "overview": "Updated overview",
  "description": "Updated description",
  "status": "IN_REVIEW",
  "priorityLabel": "High",
  "sentiment": "Positive",
  "committedVersion": "v2.2.0"
}
```

**Response:**
```json
{
  "id": "cm1a2b3c4d5e6f7g8h9i0j",
  "subject": "Updated subject",
  // ... other fields
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

### PUT /api/ers/[id]/scores

Update ER scores specifically.

**Request Body:**
```json
{
  "strategic": 4,
  "impact": 5,
  "technical": 3,
  "resource": 2,
  "market": 4
}
```

**Response:**
```json
{
  "id": "cm1a2b3c4d5e6f7g8h9i0j",
  "strategic": 4,
  "impact": 5,
  "technical": 3,
  "resource": 2,
  "market": 4,
  "totalCached": 18,
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

### POST /api/ers

Create a new ER.

**Request Body:**
```json
{
  "subject": "New enhancement request",
  "overview": "Brief overview",
  "description": "Detailed description",
  "companyId": "company123",
  "strategic": 3,
  "impact": 4,
  "technical": 2,
  "resource": 3,
  "market": 3,
  "priorityLabel": "Medium"
}
```

**Response:**
```json
{
  "id": "cm1a2b3c4d5e6f7g8h9i0j",
  "subject": "New enhancement request",
  // ... other fields
  "createdAt": "2024-01-15T12:00:00Z"
}
```

## 💬 Comments Endpoints

### GET /api/ers/[id]/comments

Get all comments for an ER.

**Response:**
```json
{
  "data": [
    {
      "id": "comment123",
      "body": "This needs priority attention",
      "authorId": "admin",
      "erId": "cm1a2b3c4d5e6f7g8h9i0j",
      "createdAt": "2024-01-15T11:00:00Z"
    }
  ]
}
```

### POST /api/ers/[id]/comments

Add a comment to an ER.

**Request Body:**
```json
{
  "body": "This is a new comment",
  "authorId": "admin"
}
```

**Response:**
```json
{
  "id": "comment456",
  "body": "This is a new comment",
  "authorId": "admin",
  "erId": "cm1a2b3c4d5e6f7g8h9i0j",
  "createdAt": "2024-01-15T12:30:00Z"
}
```

## 🏢 Company Endpoints

### GET /api/companies

Get list of all companies.

**Response:**
```json
{
  "data": [
    {
      "id": "company123",
      "name": "TechCorp",
      "createdAt": "2024-01-01T00:00:00Z",
      "_count": {
        "ers": 25
      }
    }
  ]
}
```

## 📊 Dashboard Endpoints

### GET /api/dashboard/summary

Get dashboard analytics and summary data.

**Response:**
```json
{
  "kpis": {
    "totalERs": 150,
    "openERs": 45,
    "inReviewERs": 32,
    "acceptedERs": 58,
    "rejectedERs": 15,
    "completionRate": 73.33,
    "averageScore": 16.8,
    "averageScoreThisMonth": 17.2
  },
  "statusDistribution": [
    { "name": "Open", "value": 45, "percentage": 30 },
    { "name": "In Review", "value": 32, "percentage": 21.33 },
    { "name": "Accepted", "value": 58, "percentage": 38.67 },
    { "name": "Rejected", "value": 15, "percentage": 10 }
  ],
  "companyPerformance": [
    {
      "company": "TechCorp",
      "totalERs": 45,
      "averageScore": 18.5,
      "acceptanceRate": 82.35
    }
  ],
  "scoreDistribution": {
    "strategic": { "average": 3.4, "distribution": [5, 12, 25, 18, 8] },
    "impact": { "average": 3.8, "distribution": [3, 8, 22, 28, 12] },
    "technical": { "average": 3.2, "distribution": [8, 15, 30, 20, 5] },
    "resource": { "average": 2.9, "distribution": [12, 22, 25, 15, 6] },
    "market": { "average": 3.6, "distribution": [4, 10, 20, 30, 15] }
  },
  "trendData": [
    {
      "month": "Jan 2024",
      "created": 25,
      "resolved": 18,
      "averageScore": 16.5
    }
  ]
}
```

## 📁 Data Management Endpoints

### POST /api/import/csv

Import ERs from CSV file.

**Request Body (FormData):**
```
file: <CSV file>
```

**Response:**
```json
{
  "message": "CSV imported successfully",
  "imported": 125,
  "skipped": 5,
  "errors": 2,
  "details": {
    "newCompanies": ["NewCorp", "StartupInc"],
    "duplicates": 3,
    "validationErrors": [
      {
        "row": 45,
        "error": "Invalid status value"
      }
    ]
  }
}
```

### GET /api/export/csv

Export ERs to CSV format.

**Query Parameters:**
Same as `/api/ers` endpoint for filtering.

**Response:**
Returns CSV file with headers:
```
Subject,Overview,Description,Company,Status,Strategic,Impact,Technical,Resource,Market,Total Score,Priority,Sentiment,Requested Date,Committed Version
```

## ⚙️ Settings Endpoints

### GET /api/settings/weights

Get score calculation weights.

**Response:**
```json
{
  "strategic": 1.0,
  "impact": 1.0,
  "technical": 1.0,
  "resource": 1.0,
  "market": 1.0
}
```

### PUT /api/settings/weights

Update score calculation weights.

**Request Body:**
```json
{
  "strategic": 1.2,
  "impact": 1.5,
  "technical": 1.0,
  "resource": 0.8,
  "market": 1.1
}
```

**Response:**
```json
{
  "strategic": 1.2,
  "impact": 1.5,
  "technical": 1.0,
  "resource": 0.8,
  "market": 1.1,
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

## 🔍 Data Models

### ER Model
```typescript
interface ER {
  id: string                    // CUID
  externalId?: string          // External system ID
  subject: string              // ER title
  overview?: string            // Brief description
  description?: string         // Detailed description
  status: ERStatus             // OPEN | IN_REVIEW | ACCEPTED | REJECTED
  
  // Scores (0-5 scale)
  strategic?: number
  impact?: number
  technical?: number
  resource?: number           // Higher = more resources needed
  market?: number
  totalCached?: number        // Computed total score
  
  // Metadata
  priorityLabel?: string      // High, Medium, Low
  sentiment?: string          // Positive, Neutral, Negative
  committedVersion?: string   // Target version
  requestedAt?: Date         // When requested
  
  // Relations
  companyId: string
  company: Company
  tags: ERTag[]
  comments: Comment[]
  audits: Audit[]
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}
```

### Company Model
```typescript
interface Company {
  id: string           // CUID
  name: string         // Unique company name
  ers: ER[]           // Related ERs
  createdAt: Date
  updatedAt: Date
}
```

### Comment Model
```typescript
interface Comment {
  id: string
  body: string         // Comment content
  authorId?: string    // User who created comment
  erId: string         // Related ER
  er: ER
  createdAt: Date
}
```

### Audit Model
```typescript
interface Audit {
  id: string
  action: string       // Action type (CREATED, UPDATED, SCORE_CHANGED, etc.)
  actorId?: string     // User who performed action
  erId: string         // Related ER
  er: ER
  payload?: Json       // Action details
  createdAt: Date
}
```

## 📈 Score Calculation

The total score is calculated using the formula:
```
Total = Strategic + Impact + Market + Technical + (5 - Resource)
```

**Note:** Resource score is inverted because higher resource requirements (5) should contribute less to the total score, while lower resource requirements (1) should contribute more.

**Score Weights:** Each dimension can have configurable weights (default: 1.0 for all).

**Range:** Total possible scores range from 0 to 25 points.

## ⚠️ Error Codes

- **400 Bad Request**: Invalid request data or validation errors
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User doesn't have required permissions
- **404 Not Found**: Requested resource doesn't exist
- **409 Conflict**: Resource conflict (e.g., duplicate company name)
- **422 Unprocessable Entity**: Request data validation failed
- **500 Internal Server Error**: Server-side error

## 🚀 Rate Limits

Currently no rate limits are implemented, but recommended for production:
- Authentication endpoints: 5 requests/minute
- Data modification endpoints: 100 requests/minute
- Read-only endpoints: 1000 requests/minute

## 🔒 Security Notes

- All endpoints except `/api/auth/login` require authentication
- JWT tokens expire after 24 hours
- Input validation using Zod schemas
- SQL injection protection via Prisma ORM
- XSS protection via input sanitization

---

*Last updated: 2024-01-15*