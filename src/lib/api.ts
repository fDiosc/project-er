import { getAuthToken, removeAuthToken } from './auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export async function apiRequest(url: string, options: RequestInit = {}) {
  const token = getAuthToken()

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }

  try {
    const response = await fetch(`${API_BASE}${url}`, config)

    if (response.status === 401) {
      removeAuthToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new Error('Authentication required')
    }

    return response
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

export async function get(url: string) {
  const response = await apiRequest(url)
  if (!response.ok) throw new Error(`GET ${url} failed`)
  return response.json()
}

export async function post(url: string, data?: unknown) {
  const response = await apiRequest(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
  if (!response.ok) throw new Error(`POST ${url} failed`)
  return response.json()
}

export async function patch(url: string, data?: unknown) {
  const response = await apiRequest(url, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  })
  if (!response.ok) throw new Error(`PATCH ${url} failed`)
  return response.json()
}

export async function del(url: string) {
  const response = await apiRequest(url, { method: 'DELETE' })
  if (!response.ok) throw new Error(`DELETE ${url} failed`)
  return response.json()
}