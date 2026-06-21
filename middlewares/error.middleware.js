/**
 * Middleware global de manejo de errores para Express.
 * Diferencia entre errores lógicos (4xx) y fallos operacionales (500).
 */
export const errorMiddleware = (err, req, res, next) => {
    // Si la respuesta ya comenzó a enviarse, delegar al manejador por defecto de Express
    if (res.headersSent) {
        return next(err);
    }

    // Manejar error de tipo LogicalError (errores de lógica de negocio)
    if (err.isLogical || err.name === 'LogicalError') {
        console.warn(`[Logical Error] [${req.method} ${req.url}]: ${err.message}`);
        return res.status(err.statusCode || 400).json({
            error: err.name,
            message: err.message
        });
    }

    // Manejar fallos operacionales o errores no controlados (errores de base de datos, bugs, etc.)
    console.error(`[Operational Error] [${req.method} ${req.url}]:`, err);

    // Retornar una respuesta de error 500 limpia al cliente para no exponer stack traces ni detalles internos
    return res.status(500).json({
        error: 'InternalServerError',
        message: 'Ha ocurrido un fallo operacional en el servidor.'
    });
};
