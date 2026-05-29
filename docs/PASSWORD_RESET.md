# Recuperación de Contraseña — Backend

Implementación del flujo de recuperación de contraseña usando código numérico de 6 dígitos enviado por email.

## Resumen

3 endpoints públicos en `/api/auth`:

1. `POST /api/auth/forgot-password` — pide código por email
2. `POST /api/auth/verify-reset-code` — verifica que el código sea válido (no lo consume)
3. `POST /api/auth/reset-password` — verifica el código y actualiza la contraseña

**TTL del código:** 15 minutos
**Longitud mínima de password:** 8 caracteres
**Generación:** `crypto.randomInt(0, 1_000_000)` → 6 dígitos con padding de ceros (criptográficamente seguro)
**Almacenamiento:** únicamente el hash bcrypt del código; el código en claro solo viaja por el email

---

## Endpoints

### 1. `POST /api/auth/forgot-password`

Genera un código de 6 dígitos, lo hashea con bcrypt y lo persiste en `password_reset_tokens`. Envía el código en claro por email al usuario. Invalida cualquier código activo previo del mismo email.

**Request**
```json
{ "email": "usuario@empresa.com" }
```

**Response 200**
```json
{ "message": "Código enviado" }
```

**Errores**
| Status | Body | Causa |
|--------|------|-------|
| 400 | `{ "error": "Email es requerido" }` | Body sin email |
| 404 | `{ "error": "Email no registrado" }` | Email no existe o usuario soft-deleted |
| 500 | `{ "error": "No se pudo enviar el correo. Intentá nuevamente." }` | El SMTP falló (el token se persiste igual; el front puede reintentar) |
| 500 | `{ "error": "Error interno del servidor" }` | Otro error |

**Notas**
- El email es case-insensitive (`LOWER(email)` en el lookup).
- Si el SMTP falla, devolvemos 500 explícito para que el front no muestre éxito falso.
- Al pedir un nuevo código, el anterior queda invalidado (`used_at = NOW()`) en la misma transacción.

---

### 2. `POST /api/auth/verify-reset-code`

Verifica que un código exista, no esté usado y no esté expirado. **No** consume el código: el usuario aún tiene que llamar a `reset-password`.

**Request**
```json
{ "email": "usuario@empresa.com", "code": "123456" }
```

**Response 200**
```json
{ "valid": true }
```

**Errores**
| Status | Body | Causa |
|--------|------|-------|
| 400 | `{ "error": "Código inválido o expirado" }` | Email no tiene token activo, código no matchea hash, o expirado |
| 500 | `{ "error": "Error interno del servidor" }` | Error inesperado |

**Notas**
- El código debe ser exactamente 6 dígitos (`/^\d{6}$/`). Cualquier otro formato → 400 (mismo mensaje, no revelamos detalles).
- Por seguridad, todos los caminos de error devuelven el mismo mensaje.

---

### 3. `POST /api/auth/reset-password`

Valida el código y reemplaza la contraseña del usuario. Consume el código y cualquier otro token activo del mismo email.

**Request**
```json
{
  "email": "usuario@empresa.com",
  "code": "123456",
  "newPassword": "NuevaPass123"
}
```

**Response 200**
```json
{ "message": "Contraseña actualizada" }
```

**Errores**
| Status | Body | Causa |
|--------|------|-------|
| 400 | `{ "error": "La contraseña debe tener al menos 8 caracteres" }` | `newPassword` muy corta (validación previa a tocar DB) |
| 400 | `{ "error": "Código inválido o expirado" }` | Token inválido/expirado/ya usado |
| 500 | `{ "error": "Error interno del servidor" }` | Error inesperado |

**Notas**
- El `user_id` se toma del token persistido en DB, no del body, para evitar que un atacante pueda resetear una cuenta distinta a la del token.
- La password nueva se hashea con bcrypt (`SALT_ROUNDS = 10`).
- Tras un reset exitoso, todos los tokens activos del email quedan marcados como usados.

---

## Flujo de uso desde el frontend

```
┌────────────────────────────────────────┐
│ Pantalla 1: "¿Olvidaste tu password?"  │
│   - Input email                        │
│   - Botón "Enviar código"              │
└────────────────────────────────────────┘
                │
                ▼  POST /forgot-password { email }
              200 → mostrar pantalla 2
              404 → "Email no registrado"

┌────────────────────────────────────────┐
│ Pantalla 2: "Reset password"           │
│   - Input código (6 dígitos)           │
│   - Input nueva password               │
│   - Botón "Cambiar contraseña"         │
└────────────────────────────────────────┘
                │
                ▼  (opcional) POST /verify-reset-code { email, code }
                │  para feedback en vivo mientras el user tipea el código
                │
                ▼  POST /reset-password { email, code, newPassword }
              200 → "Contraseña actualizada" → redirigir a login
              400 → mostrar error específico
```

**Cliente sugerido** (axios/fetch):
```ts
// 1. Pedir código
await api.post('/auth/forgot-password', { email });

// 2a. (Opcional) Validar en vivo
const { data } = await api.post('/auth/verify-reset-code', { email, code });
// data === { valid: true }

// 2b. Resetear
await api.post('/auth/reset-password', { email, code, newPassword });
```

---

## Schema de la DB

Tabla `password_reset_tokens` (creada por `src/db/migrate-password-reset.js`):

```sql
CREATE TABLE password_reset_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       VARCHAR(255) NOT NULL,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  code_hash   VARCHAR(255) NOT NULL,   -- bcrypt hash, no el código en claro
  expires_at  TIMESTAMP NOT NULL,
  used_at     TIMESTAMP DEFAULT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX idx_password_reset_tokens_email_active
  ON password_reset_tokens(email, used_at)
  WHERE used_at IS NULL;
```

**Por qué hash y no plaintext:**
Si la DB se compromete, el atacante no puede pedir un código y resetearse a sí mismo: necesita el código del email para que el hash coincida.

**Por qué `ON DELETE CASCADE` desde `users`:**
Si se borra el usuario, los tokens asociados se borran automáticamente.

---

## Email

El email se envía vía `nodemailer` usando el SMTP ya configurado (`smtp.hostinger.com` / `ventas@portalmayoristatsf.com`).

- **Asunto:** `Tu código de recuperación: 123456`
- **Body:** HTML con el código destacado en grande y monoespaciado, copy claro sobre TTL de 15 minutos, y disclaimer "si no fuiste vos, ignorá este email".

Implementación: `src/services/emailService.js` → `sendPasswordResetEmail({ email, code, expiresInMinutes })`.

---

## Seguridad

| Mitigación | Implementación |
|------------|----------------|
| Token enumeration | `findValidResetToken()` devuelve el mismo mensaje genérico para cualquier fallo |
| Replay attack | `used_at` se marca tras un reset exitoso; tokens previos invalidados al pedir uno nuevo |
| Brute force del código | (Pendiente, ver sección Mejoras) |
| User-id spoofing | `reset-password` usa `user_id` desde el token, no del body |
| Race conditions | `forgot-password` y `reset-password` envuelven invalidación + escritura en `BEGIN/COMMIT` |
| Email leak via timing | Misma latencia aproximada para email registrado vs no registrado: el contrato pide diferenciar, así que esto se acepta como trade-off de UX |
| Password storage | bcrypt con `SALT_ROUNDS = 10` (mismo nivel que el resto del sistema) |
| Código en claro en DB | No: solo el hash bcrypt |

**Mejoras futuras recomendadas (no críticas):**
- Rate limit en `forgot-password` por IP y por email (ej: `express-rate-limit`, 3 requests / 15 min).
- Rate limit en `verify-reset-code` y `reset-password` para mitigar brute force del código de 6 dígitos.
- Job periódico que borre tokens expirados > 24h (la tabla puede crecer sin uso real).

---

## Configuración

Variables de entorno requeridas (ya presentes en `.env`):
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — para la DB
- Las credenciales SMTP están hardcodeadas en `emailService.js` (`smtp.hostinger.com`, `ventas@portalmayoristatsf.com`); si en el futuro las querés mover a env, son: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`.

Constantes en `authController.js`:
- `RESET_CODE_TTL_MINUTES = 15`
- `MIN_PASSWORD_LENGTH = 8`
- `SALT_ROUNDS = 10`

---

## Migraciones

Ejecutar una vez:
```bash
node src/db/migrate-password-reset.js
```

La migración es idempotente (`CREATE TABLE IF NOT EXISTS`), se puede correr múltiples veces sin problema.

---

## Testing

### Suite automatizada
```bash
# Sin envío real de email (default, ideal para CI)
node src/tests/test-password-reset.js

# Con envío real al email configurado (default pedroreverendo04@gmail.com)
SEND_REAL_EMAIL=true node src/tests/test-password-reset.js
```

Cubre 36 aserciones sobre el contrato:
- Validaciones de body
- Email no registrado / registrado
- Código inválido / correcto / expirado / reusado
- Generación y consumo de tokens
- Invalidación de tokens previos
- Password corta
- Flujo end-to-end con verificación por login

### Demo E2E manual
```bash
node src/tests/test-password-reset-e2e-real.js
```

Ejecuta el flujo completo contra `pedroreverendo04@gmail.com` (o `TEST_EMAIL`), incluyendo envío real, verify, reset, login con la nueva password, y rechazo del re-uso del código.

---

## Archivos modificados/creados

| Archivo | Cambio |
|---------|--------|
| `src/db/migrate-password-reset.js` | Nuevo: migración para `password_reset_tokens` |
| `src/services/emailService.js` | Agregada `sendPasswordResetEmail()` |
| `src/controllers/authController.js` | Agregadas `forgotPassword`, `verifyResetCode`, `resetPassword` |
| `src/routes/auth.js` | Registradas las 3 nuevas rutas |
| `src/tests/test-password-reset.js` | Nuevo: suite E2E (36 asserts) |
| `src/tests/test-password-reset-e2e-real.js` | Nuevo: demo manual con email real |
| `PASSWORD_RESET.md` | Esta documentación |
