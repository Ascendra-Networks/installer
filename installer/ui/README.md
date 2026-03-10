# Installer UI

React 18 + TypeScript + Vite SPA that drives the Ascendra installation wizard. Served at `/installer/` and proxied to the backend at `localhost:3001`.

## Stack

| Concern | Technology |
|---|---|
| Framework | React 18, TypeScript 5 (strict) |
| Bundler | Vite 6 |
| Styling | Tailwind CSS v3, shadcn/ui pattern (Radix UI + CVA) |
| Real-time | Socket.IO client v4 |
| State | React Context + `useState` (no external state library) |

## Structure

```
src/
├── App.tsx                  # Root: WizardProvider + step router
├── types/index.ts           # All shared TypeScript types
├── contexts/
│   └── WizardContext.tsx    # Wizard state, WebSocket listeners, session persistence
├── services/                # API & WebSocket abstractions (see services/README.md)
├── utils/validators.ts      # Input validation helpers
└── components/
    ├── ui/                  # Primitive wrappers (Button, Input, Dialog, …)
    ├── shared/              # Reusable higher-level components (Stepper, forms, loaders)
    └── steps/               # The five wizard step pages
```

**Component tiers:**

- **`ui/`** — headless Radix UI primitives styled with CVA. No business logic.
- **`shared/`** — composed components reused across steps: `Stepper`, `StepTransition`, `LoadingIndicator`, form field components.
- **`steps/`** — wizard pages (Step 1–5). Each step folder owns its child components.

## Scripts

```bash
npm run dev              # Dev server on :5173
npm run build            # Production build
npm run typecheck        # tsc --noEmit
npm run storybook        # Storybook dev on :6006
npm run build-storybook  # Static Storybook build
```

## Documentation — Storybook

Every significant component has a co-located `.stories.tsx` file. Storybook is the primary way to develop, review, and document UI components in isolation.

**Run it:**
```bash
npm run storybook
```

**Coverage:** all `ui/` primitives, all `shared/` components and form fields, and all step-level components (including dialogs and subcomponents).

Stories for step-level components that require wizard state use the shared `withWizardProvider` decorator from `src/components/steps/decorators.tsx`.

**When adding a component**, a story is required. The story must cover at minimum: the default state and any meaningful variants or interactive states.

## Testing

### PR Validation (automated)

Every pull request runs:

| Check | Command | Scope |
|---|---|---|
| Type check | `npm run typecheck` | All source files |
| Storybook build | `npm run build-storybook` | All stories compile without error |

### Tests to write

The project currently has no test suite. *TBD*