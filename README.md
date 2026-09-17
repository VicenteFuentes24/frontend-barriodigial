# frontend-barriodigital

Frontend web de BarrioDigital. Permite autenticarse con Microsoft Entra ID mediante MSAL y consumir el backend protegido a través de AWS API Gateway.

## Tecnologías

- React 19
- TypeScript
- Vite
- React Router
- `@azure/msal-browser` y `@azure/msal-react`
- Lucide React

## Flujo de autenticación

1. El usuario inicia sesión con Microsoft Entra ID.
2. MSAL mantiene la sesión y obtiene un `access_token` para el scope configurado de la API.
3. `apiClient.ts` solicita el token mediante `acquireTokenSilent()` antes de cada llamada.
4. El token se envía en `Authorization: Bearer <access_token>`.
5. El frontend obtiene el perfil validado desde `GET /api/bff/me` y usa los roles entregados por el BFF para mostrar u ocultar opciones de navegación.

La autorización real no depende del frontend: las reglas de acceso se aplican nuevamente en el BFF.

## Variables de entorno

Crear un archivo `.env` a partir de `.env.example`:

```env
VITE_AZURE_TENANT_ID=YOUR_TENANT_ID
VITE_AZURE_CLIENT_ID=YOUR_FRONTEND_CLIENT_ID
VITE_AZURE_API_SCOPE=api://YOUR_API_CLIENT_ID/access_as_user
VITE_AZURE_REDIRECT_URI=http://localhost:5173
VITE_API_BASE_URL=https://YOUR_API_GATEWAY_ID.execute-api.YOUR_REGION.amazonaws.com
```

El archivo `.env` no debe subirse al repositorio.

## Ejecución local

```bash
npm install
npm run dev
```

Por defecto Vite levanta la aplicación en `http://localhost:5173`.

## Validaciones del proyecto

```bash
npm run lint
npm run build
```

## Rutas y roles

| Ruta | Roles visibles en frontend | Función |
| --- | --- | --- |
| `/dashboard` | Usuario autenticado | Resumen según rol |
| `/requests` | Admin, Operador, Cliente | Listado y gestión de trámites |
| `/requests/:id` | Admin, Operador, Cliente | Detalle del trámite |
| `/catalog` | Admin, Operador | Consulta del catálogo; Admin puede editar |
| `/reports` | Admin | Vista preparada para reportería |
| `/audit` | Admin, Auditor | Vista preparada para auditoría |

## Funcionalidades implementadas

### Sesión y perfil

- Inicio y cierre de sesión con Microsoft Entra ID.
- Obtención silenciosa del token para la API.
- Perfil y roles obtenidos desde `/api/bff/me`.
- Rutas protegidas y control de visibilidad por rol.
- Manejo de errores `401`, `403`, `404` y errores de servicio.

### Trámites

- Listar trámites desde `/api/requests`.
- Consultar detalle por ID.
- Crear un trámite.
- Cargar los tipos de trámite desde `/api/catalog/procedures`.
- Cambio de estado visible para Admin y Operador.

### Catálogo

- Listado de tipos de trámite.
- Creación y edición desde la vista de Admin.
- Visualización de requisitos, cupo diario y disponibilidad devuelta por el backend.

## Estructura principal

```text
src/
├── auth/          # configuración MSAL, perfil y guards
├── components/    # componentes visuales reutilizables
├── hooks/         # acceso al perfil autenticado
├── pages/         # vistas principales
├── services/      # cliente HTTP y servicios por dominio
├── types/         # tipos TypeScript
└── utils/         # formateo y utilidades
```

## Comunicación con el backend

```text
React + MSAL
   |
   | Authorization: Bearer <access_token>
   v
AWS API Gateway
   v
ms-barriodigital-bff
   v
Requests / Catalog
```

El frontend no llama directamente a los microservicios internos.
