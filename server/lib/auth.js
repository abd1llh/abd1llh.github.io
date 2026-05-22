import jwt from 'jsonwebtoken';

const COOKIE_NAME  = 'abd1llh_admin';
const MAX_AGE_MS   = 12 * 60 * 60 * 1000; // 12 hours

function getSecret() {
    return process.env.JWT_SECRET || 'change-me-in-production';
}

export function signAdminToken() {
    return jwt.sign({ role: 'admin' }, getSecret(), { expiresIn: '12h' });
}

export function verifyAdminToken(token) {
    try {
        const payload = jwt.verify(token, getSecret());
        return payload?.role === 'admin';
    } catch {
        return false;
    }
}

export function setAdminCookie(res, token) {
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: MAX_AGE_MS,
        path: '/',
    });
}

export function clearAdminCookie(res) {
    res.clearCookie(COOKIE_NAME, { path: '/' });
}

export function requireAdmin(req, res, next) {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token || !verifyAdminToken(token)) {
        res.status(401).json({ ok: false, error: 'Unauthorized' });
        return;
    }
    next();
}

/**
 * Validate admin credentials.
 * Checks BOTH email and password against .env values.
 * This replaces the old passcode-only system.
 *
 * .env:
 *   ADMIN_EMAIL=your-email@example.com
 *   ADMIN_PASSWORD=your-secure-password
 */
export function checkAdminCredentials(email, password) {
    const expectedEmail    = process.env.ADMIN_EMAIL;
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedEmail || !expectedPassword) return false;

    const emailOk    = email?.toLowerCase().trim() === expectedEmail.toLowerCase().trim();
    const passwordOk = password === expectedPassword;

    return emailOk && passwordOk;
}

/**
 * Legacy: single-password check (kept for backwards compatibility)
 */
export function checkAdminPassword(password) {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) return false;
    return password === expected;
}
