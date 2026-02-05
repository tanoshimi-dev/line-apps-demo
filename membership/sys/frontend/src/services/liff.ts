import liff from '@line/liff'
import type { UserProfile } from '../types'

export async function initializeLiff(liffId: string): Promise<void> {
  try {
    await liff.init({ liffId })
    console.log('LIFF initialized successfully')
  } catch (error) {
    console.error('LIFF initialization failed:', error)
    throw error
  }
}

export function isLoggedIn(): boolean {
  return liff.isLoggedIn()
}

export function login(): void {
  if (!liff.isLoggedIn()) {
    liff.login()
  }
}

export function logout(): void {
  if (liff.isLoggedIn()) {
    liff.logout()
    window.location.reload()
  }
}

export async function getProfile(): Promise<UserProfile | null> {
  if (!liff.isLoggedIn()) {
    return null
  }

  try {
    const profile = await liff.getProfile()
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      statusMessage: profile.statusMessage,
    }
  } catch (error) {
    console.error('Failed to get profile:', error)
    return null
  }
}

export function getAccessToken(): string | null {
  return liff.getAccessToken()
}

export function isInClient(): boolean {
  return liff.isInClient()
}

export function closeWindow(): void {
  liff.closeWindow()
}

export function openWindow(url: string, external: boolean = false): void {
  liff.openWindow({ url, external })
}

export async function sendMessages(messages: { type: 'text'; text: string }[]): Promise<void> {
  if (!liff.isInClient()) {
    console.warn('sendMessages is only available in LINE client')
    return
  }
  await liff.sendMessages(messages)
}

export async function scanCode(): Promise<string | null> {
  if (!liff.isInClient()) {
    console.warn('scanCode is only available in LINE client')
    return null
  }
  const result = await liff.scanCodeV2()
  return result.value
}
