import { JwtService } from '../services/jwt.service.js';
import { LogicalError } from '../errors/LogicalError.js';

export class AuthController {
    /**
     * Simula un servidor de autenticación que genera un token.
     */
    static async generateToken(req, res) {
        const { username, password, simulateExpired } = req.body;

        // Validar credenciales de forma simulada
        if (username === 'admin' && password === 'admin123') {
            const user = {
                id: 'usr_001',
                name: 'Daniela Tituaña'
            };

            // No capturar el error localmente para permitir que los fallos operacionales
            // (como llaves no configuradas) se propaguen a Sentry
            const token = JwtService.signToken(user, { expired: !!simulateExpired });
            return res.status(200).json({ token });
        }

        throw new LogicalError('Credenciales inválidas', 401);
    }
}
