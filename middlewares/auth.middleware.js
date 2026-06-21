import { JwtService } from '../services/jwt.service.js';
import { LogicalError } from '../errors/LogicalError.js';

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    // Control de ausencia de token
    if (!authHeader) {
        throw new LogicalError('Token de autorización ausente', 401);
    }

    if (!authHeader.startsWith('Bearer ')) {
        throw new LogicalError('El formato del token debe ser Bearer <token>', 400);
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = JwtService.verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        // Si es un error de configuración del servidor (ej. llaves no encontradas), propagarlo como operacional
        if (error.message && error.message.includes('no configurada')) {
            throw error;
        }

        // Control de expiración del token
        if (error.name === 'TokenExpiredError') {
            throw new LogicalError('El token ha expirado. Por favor, genere uno nuevo.', 401);
        }
        
        // Control de algoritmo inválido
        if (error.message && error.message.includes('invalid algorithm')) {
            throw new LogicalError('El algoritmo de firma del token no coincide con el configurado en el servidor', 400);
        }

        // Otros errores de JWT (JsonWebTokenError, firma inválida, etc.)
        if (error.name === 'JsonWebTokenError' || error.message.includes('jwt malformed') || error.message.includes('invalid signature')) {
            throw new LogicalError(error.message || 'Token inválido', 403);
        }

        // Cualquier otro error inesperado se propaga como operacional
        throw error;
    }
};
