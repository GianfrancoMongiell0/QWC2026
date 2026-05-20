# ⚽ Quiniela WC 2026

> Aplicación web corporativa para predecir los resultados del **FIFA World Cup 2026** (USA · CAN · MEX). Los empleados compiten entre sí en ligas privadas, predicen marcadores —incluyendo penales en eliminatoria— y acumulan puntos automáticamente conforme avanza el torneo.

---

## 📋 Tabla de Contenidos

1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Diseño y Paleta de Colores](#diseño-y-paleta-de-colores)
4. [Arquitectura](#arquitectura)
5. [Base de Datos](#base-de-datos)
6. [Seguridad y RLS](#seguridad-y-rls)
7. [Funcionalidades](#funcionalidades)
8. [Sistema de Puntuación](#sistema-de-puntuación)
9. [Bracket Eliminatorio](#bracket-eliminatorio)
10. [Predicción de Penales](#predicción-de-penales)
11. [PWA](#pwa)
12. [Estructura de Carpetas](#estructura-de-carpetas)
13. [Componentes](#componentes)
14. [Hooks](#hooks)
15. [Utilidades](#utilidades)
16. [Setup e Instalación](#setup-e-instalación)
17. [Orden de SQLs en Supabase](#orden-de-sqls-en-supabase)
18. [Despliegue en Vercel](#despliegue-en-vercel)
19. [Guía del Administrador](#guía-del-administrador)
20. [Limitaciones Conocidas](#limitaciones-conocidas)
21. [Roadmap Futuro](#roadmap-futuro)

---

## Descripción del Proyecto

**Quiniela WC 2026** es una aplicación web interna para empresas. Permite a los empleados participar en una quiniela completa del Mundial de Fútbol 2026. Cada usuario puede:

- Crear o unirse a múltiples **ligas privadas** con código de invitación
- Predecir el marcador exacto de los **72 partidos de grupos** y los **62 partidos eliminatorios**
- En eliminatoria, predecir también **quién gana en penales** cuando predicen un empate
- Ver su **tabla de grupos propia** calculada desde sus predicciones
- Ver el **bracket eliminatorio autoconstruido** desde sus picks de grupos
- Acumular puntos automáticamente cuando el admin ingresa los resultados reales
- Competir en tiempo real en la tabla de posiciones de su liga

El torneo cubre del **11 de junio al 19 de julio de 2026**. Las predicciones se cierran automáticamente al inicio del Mundial o cuando el usuario decide cerrarlas manualmente.

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React | 18.3.x |
| Build tool | Vite | 5.4.x |
| Estilos | Tailwind CSS | 3.4.x |
| Backend / BD | Supabase (PostgreSQL) | — |
| Auth | Supabase Auth (Email, sin verificación) | — |
| Realtime | Supabase Realtime | — |
| Hosting | Vercel (plan gratuito) | — |
| PWA | Service Worker + Web Manifest | — |

**Costo total en producción: $0**
El plan gratuito de Vercel y Supabase es más que suficiente para una quiniela corporativa de 50–200 empleados durante 3 meses.

---

## Diseño y Paleta de Colores

Diseño **mobile-first**, estética oscura inspirada en la identidad visual del Mundial 2026. Neón sobre negro para sensación premium.

### Paleta oficial

| Token | Hex | Uso |
|-------|-----|-----|
| `wc-dark` | `#0A0A0F` | Fondo principal |
| `wc-darker` | `#06060A` | Inputs y elementos recesados |
| `wc-surface` | `#12121A` | Cards, modales, navbar |
| `wc-border` | `#1E1E2E` | Bordes de todos los elementos |
| `wc-green` | `#00FF87` | Acento principal — éxito, logo, selección activa |
| `wc-blue` | `#00D4FF` | Acento secundario — hover, info |
| `wc-purple` | `#8B5CF6` | Penales, fases del bracket, filtros |
| `wc-red` | `#FF3366` | Error, predicciones cerradas, fallo |
| `wc-gold` | `#FFD700` | Puntos, primer lugar, panel admin |
| `wc-text-primary` | `#F0F0FF` | Texto principal |
| `wc-text-secondary` | `#8888AA` | Texto secundario |
| `wc-text-muted` | `#555570` | Labels, texto deshabilitado |

### Tipografía

| Familia | Uso | Clase CSS |
|---------|-----|-----------|
| **Bebas Neue** | Títulos grandes, logo, headers | `font-display` |
| **DM Sans** | Texto general, labels, botones | `font-body` |
| **JetBrains Mono** | Marcadores, puntos, códigos | `font-mono` |

---

## Arquitectura

```
Usuario (Browser / PWA)
        │
        ▼
   React + Vite
   (Vercel CDN — archivos estáticos)
        │
        ├── Supabase Auth ──── JWT Token
        │
        ├── Supabase Database (PostgreSQL + RLS)
        │       ├── Trigger: score_predictions_on_result
        │       ├── Trigger: handle_new_user (fallback)
        │       └── Function: calculate_prediction_points
        │
        └── Supabase Realtime (WebSocket)
                ├── league_members (standings en tiempo real)
                └── matches (resultados en tiempo real)
```

### Flujo principal

1. Usuario se registra → **el frontend crea el perfil directamente** (no depende del trigger)
2. Usuario predice → `upsertPrediction` guarda en `predictions` con `league_id` y opcionalmente `predicted_penalty_winner`
3. Admin ingresa resultado → `UPDATE matches SET status='finished', home_score=X, away_score=Y`
4. Trigger `score_predictions_on_result` → calcula puntos con `calculate_prediction_points` → actualiza `predictions`, `users_profiles` y `league_members`
5. Supabase Realtime notifica → standings se actualizan sin recargar

---

## Base de Datos

### Tabla: `users_profiles`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Referencia a `auth.users` |
| `username` | TEXT UNIQUE | Nombre de usuario único |
| `full_name` | TEXT | Nombre completo |
| `avatar_url` | TEXT | URL de avatar (opcional) |
| `role` | TEXT | `'user'` o `'admin'` |
| `total_points` | INTEGER | Puntos acumulados globales |

### Tabla: `leagues`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Identificador único |
| `name` | TEXT | Nombre de la liga |
| `description` | TEXT | Descripción opcional |
| `code` | TEXT UNIQUE | Código de 6 caracteres (ej: `WC7X2K`) |
| `owner_id` | UUID FK | Usuario creador |
| `is_active` | BOOLEAN | Estado de la liga |

### Tabla: `league_members`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `league_id` | UUID FK | Liga |
| `user_id` | UUID FK | Usuario miembro |
| `points` | INTEGER | Puntos en esta liga específica |

**Constraint:** `UNIQUE(league_id, user_id)`

### Tabla: `matches`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `match_number` | INTEGER UNIQUE | Número de partido (1–134) |
| `phase` | TEXT | `group`, `round_of_32`, `round_of_16`, `quarterfinal`, `semifinal`, `third_place`, `final` |
| `group_name` | TEXT | Letra del grupo (A–L), null en eliminatoria |
| `home_team` | TEXT | Equipo local o slot (`1A`, `W73`) |
| `away_team` | TEXT | Equipo visitante o slot |
| `home_team_flag` | TEXT | Emoji de bandera |
| `away_team_flag` | TEXT | Emoji de bandera |
| `match_datetime` | TIMESTAMPTZ | Fecha y hora UTC |
| `venue` | TEXT | Estadio y ciudad |
| `home_score` | INTEGER | Goles local (null hasta que admin ingrese) |
| `away_score` | INTEGER | Goles visitante |
| `status` | TEXT | `upcoming`, `live`, `finished`, `postponed` |
| `penalty_winner` | TEXT | `'home'`, `'away'` o null — ganador real en penales |

### Tabla: `predictions`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `user_id` | UUID FK | Usuario |
| `match_id` | UUID FK | Partido |
| `league_id` | UUID FK | Liga — predicciones son independientes por liga |
| `predicted_home` | INTEGER | Goles predichos para local |
| `predicted_away` | INTEGER | Goles predichos para visitante |
| `predicted_penalty_winner` | TEXT | `'home'`, `'away'` o null — ganador predicho en penales |
| `points_earned` | INTEGER | Puntos obtenidos (0, 2 o 3) |
| `is_scored` | BOOLEAN | Si ya fue puntuada |

**Constraint:** `UNIQUE(user_id, match_id, league_id)` — cada predicción es independiente por liga. Un usuario puede predecir diferente en dos ligas distintas.

### Funciones SQL

#### `calculate_prediction_points(pred_home, pred_away, pred_pen_win, real_home, real_away, real_pen_win)`
Calcula los puntos según el sistema de puntuación completo incluyendo penales.

#### `score_predictions_on_result()` (trigger en `matches`)
Se ejecuta tras `UPDATE` cuando `status = 'finished'`. Itera todas las predicciones del partido, calcula puntos y los suma en `predictions`, `users_profiles` y `league_members` (solo la liga correspondiente).

#### `handle_new_user()` (trigger en `auth.users`)
Crea el perfil automáticamente al registrarse. El frontend también crea el perfil directamente como fallback, garantizando que siempre exista.

#### `generate_league_code()`
Genera un código de 6 caracteres usando el charset `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sin caracteres ambiguos).

---

## Seguridad y RLS

RLS habilitado en las 5 tablas. El admin tiene acceso total a `matches`. Los usuarios solo pueden ver y editar sus propios datos.

### Políticas críticas de `predictions`
- **INSERT/UPDATE:** solo antes de que `match_datetime > NOW()` y `status = 'upcoming'`
- **league_id** debe pertenecer a una liga donde el usuario es miembro
- El trigger corre con `SECURITY DEFINER` para poder escribir sin restricciones de RLS

### Doble bloqueo de predicciones
1. **Frontend:** `locked = localStorage.getItem(lockKey) === 'true'` o `new Date() >= WC_DEADLINE (11 jun 2026)`
2. **Base de datos:** política RLS rechaza cualquier escritura si el partido ya comenzó

---

## Funcionalidades

### Autenticación
- Registro con username, nombre, email y contraseña
- Login con email y contraseña
- **Sin verificación de email** (Supabase Auth → Email → Confirm email: OFF)
- El perfil se crea directamente en el frontend al registrarse — no depende del trigger de BD
- Logout limpia localStorage, sessionStorage y redirige a landing

### Dashboard
- Ligas del usuario con puntos y código visible
- Botón de copiar código directamente desde la tarjeta
- Crear liga (código generado automáticamente)
- Unirse a liga con código

### Vista de Liga — Tab Grupos
- Navegación por grupos A–L con indicadores de completado (punto verde)
- Sub-vista **"Mis Predicciones"**: inputs de goles por partido con autoguardado
- Sub-vista **"Mi Tabla de Grupos"**: posiciones calculadas desde las predicciones del usuario, no de resultados reales
- Barra de progreso global

### Vista de Liga — Tab Eliminatoria
- Equipos autocompletos desde las predicciones de grupos del usuario
- Bracket avanza automáticamente según los ganadores predichos
- **Selector de penales** cuando el usuario predice empate
- Partidos agrupados por fase
- Botón de cierre de predicciones con modal de confirmación

### Vista de Liga — Tab Mi Liga
- Cards de resumen: posiciones + mis puntos acumulados en esta liga
- Tabla de posiciones con medallas y highlight del usuario
- Panel de compartir: copiar código, WhatsApp, compartir nativo

### Banner de partido próximo
- Aparece cuando hay un partido en las próximas 3 horas
- Amarillo > 30 min, rojo pulsante ≤ 30 min
- Muestra si ya tienes predicción

### Panel Admin (`/admin`)
- Solo accesible con `role = 'admin'`
- Filtros por estado y fase
- Ingresar marcador → partido se marca `finished` automáticamente → trigger puntúa
- En empate de eliminatoria: selector de ganador en penales
- El bracket eliminatorio se resuelve solo desde los resultados de grupos
- Botón "Mi Liga" para volver a vista de usuario

---

## Sistema de Puntuación

| Resultado | Condición | Puntos |
|-----------|-----------|--------|
| ⭐ Marcador exacto (90 min) | `pred_h = real_h AND pred_a = real_a` (sin penales o no aplica) | **3 pts** |
| 🏆 Empate exacto + penales correctos | Predice el empate Y acierta el ganador en penales | **3 pts** |
| ✓ Tendencia correcta | Mismo ganador o empate | **2 pts** |
| ✓ Empate exacto + penales incorrectos | Predice el empate pero falla el ganador en penales | **2 pts** |
| ✗ Fallo | Ninguna de las anteriores | **0 pts** |

**Ejemplos:**
- Predices 2-1, termina 2-1 → **3 pts**
- Predices 1-1 y dices que gana Argentina en penales, termina 1-1 y gana Argentina → **3 pts**
- Predices 1-1 y dices que gana Argentina, termina 1-1 y gana Francia → **2 pts**
- Predices 3-1, termina 1-0 → **2 pts** (ganó el mismo equipo)
- Predices 2-1, termina 1-2 → **0 pts**

Los puntos se calculan automáticamente mediante el trigger `score_predictions_on_result`.

---

## Bracket Eliminatorio

### Formato FIFA WC 2026
- 12 grupos × 4 equipos = 48 equipos en grupos
- Clasifican: top 2 de cada grupo (24) + 8 mejores terceros = **32 equipos**
- Ronda de 32 → Octavos → Cuartos → Semis → 3er Lugar + Final

### Cruces oficiales Ronda de 32 (FIFA)

| Partido | Local | Visitante | Estadio | Fecha UTC |
|---------|-------|-----------|---------|-----------|
| 73 | 2A | 2B | SoFi Stadium, LA | 28 jun |
| 74 | 1E | Mejor 3ro ABCDF | Gillette Stadium | 29 jun |
| 75 | 1F | 2C | Est. BBVA, Monterrey | 29 jun |
| 76 | 1C | 2F | NRG Stadium, Houston | 29 jun |
| 77 | 1I | Mejor 3ro CDFGH | MetLife Stadium | 30 jun |
| 78 | 2E | 2I | AT&T Stadium | 30 jun |
| 79 | 1A | Mejor 3ro CEFHI | Est. Azteca | 30 jun |
| 80 | 1L | Mejor 3ro EHIJK | Mercedes-Benz, Atlanta | 1 jul |
| 81 | 1D | Mejor 3ro BEFIJ | Levi's Stadium | 1 jul |
| 82 | 1G | Mejor 3ro AEHIJ | Lumen Field, Seattle | 1 jul |
| 83 | 2K | 2L | BMO Field, Toronto | 2 jul |
| 84 | 1H | 2J | SoFi Stadium | 2 jul |
| 85 | 1B | Mejor 3ro EFGIJ | BC Place, Vancouver | 2 jul |
| 86 | 1J | 2H | Hard Rock, Miami | 3 jul |
| 87 | 1K | Mejor 3ro DEIJL | Arrowhead Stadium | 3 jul |
| 88 | 2D | 2G | AT&T Stadium | 3 jul |

### Lógica del bracket (usuario)

1. Usuario predice todos los partidos de grupos
2. `resolveUserSlots()` calcula clasificados de cada grupo según esas predicciones
3. Los slots del bracket (`1A`, `2B`, `W73`, etc.) se resuelven en cascada
4. El ganador predicho de cada partido avanza automáticamente al siguiente
5. Si hay empate predicho: avanza el local (el usuario puede especificar penales)

---

## Predicción de Penales

En la **fase eliminatoria**, cuando un usuario predice un empate (ej: 1-1), aparece automáticamente un selector:

```
⚽ Empate — ¿Quién gana en penales? (+1pt extra si aciertas)
[ Argentina ]  [ Francia ]
```

- El selector usa los nombres reales de los equipos del partido
- La selección se guarda en `predicted_penalty_winner`
- Si acierta el empate + los penales → **3 pts** (mismo que marcador exacto)
- Si acierta el empate pero falla los penales → **2 pts**
- Una vez bloqueadas las predicciones se muestra en modo lectura

El **admin** tiene el mismo selector cuando ingresa un resultado en empate, para registrar el `penalty_winner` real. Esto también avanza el bracket correctamente.

---

## PWA

La app es instalable como Progressive Web App.

| Archivo | Descripción |
|---------|-------------|
| `public/manifest.json` | Nombre, iconos, colores, display mode |
| `public/sw.js` | Service Worker — cache + navegación offline |
| `public/icons/icon-192.png` | Icono Android 192×192 |
| `public/icons/icon-512.png` | Icono splash 512×512 |
| `public/icons/apple-touch-icon.png` | Icono iOS 180×180 |

**Android:** banner "Instalar app" automático con prompt nativo.
**iOS Safari:** instrucciones manuales (Compartir → Agregar a pantalla de inicio).

El banner se descarta permanentemente al cerrarlo (`localStorage: pwa_banner_dismissed`).

---

## Estructura de Carpetas

```
quiniela-wc2026/
│
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
│       ├── icon.svg
│       ├── icon-192.png
│       ├── icon-512.png
│       └── apple-touch-icon.png
│
├── src/
│   ├── main.jsx
│   ├── App.jsx                     # Router + AuthProvider + PWAInstallBanner
│   ├── styles/index.css            # Tailwind + clases globales
│   ├── lib/supabase.js             # Cliente Supabase
│   ├── context/AuthContext.jsx     # Auth global (sin dependencia de trigger)
│   │
│   ├── hooks/
│   │   ├── useLeague.js            # useMyLeagues, useCreateLeague, useJoinLeague
│   │   ├── useMatches.js           # useGroupMatches, useKnockoutMatches, useAllMatches
│   │   ├── usePredictions.js       # useMyPredictions (por liga, con penales)
│   │   ├── useStandings.js         # Standings con Realtime
│   │   └── usePWAInstall.js        # Detección e instalación PWA
│   │
│   ├── pages/
│   │   ├── LandingPage.jsx         # Login / Registro
│   │   ├── DashboardPage.jsx       # Mis ligas
│   │   ├── LeaguePage.jsx          # Liga (grupos, eliminatoria, posiciones)
│   │   └── AdminPage.jsx           # Panel de administrador
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Spinner.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── PWAInstallBanner.jsx
│   │   ├── layout/Navbar.jsx
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   └── RegisterForm.jsx
│   │   ├── leagues/
│   │   │   ├── LeagueCard.jsx          # Tarjeta con copiar código
│   │   │   ├── CreateLeagueModal.jsx
│   │   │   ├── JoinLeagueModal.jsx
│   │   │   └── ShareLeagueButton.jsx   # WhatsApp + nativo
│   │   ├── matches/
│   │   │   ├── PredictionInput.jsx     # Con selector de penales en eliminatoria
│   │   │   └── UpcomingMatchBanner.jsx # Banner partido próximo
│   │   └── standings/StandingsTable.jsx
│   │
│   └── utils/
│       ├── dateHelpers.js
│       └── bracketResolver.js      # Bracket completo con mejores terceros FIFA
│
├── supabase/
│   ├── 01_schema.sql               # Tablas, funciones, triggers base
│   ├── 02_rls.sql                  # Políticas RLS completas
│   ├── 03_matches_wc2026.sql       # 48 partidos grupos A–H
│   ├── 04_grupos_I_L.sql           # 24 partidos grupos I–L
│   ├── 05_knockout_official.sql    # 62 partidos eliminatorios (slots FIFA)
│   ├── 06_fix_predictions_per_league.sql  # league_id en predictions
│   ├── 07_penalty_winner.sql       # penalty_winner en matches (admin)
│   └── 08_user_penalty_prediction.sql    # predicted_penalty_winner + puntos actualizados
│
├── index.html                      # Con meta PWA y OG tags
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json                     # SPA routing
├── .env.example
└── README.md
```

---

## Setup e Instalación

### Requisitos
- Node.js 18+, npm 9+
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Vercel](https://vercel.com)

### 1. Instalar dependencias
```bash
npm install
```

### 2. Variables de entorno
```bash
cp .env.example .env.local
```
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Encuéntralas en: **Supabase → Settings → API**

### 3. Configurar Supabase Auth
**Authentication → Providers → Email:**
- Enable Email Signup: **ON**
- Confirm email: **OFF**

### 4. Ejecutar SQLs (ver sección siguiente)

### 5. Desarrollo local
```bash
npm run dev   # → http://localhost:5173
```

---

## Orden de SQLs en Supabase

Ejecutar en **SQL Editor** en este orden exacto:

```
1. supabase/01_schema.sql
2. supabase/02_rls.sql
3. supabase/03_matches_wc2026.sql        ← grupos A–H (48 partidos)
4. supabase/04_grupos_I_L.sql            ← grupos I–L (24 partidos)
5. supabase/05_knockout_official.sql     ← eliminatoria (62 partidos)
6. supabase/06_fix_predictions_per_league.sql
7. supabase/07_penalty_winner.sql
8. supabase/08_user_penalty_prediction.sql
```

### Verificar que todo quedó correcto
```sql
SELECT phase, COUNT(*) FROM public.matches
GROUP BY phase ORDER BY phase;
-- Debe mostrar: group(72) + round_of_32(16) + round_of_16(8)
-- + quarterfinal(4) + semifinal(2) + third_place(1) + final(1) = 104 total
```

### Dar permisos de admin
```sql
UPDATE public.users_profiles
SET role = 'admin'
WHERE username = 'tu_username';
```

---

## Despliegue en Vercel

1. Subir a GitHub
2. Vercel → Add New Project → importar repo
3. Framework: **Vite**
4. Variables de entorno: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
5. Deploy ✅

**Configurar URL en Supabase después del deploy:**
Authentication → URL Configuration:
- Site URL: `https://tu-app.vercel.app`
- Redirect URLs: `https://tu-app.vercel.app/**`

---

## Guía del Administrador

### Flujo durante el Mundial

**Antes del 11 de junio:**
- Todos los usuarios predicen libremente grupos y eliminatoria
- Tú también puedes predecir como usuario normal

**Durante el Mundial:**
1. Ve al panel Admin (`/admin`)
2. Filtra por "Sin resultado"
3. Cuando termine un partido: "+ Resultado" → ingresa marcadores → "✓ Guardar"
4. Si terminó en empate en eliminatoria: aparece el selector de penales
5. Los puntos se calculan automáticamente para todos los usuarios
6. El bracket real se actualiza solo

### Corrección de resultados
Si el admin ingresa un resultado incorrecto y lo corrige, el trigger re-calcula todos los puntos automáticamente (resetea las predicciones marcadas y las vuelve a puntuar con el marcador correcto).

### Queries útiles
```sql
-- Ranking global
SELECT username, total_points
FROM users_profiles ORDER BY total_points DESC;

-- Puntos por liga
SELECT u.username, l.name, lm.points
FROM league_members lm
JOIN users_profiles u ON u.id = lm.user_id
JOIN leagues l ON l.id = lm.league_id
ORDER BY l.name, lm.points DESC;

-- Predicciones puntuadas de un partido
SELECT u.username, p.predicted_home, p.predicted_away,
       p.predicted_penalty_winner, p.points_earned
FROM predictions p
JOIN users_profiles u ON u.id = p.user_id
WHERE p.match_id = 'UUID-DEL-PARTIDO'
ORDER BY p.points_earned DESC;
```

---

## Limitaciones Conocidas

### 1. Lock de predicciones en localStorage
El cierre manual usa `localStorage`. Si el usuario borra datos del navegador antes del 11 de junio puede volver a editar. Para una quiniela corporativa interna es aceptable. La solución completa sería una columna `locked_at` en `league_members`.

### 2. Empate en grupos sin penales
En grupos, si el usuario predice 0-0, el bracket asume que avanza el local. En grupos no hay penales en la realidad (se desempata por puntos), así que esto es correcto por diseño.

### 3. Mejores terceros — aproximación
La tabla de mejores terceros del `bracketResolver` cubre las combinaciones principales. Casos extremos muy específicos de la reglamentación FIFA pueden diferir levemente.

---

## Roadmap Futuro

- [ ] **Lock en BD** — columna `locked_at` en `league_members` para cierre irreversible
- [ ] **API automática** — Supabase Edge Function con cron que consulta API-Football cada 5 min durante partidos
- [ ] **Notificaciones push** — Web Push API para avisar de puntos actualizados o partido próximo
- [ ] **Resumen personal** — vista de todos los picks con estado (✅ exacto, ✓ tendencia, ✗ fallo, ⏳ pendiente)
- [ ] **Modo espectador** — ver predicciones de otros miembros de la liga después del 11 de junio
- [ ] **Estadísticas** — % de exactos, % de tendencias, racha de aciertos

---

## Scripts

```bash
npm run dev      # Desarrollo en localhost:5173
npm run build    # Build de producción
npm run preview  # Preview del build
```

---

## Licencia

Proyecto privado de uso interno corporativo. Todos los derechos reservados.

---

*Desarrollado para el FIFA World Cup 2026 · USA · CAN · MEX · 11 jun – 19 jul 2026*
