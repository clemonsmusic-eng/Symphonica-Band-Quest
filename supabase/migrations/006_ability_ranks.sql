-- Ability upgrade ranks (Resonance Point sink). Maps ability id → rank (2–3);
-- absent/1 = base. Abilities unlock by level; RP only ranks them up.
alter table characters
  add column if not exists ability_ranks jsonb not null default '{}'::jsonb;
