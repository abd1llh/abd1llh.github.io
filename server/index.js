import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import healthRoutes    from './routes/health.js';
import contactRoutes   from './routes/contact.js';
import writeupRoutes   from './routes/writeups.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes     from './routes/admin.js';
import projectRoutes   from './routes/projects.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.set('trust proxy', 1);

app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);

// Strict CORS: the frontend calls this API same-origin (relative /api
// through nginx), so cross-origin browser access is denied unless
// CORS_ORIGIN explicitly lists the allowed origins (comma-separated).
// The previous `|| true` fallback reflected ANY origin with credentials.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {
            // Requests without an Origin header (same-origin, curl,
            // health checks) are not CORS requests: let them through.
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        },
        credentials: true,
    })
);

app.use(express.json({
    limit: '32kb'
}));
app.use(cookieParser());

/* =========================================
   GLOBAL API LIMITER
========================================= */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        ok: false,
        error: 'Too many requests.',
    },
});

/* =========================================
   CONTACT LIMITER
========================================= */
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        ok: false,
        error: 'Too many messages. Try again later.',
    },
});

/* =========================================
   LOGIN LIMITER
========================================= */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        ok: false,
        error: 'Too many login attempts.',
    },
});

/* =========================================
   GLOBAL API LIMITER
========================================= */
app.use('/api', apiLimiter);

/* =========================================
   PUBLIC ROUTES
========================================= */
app.use('/api', healthRoutes);
app.use('/api', writeupRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', projectRoutes);

/* =========================================
   CONTACT ROUTE + LIMITER
========================================= */
app.use('/api/contact', contactLimiter);
app.use('/api', contactRoutes);

/* =========================================
   ADMIN LOGIN LIMITER
========================================= */
app.use('/api/admin/login', loginLimiter);

/* =========================================
   ADMIN ROUTES
========================================= */
app.use('/api', adminRoutes);

/* =========================================
   404 HANDLER
========================================= */
app.use((_req, res) => {
    res.status(404).json({
        ok: false,
        error: 'Not found',
    });
});

/* =========================================
   START SERVER
========================================= */
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[api] listening on http://0.0.0.0:${PORT}`);
});