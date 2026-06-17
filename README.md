# Práctica Calificada: Autenticación Stateless y Simulación de Microservicios con JWT
### Departamento de Ciencias de la Computación | Arquitectura de Seguridad Avanzada

Este proyecto implementa una arquitectura desacoplada de autenticación basada en tokens sin estado (Stateless) utilizando Node.js, Express y JSON Web Tokens (JWT). Simula un entorno distribuido en el cual un componente centralizado (Servidor de Identidad) actúa como emisor de credenciales mediante criptografía asimétrica (firmado con llave privada RS256), mientras que múltiples servicios independientes (Alpha y Beta) verifican la autenticidad del token de manera autónoma utilizando únicamente la llave pública compartida, evitando consultas redundantes hacia el almacenamiento o servicio de identidad centralizado.

---

## Finalidad y Fundamentos de la Arquitectura

### El Problema de las Sesiones Tradicionales (Stateful)
En el modelo tradicional de autenticación, el servidor guarda en su memoria local o en una base de datos centralizada (ej. Redis) el estado de la sesión de cada usuario bajo un identificador único (Session ID). Cuando el cliente realiza una petición, el servidor intercepta este identificador y realiza una consulta a la base de datos para recuperar la sesión.
En una arquitectura de microservicios distribuidos, esto genera serias limitaciones de escalabilidad:
1. **Cuello de Botella**: Cada microservicio debe realizar una consulta de red al servidor de identidad centralizado por cada petición recibida para verificar si la sesión sigue activa.
2. **Punto Único de Fallo**: Si la base de datos de sesiones o el servidor de autenticación caen, todo el ecosistema de servicios queda inoperable.
3. **Latencia**: Las llamadas repetidas de red para verificar la validez de la sesión ralentizan las respuestas de los servicios.

### La Solución: Autenticación Stateless con Criptografía Asimétrica
Este proyecto demuestra cómo resolver las limitaciones del modelo Stateful mediante tokens auto-contenidos y criptografía asimétrica (RS256):
1. **Emisión Centralizada (Llave Privada)**: El Servidor de Identidad es el único que posee la llave privada (`private.pem`). Cuando el usuario se autentica con sus credenciales, este servidor crea un Payload (carga útil) con los datos del usuario y firma el JWT usando su llave privada.
2. **Verificación Descentralizada (Llave Pública)**: Los microservicios (Servicio Alpha y Servicio Beta) no comparten base de datos de sesiones ni se comunican entre sí. Únicamente conocen la llave pública (`public.pem`) del Servidor de Identidad.
3. **Flujo Sin Estado (Stateless)**: Cuando un microservicio recibe una petición con el token JWT:
   - Verifica matemáticamente la firma del token utilizando la llave pública. Si es válida, garantiza que el token fue emitido por el Servidor de Identidad de confianza y que su contenido no ha sido alterado.
   - Extrae la identidad del usuario (`req.user`) directamente del cuerpo del token.
   - Todo este proceso de verificación ocurre localmente en la memoria del microservicio en pocos milisegundos, eliminando por completo las consultas de red al servidor central.

---

## Requisitos e Instalación

### 1. Descarga de Dependencias
Instale los paquetes definidos en el archivo de configuración del proyecto:
```bash
npm install
```

### 2. Generación del Par de Llaves Criptográficas (OpenSSL)
Ejecute el script para generar las llaves criptográficas en formato estándar PKCS#8:
```bash
./keypair.sh
```
Esto creará automáticamente los siguientes archivos en la raíz:
- `private.pem`: Llave privada utilizada exclusivamente por el servidor de identidad para firmar digitalmente los tokens.
- `public.pem`: Llave pública compartida con los microservicios para validar la autenticidad de las firmas de forma autónoma.

### 3. Configuración de Variables de Entorno
Cree un archivo `.env` en la raíz del proyecto basándose en `.env.example`:
```ini
PORT=3000
JWT_SECRET=mi_secreto_super_seguro
JWT_ALGORITHM=RS256
PRIVATE_KEY_PATH=./private.pem
PUBLIC_KEY_PATH=./public.pem
```

---

## Ejecución del Servidor

Inicie el servidor Express:
```bash
node index.js
```
El servidor escuchará peticiones en la dirección `http://localhost:3000`.

---

## Endpoints de la API

### 1. Generación de Token (POST `/auth/token`)
Valida credenciales simuladas y firma un token JWT.
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

### 2. Acceso a Recurso Privado - Microservicio Alpha (GET `/v1/service-alpha/private`)
- **URL**: `http://localhost:3000/v1/service-alpha/private`
- **Headers**: `Authorization: Bearer <TOKEN>`

### 3. Acceso a Recurso Privado - Microservicio Beta (GET `/v1/service-beta/private`)
- **URL**: `http://localhost:3000/v1/service-beta/private`
- **Headers**: `Authorization: Bearer <TOKEN>`

---

## Investigación Teórica: Integración de Refresh Tokens

### 1. Dado que los JWT son Stateless y en nuestra práctica expiran en 1 minuto, ¿de qué manera la implementación teórica de un Refresh Token solucionaría la experiencia del usuario sin comprometer la seguridad de los servicios distribuidos?

En sistemas distribuidos, la expiración corta de los Access Tokens (1 minuto) es una medida de seguridad orientada a mitigar el impacto en caso de que un token de acceso sea comprometido o interceptado, reduciendo su ventana de utilidad a un periodo mínimo. No obstante, obligar al usuario a reintroducir sus credenciales cada minuto resulta impracticable.

La introducción de un Refresh Token resuelve esta problemática:
- **Flujo de Renovación Silenciosa**: Cuando el Access Token expira, el cliente intercepta la respuesta `401 Unauthorized` o detecta la expiración localmente. De manera transparente al usuario, envía una petición al endpoint `/refresh` del Servidor de Identidad adjuntando el Refresh Token.
- **Emisión de Nuevas Credenciales**: El Servidor de Identidad valida el Refresh Token contra su base de datos o almacenamiento persistente. Si es válido, emite un nuevo Access Token de corta duración y lo retorna al cliente, manteniendo la sesión activa sin interrupciones para el usuario.
- **Seguridad Preservada**:
  - Los microservicios descentralizados siguen funcionando sin estado (Stateless), validando localmente el Access Token de 1 minuto mediante la llave pública compartida sin requerir llamadas al servidor de identidad.
  - El Refresh Token se transmite exclusivamente hacia el Servidor de Identidad al momento de renovar la sesión, minimizando su exposición en la red en comparación con el Access Token que se envía en cada petición.
  - En caso de robo del Refresh Token, el Servidor de Identidad puede revocarlo directamente en su base de datos centralizada, invalidando las solicitudes de renovación posteriores de forma inmediata sin comprometer el rendimiento general de la arquitectura.

### 2. ¿En qué lugar del ecosistema (Cliente o Servidor) se debería almacenar y gestionar el ciclo de vida del Refresh Token según las buenas prácticas analizadas sobre la persistencia de cookies seguras?

De acuerdo con los estándares de seguridad web, el Refresh Token debe ser **almacenado de manera persistente en el cliente mediante directivas del servidor** y su ciclo de vida debe ser **gestionado centralmente en el servidor** de la siguiente manera:

1. **Almacenamiento (Persistencia mediante Cookies Seguras)**:
   - El Refresh Token no debe almacenarse en el almacenamiento web local (`localStorage` o `sessionStorage`) debido a que estos mecanismos son accesibles a través de scripts de JavaScript ejecutados en el navegador, lo que los hace vulnerables a ataques de Cross-Site Scripting (XSS).
   - En su lugar, el servidor debe almacenar el token en el cliente emitiendo una cookie mediante la cabecera `Set-Cookie` configurada con los siguientes parámetros de seguridad:
     - **`HttpOnly`**: Impide que los scripts de JavaScript accedan al valor de la cookie, protegiéndola contra ataques XSS.
     - **`Secure`**: Restringe la transmisión de la cookie únicamente a conexiones cifradas HTTPS, mitigando ataques de interceptación en tránsito (Man-in-the-Middle).
     - **`SameSite=Strict` (o `Lax`)**: Limita el envío de la cookie en peticiones de origen cruzado, sirviendo como defensa contra ataques de Cross-Site Request Forgery (CSRF).

2. **Gestión del Ciclo de Vida (Servidor)**:
   - La lógica de control reside en el Servidor de Identidad, el cual debe implementar **Rotación de Refresh Tokens (RTR)**. En este esquema, cada vez que se consume un Refresh Token para generar un nuevo Access Token, el servidor invalida el Refresh Token antiguo y emite uno nuevo al cliente en una cookie actualizada.
   - El servidor mantiene un registro indexado en su base de datos de las sesiones activas, permitiendo la invalidación inmediata de tokens en caso de que se detecte un uso duplicado (lo que denota una brecha de seguridad).