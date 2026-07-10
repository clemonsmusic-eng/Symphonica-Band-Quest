import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InstrumentId } from '../types/game';
import { INSTRUMENTS } from '../lib/instruments';
import type { Excerpt, ExcerptChallengeType, ScoreNote } from '../lib/music/types';
import { seatExcerpt } from '../lib/music/transposition';
import { pitchStringToMidi } from '../lib/music/staff';
import { playExcerpt } from '../lib/music/audio';
import { saveCustomExcerpt } from '../lib/music/customExcerpts';
import { parseMusicXML, parseMidi, type ParsedScore } from '../lib/music/import';
import PerformanceStaff from '../components/music/PerformanceStaff';

const DURS: [string, number][] = [['whole', 4], ['dotted ½', 3], ['half', 2], ['dotted ♩', 1.5], ['quarter', 1], ['eighth', 0.5]];
const TYPES: ExcerptChallengeType[] = ['technique_scale', 'prepared_performance', 'sight_reading', 'rhythm_performance'];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `custom_${Date.now()}`;

export default function ComposerPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('My Selection');
  const [composer, setComposer] = useState('');
  const [challengeType, setChallengeType] = useState<ExcerptChallengeType>('prepared_performance');
  const [grade, setGrade] = useState(1);
  const [bpm, setBpm] = useState(96);
  const [keySig, setKeySig] = useState(0);
  const [timeNum, setTimeNum] = useState(4);
  const [timeDen, setTimeDen] = useState(4);
  const [rows, setRows] = useState<{ midi: number | null; dur: number }[]>([]);
  const [pitchInput, setPitchInput] = useState('Bb4');
  const [dur, setDur] = useState(1);
  const [previewInst, setPreviewInst] = useState<InstrumentId>('flute');
  const [pdfRef, setPdfRef] = useState<string | undefined>();
  const [msg, setMsg] = useState<string | null>(null);

  const excerpt: Excerpt = useMemo(() => {
    let t = 0;
    const notes: ScoreNote[] = rows.map((r) => { const n = { midi: r.midi, startBeat: t, durationBeats: r.dur }; t += r.dur; return n; });
    return {
      id: slug(title), title: title || 'Untitled', composer: composer || undefined,
      challengeType, grade, bpm, timeSig: [timeNum, timeDen], keySig, notes, pdfRef, source: 'pdf_assisted',
    };
  }, [rows, title, composer, challengeType, grade, bpm, timeNum, timeDen, keySig, pdfRef]);

  const seated = useMemo(() => seatExcerpt(excerpt, previewInst), [excerpt, previewInst]);
  const totalBeats = rows.reduce((s, r) => s + r.dur, 0);

  function addNote(rest: boolean) {
    if (rest) { setRows((r) => [...r, { midi: null, dur }]); return; }
    const midi = pitchStringToMidi(pitchInput);
    if (midi === null) { setMsg('Enter a pitch like "Bb4" or "F#3".'); return; }
    setRows((r) => [...r, { midi, dur }]);
  }

  function applyParsed(p: ParsedScore) {
    setBpm(p.bpm); setTimeNum(p.timeSig[0]); setTimeDen(p.timeSig[1]); setKeySig(p.keySig);
    if (p.title) setTitle(p.title); if (p.composer) setComposer(p.composer);
    setRows(p.notes.map((n) => ({ midi: n.midi, dur: n.durationBeats })));
    setMsg(`Imported ${p.notes.length} notes.`);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>, kind: 'xml' | 'midi' | 'pdf') {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    try {
      if (kind === 'pdf') { setPdfRef(await fileToDataURL(f)); setMsg('PDF attached as reference — transcribe the notes below.'); }
      else if (kind === 'midi') applyParsed(parseMidi(await f.arrayBuffer()));
      else applyParsed(parseMusicXML(await f.text()));
    } catch (err) { setMsg(`Import failed: ${(err as Error).message}`); }
  }

  function saveToLibrary() {
    if (rows.length === 0) { setMsg('Add some notes first.'); return; }
    saveCustomExcerpt(excerpt);
    setMsg(`Saved "${excerpt.title}" — it's now in Simulator → Performance.`);
  }

  const exportJson = JSON.stringify(
    { ...excerpt, id: slug(title), pdfRef: undefined, source: 'builtin' }, null, 2,
  );

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 z-20 bg-academy-dark/95 backdrop-blur-sm border-b border-academy-gold/10 px-4 py-3 flex items-center justify-between">
        <div className="fantasy-title text-lg text-academy-gold">Selection Composer</div>
        <button onClick={() => navigate('/hub')} className="text-academy-cream/40 hover:text-academy-cream/80 text-xs">← Hub</button>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
        {/* Import row */}
        <div className="card-panel">
          <div className="text-academy-gold/60 text-[10px] uppercase tracking-widest font-fantasy mb-2">Import</div>
          <div className="flex flex-wrap gap-2 text-xs">
            <FileBtn label="MusicXML" accept=".xml,.musicxml" onChange={(e) => onFile(e, 'xml')} />
            <FileBtn label="MIDI" accept=".mid,.midi" onChange={(e) => onFile(e, 'midi')} />
            <FileBtn label="PDF (reference)" accept="application/pdf" onChange={(e) => onFile(e, 'pdf')} />
          </div>
          <p className="text-academy-cream/30 text-[10px] mt-2">
            MusicXML / MIDI import notes exactly. A PDF is shown as a reference to transcribe by hand.
          </p>
        </div>

        {/* Metadata */}
        <div className="card-panel grid grid-cols-2 gap-2 text-xs">
          <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} className="composer-input" /></Field>
          <Field label="Composer"><input value={composer} onChange={(e) => setComposer(e.target.value)} className="composer-input" /></Field>
          <Field label="Type">
            <select value={challengeType} onChange={(e) => setChallengeType(e.target.value as ExcerptChallengeType)} className="composer-input">
              {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </Field>
          <Field label="Grade"><input type="number" min={1} max={6} value={grade} onChange={(e) => setGrade(Number(e.target.value))} className="composer-input" /></Field>
          <Field label="Tempo ♩="><input type="number" min={30} max={220} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="composer-input" /></Field>
          <Field label="Key (♯+/♭−)"><input type="number" min={-7} max={7} value={keySig} onChange={(e) => setKeySig(Number(e.target.value))} className="composer-input" /></Field>
          <Field label="Time (beats)"><input type="number" min={1} max={12} value={timeNum} onChange={(e) => setTimeNum(Number(e.target.value))} className="composer-input" /></Field>
          <Field label="Beat value"><select value={timeDen} onChange={(e) => setTimeDen(Number(e.target.value))} className="composer-input">{[2, 4, 8].map((d) => <option key={d} value={d}>{d}</option>)}</select></Field>
        </div>

        {/* Preview */}
        <div className="card-panel">
          <div className="flex items-center justify-between mb-2">
            <div className="text-academy-gold/60 text-[10px] uppercase tracking-widest font-fantasy">Preview</div>
            <select value={previewInst} onChange={(e) => setPreviewInst(e.target.value as InstrumentId)} className="composer-input text-xs w-auto">
              {Object.keys(INSTRUMENTS).map((id) => <option key={id} value={id}>{INSTRUMENTS[id as InstrumentId].name}</option>)}
            </select>
          </div>
          {rows.length > 0
            ? <PerformanceStaff seated={seated} timeSig={[timeNum, timeDen]} totalBeats={totalBeats} />
            : <div className="text-academy-cream/30 text-xs py-6 text-center">Add or import notes to see the staff.</div>}
          <button onClick={() => playExcerpt(seated.notes, bpm, { withClick: true, beatsPerBar: timeNum })}
            disabled={rows.length === 0} className="btn-secondary text-xs mt-2 disabled:opacity-40">▶ Play</button>
        </div>

        {pdfRef && (
          <div className="card-panel">
            <div className="text-academy-gold/60 text-[10px] uppercase tracking-widest font-fantasy mb-2">PDF reference</div>
            <embed src={pdfRef} type="application/pdf" className="w-full rounded" style={{ height: 320 }} />
          </div>
        )}

        {/* Note editor */}
        <div className="card-panel">
          <div className="text-academy-gold/60 text-[10px] uppercase tracking-widest font-fantasy mb-2">Notes</div>
          <div className="flex flex-wrap items-end gap-2 mb-3 text-xs">
            <div>
              <div className="text-academy-cream/40 mb-0.5">Pitch</div>
              <input value={pitchInput} onChange={(e) => setPitchInput(e.target.value)} placeholder="Bb4"
                className="composer-input w-20" onKeyDown={(e) => { if (e.key === 'Enter') addNote(false); }} />
            </div>
            <div>
              <div className="text-academy-cream/40 mb-0.5">Duration</div>
              <select value={dur} onChange={(e) => setDur(Number(e.target.value))} className="composer-input">
                {DURS.map(([l, v]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <button onClick={() => addNote(false)} className="btn-primary text-xs py-1.5 px-3">+ Note</button>
            <button onClick={() => addNote(true)} className="btn-secondary text-xs py-1.5 px-3">+ Rest</button>
            <button onClick={() => setRows((r) => r.slice(0, -1))} disabled={!rows.length} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">⌫ Undo</button>
            <button onClick={() => setRows([])} disabled={!rows.length} className="text-rating-poor text-xs disabled:opacity-40">Clear</button>
          </div>
          <div className="flex flex-wrap gap-1">
            {rows.map((r, i) => (
              <button key={i} onClick={() => setRows((rr) => rr.filter((_, j) => j !== i))}
                title="remove"
                className="text-[10px] font-fantasy px-1.5 py-1 rounded border border-academy-gold/20 text-academy-cream/70 hover:border-rating-poor hover:text-rating-poor">
                {r.midi === null ? '𝄽' : midiName(r.midi)}·{durName(r.dur)}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={saveToLibrary} className="btn-primary flex-1 text-sm">Save to Library</button>
        </div>
        {msg && <div className="text-academy-gold/80 text-xs text-center">{msg}</div>}

        <div className="card-panel">
          <div className="text-academy-gold/60 text-[10px] uppercase tracking-widest font-fantasy mb-2">Export (paste into src/lib/music/excerpts.ts)</div>
          <textarea readOnly value={exportJson} className="w-full h-40 bg-black/40 border border-academy-gold/15 rounded p-2 text-[10px] font-mono text-academy-cream/70" />
          <button onClick={() => navigator.clipboard?.writeText(exportJson)} className="btn-secondary text-xs mt-2">Copy JSON</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="text-academy-cream/40 mb-0.5">{label}</div>{children}</label>;
}
function FileBtn({ label, accept, onChange }: { label: string; accept: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="btn-secondary text-xs py-1.5 px-3 cursor-pointer">
      {label}<input type="file" accept={accept} onChange={onChange} className="hidden" />
    </label>
  );
}
function midiName(midi: number): string {
  const names = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  return `${names[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}
function durName(d: number): string {
  return ({ 4: 'w', 3: 'h.', 2: 'h', 1.5: 'q.', 1: 'q', 0.5: 'e' } as Record<number, string>)[d] ?? `${d}`;
}
function fileToDataURL(f: File): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f); });
}
