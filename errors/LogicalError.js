/**
 * Clase de error para fallos lógicos esperados de la aplicación.
 * Estos errores no representan fallas operacionales ni de infraestructura y no se reportan a Sentry.
 */
export class LogicalError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.name = 'LogicalError';
        this.statusCode = statusCode;
        this.isLogical = true; // Identificador para la discriminación programática
        Error.captureStackTrace(this, this.constructor);
    }
}
