# Frontend en AWS Amplify

React + TypeScript + Vite + MSAL ya estan preparados para variables externas.
No se modifican componentes, permisos, rutas, login ni llamadas HTTP.
No hace falta agregar un proxy administrativo ni ejecutar este frontend en EC2.

El remoto real se llama `frontend-barriodigial`; clonar con el destino explicito
`frontend-barriodigital` para conservar el nombre de carpeta de este workspace.

Configurar estas variables de BUILD en la aplicacion Amplify existente:

| Variable | Valor a configurar (sin secretos) |
| --- | --- |
| VITE_AZURE_TENANT_ID | Tenant existente |
| VITE_AZURE_CLIENT_ID | App SPA existente, NO client ID de la API |
| VITE_AZURE_API_SCOPE | Scope completo existente, por ejemplo api://<API_CLIENT_ID>/access_as_user |
| VITE_AZURE_REDIRECT_URI | URL HTTPS de Amplify registrada como redirect SPA en Entra |
| VITE_API_BASE_URL | URL HTTPS real de API Gateway, incluido stage si corresponde, SIN /api final |

El cliente agrega `/api/...` y Bearer mediante acquireTokenSilent. No apuntarlo a
Requests/Catalog, no usar la IP publica de la EC2 como URL del navegador y no
introducir secretos en VITE_*: quedan incorporados en el bundle publico.
Confirmar que API Gateway preserva el path esperado y no duplica/elimina /api.
Cambiar variables Vite requiere un NUEVO BUILD; no son variables de runtime.

Conservar el build Amplify existente: Node 22.12+ compatible con el Vite instalado,
`npm ci`, `npm run build`, artefactos `dist/**/*`. No se sobrescribe la configuracion
remota de Amplify ni se agrega un amplify.yml que pueda reemplazarla sin inspeccion.
Si no esta configurado, ajustar esos campos en Amplify y revisar su rewrite SPA
200 a /index.html, excluyendo assets estaticos. Recargar `/requests` y `/catalog`
debe seguir funcionando. La redirect URI debe coincidir exactamente con Entra;
no se realizan cambios de registro de aplicaciones durante esta tarea.
`FRONTEND_ORIGIN` del BFF debe coincidir con el origen Amplify, sin slash final.
Verificar CORS/OPTIONS y reenvio Authorization en API Gateway, sin comodines.

```powershell
npm ci
npm run build
```

La guia principal esta en README.AWS.md de infra-barriodigital.
Referencia: [Rewrites SPA de AWS](https://docs.aws.amazon.com/amplify/latest/userguide/redirect-rewrite-examples.html).
