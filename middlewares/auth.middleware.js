import { JwtService } from '../services/jwt.service.js';

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso denegado: Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = JwtService.verifyToken(token);

    if (!decoded) {
        return res.status(403).json({ error: 'Acceso prohibido: Token inválido o expirado' });
    }

    req.user = decoded;
    next();
};
