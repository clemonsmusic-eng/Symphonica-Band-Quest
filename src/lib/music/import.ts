import type { Excerpt, ScoreNote, ExcerptChallengeType } from './types';

export interface ParsedScore {
  title?: string;
  composer?: string;
  bpm: number;
  timeSig: [number, number];
  keySig: number;         // concert
  notes: ScoreNote[];     // concert pitch, sorted by startBeat
}

const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// ── MusicXML ─────────────────────────────────────────────────────────────────
/** Parse MusicXML text → concert-pitch score (first part, voice 1, top of chords). */
export function parseMusicXML(text: string): ParsedScore {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('Invalid MusicXML');
  const q = (el: Element | Document, sel: string) => el.querySelector(sel);
  const num = (el: Element | null | undefined, def = 0) => (el ? parseFloat(el.textContent || '') || def : def);

  const title = doc.querySelector('work-title')?.textContent
    || doc.querySelector('movement-title')?.textContent || undefined;
  const composer = doc.querySelector('creator[type="composer"]')?.textContent || undefined;

  const part = doc.querySelector('part');
  if (!part) throw new Error('No part in MusicXML');

  let divisions = num(q(part, 'divisions'), 1) || 1;
  const writtenFifths = num(q(part, 'key fifths'), 0);
  const beats = num(q(part, 'time beats'), 4) || 4;
  const beatType = num(q(part, 'time beat-type'), 4) || 4;

  // tempo: <sound tempo> or <per-minute>
  const soundTempo = part.querySelector('sound[tempo]')?.getAttribute('tempo');
  const perMinute = doc.querySelector('per-minute')?.textContent;
  const bpm = Math.round(parseFloat(soundTempo || perMinute || '96')) || 96;

  // transpose (written → sounding)
  const tr = part.querySelector('transpose');
  const trChromatic = tr ? num(q(tr, 'chromatic'), 0) : 0;
  const trOctave = tr ? num(q(tr, 'octave-change'), 0) : 0;
  let trDiatonic = tr && tr.querySelector('diatonic') ? num(q(tr, 'diatonic'), 0) : null;
  if (tr && trDiatonic === null) trDiatonic = Math.sign(trChromatic) * Math.round(Math.abs(trChromatic) / 2);

  // concert key: remove the concert→written fifths shift
  const ctwChrom = -trChromatic, ctwDia = -(trDiatonic ?? 0);
  const fifthsShift = 7 * ctwChrom - 12 * ctwDia;
  const keySig = writtenFifths - fifthsShift;

  const notes: ScoreNote[] = [];
  let cursor = 0;
  part.querySelectorAll('measure').forEach((measure) => {
    const d = q(measure, 'divisions'); if (d) divisions = num(d, divisions) || divisions;
    measure.querySelectorAll(':scope > note').forEach((note) => {
      const voice = note.querySelector('voice')?.textContent;
      if (voice && voice !== '1') return;
      const beatsDur = num(q(note, 'duration'), 0) / divisions; // duration is in quarter-note divisions
      const isChord = !!note.querySelector('chord');
      const isRest = !!note.querySelector('rest');
      if (isChord) return; // keep only the first note of a chord
      if (isRest) {
        notes.push({ midi: null, startBeat: cursor, durationBeats: beatsDur });
        cursor += beatsDur;
        return;
      }
      const step = note.querySelector('pitch step')?.textContent || 'C';
      const alter = num(note.querySelector('pitch alter'), 0);
      const octave = num(note.querySelector('pitch octave'), 4);
      const writtenMidi = (octave + 1) * 12 + LETTER_PC[step] + alter;
      const concertMidi = writtenMidi + trChromatic + 12 * trOctave;
      notes.push({ midi: concertMidi, startBeat: cursor, durationBeats: beatsDur });
      cursor += beatsDur;
    });
  });

  return { title, composer, bpm, timeSig: [beats, beatType], keySig, notes };
}

// ── Standard MIDI File ─────────────────────────────────────────────────────────
/** Parse a .mid ArrayBuffer → concert-pitch score (monophonic top line). */
export function parseMidi(buf: ArrayBuffer): ParsedScore {
  const dv = new DataView(buf);
  let p = 0;
  const str = (n: number) => { let s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(dv.getUint8(p++)); return s; };
  const u32 = () => { const v = dv.getUint32(p); p += 4; return v; };
  const u16 = () => { const v = dv.getUint16(p); p += 2; return v; };

  if (str(4) !== 'MThd') throw new Error('Not a MIDI file');
  u32(); u16(); const ntrks = u16(); const division = u16();
  const tpq = division & 0x8000 ? 480 : division; // ignore SMPTE, assume 480 fallback

  interface Ev { tick: number; type: 'on' | 'off'; midi: number; }
  const evs: Ev[] = [];
  let usPerQuarter = 500000; // 120 bpm default
  let timeSig: [number, number] = [4, 4];
  let keySig = 0;

  for (let t = 0; t < ntrks; t++) {
    if (str(4) !== 'MTrk') break;
    const len = u32(); const end = p + len;
    let tick = 0, status = 0;
    while (p < end) {
      // variable-length delta time
      let delta = 0, b: number;
      do { b = dv.getUint8(p++); delta = (delta << 7) | (b & 0x7f); } while (b & 0x80);
      tick += delta;
      let ev = dv.getUint8(p);
      if (ev & 0x80) { status = ev; p++; } else { ev = status; } // running status
      const hi = ev & 0xf0;
      if (ev === 0xff) {
        const meta = dv.getUint8(p++); let mlen = 0, mb: number;
        do { mb = dv.getUint8(p++); mlen = (mlen << 7) | (mb & 0x7f); } while (mb & 0x80);
        if (meta === 0x51 && mlen === 3) usPerQuarter = (dv.getUint8(p) << 16) | (dv.getUint8(p + 1) << 8) | dv.getUint8(p + 2);
        if (meta === 0x58 && mlen >= 2) timeSig = [dv.getUint8(p), Math.pow(2, dv.getUint8(p + 1))];
        if (meta === 0x59 && mlen >= 1) { const sf = dv.getInt8(p); keySig = sf; }
        p += mlen;
      } else if (ev === 0xf0 || ev === 0xf7) {
        let slen = 0, sb: number; do { sb = dv.getUint8(p++); slen = (slen << 7) | (sb & 0x7f); } while (sb & 0x80); p += slen;
      } else if (hi === 0x90 || hi === 0x80) {
        const note = dv.getUint8(p++); const vel = dv.getUint8(p++);
        evs.push({ tick, type: hi === 0x90 && vel > 0 ? 'on' : 'off', midi: note });
      } else if (hi === 0xc0 || hi === 0xd0) { p += 1; }
      else { p += 2; }
    }
    p = end;
  }

  // Monophonic reduction: order note-ons; each note ends at the next note-on/off.
  evs.sort((a, b) => a.tick - b.tick || (a.type === 'off' ? -1 : 1));
  const ons = evs.filter((e) => e.type === 'on');
  const notes: ScoreNote[] = [];
  for (let i = 0; i < ons.length; i++) {
    const on = ons[i];
    const offTick = evs.find((e) => e.tick > on.tick && (e.type === 'off' && e.midi === on.midi || e.type === 'on'))?.tick
      ?? on.tick + tpq;
    const startBeat = on.tick / tpq;
    const durationBeats = Math.max(0.125, (offTick - on.tick) / tpq);
    // skip a simultaneous stacked note (chord): same tick as previous
    if (notes.length && Math.abs(startBeat - notes[notes.length - 1].startBeat) < 1e-6) continue;
    notes.push({ midi: on.midi, startBeat, durationBeats });
  }
  const bpm = Math.round(60000000 / usPerQuarter);
  return { bpm, timeSig, keySig, notes };
}

/** Wrap a parsed score into a full Excerpt. */
export function toExcerpt(
  parsed: ParsedScore, meta: { id: string; title: string; challengeType: ExcerptChallengeType; grade?: number; source: Excerpt['source'] },
): Excerpt {
  return {
    id: meta.id,
    title: meta.title || parsed.title || 'Imported',
    composer: parsed.composer,
    challengeType: meta.challengeType,
    grade: meta.grade,
    bpm: parsed.bpm,
    timeSig: parsed.timeSig,
    keySig: parsed.keySig,
    notes: parsed.notes,
    source: meta.source,
  };
}
