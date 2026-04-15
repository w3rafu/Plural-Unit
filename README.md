# Plural Unit

A lightweight SvelteKit app that demonstrates the core orchestration patterns from CommunionLink: auth, organizations, invitations, and a registry-driven plugin hub.

The app now uses a restrained shadcn-style UI with shared light/dark theme tokens, while still keeping the product intentionally simple.

---

## Quick start

```sh
npm install
# Create a .env file (see below)
npm run dev
```

### Required `.env`

```
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Apply the Supabase migrations in order:

```sh
supabase db push          # if using Supabase CLI
# or paste each file in supabase/migrations/ into the SQL editor
```

If you pull newer hub code into an existing database, run migrations before restarting the app. Recent hub work depends on migrations 017, 018, 019, 020, 021, 022, 023, 024, 025, 026, and 027, and missing them can surface runtime errors such as `column hub_events.ends_at does not exist`, `relation "public.hub_event_reminders" does not exist`, `column hub_broadcasts.delivery_state does not exist`, `column hub_events.delivery_state does not exist`, `relation "public.hub_notification_preferences" does not exist`, `relation "public.hub_execution_ledger" does not exist`, `column hub_notification_reads.notification_key does not exist`, or `relation "public.hub_event_attendances" does not exist`. Missing migration `026_expand_member_event_visibility_for_recent_history.sql` will also make member-facing recent event history disappear as soon as an event starts.

If you need an operational recovery checklist instead of a feature roadmap, use [docs/hub-schema-recovery.md](/Users/rafa/Desktop/plural-unit/docs/hub-schema-recovery.md).
If you are working on the current release batch, start with [docs/roadmap-0.1.30.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.30.md) and [docs/roadmap-0.1.30-checklist.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.30-checklist.md).
If you need the prior rollout runbook, use [docs/rollout-0.1.29-checklist.md](/Users/rafa/Desktop/plural-unit/docs/rollout-0.1.29-checklist.md).
If you need the prior release handoff context, use [docs/agent-handoff-0.1.29.md](/Users/rafa/Desktop/plural-unit/docs/agent-handoff-0.1.29.md).

---

## Planning Docs

These are the best starting points for junior developers:

- Start with the newest roadmap, then work backward only if you need older implementation context.
- [docs/roadmap-0.1.30.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.30.md)
- [docs/roadmap-0.1.30-checklist.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.30-checklist.md)
- [docs/roadmap-0.1.28.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.28.md)
- [docs/roadmap-0.1.28-checklist.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.28-checklist.md)
- [docs/roadmap-0.1.27.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.27.md)
- [docs/roadmap-0.1.27-checklist.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.27-checklist.md)
- [docs/roadmap-0.1.26.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.26.md)
- [docs/roadmap-0.1.26-checklist.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.26-checklist.md)
- [docs/roadmap-0.1.25.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.25.md)
- [docs/roadmap-0.1.25-checklist.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.25-checklist.md)
- [docs/ui-guardrails.md](/Users/rafa/Desktop/plural-unit/docs/ui-guardrails.md)

---

## Architecture overview

The app has six layers. Every file belongs to exactly one layer, and layers only depend downward.

```
┌─────────────────────────────┐
│  Routes (pages/composition) │  src/routes/
├─────────────────────────────┤
│  Components (app UI)        │  src/lib/components/
├─────────────────────────────┤
│  Stores (reactive state)    │  src/lib/stores/
├─────────────────────────────┤
│  Repositories (Supabase)    │  src/lib/repositories/
├─────────────────────────────┤
│  Models (types + helpers)   │  src/lib/models/
├─────────────────────────────┤
│  Migrations (DB schema)     │  supabase/migrations/
└─────────────────────────────┘
```

**The rule:** components compose UI → stores coordinate state → repositories talk to Supabase → models define shapes. No layer reaches across another.

---

## File map

```
src/
  lib/
    supabaseClient.ts           ← Supabase client singleton
    models/
      userModel.ts              ← UserDetails type + defaults
      organizationModel.ts      ← Organization types + normalizers
      authHelpers.ts            ← Validation, error mapping
    repositories/
      profileRepository.ts      ← Auth + profile CRUD
      organizationRepository.ts ← Org CRUD, join, invite
      hubRepository.ts          ← Barrel exports for hub repository domains
      hubRepository/
        broadcasts.ts           ← Broadcast lifecycle queries and mutations
        events.ts               ← Event, RSVP, attendance, and reminder queries
        executionLedger.ts      ← Scheduled delivery and reminder execution data
        notifications.ts        ← Alert preferences and read-state queries
        resources.ts            ← Hub resource CRUD and ordering
        plugins.ts              ← Plugin activation queries and mutations
    stores/
      currentUser.svelte.ts     ← Reactive auth + profile state
      currentOrganization.svelte.ts ← Reactive org membership state
      authBoundary.svelte.ts    ← Login/onboarding gate logic
      pluginRegistry.ts         ← Plugin definitions + helpers
      currentHub.svelte.ts      ← Hub coordinator store public API
      currentHub/
        broadcasts.ts           ← Broadcast-focused store mutations
        events.ts               ← Event, RSVP, attendance, and reminder store mutations
        notifications.ts        ← Alert preference and read-state store mutations
        resources.ts            ← Resource store mutations and reordering
        load.ts                 ← Hub load pipeline and hydration helpers
        derived.ts              ← Read-only selectors and derived hub summaries
        sync.ts                 ← Delivery metadata and execution-ledger synchronization
        state.ts                ← Shared reset/default/hydration state helpers
    components/
      auth/
        AuthGate.svelte         ← Top-level access controller
        LoginForm.svelte        ← Dual-channel login form
        NameOnboarding.svelte   ← Name collection modal
        OrganizationOnboarding.svelte ← Create/join/invite org
      profile/
        ProfileSection.svelte        ← Profile summary card
        ProfileDetailsCard.svelte    ← Profile details editor
        ProfileSecurityCard.svelte   ← Security editor
      organization/
        OrganizationOverviewCard.svelte ← Org overview content
        OrganizationAccessCard.svelte   ← Join code + invitations
      hub/
        member/
          HubActivityFeed.svelte     ← Mixed recent activity feed
          MemberCommitmentsCard.svelte ← Member commitments and recent events
          BroadcastsSection.svelte   ← Member broadcast list
          EventsSection.svelte       ← Member event list
          ResourcesSection.svelte    ← Shared links and documents
        admin/
          HubManageSummaryCard.svelte ← Admin hub summary
          PluginActivationCard.svelte ← Toggle plugins on/off
          BroadcastEditor.svelte      ← Create/delete broadcasts
          EventEditor.svelte          ← Create/delete events
      ui/
        Header.svelte                ← Shared header shell
        BottomNav.svelte             ← Shared bottom navigation
        Toaster.svelte               ← Shared toast outlet
        UnsavedChangesGuard.svelte   ← Global unsaved-work navigation guard
  routes/
    +layout.svelte              ← Wraps all pages with AuthGate
    +page.svelte                ← Home/account overview
    hub/
      +page.svelte              ← Hub coordinator (registry-driven)
      manage/
        +layout.svelte          ← Hub manage shell + tabs
        sections/+page.svelte   ← Plugin setup
        content/+page.svelte    ← Broadcast/event editors
    organization/
      +layout.svelte            ← Organization shell + tabs
      overview/+page.svelte     ← Organization overview
      access/+page.svelte       ← Join code + invites
      members/+page.svelte      ← Member visibility for admins
    profile/
      +layout.svelte            ← Profile shell + tabs
      details/+page.svelte      ← Profile details
      security/+page.svelte     ← Security settings
supabase/
  migrations/
    001_create_profiles.sql
    002_create_organizations.sql
    003_create_invitations.sql
    004_create_hub_tables.sql
    006_add_profile_avatar_support.sql
    007_add_get_organization_members.sql
```

---

## How auth works

1. `currentUser` restores the Supabase session and subscribes to auth changes.
2. `currentOrganization` resolves whether the user belongs to an organization.
3. `authBoundary` derives three gates from those stores:
   - Not logged in → show `LoginForm`
   - Logged in but no name → show `NameOnboarding`
   - Logged in but no organization → show `OrganizationOnboarding`
4. `AuthGate` renders the correct surface. Routes never solve auth independently.

```
LoginForm → currentUser.login → Supabase Auth
                ↓ (auth state change)
         currentUser.isLoggedIn = true
                ↓
         authBoundary.needsNameOnboarding → NameOnboarding
                ↓ (name saved)
         authBoundary.needsOrganizationOnboarding → OrganizationOnboarding
                ↓ (org created/joined)
         App renders route content
```

---

## How the plugin system works

The hub uses a **registry-driven** pattern. Plugins are not hardcoded into pages — they are defined in a central registry, and the hub page loops over the active ones.

### The registry (`src/lib/stores/pluginRegistry.ts`)

```ts
export const PLUGIN_REGISTRY: Record<PluginKey, PluginDefinition> = {
  broadcasts: { key: 'broadcasts', title: 'Broadcasts', ... },
  events:     { key: 'events',     title: 'Events',     ... },
};
```

### How the hub page uses it

```svelte
<!-- src/routes/hub/+page.svelte -->
{#each activePlugins as plugin (plugin.key)}
  {#if plugin.key === 'broadcasts'}
    <BroadcastsSection />
  {:else if plugin.key === 'events'}
    <EventsSection />
  {/if}
{/each}
```

### How activation works

- `hub_plugins` table stores `(organization_id, plugin_key, is_enabled)`.
- Missing row = disabled.
- Admin toggles go through `currentHub.toggle()` → `hubRepository.togglePlugin()`.

---

## Hub Data Flow

The hub now follows a small coordinator pattern instead of keeping all behavior in one giant store file.

1. Routes and components call the public API on `currentHub.svelte.ts`.
2. `currentHub/load.ts` fetches and hydrates hub state for the active organization.
3. `currentHub/derived.ts` computes read-only views like activity feeds, delivery status, and engagement summaries.
4. `currentHub/broadcasts.ts`, `events.ts`, `notifications.ts`, and `resources.ts` own mutation logic by domain.
5. `currentHub/sync.ts` keeps scheduled delivery metadata and the execution ledger aligned with the latest content state.
6. `hubRepository/` files stay focused on Supabase reads/writes by table domain.

This keeps the dependency direction the same as the rest of the app:

`components/routes -> currentHub store -> hubRepository -> Supabase`

When you are debugging a hub issue, use this shortcut:

- Load or hydration bug: start in `currentHub/load.ts`
- Wrong UI summary or label: start in `currentHub/derived.ts`
- Mutation bug: start in the matching `currentHub/<domain>.ts`
- Missing/stale delivery or queue state: start in `currentHub/sync.ts`
- SQL or query bug: start in `src/lib/repositories/hubRepository/`

### Adding a new plugin

1. Add a key to the `PluginKey` union in `pluginRegistry.ts`.
2. Add a `PluginDefinition` entry in `PLUGIN_REGISTRY`.
3. Update the `PluginStateMap` type defaults.
4. Create a member section component in `components/hub/member/`.
5. Create an admin editor component in `components/hub/admin/`.
6. Add an `{#if}` branch in the hub coordinator page.
7. Add a Supabase migration for the plugin's data table.
8. Add repository functions in `hubRepository.ts`.
9. Wire the store in `currentHub.svelte.ts`.

---

## How organizations work

Organizations are minimal: `id`, `name`, `join_code`. No types, tiers, or branding.

Three ways to join:

| Method     | Who         | How                                |
|------------|-------------|-------------------------------------|
| Create     | Anyone      | Becomes the first admin            |
| Join code  | Anyone      | Admin shares a 6-character code    |
| Invitation | Admin sends | Email or phone token               |

Admin capabilities:
- Regenerate join code
- Send invitations (email or phone)
- View pending invitations
- View member count

---

## Testing

```sh
npm test          # Run all unit tests
npm run test:watch # Watch mode
npm run test:smoke:install # Install Chromium for Playwright once per machine
npm run test:smoke # Run the browser smoke harness against local routes
```

The browser smoke harness runs the real app routes in a fixture-backed smoke mode via `?smoke=1`. It covers home, Alerts, manage content, manage sections, and profile alert preferences without requiring a live signed-in Supabase session, but it is still a release-safety harness rather than a replacement for normal Supabase-backed development.

For manual failure-path checks, `?smoke=1&smokeScenario=stale-hub-schema` simulates the old hub delivery-column schema drift and should surface the targeted migration guidance in both home and manage load states.

Tests cover:
- Auth validation and error mapping (`authHelpers.test.ts`)
- Plugin registry logic (`pluginRegistry.test.ts`)
- Organization model normalizers (`organizationModel.test.ts`)

---

## Supabase migrations

Apply in order. Each migration is additive — never drops existing tables.

| File                         | What it creates                          |
|------------------------------|-------------------------------------------|
| `001_create_profiles.sql`    | `profiles` table + RLS                   |
| `002_create_organizations.sql` | `organizations`, `memberships`, RPCs   |
| `003_create_invitations.sql` | `organization_invitations` + accept RPC  |
| `004_create_hub_tables.sql`  | `hub_plugins`, `hub_broadcasts`, `hub_events` + RLS |

---

## Design decisions

- **No styles.** This is a structural wireframe. Add your own CSS/Tailwind/etc.
- **Normal app flows stay Supabase-backed.** A narrow fixture-backed smoke mode exists only for browser rollout checks; it does not replace local Supabase setup.
- **Stores are singletons.** Each store is a class instance exported as a module-level `const`. Svelte 5 `$state` and `$derived` make them reactive.
- **Repositories are the Supabase boundary.** Only `src/lib/repositories/` files know table names, column shapes, or RPC names.
- **Models are pure.** No side effects, no imports from Supabase or Svelte.
- **The plugin registry is the source of truth.** Titles, descriptions, and ordering come from the registry, not from components.
