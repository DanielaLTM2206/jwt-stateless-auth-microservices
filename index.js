import './instrument.js'; // Debe ser la primera importación para que Sentry capture toda la actividad
import express from 'express';
import * as Sentry from '@sentry/node';
import { config } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { LogicalError } from './errors/LogicalError.js';

const app = express();

app.use(express.json());
app.use(express.static('public'));

app.use('/auth', authRoutes);
app.use('/', resourceRoutes);

// Rutas de depuración para verificar la clasificación de errores
app.get('/debug-sentry', (req, res) => {
    throw new Error('Fallo operacional de prueba para Sentry');
});

app.get('/debug-logical', (req, res) => {
    throw new LogicalError('Error lógico de prueba (no debe enviarse a Sentry)', 400);
});

// Sentry.setupExpressErrorHandler debe registrarse después de las rutas y antes de otros manejadores de errores
Sentry.setupExpressErrorHandler(app);

// Manejador de errores personalizado global
app.use(errorMiddleware);

app.listen(config.PORT, () => {
    console.log(`Server running on http://localhost:${config.PORT}`);
});
