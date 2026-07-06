import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { getInstrumentColor } from '../lib/instruments';
import {
  getAbilitiesForInstrument,
  abilityUpgradeCost,
  abilityRankMult,
  ABILITY_MAX_RANK,
} from '../lib/abilities';

// Skill Tree — abilities unlock automatically by level; Resonance Points rank
// them up (rank 1 → 3), each rank boosting the ability's damage / healing.
export default function AbilitiesPage() {
  const { character, upgradeAbility } = useGameStore();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const [justUpgraded, setJustUpgraded] = useState<string | null>(null);

  if (!character) return null;

  const color = getInstrumentColor(character.instrument);
  // Full roster for the instrument (level 100 = no level filter); lock computed below.
  const abilities = getAbilitiesForInstrument(character.instrument, 100);

  async function handleUpgrade(id: string) {
    setBusy(id);
    const ok = await upgradeAbility(id);
    setBusy(null);
    if (ok) {
      setJustUpgraded(id);
      setTimeout(() => setJustUpgraded(null), 1600);
    }
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-academy-dark/95 backdrop-blur-sm border-b border-academy-gold/10 px-4 py-3 flex items-center justify-between">
        <div className="fantasy-title text-lg text-academy-gold">Skill Tree</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-academy-gold text-base">⟡</span>
            <span className="font-fantasy text-academy-gold text-lg">{character.resonancePoints}</span>
            <span className="text-academy-cream/40 text-xs">RP</span>
          </div>
          <button
            onClick={() => navigate('/hub')}
            className="text-academy-cream/40 hover:text-academy-cream/80 text-xs transition-colors"
          >
            ← Hub
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <p className="text-academy-cream/50 text-sm mb-5">
          Abilities unlock as you <span className="text-academy-cream/80">level up</span>. Spend
          <span className="text-academy-gold"> Resonance Points</span> to rank them up — each rank
          boosts its damage or healing.
        </p>

        <div className="space-y-3">
          {abilities.map((ab) => {
            const locked = ab.levelGate > character.level;
            const rank = character.abilityRanks[ab.id] ?? 1;
            const maxed = rank >= ABILITY_MAX_RANK;
            const nextRank = rank + 1;
            const cost = abilityUpgradeCost(ab.tier, nextRank);
            const canAfford = character.resonancePoints >= cost;
            const kind = ab.tier === 'basic' ? 'Basic' : 'Superior';
            const kindColor = ab.tier === 'basic' ? 'text-academy-cream/50' : 'text-rating-good';

            return (
              <div
                key={ab.id}
                className={`card-panel px-4 py-3 transition-colors ${locked ? 'opacity-50' : ''} ${justUpgraded === ab.id ? 'ring-1 ring-academy-gold' : ''}`}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-fantasy text-sm truncate" style={{ color }}>{ab.name}</span>
                    <span className={`text-[9px] font-fantasy uppercase tracking-wide ${kindColor}`}>{kind}</span>
                  </div>
                  {/* Rank pips */}
                  <div className="flex items-center gap-1 flex-shrink-0" title={`Rank ${rank}/${ABILITY_MAX_RANK}`}>
                    {Array.from({ length: ABILITY_MAX_RANK }, (_, i) => (
                      <span key={i} className={`text-[11px] ${i < rank ? 'text-academy-gold' : 'text-academy-cream/20'}`}>◆</span>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-academy-cream/50 mb-2">{ab.description}</div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] text-academy-cream/40 font-fantasy">
                    Rank {rank} · ×{abilityRankMult(rank).toFixed(2)} output
                  </span>
                  {locked ? (
                    <span className="text-[10px] font-fantasy text-rating-poor">🔒 Unlocks at Lv {ab.levelGate}</span>
                  ) : maxed ? (
                    <span className="text-[10px] font-fantasy text-academy-gold">★ MAX RANK</span>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(ab.id)}
                      disabled={!canAfford || busy === ab.id}
                      className={`text-[11px] font-fantasy px-3 py-1 rounded transition-colors ${
                        canAfford && busy !== ab.id
                          ? 'bg-academy-gold/15 text-academy-gold hover:bg-academy-gold/25'
                          : 'bg-white/5 text-academy-cream/30 cursor-not-allowed'
                      }`}
                    >
                      Upgrade → Rank {nextRank} · ⟡{cost}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
