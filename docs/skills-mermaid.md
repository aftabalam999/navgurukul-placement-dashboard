# Skills — System Connections (Mermaid)

```mermaid
flowchart LR
  subgraph Backend
    SK[Skill Model\n(name, category, isCommon, schools[], isActive, createdBy)]
    USRT[User.studentProfile.technicalSkills\n(skillId, skillName, selfRating, description)]
    USRS[User.studentProfile.softSkills\n(skillId, skillName, selfRating)]
    USRL[User.studentProfile.skills (legacy)\n(skill (ref), status, approvedBy)]
    SET[Settings (schoolModules)]
    SCRIPTS[Scripting\n(migrate_skill_ids.js, find_skill_mismatches.js)]
    AI[AI Service\n(parseJobDescription -> suggestedSkills)]
    JOBS[Jobs (requiredSkills / matching)]
    NOTIF[Notifications\n(skill_approval_needed, skill_approved/rejected)]
  end

  subgraph API
    SK_API[/api/skills\n(GET/POST/PUT/DELETE)]
    USR_ADD[/users/profile/skills POST]
    USR_APPROVE[/users/students/:id/skills/:skillId PUT]
  end

  subgraph Frontend
    F_API[skillAPI \n(getSkills, getCategories, createSkill, updateSkill)]
    UI[SearchableSelect / Profile UI]
  end

  %% Relations
  SK -->|referenced by| USRT
  SK -->|referenced by| USRS
  SK -->|referenced by| USRL
  SET -->|restricts/validates schools| SK
  SK_API -->|CRUD| SK
  USR_ADD -->|adds ref| USRL
  USR_APPROVE -->|updates status & notifies| NOTIF
  NOTIF -->|notify| CampusPOC[Campus POC]
  AI -->|suggests skill names| F_API
  F_API -->|calls| SK_API
  JOBS -->|matches against| SK
  SCRIPTS -->|read/write| USRT
  SCRIPTS -->|validate| SK
  SK -->|update triggers| USRT
  SK -->|update should trigger| USRS

  %% Back-propagation note
  SK -- "on update -> back-propagate skillName" --> USRT
  SK -- "(missing) -> should also update" --> USRS
```

---

## 🔧 Suggested integration changes (no removals — only integrate)

1. **Case-insensitive canonical name (add `normalizedName`)** ✅
   - Change: Add a `normalizedName` (lowercased + trimmed) field on `Skill` and set a unique index on it (or use collation).
   - Effect: Prevents case-only duplicates and simplifies lookups (migration backfill required). Minimal risk if index built in background.

2. **Extend back-propagation to all profile places** 🔁
   - Change: When a skill's `name` changes, update `studentProfile.technicalSkills`, `studentProfile.softSkills`, and legacy `studentProfile.skills.skillName` (if present).
   - Effect: Keeps profile displays consistent; avoids mismatch reports and UI confusion.

3. **Make `Skill` uniqueness policy explicit** 📜
   - Change: Decide global uniqueness vs per-school. If per-school, implement a compound index or keep `schools` as canonical scoping.
   - Effect: Clarifies UX and avoids accidental blocking/duplicates across schools.

4. **Harden school validation / Settings guard** 🛡️
   - Change: Defensive checks when reading `Settings.getSettings()` (ensure iterable). Add tests and fallback to empty list.
   - Effect: Prevents runtime errors when settings shape changes.

5. **Optimize migration & mismatch scripts** ⚡
   - Change: Prebuild name→id and id→name maps in `migrate_skill_ids.js` & `find_skill_mismatches.js` to avoid per-entry DB queries.
   - Effect: Faster runs, lower DB load, clearer reports; keep `--dry-run` by default for safety.

6. **Add tests and CI checks** ✅
   - Change: Unit/integration tests for skills endpoints, back-propagation behavior, and migration scripts.
   - Effect: Prevent regressions and make refactors safer.

7. **Front-end UX: creation vs selection flow** ✨
   - Change: In `SearchableSelect` and profile UI, clearly surface "Add new skill" vs "Select existing skill" and validate server-side.
   - Effect: Reduces duplicate custom skill creation and ensures use of canonical skills.

8. **Add telemetry / logging on mismatches** 📊
   - Change: Emit events or logs when migrate/mismatch scripts find missing skill docs or name mismatches.
   - Effect: Easier operational debugging and prioritization for cleanup tasks.

---

## ⚙️ Integration plan (safe, incremental)

1. **Add `normalizedName` field & index**
   - Create schema change, set `normalizedName` on create/update.
   - Backfill existing skills with a one-off script and create index in background.

2. **Backfill user profiles**
   - Run `migrate_skill_ids` (dry-run) then apply to set missing `skillId`s.
   - Run a profile backfill to sync `skillName` from canonical `Skill` for technical & soft skills.

3. **Update Skill update flow to back-propagate**
   - Add updates for `softSkills` and any other `skillName` copies inside `User` documents.

4. **Optimize & test scripts**
   - Improve `find_skill_mismatches.js` and `migrate_skill_ids.js` to use in-memory maps and add tests.

5. **Frontend adjustments**
   - Improve `SearchableSelect` UX for add/select and prevent user-spawned duplicates.

6. **Monitoring & rollback**
   - Run scripts in dry-run, monitor `skill_mismatch_report.json`. If unexpected, revert via MongoDB snapshots. Build indexes in background.

---

> Notes:
> - All changes are additive and safe to integrate; they avoid removal of data or behaviors.
> - Most steps include a dry-run and testing phase to minimize risk.

---

If you'd like, I can open a PR that: (a) adds `normalizedName` to `Skill` with migration script, and (b) extends back-propagation to `softSkills` and adds tests. Which would you prefer me to start with? 🔁