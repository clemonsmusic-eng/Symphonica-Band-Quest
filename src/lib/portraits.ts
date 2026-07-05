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
  commander_mesto: '/portraits/commander_mesto.png',     // Commander Mesto (Z12)
  ostinato_usher: '/portraits/ostinato_usher.png',       // Ostinato, the Usher (Z12)
  piano_commander: '/portraits/piano_commander.png',     // Piano (Z11)
  forte_commander: '/portraits/forte_commander.png',     // Forte (Z11)
  // Instrument-inspired roster (zones 5–12)
  piccolo_pixie: '/portraits/piccolo_pixie.png',           // Z5
  fife_flitter: '/portraits/fife_flitter.png',             // Z5
  ocarina_ogre: '/portraits/ocarina_ogre.png',             // Z6
  sistrum_shade: '/portraits/sistrum_shade.png',           // Z6
  saxhorn_stalker: '/portraits/saxhorn_stalker.png',       // Z7
  glocken_golem: '/portraits/glocken_golem.png',           // Z7
  bagpipe_banshee: '/portraits/bagpipe_banshee.png',       // Z8
  marimba_marauder: '/portraits/marimba_marauder.png',     // Z8
  flugel_fiend: '/portraits/flugel_fiend.png',             // Z9
  concertina_crawler: '/portraits/concertina_crawler.png', // Z9
  theremin_terror: '/portraits/theremin_terror.png',       // Z10
  vibra_wraith: '/portraits/vibra_wraith.png',             // Z10
  castanet_chatterer: '/portraits/castanet_chatterer.png', // Z11
  crotale_cretin: '/portraits/crotale_cretin.png',         // Z11
  timpani_titan: '/portraits/timpani_titan.png',           // Z12
  gong_guardian: '/portraits/gong_guardian.png',           // Z12
  // Extra roster fill (1–2 per area)
  rest_wraith: '/portraits/rest_wraith.png',               // Z1
  dissonant_din: '/portraits/dissonant_din.png',           // Z1
  metronome_menace: '/portraits/metronome_menace.png',     // Z2
  cadence_cur: '/portraits/cadence_cur.png',               // Z3
  stagefright_shade: '/portraits/stagefright_shade.png',   // Z4
  fermata_fiend: '/portraits/fermata_fiend.png',           // Z5
  semitone_serpent: '/portraits/semitone_serpent.png',     // Z6
  glissghast: '/portraits/glissghast.png',                 // Z7
  reprise_revenant: '/portraits/reprise_revenant.png',     // Z8
  staccato_stinger: '/portraits/staccato_stinger.png',     // Z9
  downbeat_drowner: '/portraits/downbeat_drowner.png',     // Z10
  dissonaut: '/portraits/dissonaut.png',                   // Z11
  coda_colossus: '/portraits/coda_colossus.png',           // Z12
  tacet_titan: '/portraits/tacet_titan.png',               // Z12
};
