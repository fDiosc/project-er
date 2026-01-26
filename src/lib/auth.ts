'use client'

export interface User {
  username: string
  role: string
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('auth_token', token)
}

export function removeAuthToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth_token')
}

export async function verifyToken(): Promise<{ valid: boolean; user?: User }> {
  const token = getAuthToken()
  
  if (!token) {
    return { valid: false }
  }

  try {
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    if (response.ok) {
      const data = await response.json()
      return { valid: true, user: data.user }
    } else {
      removeAuthToken()
      return { valid: false }
    }
  } catch (error) {
    removeAuthToken()
    return { valid: false }
  }
}

export function logout(): void {
  removeAuthToken()
  window.location.href = '/login'
}