import liff from '@line/liff';
import type { UserProfile } from '../types';

export async function initializeLiff(liffId: string): Promise<void> {
  await liff.init({ liffId });
}

export function getAccessToken(): string | null {
  // alert('Getting access token: ' + liff.getAccessToken())
  return liff.getAccessToken();
}

export async function getProfile(): Promise<UserProfile | null> {
  try {
    const profile = await liff.getProfile();
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
    };
  } catch {
    return null;
  }
}

export function login(): void {
  liff.login();
}

export function logout(): void {
  liff.logout();
  window.location.reload();
}

export function isLoggedIn(): boolean {
  try {
    return liff.isLoggedIn();
  } catch {
    return false;
  }
}
