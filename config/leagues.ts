// IDs Oficiais da API-Football (v3)
export const TARGET_LEAGUES = [
  // --- 🌍 COMPETIÇÕES INTERNACIONAIS ---
  2,    // UEFA Champions League
  3,    // UEFA Europa League
  13,   // Copa Libertadores
  11,   // Copa Sudamericana
  1,    // Copa do Mundo (quando houver)

  // --- 🇪🇺 EUROPA (Principais) ---
  39,   // Premier League (Inglaterra)
  140,  // La Liga (Espanha)
  135,  // Serie A (Itália)
  78,   // Bundesliga (Alemanha)
  61,   // Ligue 1 (França)
  88,   // Eredivisie (Holanda)
  94,   // Primeira Liga (Portugal)

  // --- 🇧🇷 AMÉRICA DO SUL ---
  71,   // Brasileirão Série A
  72,   // Brasileirão Série B
  128,  // Liga Profissional (Argentina)
  
  // --- 🇺🇸 AMÉRICA DO NORTE ---
  253,  // MLS (Major League Soccer - EUA)
  262,  // Liga MX (México)

  // --- 🇸🇦 ORIENTE MÉDIO & ÁSIA ---
  307,  // Saudi Pro League (Arábia Saudita)
  98,   // J1 League (Japão)
  292,  // K League 1 (Coreia do Sul)
];

// Prioridade de exibição por liga (menor número = maior prioridade)
// Destaque: Champions, Premier League, Brasileirão, Libertadores; demais vêm depois
export const leaguePriority: Record<number, number> = {
  // Top destaque
  2: 1,   // Champions League
  39: 2,  // Premier League
  71: 3,  // Brasileirão Série A
  13: 4,  // Copa Libertadores
  1: 5,   // Copa do Mundo (quando houver)

  // Europa (principais)
  140: 10, // La Liga
  135: 11, // Serie A
  78: 12,  // Bundesliga
  61: 13,  // Ligue 1
  94: 14,  // Primeira Liga
  88: 15,  // Eredivisie

  // América do Sul / Norte
  3: 20,   // Europa League
  11: 21,  // Sudamericana
  72: 30,  // Brasileirão Série B
  128: 31, // Liga Profissional Argentina
  253: 40, // MLS
  262: 41, // Liga MX

  // Oriente Médio & Ásia (aparecem depois)
  307: 60, // Saudi Pro League
  98: 61,  // J1 League
  292: 62, // K League 1
};