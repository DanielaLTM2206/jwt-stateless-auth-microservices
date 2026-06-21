import * as Sentry from '@sentry/node';

export class ResourceController {
    /**
     * Simula un recurso privado del Microservicio Alpha.
     */
    static getAlphaPrivateData(req, res) {
        // Simular fallo de conexión a base de datos (Error Operacional)
        if (req.query.simulateError === 'true') {
            throw new Error("Conexión perdida con la BDD");
        }

        return res.status(200).json({
            message: 'Acceso exitoso al recurso privado del Microservicio Alpha (flujo stateless garantizado)',
            service: 'Service Alpha',
            user: req.user
        });
    }

    /**
     * Simula un recurso privado del Microservicio Beta.
     */
    static getBetaPrivateData(req, res) {
        try {
            // Simular un fallo de conexión en Service Beta si se solicita por query
            if (req.query.simulateError === 'true') {
                throw new Error("Fallo de conexión en Service Beta");
            }

            return res.status(200).json({
                message: 'Acceso exitoso al recurso privado del Microservicio Beta (flujo stateless garantizado)',
                service: 'Service Beta',
                user: req.user
            });
        } catch (error) {
            // Capturar la excepción explícitamente en Sentry adjuntando tags y contexto extra
            Sentry.withScope((scope) => {
                // Configurar etiquetas indexables (tags)
                scope.setTag("service", "Service Beta");
                scope.setTag("user_id", req.user?.sub || req.user?.id || "unknown");

                // Configurar contexto extra (no indexado, para depuración detallada)
                // Aseguramos no enviar contraseñas ni secretos
                scope.setExtra("username", req.user?.name || "unknown");
                scope.setExtra("request_query", req.query);
                scope.setExtra("request_url", req.originalUrl);

                // Disparar captura explícita
                Sentry.captureException(error);
            });

            // Retornar código HTTP 500 con formato JSON seguro
            return res.status(500).json({
                error: 'InternalServerError',
                message: 'Ha ocurrido un fallo operacional en el servidor.'
            });
        }
    }
}
