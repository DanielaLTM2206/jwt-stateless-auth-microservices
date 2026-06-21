import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';

// Cargar variables de entorno antes de inicializar Sentry para respetar el ciclo de vida
dotenv.config();

Sentry.init({
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
    beforeSend(event, hint) {
        const error = hint.originalException;
        // Filtrar errores lógicos para evitar contaminación en el panel de Sentry
        if (error && (error.isLogical || error.name === 'LogicalError')) {
            return null; // Ignorar el evento en Sentry
        }
        return event; // Enviar el evento si es un fallo operacional
    }
});
