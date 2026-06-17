# Práctica Calificada: Autenticación Stateless y Simulación de Microservicios con JWT
### Departamento de Ciencias de la Computación | Arquitectura de Seguridad Avanzada

Este proyecto implementa un sistema desacoplado de autenticación basada en tokens (Stateless) utilizando **Node.js**, **Express** y **JSON Web Tokens (JWT)**. Simula un entorno distribuido en el cual un servidor de identidad firma tokens de manera centralizada mediante criptografía asimétrica (llave privada `RS256`), mientras que múltiples servicios independientes (Alpha y Beta) verifican de forma autónoma la autenticidad del token utilizando la llave pública, eliminando la necesidad de realizar consultas a una base de datos o almacenamiento centralizado.

---

## 🛠️ Requisitos e Instalación

### 1. Clonar el repositorio e instalar dependencias
Instala los paquetes necesarios definidos en `package.json` (`express`, `jsonwebtoken`, `dotenv`):
```bash
npm install
```

### 2. Generar el Par de Llaves Criptográficas (OpenSSL)
Ejecuta el script `keypair.sh` para generar un par de llaves criptográficas en formato estándar PKCS#8:
```bash
# En sistemas basados en Unix o Git Bash en Windows:
./keypair.sh
```
Esto creará automáticamente los siguientes archivos en la raíz del proyecto:
- `private.pem`: Llave privada utilizada por el servidor de identidad para firmar los tokens.
- `public.pem`: Llave pública distribuida a los microservicios para verificar los tokens de forma independiente.

### 3. Configuración de Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:
```ini
PORT=3000
JWT_SECRET=mi_secreto_super_seguro
JWT_ALGORITHM=RS256
PRIVATE_KEY_PATH=./private.pem
PUBLIC_KEY_PATH=./public.pem
```

---

## 🚀 Ejecución del Servidor

Inicia el servidor Express local:
```bash
node index.js
```
El servidor estará escuchando en `http://localhost:3000`.

---

## 🛣️ Endpoints y Pruebas de API

### 1. Generación de Token (POST `/auth/token`)
Simula el servidor de identidad. Valida credenciales ficticias y firma un token JWT.
- **URL**: `http://localhost:3000/auth/token`
- **Método**: `POST`
- **Headers**: `Content-Type: application/json`
- **Cuerpo (JSON)**:
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 2. Acceso a Recurso Privado - Microservicio Alpha (GET `/v1/service-alpha/private`)
- **URL**: `http://localhost:3000/v1/service-alpha/private`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "message": "Acceso exitoso al recurso privado del Microservicio Alpha (flujo stateless garantizado)",
    "service": "Service Alpha",
    "user": {
      "sub": "usr_001",
      "name": "Daniela Tituaña",
      "exp": 1781665200
    }
  }
  ```

### 3. Acceso a Recurso Privado - Microservicio Beta (GET `/v1/service-beta/private`)
- **URL**: `http://localhost:3000/v1/service-beta/private`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "message": "Acceso exitoso al recurso privado del Microservicio Beta (flujo stateless garantizado)",
    "service": "Service Beta",
    "user": {
      "sub": "usr_001",
      "name": "Daniela Tituaña",
      "exp": 1781665200
    }
  }
  ```

---

## 📝 Investigación Teórica: Integración de Refresh Tokens

### 1. Dado que los JWT son Stateless y en nuestra práctica expiran en 1 minuto, ¿de qué manera la implementación teórica de un Refresh Token solucionaría la experiencia del usuario sin comprometer la seguridad de los servicios distribuidos?

En una arquitectura distribuida, la expiración corta de los Access Tokens (1 minuto en esta práctica) es una excelente medida de seguridad, ya que reduce drásticamente el tiempo de validez de un token que haya sido robado por interceptación de red o filtración en el cliente. Sin embargo, obligar al usuario a reintroducir sus credenciales cada minuto degradaría de manera intolerable la experiencia de usuario.

La implementación de un **Refresh Token** soluciona esto de la siguiente manera:
- **Flujo Silencioso**: Cuando el Access Token expira, el cliente (por ejemplo, una aplicación frontend) detecta la expiración o intercepta la respuesta `401 Unauthorized`. Automáticamente, envía una petición en segundo plano al servidor de identidad (auth server) enviando el **Refresh Token**.
- **Generación de Nuevas Credenciales**: El servidor de identidad valida el Refresh Token. Si es legítimo, emite un nuevo Access Token de corta duración (y opcionalmente rota el Refresh Token). De este modo, la sesión del usuario continúa activa sin interrupción visual.
- **Seguridad Preservada**:
  - Los microservicios distribuidos (como Alpha y Beta) siguen operando de forma 100% stateless, validando únicamente las firmas de los Access Tokens mediante la llave pública y rechazándolos al cabo de 1 minuto si están expirados. Ningún microservicio necesita interactuar con una base de datos centralizada ni conocer los Refresh Tokens.
  - La verificación del Refresh Token ocurre únicamente en el servidor de identidad. Dado que el Refresh Token no se envía a los microservicios en cada petición ordinaria de API, su exposición en la red es mínima.
  - Si se sospecha de un Refresh Token robado, el servidor de identidad puede invalidarlo de manera inmediata en su almacenamiento centralizado (Base de datos o Redis), bloqueando cualquier intento posterior de renovación sin afectar el rendimiento de los microservicios.

### 2. ¿En qué lugar del ecosistema (Cliente o Servidor) se debería almacenar y gestionar el ciclo de vida del Refresh Token según las buenas prácticas analizadas sobre la persistencia de cookies seguras?

De acuerdo con las mejores prácticas de seguridad informática, el Refresh Token debe ser **almacenado en el cliente de forma indirecta** y **gestionado en el servidor** mediante el mecanismo de cookies seguras:

1. **Almacenamiento (Cookie HttpOnly, Secure y SameSite):**
   - El Refresh Token jamás debe guardarse en el almacenamiento web local del cliente (`localStorage` o `sessionStorage`), debido a que estas API son accesibles por código JavaScript de la página y vulnerables a ataques de **Cross-Site Scripting (XSS)**.
   - En su lugar, el servidor de identidad debe escribir el Refresh Token en una cabecera de respuesta `Set-Cookie` configurada con los siguientes atributos obligatorios:
     - **`HttpOnly`**: Bloquea por completo el acceso al token mediante JavaScript del cliente, mitigando el robo de identidades por ataques XSS.
     - **`Secure`**: Garantiza que el navegador web únicamente transmita la cookie bajo conexiones cifradas HTTPS, previniendo ataques de tipo Man-in-the-Middle (MitM).
     - **`SameSite=Strict` (o `Lax`)**: Restringe el envío de la cookie en peticiones cruzadas entre diferentes dominios, protegiendo al ecosistema de ataques de **Cross-Site Request Forgery (CSRF)**.

2. **Gestión del Ciclo de Vida (Servidor):**
   - El **Servidor de Identidad (Servidor)** es el único responsable de generar, renovar y revocar los Refresh Tokens.
   - Debe implementar **Refresh Token Rotation (RTR)**: cada vez que se usa un Refresh Token para solicitar un nuevo Access Token, el servidor invalida el Refresh Token anterior y devuelve uno nuevo al cliente. Esto permite detectar de inmediato si el Refresh Token fue duplicado (si el servidor detecta que se intenta usar un Refresh Token ya utilizado, invalida toda la familia de tokens de esa sesión por sospecha de brecha de seguridad).
   - El servidor mantiene una tabla indexada (o almacenamiento rápido en Redis) para el control y revocación manual de sesiones activas.