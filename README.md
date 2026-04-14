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

If you pull newer 0.1.25, 0.1.26, or 0.1.27 code into an existing database, run migrations before restarting the app. Recent hub work depends on migrations 017, 018, 019, 020, 021, 022, 023, and 024, and missing them can surface runtime errors such as `column hub_events.ends_at does not exist`, `relation "public.hub_event_reminders" does not exist`, `column hub_broadcasts.delivery_state does not exist`, `relation "public.hub_notification_preferences" does not exist`, `relation "public.hub_execution_ledger" does not exist`, or `column hub_notification_reads.notification_key does not exist`.

---

## Planning Docs

These are the best starting points for junior developers:

- [docs/roadmap-0.1.25.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.25.md)
- [docs/roadmap-0.1.25-checklist.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.25-checklist.md)
- [docs/roadmap-0.1.24.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.24.md)
- [docs/roadmap-0.1.24-checklist.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.24-checklist.md)
- [docs/roadmap-0.1.4.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.4.md)
- [docs/roadmap-0.1.4-checklist.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.4-checklist.md)
- [docs/roadmap-0.1.3.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.3.md)
- [docs/roadmap-0.1.3-checklist.md](/Users/rafa/Desktop/plural-unit/docs/roadmap-0.1.3-checklist.md)
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
      hubRepository.ts          ← Plugin data + activation rows
    stores/
      currentUser.svelte.ts     ← Reactive auth + profile state
      currentOrganization.svelte.ts ← Reactive org membership state
      authBoundary.svelte.ts    ← Login/onboarding gate logic
      pluginRegistry.ts         ← Plugin definitions + helpers
      currentHub.svelte.ts      ← Reactive hub content + toggles
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
        OrganizationSummaryCard.svelte ← Org summary header card
        OrganizationOverviewCard.svelte ← Org overview content
        OrganizationAccessCard.svelte   ← Join code + invitations
      hub/
        member/
          HubOverviewCard.svelte     ← Member hub summary
          HubActivityFeed.svelte     ← Mixed recent activity feed
          BroadcastsSection.svelte   ← Member broadcast list
          EventsSection.svelte       ← Member event list
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
```

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
- **No demo mode.** Supabase env vars are required. If missing, the app throws.
- **Stores are singletons.** Each store is a class instance exported as a module-level `const`. Svelte 5 `$state` and `$derived` make them reactive.
- **Repositories are the Supabase boundary.** Only `src/lib/repositories/` files know table names, column shapes, or RPC names.
- **Models are pure.** No side effects, no imports from Supabase or Svelte.
- **The plugin registry is the source of truth.** Titles, descriptions, and ordering come from the registry, not from components.
