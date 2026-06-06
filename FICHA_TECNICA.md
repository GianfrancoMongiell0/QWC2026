# 📋 Ficha Técnica — Quiniela WC 2026

---

## 1. Descripción General

**Quiniela WC 2026** es una aplicación web corporativa desarrollada para que los empleados de una empresa puedan participar en una quiniela del **FIFA World Cup 2026** (USA · Canadá · México). Los usuarios predicen marcadores de los 104 partidos del torneo, compiten en ligas privadas y acumulan puntos automáticamente conforme avanza el torneo.

| Campo | Detalle |
|-------|---------|
| **Nombre** | Quiniela WC 2026 |
| **Tipo** | Aplicación web corporativa (SPA + PWA) |
| **Torneo** | FIFA World Cup 2026 — 11 jun al 19 jul 2026 |
| **Sedes** | USA · Canadá · México |
| **Partidos** | 104 (72 grupos + 32 eliminatorios) |
| **URL producción** | https://qwc-2026.vercel.app |
| **Repositorio** | https://github.com/GianfrancoMongiell0/QWC2026 |
| **Costo operativo** | $0/mes (planes gratuitos de Vercel + Supabase) |

---

## 2. Stack Tecnológico

### Frontend
| Tecnología | Versión | Rol |
|-----------|---------|-----|
| React | 18.3.x | Framework UI |
| Vite | 5.4.x | Build tool y dev server |
| Tailwind CSS | 3.4.x | Estilos y utilidades CSS |
| React Router DOM | 6.26.x | Enrutamiento SPA |

### Backend / Infraestructura
| Tecnología | Plan | Rol |
|-----------|------|-----|
| Supabase | Free | Base de datos PostgreSQL + Auth + Realtime |
| Vercel | Hobby (Free) | Hosting y CDN global |

### PWA
| Componente | Descripción |
|-----------|-------------|
| Web Manifest | Configuración de instalación como app nativa |
| Service Worker | Caché offline + estrategia Network First / Cache First |
| Iconos | 192×192, 512×512 (Android) + 180×180 (iOS) |

### Dependencias principales
```json
{
  "@supabase/supabase-js": "^2.45.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.26.0"
}
```

---

## 3. Arquitectura del Sistema

```
Usuario (Browser / PWA instalada)
         │
         ▼
    React + Vite
    (Vercel CDN — archivos estáticos)
         │
         ├── Supabase Auth ──── JWT Token (sesión persistente)
         │
         ├── Supabase Database (PostgreSQL)
         │       ├── RLS en todas las tablas
         │       ├── Trigger: score_predictions_on_result
         │       ├── Trigger: handle_new_user
         │       └── Function: calculate_prediction_points
         │
         └── Supabase Realtime (WebSocket)
                 ├── league_members → standings en tiempo real
                 └── matches → resultados en tiempo real
```

### Flujo principal de datos
1. Usuario se registra → frontend crea perfil en `users_profiles` directamente (sin depender del trigger)
2. Usuario predice → `upsert` en `predictions` con `user_id + match_id + league_id`
3. Admin ingresa resultado → `UPDATE matches SET status='finished', home_score=X, away_score=Y`
4. Trigger `score_predictions_on_result` → calcula puntos → actualiza `predictions`, `users_profiles`, `league_members`
5. Supabase Realtime notifica → standings actualizan sin recargar

---

## 4. Base de Datos

### Tablas

#### `users_profiles`
Extiende `auth.users` con datos de la aplicación.
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | FK a `auth.users` |
| `username` | TEXT UNIQUE | Nombre de usuario |
| `full_name` | TEXT | Nombre completo |
| `avatar_url` | TEXT | URL de avatar (opcional) |
| `role` | TEXT | `'user'` o `'admin'` |
| `total_points` | INTEGER | Puntos globales acumulados |
| `created_at` | TIMESTAMPTZ | Fecha de registro |
| `updated_at` | TIMESTAMPTZ | Última actualización |

#### `leagues`
Ligas privadas creadas por usuarios.
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Identificador |
| `name` | TEXT | Nombre de la liga |
| `description` | TEXT | Descripción opcional |
| `code` | TEXT UNIQUE | Código de 6 caracteres (ej: `WC7X2K`) |
| `owner_id` | UUID FK | Usuario creador |
| `is_active` | BOOLEAN | Estado activo/inactivo |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

#### `league_members`
Membresías de usuarios en ligas.
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Identificador |
| `league_id` | UUID FK | Liga |
| `user_id` | UUID FK | Usuario |
| `points` | INTEGER | Puntos en esta liga específica |
| `joined_at` | TIMESTAMPTZ | Fecha de unión |
| **UNIQUE** | | `(league_id, user_id)` |

#### `matches`
Los 104 partidos del torneo.
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Identificador |
| `match_number` | INTEGER UNIQUE | Número (1–104) |
| `phase` | TEXT | `group`, `round_of_32`, `round_of_16`, `quarterfinal`, `semifinal`, `third_place`, `final` |
| `group_name` | TEXT | Letra A–L (null en eliminatoria) |
| `home_team` | TEXT | Equipo local o slot (`1A`, `W73`) |
| `away_team` | TEXT | Equipo visitante o slot |
| `home_team_flag` | TEXT | Emoji de bandera local |
| `away_team_flag` | TEXT | Emoji de bandera visitante |
| `match_datetime` | TIMESTAMPTZ | Fecha y hora UTC |
| `venue` | TEXT | Estadio y ciudad |
| `home_score` | INTEGER | Goles local (null hasta resultado) |
| `away_score` | INTEGER | Goles visitante (null hasta resultado) |
| `status` | TEXT | `upcoming`, `live`, `finished`, `postponed` |
| `penalty_winner` | TEXT | `'home'`, `'away'` o null — ganador en penales |

#### `predictions`
Predicciones de usuarios. Independientes por liga.
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Identificador |
| `user_id` | UUID FK | Usuario |
| `match_id` | UUID FK | Partido |
| `league_id` | UUID FK | Liga — predicciones son independientes por liga |
| `predicted_home` | INTEGER | Goles predichos local |
| `predicted_away` | INTEGER | Goles predichos visitante |
| `predicted_penalty_winner` | TEXT | `'home'`, `'away'` o null — penales predichos |
| `points_earned` | INTEGER | Puntos obtenidos (0, 2 o 3) |
| `is_scored` | BOOLEAN | Si ya fue puntuada |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Última actualización |
| **UNIQUE** | | `(user_id, match_id, league_id)` |

### Funciones SQL

#### `generate_league_code()`
Genera código alfanumérico de 6 caracteres. Charset: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sin caracteres ambiguos O, 0, I, 1).

#### `calculate_prediction_points(pred_home, pred_away, pred_pen_win, real_home, real_away, real_pen_win)`
Calcula puntos según el sistema de puntuación. Firma de 6 parámetros para soportar penales.

#### `score_predictions_on_result()` (Trigger AFTER UPDATE en `matches`)
Se dispara cuando `status = 'finished'`. Itera todas las predicciones del partido, calcula y asigna puntos en `predictions`, `users_profiles` y `league_members` (solo la liga de esa predicción). También re-calcula si se corrige un resultado.

#### `handle_new_user()` (Trigger AFTER INSERT en `auth.users`)
Crea automáticamente el perfil en `users_profiles` al registrarse. El frontend también crea el perfil directamente como fallback.

### Índices
```sql
idx_predictions_match  ON predictions(match_id)
idx_predictions_user   ON predictions(user_id)
idx_predictions_league ON predictions(league_id)
idx_matches_datetime   ON matches(match_datetime)
idx_members_league     ON league_members(league_id)
idx_members_user       ON league_members(user_id)
```

---

## 5. Seguridad

### Row Level Security (RLS)
Habilitado en las 5 tablas públicas. Ningún usuario puede leer ni escribir datos de otro.

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `users_profiles` | Todos autenticados | Solo propio | Solo propio | — |
| `leagues` | Todos autenticados | Solo creador | Solo dueño | Solo dueño |
| `league_members` | Todos autenticados | Solo propio | — | Solo propio |
| `matches` | Todos autenticados | Solo admin | Solo admin | — |
| `predictions` | Propio + compañeros de liga (post-partido) | Solo propio + antes del partido | Solo propio + antes del partido | Solo propio + antes del partido |

### Doble bloqueo de predicciones
1. **Frontend:** `locked = localStorage.getItem(lockKey) === 'true'` O `new Date() >= new Date('2026-06-11T00:00:00-05:00')`
2. **Base de datos:** política RLS rechaza cualquier INSERT/UPDATE si `match_datetime <= NOW()` o `status != 'upcoming'`

### Autenticación
- Supabase Auth con email y contraseña
- Sin verificación de email (desactivado en configuración)
- JWT tokens con auto-refresh
- Logout limpia localStorage, sessionStorage y redirige

---

## 6. Sistema de Puntuación

| Resultado | Condición | Puntos |
|-----------|-----------|--------|
| ⭐ Marcador exacto (90 min) | `pred_h = real_h AND pred_a = real_a` (sin penales) | **3 pts** |
| 🏆 Empate exacto + penales correctos | Predice el empate Y acierta el ganador en penales | **3 pts** |
| ✓ Tendencia correcta | Mismo ganador o empate | **2 pts** |
| ✓ Empate exacto + penales incorrectos | Predice el empate pero falla los penales | **2 pts** |
| ✗ Fallo | Ninguna de las anteriores | **0 pts** |

**Ejemplos:**
- Predices 2-1, termina 2-1 → **3 pts**
- Predices 1-1 + Argentina en penales, termina 1-1 + Argentina gana → **3 pts**
- Predices 1-1 + Argentina, termina 1-1 + Francia gana → **2 pts**
- Predices 3-1, termina 1-0 → **2 pts** (ganó el mismo)
- Predices 2-1, termina 1-2 → **0 pts**

Los puntos se calculan **automáticamente** via trigger de PostgreSQL cuando el admin ingresa el resultado.

---

## 7. Bracket Eliminatorio

### Formato FIFA WC 2026
- 12 grupos × 4 equipos = 48 equipos
- Clasifican: Top 2 de cada grupo (24) + 8 mejores terceros = **32 equipos**
- Ronda de 32 → Octavos → Cuartos → Semis → 3er Lugar + Final

### Lógica del bracket (bracketResolver.js)
El módulo más complejo del proyecto. Resuelve los slots del bracket (`1A`, `2B`, `W73`, etc.) a partir de predicciones o resultados reales.

**Funciones principales:**
- `calcGroupStandings(matches, getScore)` — calcula tabla de grupo
- `resolveUserSlots(groupMatches, predictions)` — mapa de slots desde predicciones del usuario
- `resolveAdminSlots(groupMatches)` — mapa de slots desde resultados reales
- `resolveKnockoutBracket(knockoutMatches, groupSlots, predictions)` — bracket completo del usuario
- `resolveRealKnockoutBracket(knockoutMatches, groupSlots)` — bracket real del admin

**Fix de duplicación:** un `Set` de `usedTeams` garantiza que ningún equipo aparezca en dos partidos simultáneamente.

**Penales en bracket:** usa `predicted_penalty_winner` del usuario para determinar el ganador cuando hay empate predicho.

### Cruces oficiales Ronda de 32

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

---

## 8. Diseño y UI

### Principios
- **Mobile-first** — diseñado primero para móvil, adaptado a desktop
- **Dark theme** — fondo oscuro con acentos neón
- **Identidad WC 2026** — paleta inspirada en la identidad oficial del torneo

### Paleta de Colores
| Token | Hex | Uso |
|-------|-----|-----|
| `wc-dark` | `#0A0A0F` | Fondo principal |
| `wc-darker` | `#06060A` | Inputs, elementos recesados |
| `wc-surface` | `#12121A` | Cards, modales, navbar |
| `wc-border` | `#1E1E2E` | Bordes de todos los elementos |
| `wc-green` | `#00FF87` | Acento principal — logo, éxito, activo |
| `wc-blue` | `#00D4FF` | Acento secundario — hover, info |
| `wc-purple` | `#8B5CF6` | Penales, fases del bracket |
| `wc-red` | `#FF3366` | Error, predicciones cerradas |
| `wc-gold` | `#FFD700` | Puntos, primer lugar, admin |
| `wc-text-primary` | `#F0F0FF` | Texto principal |
| `wc-text-secondary` | `#8888AA` | Texto secundario |
| `wc-text-muted` | `#555570` | Labels, texto deshabilitado |

### Tipografía
| Familia | Uso |
|---------|-----|
| **Bebas Neue** | Títulos, logo, headers grandes |
| **DM Sans** | Texto general, labels, botones |
| **JetBrains Mono** | Marcadores, puntos, códigos de liga |

### Animaciones
| Nombre | Uso |
|--------|-----|
| `spin` | Spinner de carga |
| `slideUp` | Entrada de modales |
| `fadeIn` | Feedback de guardado |
| `pulse-neon` | Badge "EN VIVO" |
| `pulse-border` | Banner de partido próximo (modo urgente) |

---

## 9. Estructura de Carpetas

```
quiniela-wc2026/
│
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service Worker
│   └── icons/
│       ├── icon.svg               # Fuente SVG
│       ├── icon-192.png           # Icono Android
│       ├── icon-512.png           # Icono splash
│       └── apple-touch-icon.png  # Icono iOS
│
├── src/
│   ├── main.jsx                   # Entry point
│   ├── App.jsx                    # Router + AuthProvider + PWABanner
│   ├── styles/index.css           # Tailwind + clases globales
│   │
│   ├── lib/
│   │   └── supabase.js            # Cliente Supabase inicializado
│   │
│   ├── context/
│   │   └── AuthContext.jsx        # Auth global — signUp, signIn, signOut
│   │
│   ├── hooks/
│   │   ├── useLeague.js           # useMyLeagues, useCreateLeague, useJoinLeague, useLeagueDetail
│   │   ├── useMatches.js          # useGroupMatches, useKnockoutMatches, useAllMatches
│   │   ├── usePredictions.js      # useMyPredictions (por liga, con penales, upsert)
│   │   ├── useStandings.js        # Standings con Realtime
│   │   └── usePWAInstall.js       # Detección e instalación PWA
│   │
│   ├── pages/
│   │   ├── LandingPage.jsx        # Login / Registro
│   │   ├── DashboardPage.jsx      # Mis ligas
│   │   ├── LeaguePage.jsx         # Liga (grupos, eliminatoria, posiciones)
│   │   └── AdminPage.jsx          # Panel administrador
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Spinner.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── PWAInstallBanner.jsx
│   │   ├── layout/
│   │   │   └── Navbar.jsx
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   └── RegisterForm.jsx
│   │   ├── leagues/
│   │   │   ├── LeagueCard.jsx         # Con copiar código rápido
│   │   │   ├── CreateLeagueModal.jsx
│   │   │   ├── JoinLeagueModal.jsx
│   │   │   └── ShareLeagueButton.jsx  # WhatsApp + nativo
│   │   ├── matches/
│   │   │   ├── PredictionInput.jsx    # Con selector de penales en eliminatoria
│   │   │   └── UpcomingMatchBanner.jsx
│   │   └── standings/
│   │       └── StandingsTable.jsx
│   │
│   └── utils/
│       ├── dateHelpers.js         # Formateo fechas, countdown, agrupación
│       └── bracketResolver.js     # Lógica bracket con mejores terceros FIFA + penales
│
├── supabase/
│   ├── 01_schema.sql              # Tablas, funciones, triggers
│   ├── 02_rls.sql                 # Políticas RLS
│   ├── 03_matches_wc2026.sql      # 48 partidos grupos A–H
│   ├── 04_grupos_I_L.sql          # 24 partidos grupos I–L
│   ├── 05_knockout_official.sql   # 62 partidos eliminatorios
│   ├── 06_fix_predictions_per_league.sql
│   ├── 07_penalty_winner.sql      # Campo penalty_winner en matches
│   └── 08_user_penalty_prediction.sql  # predicted_penalty_winner + puntos actualizados
│
├── index.html                     # Meta PWA, OG tags, fonts
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json                    # SPA routing
├── .env.example
├── .gitignore
└── README.md
```

---

## 10. Funcionalidades Completas

### Autenticación
- Registro con username, nombre completo, email y contraseña
- Login con email y contraseña
- **Sin verificación de email**
- Perfil creado directamente en el frontend al registrarse (sin depender del trigger)
- Logout limpia localStorage + sessionStorage y redirige al landing

### Dashboard
- Ligas del usuario con puntos acumulados
- Copiar código de liga con un toque (con feedback visual)
- Crear nueva liga (código generado automáticamente)
- Unirse a liga con código de 6 caracteres

### Vista de Liga — Grupos
- Navegación por grupos A–L
- Indicadores visuales de grupo completado (punto verde + botón verde)
- **Sub-vista Predicciones:** inputs de goles con autoguardado al perder el foco
- **Sub-vista Tabla de Grupos:** posiciones calculadas desde las predicciones del usuario (no de resultados reales)
- Barra de progreso global de predicciones de grupos

### Vista de Liga — Eliminatoria
- Equipos autocompletos desde predicciones de grupos
- Bracket avanza automáticamente según ganadores predichos
- **Selector de penales** cuando se predice empate en eliminatoria
- Partidos agrupados por fase con separadores
- Barra de progreso por fase
- Botón de cierre con modal de confirmación

### Vista de Liga — Mi Liga
- Cards de resumen: posiciones + mis puntos en esta liga
- Tabla de posiciones con medallas 🥇🥈🥉
- Highlight del usuario actual
- Panel de compartir: copiar código, WhatsApp, compartir nativo

### Banner de partido próximo
- Aparece cuando hay partido en las próximas 3 horas
- **Amarillo** si falta más de 30 minutos
- **Rojo pulsante** si faltan menos de 30 minutos
- Muestra si ya tienes predicción para ese partido
- Cuenta regresiva cada 30 segundos
- Descartable con ✕

### Panel Admin (`/admin`)
- Acceso exclusivo para `role = 'admin'`
- Filtros por estado (sin resultado / con resultado) y por fase
- Búsqueda por nombre de equipo
- Estadísticas: total, con resultado, pendientes
- Ingresar marcador → partido se marca `finished` → trigger calcula puntos automáticamente
- En empate de eliminatoria: selector de ganador en penales
- Bracket real se actualiza solo desde resultados de grupos
- Botón "⚽ Mi Liga" para volver a vista de usuario normal

### Cierre de predicciones
| Método | Comportamiento |
|--------|----------------|
| **Manual** | Usuario hace clic → modal de confirmación → `localStorage` → inputs bloqueados |
| **Automático** | 11 jun 2026 00:00 CDMX → bloqueo por fecha hardcodeado |
| **RLS** | Base de datos rechaza cualquier escritura si `match_datetime <= NOW()` |

### PWA
- Instalable en Android (prompt automático) e iOS (instrucciones manuales)
- Funciona offline con caché básico
- Banner de instalación descartable permanentemente

---

## 11. APIs y Conexiones Externas

| Servicio | Uso | Plan |
|---------|-----|------|
| Supabase | BD, Auth, Realtime | Free |
| Vercel | Hosting, CDN, CI/CD | Hobby (Free) |
| Google Fonts | Bebas Neue, DM Sans, JetBrains Mono | Gratuito |
| WhatsApp Web API | Compartir código de liga | Gratuito (URL scheme) |
| Web Share API | Compartir nativo en móvil | Nativo del browser |

---

## 12. Variables de Entorno

| Variable | Descripción | Dónde obtenerla |
|---------|-------------|-----------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Clave pública anónima | Supabase → Settings → API → anon public |

> ⚠️ Nunca uses la `service_role` key en el frontend.

---

## 13. Configuración de Supabase

### Auth
- **Enable Email Signup:** ON
- **Confirm email:** OFF
- **Site URL:** `https://qwc-2026.vercel.app`
- **Redirect URLs:** `https://qwc-2026.vercel.app/**`

### RLS adicional — `users_profiles`
```sql
CREATE POLICY "profiles_insert_service"
  ON public.users_profiles FOR INSERT
  TO service_role
  WITH CHECK (true);
```
Necesario para que el trigger pueda crear perfiles sin restricciones de RLS.

---

## 14. Orden de Ejecución de SQLs

```
1. supabase/01_schema.sql                    → Tablas, funciones, triggers base
2. supabase/02_rls.sql                       → Políticas RLS
3. supabase/03_matches_wc2026.sql            → 48 partidos grupos A–H
4. supabase/04_grupos_I_L.sql                → 24 partidos grupos I–L
5. supabase/05_knockout_official.sql         → 62 partidos eliminatorios
6. supabase/06_fix_predictions_per_league.sql → league_id en predictions
7. supabase/07_penalty_winner.sql            → penalty_winner en matches
8. supabase/08_user_penalty_prediction.sql   → predicted_penalty_winner + puntos
```

### Verificación post-instalación
```sql
SELECT phase, COUNT(*) FROM matches GROUP BY phase ORDER BY phase;
-- group(72) + round_of_32(16) + round_of_16(8) + quarterfinal(4)
-- + semifinal(2) + third_place(1) + final(1) = 104 total
```

---

## 15. Guía del Administrador

### Dar permisos de admin
```sql
UPDATE public.users_profiles
SET role = 'admin'
WHERE username = 'tu_username';
```

### Flujo durante el Mundial
1. Ir a `/admin`
2. Filtrar "Sin resultado"
3. Cuando termine un partido: `+ Resultado` → ingresar marcadores → `✓ Guardar`
4. Si terminó en empate en eliminatoria: seleccionar ganador en penales
5. Los puntos se calculan solos para todos los usuarios

### Corrección de resultados
Si el admin ingresa un resultado incorrecto y lo corrige, el trigger resetea las predicciones y re-calcula automáticamente.

### Bloquear registros el 10 de junio
```
Supabase → Authentication → Providers → Email
→ "Allow new users to sign up" → OFF
```

### Queries útiles para el admin
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

-- Ver predicciones de un partido específico
SELECT u.username, p.predicted_home, p.predicted_away,
       p.predicted_penalty_winner, p.points_earned
FROM predictions p
JOIN users_profiles u ON u.id = p.user_id
WHERE p.match_id = 'UUID-DEL-PARTIDO'
ORDER BY p.points_earned DESC;

-- Limpiar datos de prueba (NO ejecutar en producción)
DELETE FROM predictions;
DELETE FROM league_members;
DELETE FROM leagues;
UPDATE matches SET home_score=NULL, away_score=NULL,
  penalty_winner=NULL, status='upcoming' WHERE status='finished';
```

---

## 16. Limitaciones Conocidas

| Limitación | Impacto | Solución futura |
|-----------|---------|-----------------|
| Lock de predicciones en localStorage | Usuario puede borrar caché y editar antes del 11 jun | Columna `locked_at` en `league_members` |
| Empate sin penales predichos | Avanza el equipo local por defecto | Aceptable por diseño |
| Mejores terceros — aproximación | Casos extremos de la reglamentación FIFA pueden diferir | Tabla de 924 combinaciones |
| Sin notificaciones push | Usuario no recibe alertas de puntos | Web Push API |
| Sin verificación de email | Cualquiera puede registrarse con email falso | Aceptable para uso interno |
| Conexiones Realtime (60 máx) | Con +50 usuarios simultáneos puede acercarse al límite | Upgrade a plan Pro |

---

## 17. Roadmap Futuro

### Alta prioridad
- [ ] Lock de predicciones en BD (`locked_at` en `league_members`)
- [ ] API automática de resultados (Supabase Edge Function + API-Football)
- [ ] Recordatorio por email 48h antes del Mundial

### Media prioridad
- [ ] Modo espectador post-cierre
- [ ] Notificaciones push
- [ ] Estadísticas personales (% exactos, rachas, mejor partido)
- [ ] Animación de puntos al actualizarse

### Baja prioridad
- [ ] Dominio personalizado
- [ ] Exportar ranking a PDF
- [ ] Avatares de usuario
- [ ] Liga global (todos los usuarios de la empresa)

---

## 18. Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| Archivos de código | ~40 archivos |
| Líneas de código | ~3,000 líneas |
| Tablas en BD | 5 |
| Funciones SQL | 4 |
| Triggers | 2 |
| Partidos cargados | 104 |
| Grupos | 12 (A–L) |
| Fases eliminatorias | 6 |
| Versiones del proyecto | 12 |
| Costo mensual | $0 |

---

*Ficha técnica generada para Quiniela WC 2026 — v12*
*Última actualización: Mayo 2026*