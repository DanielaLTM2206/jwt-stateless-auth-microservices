import { JwtService } from '../services/jwt.service.js';

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    // Control de ausencia de token
    if (!authHeader) {
        return res.status(401).json({ 
            error: 'Acceso denegado', 
            message: 'Token de autorización ausente' 
        });
    }

    if (!authHeader.startsWith('Bearer ')) {
        return res.status(400).json({ 
            error: 'Petición inválida', 
            message: 'El formato del token debe ser Bearer <token>' 
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = JwtService.verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        // Control de expiración del token
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expirado', 
                message: 'El token ha expirado. Por favor, genere uno nuevo.' 
            });
        }
        
        // Control de algoritmo inválido
        if (error.message && error.message.includes('invalid algorithm')) {
            return res.status(400).json({ 
                error: 'Algoritmo inválido', 
                message: 'El algoritmo de firma del token no coincide con el configurado en el servidor' 
            });
        }

        // Otros errores de JWT (JsonWebTokenError, firma inválida, etc.)
        return res.status(403).json({ 
            error: 'Acceso prohibido', 
            message: error.message || 'Token inválido' 
        });
    }
};
