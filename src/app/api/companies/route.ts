import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { companySchema } from '@/lib/validations'

// GET /api/companies - List all companies
export async function GET(request: NextRequest) {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            ers: true
          }
        }
      }
    })

    return NextResponse.json(companies)
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: { code: 'FETCH_ERROR', message: 'Failed to fetch companies' } },
      { status: 500 }
    )
  }
}

// POST /api/companies - Create new company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = companySchema.parse(body)
    
    const company = await prisma.company.create({
      data: {
        name: data.name
      },
      include: {
        _count: {
          select: {
            ers: true
          }
        }
      }
    })

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    console.error('Error creating company:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid company data' } },
        { status: 400 }
      )
    }
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE_ERROR', message: 'Company with this name already exists' } },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: { code: 'CREATE_ERROR', message: 'Failed to create company' } },
      { status: 500 }
    )
  }
}