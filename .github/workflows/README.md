# GitHub Actions Workflows

Este proyecto incluye pipelines de CI/CD configurados con GitHub Actions.

## 📋 Workflows Disponibles

### 1. CI Pipeline (`.github/workflows/ci.yml`)

Pipeline de integración continua que se ejecuta en cada push y pull request a las ramas `main`, `master` o `develop`.

#### Jobs incluidos:

- **Backend - Lint**: Ejecuta ESLint en el código del backend
- **Backend - Tests**: Ejecuta tests unitarios con cobertura
- **Backend - Build**: Compila el backend (solo si lint y tests pasan)
- **Frontend - Lint**: Ejecuta ESLint en el código del frontend
- **Frontend - Build**: Compila el frontend (solo si lint pasa)
- **E2E Tests**: Ejecuta tests end-to-end del backend
- **CI Success**: Verifica que todos los jobs hayan pasado exitosamente

#### Características:

- ✅ Cacheo de dependencias de npm para optimizar tiempos
- ✅ Servicio PostgreSQL para tests
- ✅ Generación automática de Prisma Client
- ✅ Ejecución de migraciones de base de datos
- ✅ Upload de artefactos de build
- ✅ Upload de reportes de cobertura (Codecov)

### 2. Deploy Pipeline (`.github/workflows/deploy.yml`)

Pipeline de deployment que se ejecuta solo en push a `main` o `master`, o manualmente mediante `workflow_dispatch`.

#### Jobs incluidos:

- **Deploy Backend**: Compila y despliega el backend
- **Deploy Frontend**: Compila y despliega el frontend

#### Configuración necesaria:

Para usar este pipeline, necesitas configurar los siguientes secrets en GitHub:

- `VITE_API_BASE_URL`: URL de la API en producción (para el frontend)
- `DEPLOY_TOKEN`: Token de autenticación para deployment del backend (opcional)
- `DEPLOY_HOST`: Host de destino para deployment (opcional)

**Nota**: Este workflow está configurado como plantilla. Debes descomentar y configurar los comandos de deployment según tu proveedor (Render, Vercel, Heroku, AWS, etc.).

## 🚀 Cómo usar

### Ejecución automática

Los workflows se ejecutan automáticamente cuando:
- Haces push a las ramas `main`, `master` o `develop`
- Creas o actualizas un pull request hacia estas ramas

### Ejecución manual

Para ejecutar el pipeline de deployment manualmente:

1. Ve a la pestaña **Actions** en GitHub
2. Selecciona el workflow **Deploy Pipeline**
3. Click en **Run workflow**
4. Selecciona la rama y click en **Run workflow**

## 🔧 Configuración de Secrets

Para configurar secrets en GitHub:

1. Ve a **Settings** → **Secrets and variables** → **Actions**
2. Click en **New repository secret**
3. Agrega los secrets necesarios

### Secrets recomendados:

```bash
# Frontend
VITE_API_BASE_URL=https://api.tudominio.com

# Backend Deployment (ejemplo para Render)
RENDER_API_KEY=tu_api_key_de_render

# Backend Deployment (ejemplo para Vercel)
VERCEL_TOKEN=tu_token_de_vercel
VERCEL_ORG_ID=tu_org_id
VERCEL_PROJECT_ID=tu_project_id
```

## 📊 Ver resultados

Puedes ver el estado de los workflows en:
- La pestaña **Actions** de tu repositorio
- Los badges de estado en el README (si los agregas)
- Las notificaciones de GitHub (si están habilitadas)

## 🐛 Solución de problemas

### Los tests fallan

- Verifica que PostgreSQL esté configurado correctamente
- Revisa que las migraciones de Prisma estén actualizadas
- Verifica que las variables de entorno de test estén correctas

### El build falla

- Verifica que todas las dependencias estén instaladas
- Revisa los logs del job específico que falló
- Asegúrate de que el código compile localmente antes de hacer push

### El deployment falla

- Verifica que los secrets estén configurados correctamente
- Revisa los permisos de los tokens de deployment
- Asegúrate de que el servicio de destino esté disponible

## 📝 Personalización

Puedes personalizar los workflows según tus necesidades:

- Agregar más jobs de testing
- Configurar deployment a múltiples entornos (staging, production)
- Agregar notificaciones (Slack, Discord, Email)
- Configurar cacheo adicional
- Agregar análisis de seguridad (Snyk, Dependabot)

## 🔗 Recursos útiles

- [Documentación de GitHub Actions](https://docs.github.com/en/actions)
- [Marketplace de Actions](https://github.com/marketplace?type=actions)
- [Guía de CI/CD con GitHub Actions](https://docs.github.com/en/actions/guides)
