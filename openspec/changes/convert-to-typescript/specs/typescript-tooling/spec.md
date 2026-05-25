## ADDED Requirements

### Requirement: Sources are TypeScript and typecheck under a strict config

All application source files in both workspaces SHALL be TypeScript (`.ts`/`.tsx`), and the project SHALL provide a strict-enough TypeScript configuration under which they typecheck without error. There SHALL be no remaining `.js`/`.jsx` application source files in `server/src/` or `client/src/` once the migration is complete.

#### Scenario: Repo typecheck passes

- **WHEN** a developer runs the repo-level `npm run typecheck`
- **THEN** both the server and client workspaces are typechecked and the command exits zero with no type errors

#### Scenario: No untyped application source remains

- **WHEN** the migration is complete and `allowJs` is disabled
- **THEN** `server/src/` and `client/src/` contain no `.js` or `.jsx` source files
- **AND** the build/typecheck still succeeds

#### Scenario: Strict config rejects implicit any in app code

- **WHEN** application code introduces a value whose type is implicitly `any`
- **THEN** `npm run typecheck` reports an error rather than silently accepting it

### Requirement: Shared domain types are the single source of truth for string unions

The role, task status, task type, recurrence, and transaction type values SHALL be defined as TypeScript string-literal unions in a shared location, and both server and client SHALL consume those definitions rather than bare `string` types or independently redeclared literals.

#### Scenario: Server and client agree on status literals

- **WHEN** server code creates or transitions a task status and client code renders it
- **THEN** both reference the same shared `TaskStatus` union, so an invalid literal (e.g. a typo'd status) fails typecheck on both sides

#### Scenario: req.user is typed

- **WHEN** a route handler reads `req.user` after `requireAuth`
- **THEN** `req.user` is typed as the shared authenticated-user shape (`id`, `role`, `name`, `parentId`) via an Express `Request` augmentation, with no cast required

### Requirement: Server and client build and run unchanged after migration

The TypeScript toolchain SHALL preserve existing runtime behavior and developer workflows: the server runs in dev with watch and in production without a manual pre-build step, the client builds and serves via Vite, and no API contract, auth behavior, or UI changes.

#### Scenario: Server dev and start run TypeScript directly

- **WHEN** a developer runs the server `dev` or `start` script
- **THEN** the server starts from the TypeScript entry point (via `tsx`) on port 3001 with watch in dev, and serves the same API as before

#### Scenario: Client builds with Vite

- **WHEN** a developer runs `npm run build --workspace=client`
- **THEN** Vite compiles the `.tsx`/`.ts` sources and produces the same client bundle structure served from `client/dist`

#### Scenario: Production deploy starts successfully

- **WHEN** the Railway deploy runs its start command after `prisma migrate deploy`
- **THEN** the server starts from the TypeScript entry point with `tsx` available at runtime and serves the built client and API
