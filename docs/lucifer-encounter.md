# Lucifer encounter

Lucifer now has 21 additional direct attacks, two sister commands and a defensive burst, alongside the existing slash and ricochet stake. Her health scaling is unchanged. Phase 2 begins at 65% health and phase 3 at 30%; transitions wait for the current action's recovery.

## Combat

Pink ground warnings show the full prospective attack area. Amber outlines retain the committed area during the strike. Move out of the marked lane or dodge; no jump input is required. Ring-marked heavy attacks can also be parried with Punch or Kick when the ring turns gold. A parry ends the queued combination and provides 1.2 seconds of full-damage vulnerability.

Lucifer takes 12% damage while guarded and full damage throughout recovery. Her defensive burst deals no damage, never interrupts an existing punish window, and has its own warning and cooldown. Sister calls warn at a fixed location, summon one sister at a time, and leave Lucifer exposed afterward.

The existing encounter routing is retained: use **Start With Lucifer Boss** in the game's debug menu to access her directly. No changes were made to the regular boss scheduling.

## Animation review controls

Pause the game and enter `WWSSADAD` (or Up Up Down Down Left Right Left Right) within one second to open the existing debug menu. Enable **Start With Lucifer Boss** and use its restart button. During that encounter, **F8** opens Lucifer's controls:

- Select a phase and apply it, or select an individual move and play it.
- Pause Lucifer and step her simulation in 1/60-second increments.
- Display collision areas and set a deterministic pattern seed.

These controls are gated by the existing debug menu or Lucifer debug-start flag. They do not appear in ordinary play.

## Files and verification

- `lucifer-data.js`: source clips, stage frames, attack classes, movement limits and combination catalog.
- `lucifer-combat.js`: owned state machine, positioning, phased selection, hits, parries and independent sister runtime.
- `lucifer-presentation.js`: anchors, telegraphs, sister visuals and review controls.
- `game.js`: existing game integration, damage entry points, loading and shared HUD/input hooks.
- `lucifer-animation-manifest.md`: confirmed source interpretation and preserved sprite hashes.

Run the dependency-free regression suite from the project directory:

```sh
node --test tests/lucifer-combat.test.cjs
```

The implementation was checked with 89 passing tests, including all source attack frames, protected player states, both lane boundaries, all five sisters, parries, Reflex, Kanon, Shannon, Witch Time, Nightfall, deterministic selection and 30/60/120 FPS simulations. All 277 selected PNGs decode; the 32 pre-existing PNG hashes remain unchanged.

Headless Edge additionally completed 52 action playbacks (26 actions in both directions), with no page errors or failed asset requests, and verified the F8 controls. An automated fight using normal movement, attacks and dodge inputs defeated the 783-HP boss through all three phases with no items or blessings, finishing with 56 HP after approximately 222 seconds. This verifies a viable counterplay path; it is not a substitute for human difficulty tuning.

Local visual and encounter QA artifacts are under the ignored `build/lucifer-qa/` directory.
