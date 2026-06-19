import { JwtService } from '../services/jwt.service.js';

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

            try {
                const token = JwtService.signToken(user, { expired: !!simulateExpired });
                return res.status(200).json({ token });
            } catch (error) {
                return res.status(500).json({ error: 'Error al generar el token' });
            }
        }

        return res.status(401).json({ error: 'Credenciales inválidas' });
    }
}
