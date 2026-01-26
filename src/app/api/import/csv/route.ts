import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { prisma } from '@/lib/db'
import { calculateTotalScore } from '@/lib/validations'
import { ERStatus } from '@prisma/client'

interface CSVRow {
  ID?: string
  Status?: string
  Requested?: string
  'ER - Priority'?: string
  Subject?: string
  'Request Status'?: string
  Organization?: string
  Updated?: string
  'Submitted Priority'?: string
  RequestOverview?: string
  ER?: string
  Sentiment?: string
  'Status_1'?: string // Papa Parse renames duplicate headers
  'Commited version'?: string
  Strategic?: string
  Impact?: string
  Technical?: string
  Resource?: string
  Market?: string
  Total?: string
}

// Map CSV status values to our ERStatus enum
// Priority: Use the second Status column (Status_1) which contains Accepted/Rejected
function mapStatus(csvStatus: string | undefined): ERStatus {
  if (!csvStatus) return ERStatus.OPEN

  const status = csvStatus.toLowerCase().trim()

  // Direct mapping for exact matches
  if (status === 'accepted') return ERStatus.ACCEPTED
  if (status === 'rejected') return ERStatus.REJECTED

  // Fallback mapping for other status values
  if (status.includes('accept') || status.includes('approved') || status.includes('roadmap')) return ERStatus.ACCEPTED
  if (status.includes('reject') || status.includes('not accept') || status.includes('not planned')) return ERStatus.REJECTED
  if (status.includes('review') || status.includes('development') || status.includes('consideration') || status.includes('planned')) return ERStatus.IN_REVIEW
  if (status.includes('hold') || status.includes('on-hold')) return ERStatus.IN_REVIEW
  if (status.includes('open') || status.includes('closed')) return ERStatus.OPEN

  return ERStatus.OPEN
}

// Parse date from various formats
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null

  try {
    // Handle MM/DD/YYYY format
    const parsed = new Date(dateStr)
    if (isNaN(parsed.getTime())) return null
    return parsed
  } catch {
    return null
  }
}

// Parse score to number (0-5)
function parseScore(scoreStr: string | undefined): number | null {
  if (!scoreStr) return null

  const score = parseInt(scoreStr.trim())
  if (isNaN(score)) return null
  if (score < 0) return 0
  if (score > 5) return 5

  return score
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const upsertMode = formData.get('upsertMode') as string || 'externalId'

    if (!file) {
      return NextResponse.json(
        { error: { code: 'NO_FILE', message: 'No file provided' } },
        { status: 400 }
      )
    }

    // Read file content
    const text = await file.text()

    // Parse CSV
    const parseResult = Papa.parse<CSVRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    })

    if (parseResult.errors.length > 0) {
      console.error('CSV parsing errors:', parseResult.errors)
      return NextResponse.json(
        {
          error: {
            code: 'PARSE_ERROR',
            message: 'Failed to parse CSV',
            details: parseResult.errors
          }
        },
        { status: 400 }
      )
    }

    const rows = parseResult.data
    console.log(`Processing ${rows.length} CSV rows`)

    let processed = 0
    let created = 0
    let updated = 0
    const errors: string[] = []

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      try {
        // Skip rows without essential data
        if (!row.Subject?.trim()) {
          console.log(`Skipping row ${i + 1}: No subject`)
          continue
        }

        // Find or create company
        const organizationName = row.Organization?.trim() || 'Unknown'
        let company = await prisma.company.findUnique({
          where: { name: organizationName }
        })

        if (!company) {
          company = await prisma.company.create({
            data: { name: organizationName }
          })
          console.log(`Created company: ${organizationName}`)
        }

        // Prepare ER data
        const externalId = row.ID?.trim()
        const subject = row.Subject.trim()

        // Parse scores
        const strategic = parseScore(row.Strategic)
        const impact = parseScore(row.Impact)
        const technical = parseScore(row.Technical)
        const resource = parseScore(row.Resource)
        const market = parseScore(row.Market)

        // Calculate total score using our weights
        const totalCached = calculateTotalScore({
          strategic,
          impact,
          technical,
          resource,
          market,
        })

        // Determine status - prioritize Status_1 (second Status column) which contains Accepted/Rejected
        const status1 = row.Status // First Status column (Open, Closed, etc.)
        const status2 = row['Request Status'] // Request Status column  
        const status3 = row['Status_1'] // Second Status column - Papa Parse renames duplicate headers (Accepted/Rejected)

        // Use Status_1 (Accepted/Rejected) as primary, fall back to others
        const primaryStatus = status3 || status2 || status1 || 'Open'
        const mappedStatus = mapStatus(primaryStatus)

        // Log for debugging (remove in production)
        // console.log(`Row ${i + 1}: Status1="${status1}" Status2="${status2}" Status3="${status3}" -> Mapped: ${mappedStatus}`)

        const erData = {
          externalId,
          subject,
          overview: row.RequestOverview?.trim() || null,
          description: row.ER?.trim() || null,
          companyId: company.id,
          status: mappedStatus,
          priorityLabel: row['ER - Priority']?.trim() || null,
          submittedPriority: row['Submitted Priority']?.trim() || null,
          sentiment: row.Sentiment?.trim() || null,
          committedVersion: row['Commited version']?.trim() || null,
          requestedAt: parseDate(row.Requested),
          updatedAtCsv: parseDate(row.Updated),
          strategic,
          impact,
          technical,
          resource,
          market,
          totalCached,
          // Store raw status values for traceability
          externalStatus: status1?.trim() || null,
          externalRequestStatus: status2?.trim() || null,
          externalStatusAlt: status3?.trim() || null,
        }

        // Upsert based on mode
        let existingER = null

        if (upsertMode === 'externalId' && externalId) {
          existingER = await prisma.eR.findFirst({
            where: { externalId }
          })
        } else if (upsertMode === 'subject+company') {
          existingER = await prisma.eR.findFirst({
            where: {
              subject,
              companyId: company.id
            }
          })
        }

        if (existingER) {
          // Update existing ER
          await prisma.eR.update({
            where: { id: existingER.id },
            data: erData
          })

          // Create audit entry
          await prisma.audit.create({
            data: {
              erId: existingER.id,
              action: 'CSV_UPDATE',
              payload: {
                csvRow: i + 1,
                updatedFields: Object.keys(erData)
              },
            }
          })

          updated++
        } else {
          // Create new ER
          const newER = await prisma.eR.create({
            data: erData
          })

          // Create audit entry
          await prisma.audit.create({
            data: {
              erId: newER.id,
              action: 'CSV_IMPORT',
              payload: {
                csvRow: i + 1,
                source: 'csv_import'
              },
            }
          })

          created++
        }

        processed++

        // Log progress every 10 rows
        if (processed % 10 === 0) {
          console.log(`Processed ${processed} rows...`)
        }

      } catch (error) {
        const errorMsg = `Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    console.log(`Import completed: ${processed} processed, ${created} created, ${updated} updated, ${errors.length} errors`)

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: rows.length,
        processed,
        created,
        updated,
        errors: errors.length,
        errorDetails: errors.slice(0, 10) // Return first 10 errors
      }
    })

  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'IMPORT_ERROR',
          message: 'Failed to import CSV',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    )
  }
}