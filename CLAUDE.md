# Project Guidelines

## Code Quality
Mandatory: SRP, no magic values, descriptive names, error handling on boundaries,
max 40 lines / 3 params / 3 nesting, no duplication, YAGNI, Law of Demeter, AAA tests.
Prefer: KISS (simplest solution wins), deep modules, composition over inheritance,
strategic programming. See CODE_PRINCIPLES.md for full details.

## Behavioral Rules
- Never guess versions, APIs, or config syntax from training knowledge — always research first via Context7 or Tavily.
- Always use Tavily MCP tools (`tavily_search`, `tavily_extract`, `tavily_research`, `tavily_crawl`, `tavily_map`) for web research. Do NOT use built-in WebSearch or WebFetch tools.
- When a task feels too complex or requires touching many files, stop and ask before proceeding. Over-engineering is the most common failure mode.
- When encountering an unfamiliar pattern in the codebase, use LSP (`goToDefinition`, `findReferences`) to understand it before modifying it. Don't assume based on naming alone.
- Before creating any abstraction (interface, base class, wrapper, utility), ask: does the current task require this? If not, don't build it.
- When stuck or confused for more than 2 attempts at the same problem, say so explicitly rather than trying more variations.
- Prefer modifying existing patterns over introducing new ones. If the codebase does something one way, do it the same way unless explicitly told otherwise.
- Always request local code review (`superpowers:code-reviewer`) before committing. Fix Critical and Important issues before proceeding.
- Dark mode only — `forcedTheme="dark"` is intentional. Never add light mode support unless explicitly asked.
- SQLite DB at `data/supporters.db` is read-only in the API route. Never write to it from the Next.js app.
- Deployment: Coolify on butools.xyz. Dockerfile uses `node server.js` (no PM2), standalone output, port 4001. Coolify injects `PORT=4001` at runtime (overriding Dockerfile's `ENV PORT=3000`).
- Map tiles in `public/BlessMap/` are large binary assets. Don't modify or regenerate them.
- Route directories use snake_case for URL-friendliness (`runes_dreaming`, `gearscore_cal`), even though code uses camelCase.
- shadcn/ui components in `components/ui/` — use `npx shadcn@latest add <component>` to add new ones, don't hand-write them.
- Feature modules go in `app/features/<name>/` with `components/`, `store/`, `data/`, `types.ts`. Don't put feature-specific code in shared `components/`.
- `@/*` path alias maps to project root (configured in tsconfig.json).
- Google Analytics ID `G-V5TV59NQZT` is hardcoded in layout.tsx — not an env var.
- `BMC_ACCESS_TOKEN` is the only required env var. It's used by `scripts/fetchSupporters.mjs`, not by Next.js directly. Passed as Docker ARG in Coolify.
- ShapeDoctor uses a webpack-built web worker (`worker.webpack.config.js`). The build script is `npm run build:worker:prod && next build`. Worker output at `public/workers/` is gitignored.
- COOP/COEP headers are set in `next.config.ts` for SharedArrayBuffer support (required by ShapeDoctor solver).
- The `overrides` in package.json (`systeminformation`, `basic-ftp`, `lodash`) are security patches — don't remove them.

## Existing Conventions
- Commits: `type(scope): description [TEE-XXX]` (conventional commits — fix, feat, chore, refactor, docs). Include the Linear ID in brackets when the work maps to a ticket.
- Branches: `feat/tee-XXX-description` or `fix/tee-XXX-description` when tied to a Linear ticket; `feat/<description>` / `fix/<description>` otherwise
- No enforced formatter — be consistent within each file
- TypeScript strict mode enabled
- Jest + ts-jest configured; add AAA tests alongside new code (colocate `*.test.ts` next to source)

## Linear Integration
- **Repo label:** `repo:butoolz` — all issues MUST carry this label
- **Project prefix:** `TEE`
- **Branch format:** `feat/tee-XXX-desc` or `fix/tee-XXX-desc`
- **Commit format:** `type(scope): desc [TEE-XXX]`
- **GitHub repo:** `foreztgump/butoolz` — PRs open against `main`

## Tools
- **OpenMemory**: Persistent context across sessions. Query at session start (`openmemory query`), store at key checkpoints (`openmemory store`).
- **OpenSpec**: Spec before code. `/opsx:new` → `/opsx:ff` → review → implement → `/opsx:verify` → `/opsx:archive`
- **Superpowers**: TDD methodology, local code review. Invoke the `superpowers:brainstorming` skill for complex features, `superpowers:writing-plans` for multi-file changes, `superpowers:executing-plans` to work through plans with review checkpoints, and the `superpowers:code-reviewer` agent before every commit.
- **CodeRabbit**: PR-level review (triggers automatically on PR). If unavailable, fall back to `superpowers:code-reviewer`.
- **Context7**: Look up library docs before writing code. `resolve-library-id` → `query-docs`.
- **Tavily** (replaces WebSearch/WebFetch): 5 tools for all web research — `tavily_search` (versions, errors), `tavily_extract` (full page content), `tavily_crawl` (doc ingestion), `tavily_map` (site structure), `tavily_research` (AI synthesis).
- **Playwright**: E2E testing and visual validation.
- **LSP**: vtsls (TypeScript) via boostvolt marketplace. Use `goToDefinition`, `findReferences`, `documentSymbol`, `workspaceSymbol` for navigation — prefer over grep. Requires `ENABLE_LSP_TOOL=1`.

## Research Protocol
Before writing code: Context7 (docs) → Tavily `tavily_search` (versions, breaking changes) → `tavily_extract` (deep dives on key results) → OpenMemory (patterns). Never rely on training knowledge for APIs or versions.

## Workflows
- `/work TEE-XXX` — Linear issue → branch → spec → implement → review → PR
- `/work-local "<description>"` — Standalone workflow (no Linear ticket)
- `/resume` — Continue where you left off (checks all state sources)
- `/fix "<bug>"` — Debug and fix with verify-first discipline
- `/opsx:new` — Start a new OpenSpec change
- `/opsx:ff` — Fast-forward through artifact creation in one go
- `/opsx:continue` — Create the next artifact in the current change
- `/opsx:apply` — Implement tasks from a change
- `/opsx:verify` — Verify implementation matches change artifacts
- `/opsx:archive` — Archive a completed change
- `/opsx:explore` — Think-partner mode for exploring ideas or clarifying requirements

## OpenMemory Checkpoints
**Mandatory** — do not skip. Query before starting, store after completing.

| When | Action |
|------|--------|
| Before `/opsx:new`, `/opsx:ff`, `/fix` | `openmemory query "<topic> patterns" --limit 5` |
| After `/opsx:ff`, `/opsx:continue` (artifacts done) | Store design summary and key decisions |
| During `/opsx:apply` (every 3–4 tasks) | Store progress, surprises, deviations |
| After `/opsx:verify` | Store findings (pass/fail, issues, fixes) |
| After `/opsx:archive` | Store completion record, patterns learned, follow-ups |
| During `/opsx:explore` | Store decisions immediately — don't wait |
| After `superpowers:brainstorming` | Store chosen approach, rejected alternatives, and why |
| After `superpowers:writing-plans` | Store plan summary, key architectural decisions |
| After `superpowers:executing-plans` batch | Store what was built, deviations from plan |
| After code review (superpowers or coderabbit) | Store non-obvious issues that apply beyond the current PR |
| After `/fix` confirmed | Store error pattern, root cause, resolution |
| On `/resume` or session start | `openmemory query "recent context butoolz" --limit 5` |
| Before context compacts | Store any unsaved decisions or findings |

## Documentation Updates
After every implementation, check and update: README.md, CHANGELOG.md, CLAUDE.md, OpenSpec specs.
