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
- Deployment: Coolify on butools.xyz. Dockerfile uses `node server.js` (no PM2), port 3000, standalone output.
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
- Commits: `type(scope): description` (conventional commits — fix, feat, chore, refactor, docs)
- Branches: `feat/<description>`, `fix/<description>`
- No enforced formatter — be consistent within each file
- TypeScript strict mode enabled

## Tools
- **OpenMemory**: Persistent context across sessions. Query at session start (`openmemory query`), store at key checkpoints (`openmemory store`).
- **OpenSpec**: Spec before code. `/opsx:new` → `/opsx:ff` → review → implement → `/opsx:verify` → `/opsx:archive`
- **Superpowers**: TDD methodology, local code review. `/superpowers:brainstorm` for complex features, `/superpowers:write-plan` for multi-file changes, `superpowers:code-reviewer` before every commit.
- **CodeRabbit**: PR-level review (triggers automatically on PR). If unavailable, fall back to `superpowers:code-reviewer`.
- **Context7**: Look up library docs before writing code. `resolve-library-id` → `query-docs`.
- **Tavily** (replaces WebSearch/WebFetch): 5 tools for all web research — `tavily_search` (versions, errors), `tavily_extract` (full page content), `tavily_crawl` (doc ingestion), `tavily_map` (site structure), `tavily_research` (AI synthesis).
- **Playwright**: E2E testing and visual validation.
- **LSP**: vtsls (TypeScript) via boostvolt marketplace. Use `goToDefinition`, `findReferences`, `documentSymbol`, `workspaceSymbol` for navigation — prefer over grep. Requires `ENABLE_LSP_TOOL=1`.

## Research Protocol
Before writing code: Context7 (docs) → Tavily `tavily_search` (versions, breaking changes) → `tavily_extract` (deep dives on key results) → OpenMemory (patterns). Never rely on training knowledge for APIs or versions.

## Workflows
- `/opsx:new` — Start a new change with OpenSpec
- `/opsx:ff` — Fast-forward through artifact creation
- `/opsx:apply` — Implement tasks from a change
- `/work-local "<description>"` — Standalone workflow
- `/resume` — Continue where you left off
- `/fix "<bug>"` — Debug and fix

## Documentation Updates
After every implementation, check and update: README.md, CHANGELOG.md, CLAUDE.md, OpenSpec specs.
