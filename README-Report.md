# Reportería React — EV5/EV6

La página existente `/reports` consume exclusivamente el BFF mediante `apiClient.ts`. Se conserva la adquisición silenciosa del access token con MSAL, el scope configurado y la autorización Admin del BFF. No se agregaron flujos de autenticación, datos de demostración en producción ni llamadas desde el navegador al puerto 8083.

## Diagnóstico y contrato verificado

Se inspeccionaron `ReportDtos.java`, `ReportController.java`, `RangeResolver.java`, `ReportService.java`, `StatisticsRepository.java` y pruebas de ms-report, además del proxy Report y su seguridad en el BFF, en modo de solo lectura.

La vista anterior esperaba campos que Report no devuelve (`activeRequests`, `averageResolutionTime`, `hourlyRequests`, `activeStatuses`), esperaba un array directo para el ranking y usaba `total` en lugar de `totalRequests`. No consultaba el endpoint de horas. Además, una sola promesa rechazada ocultaba todas las secciones. Esos desajustes se corrigen sin cambiar contratos backend.

| Consulta a través del BFF | Respuesta real | Uso en la pantalla |
| --- | --- | --- |
| `GET /api/report/kpis?range=last24h` o `last7d` | `{ range: { from, to }, totalRequests, requestsByStatus, resolvedRequests, averageResolutionSeconds }` | Tarjetas y estados, según selector |
| `GET /api/report/top-procedures?range=last7d` | `{ range: { from, to }, procedures: [{ procedureId, procedureName, totalRequests }] }` | Ranking, siempre últimos siete días |
| `GET /api/report/requests-by-hour?range=last24h` | `{ range: { from, to }, hours: [{ hour, totalRequests }] }` | Serie horaria, siempre últimas 24 horas |

Los tres endpoints admiten `last24h`, `last7d`, `last30d` y rangos explícitos `from`/`to` según el backend. La interfaz ofrece inicialmente solo 24 horas y siete días para KPIs. Los rangos fijos de los otros paneles son una decisión de presentación, no una limitación del endpoint. Se muestra también el intervalo efectivo que devuelve cada respuesta.

### Semántica de los indicadores

- Report filtra solicitudes por su **fecha de creación**: `from <= created_at < to`. Los estados corresponden al estado actual de ese conjunto. No es una reconstrucción histórica de estados ni un conteo de resoluciones ocurridas durante el período.
- Total: `totalRequests`. Activos: suma de `INGRESADO`, `ADMITIDO`, `EN_GESTION`, `EN_TERRENO` en `requestsByStatus`.
- Resueltos: `resolvedRequests`. Se muestran los seis estados, incluidos `RESUELTO` y `RECHAZADO`, con las etiquetas españolas del `StatusBadge` existente.
- Tiempo: `averageResolutionSeconds`, convertido a segundos/minutos/horas/días, con hasta un decimal. `null` muestra «Sin solicitudes resueltas»; cero válido muestra `0 s`.
- Horas: se ordenan cronológicamente los buckets recibidos, sin completar huecos ni inventar cantidades. PostgreSQL agrupa por hora UTC; la visualización usa `America/Santiago`, incluyendo el desplazamiento GMT para distinguir cambios estacionales. Un bucket inicial puede empezar antes del `from` exacto por el redondeo horario del backend.
- El ranking usa nombres reales y `totalRequests` de `procedures`; los arrays vacíos muestran estados vacíos.

## Implementación y reutilización

| Archivo | Función |
| --- | --- |
| `src/types/report.ts` | DTO TypeScript alineados con los records Java |
| `src/services/reportService.ts` | Tres consultas relativas al BFF, validación de respuestas y mensajes seguros específicos de Report |
| `src/utils/report.ts` | Activos, series, períodos, zona horaria y duración |
| `src/hooks/useReportQuery.ts` | Estado independiente, reintento, cancelación y límite de espera de 20 segundos por consulta |
| `src/pages/ReportsPage.tsx` | Adaptación de la vista existente, selector y actualización manual |
| `src/index.css` | Estilos acotados a Report para filtro, barras y lista horaria |
| `tests/`, `vitest.config.ts`, `package.json`, `package-lock.json` | Pruebas aisladas con Vitest, Testing Library y jsdom, solo dependencias de desarrollo |
| `README.md`, `README-Report.md` | Guía de uso y evidencia |

Se reutilizan `PageHeader`, `Button`, `LoadingState`, `ErrorState`, `EmptyState`, `StatusBadge`, `formatNumber`, los estados de dominio y las cuadrículas/tarjetas existentes. No se agregó una biblioteca de gráficos. Las barras tienen etiquetas y cantidades legibles sin depender del color. El selector tiene etiqueta, las secciones tienen títulos accesibles, los errores usan `role="alert"` y la carga conserva los componentes accesibles existentes.

Cambiar el selector cancela/ignora la consulta KPI anterior y oculta sus resultados hasta recibir los del nuevo período. Actualizar recarga las tres fuentes y conserva el selector. El reintento de una sección recarga solo su fuente; KPIs y estados comparten la misma respuesta. Incluso si el transporte ignora la cancelación, una respuesta anterior no reemplaza la actual. Se aborta al desmontar y al superar 20 segundos.

Las respuestas deben tener campos, conteos y fechas válidos. Un DTO antiguo, JSON inválido o contenido inesperado produce un error explícito, sin convertirlo en estadísticas vacías. Los errores 401, 403, 5xx, red y desconocidos se presentan mediante mensajes controlados; no se muestra texto arbitrario del backend ni detalles de MSAL. El cliente HTTP compartido permanece sin cambios, al igual que Auditoría, Dashboard, rutas y reglas de acceso.

## Validación ejecutada

En esta implementación, con Node.js 22.20.0:

| Comando | Resultado real |
| --- | --- |
| `npm test` | 62 pruebas aprobadas, cinco archivos, Vitest 5.1.0 |
| `npm run build` | TypeScript y Vite 8.3.0 completaron correctamente; bundle principal de aproximadamente 559 kB (160 kB gzip) y aviso por superar 500 kB |
| `npm run lint` | Sin errores; dos advertencias preexistentes en `AuthProfileProvider.tsx` (dependencia de efecto y exportación para Fast Refresh), archivo no modificado |

Cobertura: cero solicitudes, dos admitidas en siete días, duración nula y conversión de unidades, estados, envelopes de ranking/horas, fechas y zona horaria, 401/403/503/red/JSON inválido, token mediante el cliente existente, cambio de período, actualización, fallos parciales, reintento, respuesta obsoleta, timeout y desmontaje. Las pruebas de navegación ejecutan los guards y rutas reales con identidad simulada únicamente en tests, incluyendo Admin/Operador/Cliente/Auditor, login, Requests, Catalog, Audit y Dashboard.

Las pruebas no contactan Azure, Supabase, Kafka ni un BFF real. Vitest tiene `envDir: false`, no carga archivos `.env` reales. Los fixtures están exclusivamente en `tests/`; no se usan en el código de producción. No se modificaron otros repositorios ni se realizaron commits o pushes.

La comprobación visual no pudo completarse: Computer Use detuvo la inspección de Brave porque no pudo determinar la URL del navegador con suficiente certeza. No se comprobó el circuito real autenticado ni el diseño visual en navegador en esta ejecución. Debe realizarse con el procedimiento siguiente.

La instalación de herramientas de pruebas informó dos dependencias de desarrollo con avisos de seguridad (`vite@8.3.0` y `source-map-js@1.2.1`); `npm audit --json` lo confirmó. Ambas versiones ya estaban en el lockfile anterior. No se ejecutó `npm audit fix` ni se actualizaron dependencias existentes fuera del alcance. Queda pendiente revisar esos parches de desarrollo. La advertencia de tamaño del bundle tampoco impide compilar; una optimización de carga puede abordarse por separado.

## Prueba local con Admin

Requisitos: BFF funcionando en `http://localhost:8080`, Report en `http://localhost:8083`, infraestructura y proyección operativas, y las variables Entra existentes configuradas. No es necesario agregar nuevas variables. La aplicación usa `VITE_AZURE_TENANT_ID`, `VITE_AZURE_CLIENT_ID`, `VITE_AZURE_API_SCOPE`, `VITE_AZURE_REDIRECT_URI` y `VITE_API_BASE_URL`. Conservar sus valores existentes y el scope `access_as_user`. No imprimir tokens ni incluir credenciales en el repositorio.

Desde PowerShell:

```powershell
Set-Location 'G:\Desarrollo EP3-EP4\frontend-barriodigital'
# Si todavía no están instaladas las dependencias del lockfile:
npm ci
npm test
npm run lint
npm run build
# Solo sobrescribe la URL pública del BFF para esta sesión; conserva Entra.
$env:VITE_API_BASE_URL = 'http://localhost:8080'
npm run dev -- --host localhost --port 5173 --strictPort
```

Si Vite ya está ejecutándose en 5173, utilizar esa instancia con su configuración correcta. Reiniciar Vite al cambiar variables de entorno; no iniciar una segunda instancia en otro puerto para eludir un puerto ocupado.

1. Abrir `http://localhost:5173`, iniciar sesión por el flujo existente con una cuenta Admin y entrar a Reportería (`/reports`).
2. Comprobar que las tres consultas terminan y muestran datos o estados vacíos legítimos. Cero solicitudes debe verse como `0`; duración nula como «Sin solicitudes resueltas».
3. En DevTools, revisar solo URL, estado y cuerpo de las respuestas de Report. Deben ir a `localhost:8080/api/report/...`, nunca a 8083. No copiar, registrar ni compartir cabeceras Authorization, tokens, HAR o capturas con datos sensibles.
4. Comparar total/resueltos con los campos homónimos; sumar los cuatro estados activos. Contrastar ranking y horas con los arrays de cada respuesta, sin exigir que coincidan totales de períodos distintos.
5. Elegir «Últimos 7 días». Solo KPIs/estados deben cambiar de período; horas sigue en 24 horas y ranking en siete días. Pulsar Actualizar y comprobar que el selector conserva siete días.
6. Verificar nombres y fechas, legibilidad con teclado y en vista móvil. Usar una cuenta Operador o Cliente solo si está disponible: Reportería no debe aparecer en navegación y `/reports` debe ser rechazado por el guard; el BFF sigue siendo la autoridad real.
7. Las pruebas automatizadas cubren errores y carreras sin detener servicios reales. No detener Kafka, alterar datos ni desactivar seguridad para provocar fallos manualmente.

La pantalla está conectada a datos persistidos de Report; la actualización de la proyección depende del consumo Kafka y puede ser eventual. Esta tarea no modifica Auditoría ni agrega otros indicadores al Dashboard general.
