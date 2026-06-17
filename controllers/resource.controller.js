export class ResourceController {
    /**
     * Simula un recurso privado del Microservicio Alpha.
     */
    static getAlphaPrivateData(req, res) {
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
        return res.status(200).json({
            message: 'Acceso exitoso al recurso privado del Microservicio Beta (flujo stateless garantizado)',
            service: 'Service Beta',
            user: req.user
        });
    }
}
