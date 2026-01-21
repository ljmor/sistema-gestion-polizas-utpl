# Sistema de Gestión de Pólizas de Vida Estudiantil - UTPL

<div align="center">

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

**Sistema integral para la gestión de pólizas de seguros de vida estudiantil y seguimiento de siniestros**

*Universidad Técnica Particular de Loja*

</div>

---

## 📋 Descripción del Sistema

El **Sistema de Gestión de Pólizas (SGP)** es una aplicación web diseñada para gestionar el ciclo completo de las pólizas de vida de estudiantes de la UTPL, desde la recepción de reportes de siniestros hasta el cierre del caso con el pago correspondiente.

### Tipos de Siniestros Soportados

| Tipo | Descripción | Documentación Requerida |
|------|-------------|------------------------|
| **Muerte Natural** | Fallecimiento por causas naturales | Cédula, Certificado de defunción, Certificado de matrícula |
| **Muerte por Accidente** | Fallecimiento por accidente | Cédula, Certificado de defunción, Certificado de matrícula, Parte policial |

### Funcionalidades Principales

- 🌐 **Portal Público**: Permite a familiares reportar siniestros y adjuntar documentación
- 📁 **Gestión Documental**: Control y validación de documentos requeridos
- 👥 **Gestión de Beneficiarios**: Registro, validación y seguimiento de firmas
- 💼 **Liquidación**: Envío de expedientes a aseguradora y registro de respuestas
- 💰 **Pagos**: Gestión del pago a beneficiarios con notificaciones
- ⏰ **Alertas Automáticas**: Sistema de notificaciones por plazos legales
- 📊 **Reportes**: Estadísticas y análisis de siniestralidad
- 📧 **Notificaciones por Email**: Comunicación automática con beneficiarios y aseguradora

---

## 🏗️ Arquitectura del Proyecto

```
sistema-poliza-utpl/
├── backend/                 # API REST (NestJS + Prisma + PostgreSQL)
│   ├── src/
│   │   ├── alertas/        # Sistema de alertas y cron jobs
│   │   ├── auth/           # Autenticación JWT
│   │   ├── config/         # Configuración del sistema
│   │   ├── dashboard/      # KPIs y estadísticas
│   │   ├── files/          # Gestión de archivos
│   │   ├── mail/           # Servicio de correos
│   │   ├── polizas/        # CRUD de pólizas
│   │   ├── prisma/         # Cliente de base de datos
│   │   ├── public/         # Endpoints públicos
│   │   ├── reportes/       # Generación de reportes
│   │   ├── siniestros/     # Gestión de siniestros
│   │   └── users/          # Gestión de usuarios
│   ├── prisma/
│   │   ├── schema.prisma   # Esquema de base de datos
│   │   └── seed.ts         # Datos de prueba
│   └── uploads/            # Archivos subidos
│
├── frontend/                # SPA (React + Vite + Material-UI)
│   ├── src/
│   │   ├── app/            # Configuración y rutas
│   │   ├── application/    # Servicios de aplicación
│   │   ├── domain/         # Tipos y enums
│   │   ├── features/       # Módulos funcionales
│   │   ├── infrastructure/ # API clients y queries
│   │   └── shared/         # Componentes compartidos
│   └── public/
│
└── README.md
```

---

## 🚀 Guía de Instalación Local

### Prerrequisitos

Asegúrate de tener instalado:

| Software | Versión Mínima | Verificar con |
|----------|----------------|---------------|
| Node.js | 18.x | `node --version` |
| npm | 9.x | `npm --version` |
| Docker | 20.x | `docker --version` |
| Docker Compose | 2.x | `docker compose version` |
| Git | 2.x | `git --version` |

### Paso 1: Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd sistema-poliza-utpl
```

### Paso 2: Configurar y Levantar la Base de Datos

```bash
# Entrar a la carpeta del backend
cd backend

# Levantar PostgreSQL con Docker
docker compose up -d

# Verificar que el contenedor esté corriendo
docker ps
```

> **Nota**: PostgreSQL estará disponible en `localhost:5432`

### Paso 3: Configurar el Backend

```bash
# Asegúrate de estar en la carpeta backend/
cd backend

# Instalar dependencias
npm install

# Crear archivo de configuración
cp .env.example .env
```

**Editar el archivo `.env` con tu configuración:**

```env
# Base de datos
DATABASE_URL="postgresql://sgpuser:sgppass123@localhost:5432/sgp_db?schema=public"

# JWT
JWT_SECRET=tu_clave_secreta_muy_segura_aqui
JWT_EXPIRES_IN=8h

# Credenciales del Gestor
GESTOR_EMAIL=tu_correo@ejemplo.com
GESTOR_NAME=Tu Nombre
GESTOR_PASSWORD=TuContraseñaSegura123!

# Configuración SMTP (para envío de correos)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=tu_usuario_smtp
SMTP_PASS=tu_password_smtp
SMTP_FROM=tu_correo_verificado@ejemplo.com

# Aseguradora
ASEGURADORA_EMAIL=correo_aseguradora@ejemplo.com
ASEGURADORA_NOMBRE=Nombre Aseguradora
```

```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones de base de datos
npx prisma migrate dev

# (Opcional) Cargar datos de prueba
npx prisma db seed
```

### Paso 4: Configurar el Frontend

```bash
# Entrar a la carpeta del frontend
cd ../frontend

# Instalar dependencias
npm install

# Crear archivo de configuración (si no existe)
cp .env.example .env 2>/dev/null || true
```

**Verificar/crear el archivo `.env`:**

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=SGP UTPL
```

### Paso 5: Ejecutar la Aplicación

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```
✅ Backend disponible en: **http://localhost:3000**

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Frontend disponible en: **http://localhost:5173**

### Paso 6: Acceder al Sistema

1. Abre tu navegador en: **http://localhost:5173**
2. Inicia sesión con las credenciales configuradas en `.env`:
   - **Email**: El valor de `GESTOR_EMAIL`
   - **Contraseña**: El valor de `GESTOR_PASSWORD`

---

## 🔐 Sistema de Autenticación

### Credenciales del Gestor

El sistema tiene un único usuario (Gestor UTPL) configurado mediante variables de entorno. Las credenciales se establecen en el archivo `.env` del backend.

### Recuperación de Contraseña

Si olvidaste tu contraseña:

1. En la pantalla de login, click en **"¿Olvidaste tu contraseña?"**
2. Ingresa el correo del gestor
3. Recibirás un email con una **contraseña temporal**
4. Inicia sesión con la contraseña temporal
5. Ve a **Mi Perfil** y cambia tu contraseña

### Cambio de Contraseña

1. Click en tu nombre (esquina superior derecha)
2. Selecciona **"Mi Perfil"**
3. En la sección "Seguridad", ingresa:
   - Contraseña actual
   - Nueva contraseña (mínimo 8 caracteres)
   - Confirmar nueva contraseña
4. Click en **"Actualizar contraseña"**

---

## 📂 Flujo de Gestión de Siniestros

```
┌─────────────────┐
│  PORTAL PÚBLICO │ ← Familiar reporta siniestro
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   RECEPCIÓN     │ ← Gestor revisa datos, asigna póliza
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   VALIDACIÓN    │ ← Verificación de documentos
└────────┬────────┘   (aprobar/rechazar/solicitar)
         │
         ▼
┌─────────────────┐
│  BENEFICIARIOS  │ ← Registro y firma de beneficiarios
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   LIQUIDACIÓN   │ ← Envío a aseguradora
└────────┬────────┘   Registro de respuesta
         │
         ▼
┌─────────────────┐
│  PAGO / CIERRE  │ ← Pago a beneficiarios
└─────────────────┘   Cierre del caso
```

### Bloqueo de Fases

El sistema implementa un flujo ordenado donde cada fase se desbloquea al completar la anterior:

| Fase | Se desbloquea cuando... |
|------|------------------------|
| Validación | Se completa la recepción |
| Beneficiarios | Se inicia la validación |
| Liquidación | Todos los documentos están aprobados Y todas las firmas recibidas |
| Pago/Cierre | La liquidación está aprobada |

---

## ⏰ Sistema de Alertas y Plazos

El sistema monitorea automáticamente los plazos legales y genera alertas:

| Alerta | Plazo | Descripción |
|--------|-------|-------------|
| 🔴 **Plazo 60 días** | 60 días desde el reporte | Tiempo máximo para enviar expediente a la aseguradora |
| 🟡 **Plazo 15 días** | 15 días hábiles | Tiempo de respuesta de la aseguradora |
| 🟠 **Plazo 72 horas** | 72 horas | Tiempo para ejecutar el pago tras aprobación |
| 🔵 **Vencimiento póliza** | 30 días antes | Aviso de próximo vencimiento de vigencia |

### Notificaciones

- **En la UI**: Notificaciones estilo macOS en tiempo real
- **Por email**: Alertas críticas enviadas al correo del gestor
- **En el dashboard**: Panel de alertas pendientes

---

## 📧 Configuración de Correo Electrónico

El sistema requiere un servidor SMTP para enviar notificaciones. Recomendamos usar **Brevo** (ex Sendinblue) por su plan gratuito.

### Configuración con Brevo

1. Crea una cuenta en [brevo.com](https://www.brevo.com)
2. Ve a **SMTP & API** en la configuración
3. Obtén tus credenciales SMTP
4. Configura en `.env`:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=tu_login_brevo
SMTP_PASS=tu_smtp_key_brevo
SMTP_FROM=correo_verificado_en_brevo@tudominio.com
```

### Correos que envía el sistema

| Evento | Destinatario | Contenido |
|--------|-------------|-----------|
| Solicitud de documentos | Beneficiarios | Lista de documentos pendientes |
| Expediente a aseguradora | Aseguradora | Datos del caso + documentos adjuntos |
| Liquidación | Beneficiarios | Monto aprobado + documento de liquidación |
| Pago realizado | Beneficiarios | Comprobante de pago |
| Contraseña temporal | Gestor | Nueva contraseña para acceso |

---

## 🛠️ Comandos Útiles

### Backend

```bash
# Desarrollo
npm run start:dev          # Iniciar con hot-reload

# Base de datos
npx prisma studio          # Abrir GUI de base de datos
npx prisma migrate dev     # Crear/ejecutar migraciones
npx prisma db seed         # Cargar datos de prueba
npx prisma migrate reset   # Resetear BD (¡borra todo!)

# Producción
npm run build              # Compilar
npm run start:prod         # Ejecutar compilado
```

### Frontend

```bash
npm run dev                # Desarrollo con hot-reload
npm run build              # Compilar para producción
npm run preview            # Vista previa de producción
npm run lint               # Verificar código
```

### Docker

```bash
# Levantar servicios
docker compose up -d

# Ver logs
docker compose logs -f

# Detener servicios
docker compose down

# Resetear (elimina volúmenes)
docker compose down -v
```

---

## 📊 API REST

La documentación interactiva de la API está disponible en:

**http://localhost:3000/api** (Swagger UI)

### Endpoints Principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/login` | Iniciar sesión |
| `POST` | `/auth/forgot-password` | Recuperar contraseña |
| `POST` | `/auth/change-password` | Cambiar contraseña |
| `POST` | `/public/siniestros` | Crear reporte público |
| `GET` | `/siniestros` | Listar siniestros |
| `GET` | `/siniestros/:id` | Detalle de siniestro |
| `PATCH` | `/siniestros/:id` | Actualizar siniestro |
| `GET` | `/polizas` | Listar pólizas |
| `POST` | `/polizas` | Crear póliza |
| `GET` | `/alertas` | Listar alertas |
| `POST` | `/alertas/:id/resolver` | Eliminar alerta |
| `GET` | `/dashboard/kpis` | Obtener KPIs |

---

## 🔧 Solución de Problemas

### El backend no inicia

```bash
# Verificar que PostgreSQL esté corriendo
docker ps

# Si no está corriendo
docker compose up -d

# Verificar conexión
npx prisma db push
```

### Error de puerto en uso

```bash
# Matar proceso en puerto 3000
lsof -ti:3000 | xargs kill -9

# Matar proceso en puerto 5173
lsof -ti:5173 | xargs kill -9
```

### No llegan los correos

1. Verifica las credenciales SMTP en `.env`
2. Asegúrate de que el email en `SMTP_FROM` esté verificado en tu proveedor
3. Revisa los logs del backend para ver errores de SMTP

### Error al subir archivos

```bash
# Crear carpeta de uploads si no existe
mkdir -p backend/uploads/documents
chmod 755 backend/uploads
```

---

## 📝 Variables de Entorno Completas

### Backend (.env)

```env
# ═══════════════════════════════════════════
# BASE DE DATOS
# ═══════════════════════════════════════════
DATABASE_URL="postgresql://sgpuser:sgppass123@localhost:5432/sgp_db?schema=public"

# ═══════════════════════════════════════════
# AUTENTICACIÓN JWT
# ═══════════════════════════════════════════
JWT_SECRET=clave_secreta_muy_larga_y_segura_minimo_32_caracteres
JWT_EXPIRES_IN=8h

# ═══════════════════════════════════════════
# CREDENCIALES DEL GESTOR
# ═══════════════════════════════════════════
GESTOR_EMAIL=gestor@utpl.edu.ec
GESTOR_NAME=Gestor UTPL
GESTOR_PASSWORD=GestorUTPL2025!

# ═══════════════════════════════════════════
# CONFIGURACIÓN SMTP
# ═══════════════════════════════════════════
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=tu_usuario_smtp
SMTP_PASS=tu_clave_smtp
SMTP_FROM=noreply@utpl.edu.ec

# ═══════════════════════════════════════════
# ASEGURADORA
# ═══════════════════════════════════════════
ASEGURADORA_EMAIL=seguros@aseguradora.com
ASEGURADORA_NOMBRE=Aseguradora XYZ

# ═══════════════════════════════════════════
# ALMACENAMIENTO
# ═══════════════════════════════════════════
STORAGE_TYPE=local
UPLOAD_PATH=./uploads
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=SGP UTPL
VITE_ALERTS_POLLING_INTERVAL=30000
```

---

## 👥 Roles y Permisos

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **Gestor** | Usuario único del sistema | Acceso completo a todas las funcionalidades |
| **Público** | Visitantes del portal | Solo puede crear reportes de siniestros |

---

## 📄 Licencia

Este proyecto es de uso exclusivo interno de la **Universidad Técnica Particular de Loja**.

---

## 🤝 Soporte

Para soporte técnico o consultas sobre el sistema, contactar al área de TI de la UTPL.

---

<div align="center">

**Sistema de Gestión de Pólizas de Vida Estudiantil**

*Desarrollado para la Universidad Técnica Particular de Loja*

© 2025 UTPL - Todos los derechos reservados

</div>
