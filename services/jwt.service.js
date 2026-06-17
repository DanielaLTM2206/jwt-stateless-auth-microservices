import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export class JwtService {
    /**
     * Firma un token JWT basándose en el algoritmo configurado.
     * @param {Object} user - Los datos del usuario a incluir en el token.
     * @returns {string} El token JWT generado.
     */
    static signToken(user) {
        const algorithm = config.ALGORITHM || 'HS256';
        const key = algorithm === 'RS256' ? config.PRIVATE_KEY : config.JWT_SECRET;

        if (!key) {
            throw new Error(`Clave para firma (${algorithm}) no configurada.`);
        }

        const now = Math.floor(Date.now() / 1000);
        const exp = now + 60; // Expiración exacta de 1 minuto

        const payload = {
            sub: user.id || user.sub,
            name: user.name,
            exp
        };

        return jwt.sign(payload, key, { algorithm, noTimestamp: true });
    }

    /**
     * Verifica un token JWT basándose en el algoritmo configurado.
     * @param {string} token - El token JWT a verificar.
     * @returns {Object|null} El payload decodificado o null si es inválido.
     */
    static verifyToken(token) {
        const algorithm = config.ALGORITHM || 'HS256';
        const key = algorithm === 'RS256' ? config.PUBLIC_KEY : config.JWT_SECRET;

        if (!key) {
            throw new Error(`Clave de verificación (${algorithm}) no configurada.`);
        }

        // Permite que jwt.verify lance errores (TokenExpiredError, JsonWebTokenError) para un manejo detallado
        return jwt.verify(token, key, { algorithms: [algorithm] });
    }
}
