# Frontend en AWS Amplify

Conectar el repositorio existente `frontend-barriodigial`. Su
[`amplify.yml`](amplify.yml) usa Node.js 22 (22.12 o posterior), instala el
lockfile con `npm ci`, ejecuta `npm run build` y publica `dist`.

| Variable de build | Valor |
| --- | --- |
| `VITE_AZURE_TENANT_ID` | Tenant existente |
| `VITE_AZURE_CLIENT_ID` | ID de la aplicación SPA existente |
| `VITE_AZURE_API_SCOPE` | Identificador completo del scope delegado existente `access_as_user` |
| `VITE_AZURE_REDIRECT_URI` | URI HTTPS de Amplify que coincida exactamente con una URI SPA ya registrada |
| `VITE_API_BASE_URL` | Endpoint `https://<id>.execute-api.us-east-1.amazonaws.com`, con stage opcional y sin el prefijo `/api` |

El build toma las variables del proceso Amplify e incorpora estas cinco al bundle
público. Mantener las credenciales fuera de `VITE_*`. `apiClient.ts` agrega
`/api/…` y envía el token de acceso obtenido por MSAL. Configurar
`FRONTEND_ORIGIN` del BFF y CORS de API Gateway con el origen exacto de Amplify.

Usar exclusivamente una URL Amplify cuya URI SPA ya esté registrada en Entra,
incluida la barra final si forma parte del registro. Si no hay coincidencia
confirmada, detener la publicación de esa URL y reportar el bloqueo. Conservar
los IDs, los roles y las URI existentes de Entra.

En **Rewrites and redirects** de Amplify, conservar o configurar la regla SPA
de estado `200` hacia `/index.html` para rutas de aplicación y excluir los assets.
Comprobar recarga directa de `/requests`, `/catalog`, `/reports` y `/audit`
con los roles correspondientes. [Reglas SPA de Amplify](https://docs.aws.amazon.com/amplify/latest/userguide/redirect-rewrite-examples.html)

Ejecutar `npm run lint` y `npm test` para las verificaciones aisladas. Para una
compilación de prueba, exportar los cinco valores ficticios de la plantilla.
