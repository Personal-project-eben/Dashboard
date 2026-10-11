import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.js';
import { weatherRouter } from './routes/weather.js';
import { rssRouter } from './routes/rss.js';
import { githubRouter } from './routes/github.js';
import { cryptoRouter } from './routes/crypto.js';
import { openlibraryRouter } from './routes/openlibrary.js';
import { inspirationRouter } from './routes/inspiration.js';
import { productivityRouter } from './routes/productivity.js';
import { aiRouter } from './routes/ai.js';
import { widgetsRouter } from './routes/widgets.js';
import { adminRouter } from './routes/admin.js';
import { profileRouter } from './routes/profile.js';
import { chargerUtilisateur, exigerAuth, exigerAdmin } from './middlewares/auth.js';
import { CATALOGUE_SERVICES } from './catalog.js';
import { prisma } from './db.js';

const app = express();

const CORS_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];

app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
app.options('*', cors({ origin: CORS_ORIGINS, credentials: true }));

app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRouter);
app.use('/services/weather', weatherRouter);
app.use('/services/rss', rssRouter);
app.use('/services/github', githubRouter);
app.use('/services/crypto', cryptoRouter);
app.use('/services/openlibrary', openlibraryRouter);
app.use('/services/inspiration', inspirationRouter);
app.use('/services/productivity', productivityRouter);
app.use('/services/ai', aiRouter);
app.use('/dashboard/widgets', widgetsRouter);

app.use('/admin', chargerUtilisateur, exigerAuth, exigerAdmin, adminRouter);
app.use('/profile', chargerUtilisateur, exigerAuth, profileRouter);

// GET / — route de vérification rapide que le serveur répond.
app.get('/', (req, res) => {
    res.send('OK — Dashboard backend');
});

// GET /health — vérifie la connexion à la base de données via un SELECT 1.
app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({
            status: 'UP',
            timestamp: new Date().toISOString(),
            database: 'OK',
        });
    } catch (err) {
        res.status(503).json({
            status: 'DOWN',
            timestamp: new Date().toISOString(),
            database: err.message,
        });
    }
});

// GET /about.json — retourne les métadonnées du serveur et la liste des services disponibles.
app.get('/about.json', (req, res) => {
    res.json({
        client: {
            host: req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip?.replace('::ffff:', ''),
        },
        server: {
            current_time: Math.floor(Date.now() / 1000),
            services: CATALOGUE_SERVICES,
        },
    });
});

export default app;