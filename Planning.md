# Planificacion Agil (Scrum) - DriveMind

## 1) Contexto del proyecto

- Equipo: Javier y Daniel (ambos full-stack).
- Inicio: martes 7 de abril de 2026.
- Fecha objetivo de entrega completa: lunes 11 de mayo de 2026.
- Entregable final: software funcionando + documentacion tecnica + despliegue automatizado + evidencias de pruebas.

---

## 2) Objetivo del cierre (11 mayo)

Llegar al 11 de mayo con:

1. `auth-service`, `core-service` y `ai-service` implementados e integrados.
2. Frontend funcional con flujos principales (auth, tests, estadisticas, chat IA).
3. Docker Compose operativo para todo el sistema.
4. Documentacion tecnica y manuales completos.
5. Evidencias de testing funcional y tecnico.

---

## 3) Marco Scrum (adaptado a equipo de 2)

### Roles

- Product Owner (compartido): Javier + Daniel.
- Scrum Master (rotativo semanal):
  - Semanas impares: Javier.
  - Semanas pares: Daniel.
- Development Team: Javier + Daniel.

### Ceremonias

- Sprint Planning: martes 09:00 (60 min).
- Daily Scrum: lunes a viernes 09:15 (15 min).
- Backlog Refinement: jueves 18:00 (30 min).
- Sprint Review + Retrospective: lunes 18:00 (60 min).

### Tablero

Estados: `To Do` -> `In Progress` -> `In Review` -> `Done`

Politica WIP:

- Maximo 2 tareas activas por persona.
- Terminar antes de abrir tareas grandes nuevas.

---

## 4) Definition of Ready (DoR)

Una historia entra a sprint si tiene:

- Descripcion clara (que y para que).
- Criterios de aceptacion concretos.
- Dependencias identificadas (API, DB, frontend, IA).
- Estimacion acordada por ambos.

---

## 5) Definition of Done (DoD)

Una tarea/historia esta en `Done` cuando:

- Codigo implementado e integrado.
- Pruebas minimas ejecutadas (manuales y/o automaticas).
- Validacion funcional por ambos.
- Documentacion actualizada.
- Sin errores criticos abiertos.
- Ejecutable en entorno Docker (si aplica).

---

## 6) Backlog por epicas

### Epica A - Auth y gestion de usuarios/autoescuelas

- Login JWT.
- Registro de autoescuelas por `system_admin`.
- Gestion de alumnos por `school_admin`.
- Asignacion y revocacion de licencias.

### Epica B - Core de tests y estadisticas

- Generacion de tests (`license`, `topic`, `random`, `failed`).
- Envio/correccion de tests.
- Dashboard de estadisticas (resumen, por tema, historico, tendencia).

### Epica C - IA conversacional persistente

- Conversaciones multiples.
- Persistencia de mensajes.
- Integracion con HuggingFace.

### Epica D - Frontend integrado

- Login y gestion de sesion.
- Pantallas de tests.
- Dashboard de progreso.
- Chat IA.

### Epica E - Calidad, documentacion y despliegue

- Docker Compose integral.
- Scripts de carga/seed.
- Evidencias de pruebas.
- Documentacion tecnica y manual de usuario.

---

## 7) Cronograma de sprints (07 abril -> 11 mayo)

### Sprint 1 - Kickoff tecnico

**Fechas:** 07/04 -> 13/04

**Objetivo:** base solida de arquitectura, backlog y entorno.

- Cerrar backlog y criterios de aceptacion.
- Validar contratos API por servicio.
- Entorno Docker base y conectividad servicios/DB.
- Estructura frontend y navegacion base.
- Evidencias iniciales de pruebas tecnicas.

**Foco de responsables**

- Javier: arquitectura backend + contratos API.
- Daniel: base frontend + integracion inicial de entorno.

### Sprint 2 - Auth end-to-end

**Fechas:** 14/04 -> 20/04

**Objetivo:** flujo completo de autenticacion y gestion academica minima.

- Implementar auth JWT y `/auth/me`.
- Alta de autoescuela por `system_admin`.
- Gestion de estudiantes por `school_admin`.
- Frontend de login + vistas de gestion basica.
- Pruebas funcionales de flujo auth.

**Foco de responsables**

- Javier: backend auth + modelo de datos.
- Daniel: frontend auth + integracion con auth-service.

### Sprint 3 - Motor de tests

**Fechas:** 21/04 -> 27/04

**Objetivo:** generacion y resolucion de tests completa.

- Carga de preguntas JSON en DB.
- Generacion de tests por `license`, `topic`, `random`, `failed`.
- Submit y correccion automatica (fallos > 3 = suspenso).
- UI de realizacion de test.
- Estadisticas base (aprobado/suspenso, acierto global).

**Foco de responsables**

- Javier: core-service (logica de tests).
- Daniel: frontend de test + integracion core.

### Sprint 4 - Dashboard + IA persistente

**Fechas:** 28/04 -> 04/05

**Objetivo:** completar valor diferencial del producto.

- Estadisticas avanzadas (por tema, historico, tendencias).
- Conversaciones IA persistentes (`ai-service`).
- Integracion real con HuggingFace.
- Pantallas de dashboard y chat IA.
- Validacion de estabilidad entre servicios.

**Foco de responsables**

- Javier: ai-service + persistencia de conversaciones.
- Daniel: dashboard frontend + visualizacion de estadisticas.

### Sprint 5 - Cierre, documentacion y despliegue

**Fechas:** 05/05 -> 11/05

**Objetivo:** entrega final preparada para evaluacion/demo.

- Pruebas integrales (funcionales + regresion).
- Correccion de bugs criticos.
- Automatizacion de despliegue con Docker Compose.
- Documentacion tecnica final + manual de usuario.
- Preparacion de demo final.

**Foco de responsables**

- Javier: despliegue + documentacion tecnica backend.
- Daniel: documentacion funcional + QA final + flujo de demo.

---

## 8) Estrategia de trabajo (equipo full-stack)

- Cada sprint tiene responsables de foco, pero ambos pueden hacer frontend y backend.
- Pairing puntual en tareas criticas (auth, submit tests, estadisticas, IA).
- Regla operativa:
  - Si una tarea bloquea al otro, se resuelve en conjunto.
  - Si no hay bloqueo, se trabaja en paralelo por vertical slices.

---

## 9) Riesgos y mitigacion

- Riesgo: retraso por integracion entre microservicios.
  - Mitigacion: pruebas de integracion desde Sprint 2 y contratos API cerrados.

- Riesgo: dependencia externa de HuggingFace (latencia/limites).
  - Mitigacion: manejo de errores, timeouts y respuesta fallback.

- Riesgo: carga alta de documentacion y despliegue al final.
  - Mitigacion: actualizacion continua de documentacion en cada sprint.

- Riesgo: alcance excesivo para 2 personas.
  - Mitigacion: priorizacion MoSCoW (`Must`, `Should`, `Could`, `Wont`).

---

## 10) Criterios de exito al 11 de mayo

- Flujo completo usable: login -> test -> resultados -> dashboard -> chat IA.
- Servicios levantan con Docker Compose sin pasos manuales complejos.
- APIs principales documentadas y coherentes con implementacion.
- Evidencias de pruebas incluidas.
- Documentacion final lista para evaluacion.
