-- ============================================================
-- QUINIELA WC 2026 — 48 PARTIDOS FASE DE GRUPOS
-- Grupos según datos oficiales FIFA WC 2026
-- Fechas aproximadas (ajustar cuando FIFA confirme horarios)
-- ============================================================

INSERT INTO public.matches (match_number, phase, group_name, home_team, home_team_flag, away_team, away_team_flag, match_datetime, venue, status) VALUES

-- GRUPO A: México, Sudáfrica, Corea del Sur, República Checa
(1,  'group','A','México',           '🇲🇽','Sudáfrica',       '🇿🇦','2026-06-11 20:00:00+00','Estadio Azteca, Ciudad de México','upcoming'),
(2,  'group','A','Corea del Sur',    '🇰🇷','República Checa', '🇨🇿','2026-06-11 23:00:00+00','AT&T Stadium, Dallas','upcoming'),
(3,  'group','A','México',           '🇲🇽','Corea del Sur',   '🇰🇷','2026-06-15 20:00:00+00','Estadio Azteca, Ciudad de México','upcoming'),
(4,  'group','A','Sudáfrica',        '🇿🇦','República Checa', '🇨🇿','2026-06-15 23:00:00+00','MetLife Stadium, New Jersey','upcoming'),
(5,  'group','A','México',           '🇲🇽','República Checa', '🇨🇿','2026-06-19 23:00:00+00','SoFi Stadium, Los Ángeles','upcoming'),
(6,  'group','A','Sudáfrica',        '🇿🇦','Corea del Sur',   '🇰🇷','2026-06-19 23:00:00+00','Levi\'s Stadium, San Francisco','upcoming'),

-- GRUPO B: Canadá, Bosnia y Herzegovina, Catar, Suiza
(7,  'group','B','Canadá',           '🇨🇦','Bosnia y Herz.',  '🇧🇦','2026-06-12 00:00:00+00','BC Place, Vancouver','upcoming'),
(8,  'group','B','Catar',            '🇶🇦','Suiza',           '🇨🇭','2026-06-12 20:00:00+00','Arrowhead Stadium, Kansas City','upcoming'),
(9,  'group','B','Canadá',           '🇨🇦','Catar',           '🇶🇦','2026-06-16 20:00:00+00','BC Place, Vancouver','upcoming'),
(10, 'group','B','Bosnia y Herz.',   '🇧🇦','Suiza',           '🇨🇭','2026-06-16 23:00:00+00','Estadio Akron, Guadalajara','upcoming'),
(11, 'group','B','Canadá',           '🇨🇦','Suiza',           '🇨🇭','2026-06-20 23:00:00+00','BC Place, Vancouver','upcoming'),
(12, 'group','B','Bosnia y Herz.',   '🇧🇦','Catar',           '🇶🇦','2026-06-20 23:00:00+00','MetLife Stadium, New Jersey','upcoming'),

-- GRUPO C: Brasil, Marruecos, Haití, Escocia
(13, 'group','C','Brasil',           '🇧🇷','Marruecos',       '🇲🇦','2026-06-12 23:00:00+00','Hard Rock Stadium, Miami','upcoming'),
(14, 'group','C','Haití',            '🇭🇹','Escocia',         '🏴󠁧󠁢󠁳󠁣󠁴󠁿','2026-06-13 02:00:00+00','AT&T Stadium, Dallas','upcoming'),
(15, 'group','C','Brasil',           '🇧🇷','Haití',           '🇭🇹','2026-06-17 20:00:00+00','Hard Rock Stadium, Miami','upcoming'),
(16, 'group','C','Marruecos',        '🇲🇦','Escocia',         '🏴󠁧󠁢󠁳󠁣󠁴󠁿','2026-06-17 23:00:00+00','SoFi Stadium, Los Ángeles','upcoming'),
(17, 'group','C','Brasil',           '🇧🇷','Escocia',         '🏴󠁧󠁢󠁳󠁣󠁴󠁿','2026-06-21 23:00:00+00','MetLife Stadium, New Jersey','upcoming'),
(18, 'group','C','Marruecos',        '🇲🇦','Haití',           '🇭🇹','2026-06-21 23:00:00+00','Estadio Azteca, Ciudad de México','upcoming'),

-- GRUPO D: Estados Unidos, Paraguay, Australia, Turquía
(19, 'group','D','Estados Unidos',   '🇺🇸','Paraguay',        '🇵🇾','2026-06-13 20:00:00+00','MetLife Stadium, New Jersey','upcoming'),
(20, 'group','D','Australia',        '🇦🇺','Turquía',         '🇹🇷','2026-06-13 23:00:00+00','SoFi Stadium, Los Ángeles','upcoming'),
(21, 'group','D','Estados Unidos',   '🇺🇸','Australia',       '🇦🇺','2026-06-17 02:00:00+00','MetLife Stadium, New Jersey','upcoming'),
(22, 'group','D','Paraguay',         '🇵🇾','Turquía',         '🇹🇷','2026-06-18 20:00:00+00','AT&T Stadium, Dallas','upcoming'),
(23, 'group','D','Estados Unidos',   '🇺🇸','Turquía',         '🇹🇷','2026-06-22 23:00:00+00','Levi\'s Stadium, San Francisco','upcoming'),
(24, 'group','D','Paraguay',         '🇵🇾','Australia',       '🇦🇺','2026-06-22 23:00:00+00','Arrowhead Stadium, Kansas City','upcoming'),

-- GRUPO E: Alemania, Curazao, Costa de Marfil, Ecuador
(25, 'group','E','Alemania',         '🇩🇪','Curazao',         '🇨🇼','2026-06-14 20:00:00+00','MetLife Stadium, New Jersey','upcoming'),
(26, 'group','E','Costa de Marfil',  '🇨🇮','Ecuador',         '🇪🇨','2026-06-14 23:00:00+00','AT&T Stadium, Dallas','upcoming'),
(27, 'group','E','Alemania',         '🇩🇪','Costa de Marfil', '🇨🇮','2026-06-18 23:00:00+00','Hard Rock Stadium, Miami','upcoming'),
(28, 'group','E','Curazao',          '🇨🇼','Ecuador',         '🇪🇨','2026-06-19 02:00:00+00','SoFi Stadium, Los Ángeles','upcoming'),
(29, 'group','E','Alemania',         '🇩🇪','Ecuador',         '🇪🇨','2026-06-23 23:00:00+00','AT&T Stadium, Dallas','upcoming'),
(30, 'group','E','Curazao',          '🇨🇼','Costa de Marfil', '🇨🇮','2026-06-23 23:00:00+00','BC Place, Vancouver','upcoming'),

-- GRUPO F: Países Bajos, Japón, Suecia, Túnez
(31, 'group','F','Países Bajos',     '🇳🇱','Japón',           '🇯🇵','2026-06-14 02:00:00+00','BC Place, Vancouver','upcoming'),
(32, 'group','F','Suecia',           '🇸🇪','Túnez',           '🇹🇳','2026-06-15 02:00:00+00','Levi\'s Stadium, San Francisco','upcoming'),
(33, 'group','F','Países Bajos',     '🇳🇱','Suecia',          '🇸🇪','2026-06-19 20:00:00+00','Hard Rock Stadium, Miami','upcoming'),
(34, 'group','F','Japón',            '🇯🇵','Túnez',           '🇹🇳','2026-06-20 02:00:00+00','Arrowhead Stadium, Kansas City','upcoming'),
(35, 'group','F','Países Bajos',     '🇳🇱','Túnez',           '🇹🇳','2026-06-24 23:00:00+00','Estadio Azteca, Ciudad de México','upcoming'),
(36, 'group','F','Japón',            '🇯🇵','Suecia',          '🇸🇪','2026-06-24 23:00:00+00','MetLife Stadium, New Jersey','upcoming'),

-- GRUPO G: Bélgica, Egipto, Irán, Nueva Zelanda
(37, 'group','G','Bélgica',          '🇧🇪','Egipto',          '🇪🇬','2026-06-15 02:00:00+00','Estadio Akron, Guadalajara','upcoming'),
(38, 'group','G','Irán',             '🇮🇷','Nueva Zelanda',   '🇳🇿','2026-06-16 02:00:00+00','BC Place, Vancouver','upcoming'),
(39, 'group','G','Bélgica',          '🇧🇪','Irán',            '🇮🇷','2026-06-20 20:00:00+00','AT&T Stadium, Dallas','upcoming'),
(40, 'group','G','Egipto',           '🇪🇬','Nueva Zelanda',   '🇳🇿','2026-06-21 02:00:00+00','Hard Rock Stadium, Miami','upcoming'),
(41, 'group','G','Bélgica',          '🇧🇪','Nueva Zelanda',   '🇳🇿','2026-06-25 23:00:00+00','SoFi Stadium, Los Ángeles','upcoming'),
(42, 'group','G','Egipto',           '🇪🇬','Irán',            '🇮🇷','2026-06-25 23:00:00+00','Levi\'s Stadium, San Francisco','upcoming'),

-- GRUPO H: España, Cabo Verde, Arabia Saudita, Uruguay
(43, 'group','H','España',           '🇪🇸','Cabo Verde',      '🇨🇻','2026-06-16 02:00:00+00','Hard Rock Stadium, Miami','upcoming'),
(44, 'group','H','Arabia Saudita',   '🇸🇦','Uruguay',         '🇺🇾','2026-06-17 02:00:00+00','AT&T Stadium, Dallas','upcoming'),
(45, 'group','H','España',           '🇪🇸','Arabia Saudita',  '🇸🇦','2026-06-21 20:00:00+00','MetLife Stadium, New Jersey','upcoming'),
(46, 'group','H','Cabo Verde',       '🇨🇻','Uruguay',         '🇺🇾','2026-06-22 02:00:00+00','Estadio Azteca, Ciudad de México','upcoming'),
(47, 'group','H','España',           '🇪🇸','Uruguay',         '🇺🇾','2026-06-26 23:00:00+00','Hard Rock Stadium, Miami','upcoming'),
(48, 'group','H','Cabo Verde',       '🇨🇻','Arabia Saudita',  '🇸🇦','2026-06-26 23:00:00+00','Arrowhead Stadium, Kansas City','upcoming');
