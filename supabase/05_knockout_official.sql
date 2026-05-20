-- ============================================================
-- QUINIELA WC 2026 — FASE ELIMINATORIA OFICIAL FIFA
-- Cruces según el sorteo oficial del 5 dic 2025
-- Los equipos (home_team/away_team) se definen con los slots
-- oficiales. El frontend resuelve quién ocupa cada slot
-- basándose en las predicciones del usuario (vista usuario)
-- o en los resultados reales del admin (vista real).
-- ============================================================

-- El campo home_team y away_team almacena el SLOT oficial
-- Ej: '1A' = ganador Grupo A, '2B' = subcampeón Grupo B
-- '3ABCDF' = mejor 3ro de esos grupos (se resolve al final)
-- El admin actualiza home_team/away_team con el equipo real
-- cuando se define el duelo.

INSERT INTO public.matches
  (match_number, phase, home_team, away_team, match_datetime, venue, status)
VALUES

-- ── RONDA DE 32 (16 partidos) ──────────────────────────────
-- Bracket oficial FIFA WC 2026
(73,  'round_of_32', '2A', '2B',        '2026-06-28 23:00:00+00', 'SoFi Stadium, Los Ángeles',           'upcoming'),
(74,  'round_of_32', '1E', '3ABCDF',    '2026-06-29 20:00:00+00', 'Gillette Stadium, Boston',             'upcoming'),
(75,  'round_of_32', '1F', '2C',        '2026-06-29 23:00:00+00', 'Estadio BBVA, Monterrey',              'upcoming'),
(76,  'round_of_32', '1C', '2F',        '2026-06-29 02:00:00+00', 'NRG Stadium, Houston',                 'upcoming'),
(77,  'round_of_32', '1I', '3CDFGH',    '2026-06-30 23:00:00+00', 'MetLife Stadium, New Jersey',          'upcoming'),
(78,  'round_of_32', '2E', '2I',        '2026-06-30 20:00:00+00', 'AT&T Stadium, Dallas',                 'upcoming'),
(79,  'round_of_32', '1A', '3CEFHI',    '2026-06-30 02:00:00+00', 'Estadio Azteca, Ciudad de México',     'upcoming'),
(80,  'round_of_32', '1L', '3EHIJK',    '2026-07-01 23:00:00+00', 'Mercedes-Benz Stadium, Atlanta',       'upcoming'),
(81,  'round_of_32', '1D', '3BEFIJ',    '2026-07-01 20:00:00+00', 'Levi''s Stadium, San Francisco',       'upcoming'),
(82,  'round_of_32', '1G', '3AEHIJ',    '2026-07-01 02:00:00+00', 'Lumen Field, Seattle',                 'upcoming'),
(83,  'round_of_32', '2K', '2L',        '2026-07-02 23:00:00+00', 'BMO Field, Toronto',                   'upcoming'),
(84,  'round_of_32', '1H', '2J',        '2026-07-02 20:00:00+00', 'SoFi Stadium, Los Ángeles',            'upcoming'),
(85,  'round_of_32', '1B', '3EFGIJ',    '2026-07-02 02:00:00+00', 'BC Place, Vancouver',                  'upcoming'),
(86,  'round_of_32', '1J', '2H',        '2026-07-03 23:00:00+00', 'Hard Rock Stadium, Miami',             'upcoming'),
(87,  'round_of_32', '1K', '3DEIJL',    '2026-07-03 20:00:00+00', 'Arrowhead Stadium, Kansas City',       'upcoming'),
(88,  'round_of_32', '2D', '2G',        '2026-07-03 02:00:00+00', 'AT&T Stadium, Dallas',                 'upcoming'),

-- ── OCTAVOS DE FINAL (8 partidos) ──────────────────────────
-- Ganadores: M73 vs M76, M74 vs M75, etc.
-- Los slots se resuelven según avance del bracket
(89,  'round_of_16', 'W73', 'W76',      '2026-07-05 23:00:00+00', 'MetLife Stadium, New Jersey',          'upcoming'),
(90,  'round_of_16', 'W74', 'W75',      '2026-07-05 20:00:00+00', 'AT&T Stadium, Dallas',                 'upcoming'),
(91,  'round_of_16', 'W77', 'W80',      '2026-07-06 23:00:00+00', 'SoFi Stadium, Los Ángeles',            'upcoming'),
(92,  'round_of_16', 'W78', 'W79',      '2026-07-06 20:00:00+00', 'Hard Rock Stadium, Miami',             'upcoming'),
(93,  'round_of_16', 'W83', 'W88',      '2026-07-07 23:00:00+00', 'BC Place, Vancouver',                  'upcoming'),
(94,  'round_of_16', 'W84', 'W87',      '2026-07-07 20:00:00+00', 'Levi''s Stadium, San Francisco',       'upcoming'),
(95,  'round_of_16', 'W81', 'W82',      '2026-07-08 23:00:00+00', 'Mercedes-Benz Stadium, Atlanta',       'upcoming'),
(96,  'round_of_16', 'W85', 'W86',      '2026-07-08 20:00:00+00', 'Lumen Field, Seattle',                 'upcoming'),

-- ── CUARTOS DE FINAL (4 partidos) ──────────────────────────
(97,  'quarterfinal', 'W89', 'W90',     '2026-07-10 23:00:00+00', 'MetLife Stadium, New Jersey',          'upcoming'),
(98,  'quarterfinal', 'W91', 'W92',     '2026-07-10 20:00:00+00', 'AT&T Stadium, Dallas',                 'upcoming'),
(99,  'quarterfinal', 'W93', 'W94',     '2026-07-11 23:00:00+00', 'SoFi Stadium, Los Ángeles',            'upcoming'),
(100, 'quarterfinal', 'W95', 'W96',     '2026-07-11 20:00:00+00', 'Hard Rock Stadium, Miami',             'upcoming'),

-- ── SEMIFINALES (2 partidos) ────────────────────────────────
(101, 'semifinal',   'W97', 'W98',      '2026-07-14 23:00:00+00', 'AT&T Stadium, Dallas',                 'upcoming'),
(102, 'semifinal',   'W99', 'W100',     '2026-07-15 23:00:00+00', 'Mercedes-Benz Stadium, Atlanta',       'upcoming'),

-- ── TERCER LUGAR (1 partido) ────────────────────────────────
(103, 'third_place', 'L101', 'L102',    '2026-07-18 23:00:00+00', 'Hard Rock Stadium, Miami',             'upcoming'),

-- ── FINAL (1 partido) ───────────────────────────────────────
(104, 'final',       'W101', 'W102',    '2026-07-19 23:00:00+00', 'MetLife Stadium, New Jersey',          'upcoming');
