import type { AllyId } from '../types/game';

// Retro character portraits in public/portraits/. Originally generated from
// the concept lineup (docs/assets/maestros_reference.png) by
// scripts/make_portraits.py; newer per-character art drops go through
// scripts/make_character_portraits.py (docs/assets/characters/) and overwrite
// these files as they arrive. Rendering falls back to the instrument emoji
// whenever a file is missing, so shipping without (or before) the assets is
// safe — and higher-quality art can replace the files with no code changes.
export const MAESTRO_PORTRAITS: Partial<Record<AllyId, string>> = {
  syrinx: '/portraits/syrinx.png',         // Flaura — flute
  salpinx: '/portraits/salpinx.png',       // Cornelius — trumpet
  chalumeau: '/portraits/chalumeau.png',   // Clarence — clarinet
  vela: '/portraits/vela.png',             // Adolpha — alto sax
  posaune: '/portraits/posaune.png',       // Sackbut — trombone
  cantora: '/portraits/cantora.png',       // Torbult — euphonium/tuba
  waldhorn: '/portraits/waldhorn.png',     // Waldhorn — french horn
  hautbois: '/portraits/hautbois.png',     // Hautbois — oboe
  bassanello: '/portraits/bassanello.png', // Fagotto — bassoon
  percival: '/portraits/percival.png',     // Paige — percussion
};

// Student classmate portraits (lib/students.ts ids), same pipeline and same
// emoji fallback — students without art yet simply keep their instrument tile.
export const STUDENT_PORTRAITS: Partial<Record<string, string>> = {
  piper: '/portraits/piper.png',           // Piper — flute
  reed: '/portraits/reed.png',             // Reed — bassoon
  tommy: '/portraits/tommy.png',           // Tommy — trombone
  benny: '/portraits/benny.png',           // Benny — clarinet
  miles: '/portraits/miles.png',           // Miles — trumpet
  gene: '/portraits/gene.png',             // Gene — percussion
  otto: '/portraits/otto.png',             // Otto — tuba
  zoot: '/portraits/zoot.png',             // Zoot — alto sax
  obie: '/portraits/obie.png',             // Obie — oboe
  cora: '/portraits/cora.png',             // Cora — french horn
};

// Enemy/boss portraits (lib/enemies.ts ids). Same drop-in-and-fall-back-to-emoji
// contract: register a named boss here and drop public/portraits/<id>.png; until
// the file exists, battle keeps the enemy's emoji. Common mobs stay emoji-only.
export const ENEMY_PORTRAITS: Record<string, string> = {
  vexus: '/portraits/vexus.png',                         // Vexus, the Conductor (finale)
  lieutenant_contra: '/portraits/lieutenant_contra.png', // Lieutenant Contra (Z7)
  lieutenant_kije: '/portraits/lieutenant_kije.png',     // Lieutenant Kije (Z12)
  general_grave: '/portraits/general_grave.png',         // General Grave (Z12)
  commander_mesto: '/portraits/commander_mesto.png',     // Commander Coren Glais (Z12)
  ostinato_usher: '/portraits/ostinato_usher.png',       // Ostinato, the Usher (Z12)
  piano_commander: '/portraits/piano_commander.png',     // Ebony (Z11)
  forte_commander: '/portraits/forte_commander.png',     // Ivory (Z11)
  // Instrument-inspired roster (zones 5–12)
  pixielo: '/portraits/pixielo.png',           // Z5
  fiferfly: '/portraits/fiferfly.png',             // Z5
  ghoulgenspiel: '/portraits/ghoulgenspiel.png',           // Z7
  bagpipe_banshee: '/portraits/bagpipe_banshee.png',       // Z8
  flugel_fiend: '/portraits/flugel_fiend.png',             // Z9
  therrormin: '/portraits/therrormin.png',       // Z10
  vibrawraith: '/portraits/vibrawraith.png',             // Z10
  chastanet: '/portraits/chastanet.png', // Z11
  crotentacle: '/portraits/crotentacle.png',         // Z11
  timptanic: '/portraits/timptanic.png',           // Z12
  gongolem: '/portraits/gongolem.png',           // Z12
  // Extra roster fill (1–2 per area)
  rest_wraith: '/portraits/rest_wraith.png',               // Z1
  frat: '/portraits/frat.png',           // Z1
  stage_phantom: '/portraits/stage_phantom.png',   // Z4
  fermoctopus: '/portraits/fermoctopus.png',       // Z5
  saxerpent: '/portraits/saxerpent.png',     // Z6
  glissanghost: '/portraits/glissanghost.png',                 // Z7
  stingcatto: '/portraits/stingcatto.png',     // Z9
  dissonaut: '/portraits/dissonaut.png',                   // Z11
  tacetus: '/portraits/tacetus.png',               // Z12
};
