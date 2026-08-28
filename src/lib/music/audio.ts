// Self-contained Web Audio helpers: a lookahead-scheduled metronome whose clock
// also drives the visual playhead (so click and playhead stay locked), plus
// oscillator playback for demonstrations and reference/tuner tones.
import { midiToFreq } from './staff';
import type { SeatedNote } from './transposition';

let ctx: AudioContext | null = null;

/** Lazily create + resume the shared AudioContext (call from a user gesture). */
export async function getAudioCtx(): Promise<AudioContext> {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') await ctx.resume();
  return ctx;
}

/** Schedule one oscillator tone. `when` is an absolute ctx time. */
function scheduleTone(
  ac: AudioContext, freq: number, when: number, dur: number,
  type: OscillatorType = 'sine', peak = 0.22,
) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(peak, when + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.start(when);
  osc.stop(when + dur + 0.02);
}

/** A short metronome click; accented (louder/higher) on downbeats. */
function scheduleClick(ac: AudioContext, when: number, accent: boolean) {
  scheduleTone(ac, accent ? 1760 : 1245, when, 0.05, 'square', accent ? 0.3 : 0.16);
}

export interface MetronomeOptions {
  bpm: number;
  beatsPerBar: number;
  countInBeats?: number;   // audible count-in before beat 0 (default 0)
  totalBeats?: number;     // stop clicking after this many beats past 0 (default Infinity)
  silent?: boolean;        // run the clock with no clicks (the caller wants timing only)
  onDone?: () => void;
}

/**
 * A lookahead metronome. `beatsElapsed()` reports the current position in beats
 * relative to beat 0 (negative during the count-in) so a component can drive a
 * playhead off the same clock the clicks use.
 */
export class Metronome {
  private ac: AudioContext;
  private bpm = 72;
  private beatsPerBar = 4;
  private countIn = 0;
  private totalBeats = Infinity;
  private silent = false;
  private startTime = 0;           // ctx time of beat 0
  private nextBeat = 0;            // next beat index to schedule (starts at -countIn)
  private timer: ReturnType<typeof setInterval> | null = null;
  private done = false;
  private onDone?: () => void;
  running = false;

  constructor(ac: AudioContext) { this.ac = ac; }

  start(opts: MetronomeOptions) {
    this.bpm = opts.bpm;
    this.beatsPerBar = opts.beatsPerBar;
    this.countIn = opts.countInBeats ?? 0;
    this.totalBeats = opts.totalBeats ?? Infinity;
    this.silent = opts.silent ?? false;
    this.onDone = opts.onDone;
    this.done = false;
    this.running = true;
    const spb = 60 / this.bpm;
    this.startTime = this.ac.currentTime + 0.12 + this.countIn * spb;
    this.nextBeat = -this.countIn;
    this.timer = setInterval(() => this.schedule(), 25);
    this.schedule();
  }

  private schedule() {
    const spb = 60 / this.bpm;
    const aheadUntil = this.ac.currentTime + 0.12;
    while (this.nextBeat < this.totalBeats && this.startTime + this.nextBeat * spb < aheadUntil) {
      const t = this.startTime + this.nextBeat * spb;
      const isDownbeat = ((this.nextBeat % this.beatsPerBar) + this.beatsPerBar) % this.beatsPerBar === 0;
      if (!this.silent) scheduleClick(this.ac, Math.max(this.ac.currentTime, t), isDownbeat);
      this.nextBeat++;
    }
    if (this.nextBeat >= this.totalBeats && !this.done) {
      // Stop clicking once the last beat is scheduled; fire onDone after it sounds.
      this.done = true;
      const endAt = this.startTime + this.totalBeats * spb;
      const wait = Math.max(0, (endAt - this.ac.currentTime) * 1000);
      setTimeout(() => { this.onDone?.(); }, wait);
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
    }
  }

  /** Position in beats relative to beat 0 (negative during count-in). */
  beatsElapsed(): number {
    return ((this.ac.currentTime - this.startTime) * this.bpm) / 60;
  }

  stop() {
    this.running = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }
}

/** A short plucked blip — immediate confirmation that a rhythm-game note landed. */
export async function playNoteBlip(midi: number, dur = 0.24) {
  const ac = await getAudioCtx();
  scheduleTone(ac, midiToFreq(midi), ac.currentTime, dur, 'triangle', 0.2);
}

/** Play a reference/tuner tone for a concert MIDI note. */
export async function playReferenceTone(midi: number, dur = 1.2) {
  const ac = await getAudioCtx();
  scheduleTone(ac, midiToFreq(midi), ac.currentTime, dur, 'sine', 0.28);
}

export interface ExcerptPlayback { stop: () => void; }

/**
 * Demonstration playback: sound a seated excerpt's notes (concert pitch) at the
 * given tempo. Returns a handle; `stop()` cancels the scheduled AudioContext by
 * muting future notes (already-scheduled oscillators are short and self-stop).
 */
export async function playExcerpt(
  notes: SeatedNote[], bpm: number, opts: { onDone?: () => void; withClick?: boolean; beatsPerBar?: number } = {},
): Promise<ExcerptPlayback> {
  const ac = await getAudioCtx();
  const spb = 60 / bpm;
  const t0 = ac.currentTime + 0.15;
  let cancelled = false;

  for (const n of notes) {
    if (n.rest || n.soundingMidi === null) continue;
    const when = t0 + n.startBeat * spb;
    const dur = Math.max(0.12, n.durationBeats * spb * 0.92);
    scheduleTone(ac, midiToFreq(n.soundingMidi), when, dur, 'triangle', 0.24);
  }

  const totalBeats = notes.reduce((m, n) => Math.max(m, n.startBeat + n.durationBeats), 0);
  if (opts.withClick) {
    const bpb = opts.beatsPerBar ?? 4;
    for (let b = 0; b < totalBeats; b++) {
      scheduleClick(ac, t0 + b * spb, b % bpb === 0);
    }
  }
  const endMs = (totalBeats * spb + 0.2) * 1000;
  const timer = setTimeout(() => { if (!cancelled) opts.onDone?.(); }, endMs);

  return { stop: () => { cancelled = true; clearTimeout(timer); } };
}
