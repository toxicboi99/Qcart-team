/**
 * Session utilities for login/logout timing and expiry
 * Session duration: 24 hours (configurable)
 */
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
export const SESSION_CHECK_INTERVAL_MS = 60 * 1000; // Check every minute

const USER_SESSION_KEY = 'userSession';
const ADMIN_SESSION_KEY = 'adminSession';

/**
 * Create session object with timing
 * @param {object} user - User data
 * @returns {{ user, loginAt, expiresAt }}
 */
export function createSession(user) {
  const now = Date.now();
  return {
    user,
    loginAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  };
}

/**
 * Check if session is valid (not expired)
 * @param {object} session - Session object
 * @returns {boolean}
 */
export function isSessionValid(session) {
  if (!session?.user || !session?.expiresAt) return false;
  return Date.now() < session.expiresAt;
}

/**
 * Get user session from localStorage
 */
export function getUserSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Get admin session from localStorage
 */
export function getAdminSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Save user session
 */
export function setUserSession(session) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
}

/**
 * Save admin session
 */
export function setAdminSession(session) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

/**
 * Clear user session and optionally record logout time
 */
export function clearUserSession() {
  if (typeof window === 'undefined') return;
  const session = getUserSession();
  if (session) {
    const logoutAt = Date.now();
    const duration = Math.round((logoutAt - session.loginAt) / 1000); // seconds
    // Optional: store last logout for analytics (kept minimal)
    try {
      localStorage.setItem('lastUserLogout', JSON.stringify({ logoutAt, duration }));
    } catch {}
  }
  localStorage.removeItem(USER_SESSION_KEY);
}

/**
 * Clear admin session and optionally record logout time
 */
export function clearAdminSession() {
  if (typeof window === 'undefined') return;
  const session = getAdminSession();
  if (session) {
    const logoutAt = Date.now();
    const duration = Math.round((logoutAt - session.loginAt) / 1000);
    try {
      localStorage.setItem('lastAdminLogout', JSON.stringify({ logoutAt, duration }));
    } catch {}
  }
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

/**
 * Get session info (login time, remaining time) for display
 */
export function getSessionInfo(session) {
  if (!session) return null;
  const now = Date.now();
  const remaining = Math.max(0, session.expiresAt - now);
  return {
    loginAt: session.loginAt,
    expiresAt: session.expiresAt,
    remainingMs: remaining,
    isValid: remaining > 0,
  };
}
