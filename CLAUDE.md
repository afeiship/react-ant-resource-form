# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@jswork/react-ant-resource-form` is a monorepo (Lerna + Yarn workspaces) providing an Ant Design form builder component for resource-based CRUD operations. The component uses a **class-based architecture** (not functional components) to maintain form instance stability.

**Repository**: https://github.com/afeiship/react-ant-resource-form
**Package**: `@jswork/react-ant-resource-form`
**Current Version**: 1.0.39

## Development Commands

### Root Level Commands
```bash
yarn dev                    # Start example app development server (Vite)
yarn run ln:build           # Build the library (includes docs build)
yarn run ln:publish         # Publish the library to npm
yarn run docs               # Build documentation
```

### Library Package (`packages/lib/`)
```bash
cd packages/lib
yarn build                  # Build with tsup (CJS/ESM + TypeScript declarations)
yarn release                # Publish with release-it
```

### Example Package (`packages/example/`)
```bash
cd packages/example
yarn dev                    # Start Vite dev server
yarn build                  # Build with TypeScript + Vite
yarn lint                   # Run ESLint
yarn preview                # Preview built application
```

## Repository Structure

```
react-ant-resource-form/
├── packages/
│   ├── lib/                 # Main library package (@jswork/react-ant-resource-form)
│   │   ├── src/
│   │   │   ├── index.tsx    # Main component (class-based)
│   │   │   ├── types.ts     # TypeScript type definitions
│   │   │   ├── locales.ts   # i18n (zh-CN, en-US)
│   │   │   └── utils.ts     # Helper functions
│   │   ├── style.scss       # Component styles
│   │   └── package.json
│   └── example/             # Example/demo application
│       ├── src/             # Example app source
│       └── package.json
├── lerna.json              # Lerna monorepo configuration
├── llms.txt                # Comprehensive documentation (511 lines)
└── package.json            # Root package.json
```

## Architecture

### Core Component Design

The `ReactAntResourceForm` component is a **class component** (intentionally not functional) with the following architecture:

**Key Design Decisions:**
- Class component maintains stable form instance references across renders
- State management for `loading` and `touched` flags
- Deep equality comparison (`fast-deep-equal`) for change detection
- Global API integration via `nx.$api` object
- Event emission via `nx.$event` object

### API Integration Pattern

The component expects a global API object with naming convention:

```typescript
import nx from '@jswork/next';

nx.$api = {
  posts_show: (payload) => axios.get(`/api/posts/${payload.id}`),
  posts_create: (payload) => axios.post('/api/posts', payload),
  posts_update: (payload) => axios.put(`/api/posts/${payload.id}`, payload),
};
```

API methods are called as `{name}_show`, `{name}_create`, `{name}_update`.

### Mode Detection

- **Create Mode**: `params.id` is `undefined`, `null`, or empty
- **Edit Mode**: `params.id` has a value

In edit mode, the component automatically calls `{name}_show` on mount to fetch and populate form data.

### Lifecycle Hooks

1. **`initGuard(args: InitGuardArgs)`**: Called before form initialization (create mode) or detail fetch (edit mode). Can reject via `Promise.reject()`.

2. **`submitGuard(args: SubmitGuardArgs)`**: Called before form submission. Can reject via `Promise.reject()` for validation.

3. **`onInit(instance: ReactAntResourceForm)`**: Called with component instance for direct access to `formInstance` methods.

4. **`onMutate(args: MutateArgs)`**: Called after successful create/update operations.

### Data Flow

1. Component mounts → detects mode via `params.id`
2. Edit mode: `initGuard` → `{name}_show` API → populate form → set initial values
3. Create mode: `initGuard` → set initial values (empty)
4. Form changes → `onValuesChange` → deep compare → update `touched` state
5. Submit → `submitGuard` → `{name}_create/update` API → success → emit event → optional back navigation

### Event System

After successful mutations, emits: `nx.$event?.emit?.(`${name}:refetch`)`

Set up globally for list refresh integration:
```typescript
nx.$event = {
  emit: (eventName) => {
    if (eventName === 'posts:refetch') {
      queryClient.invalidateQueries('posts');
    }
  }
};
```

## TypeScript Configuration

- Project uses ES Modules (`"type": "module"`)
- `tsconfig.json` targets ES2019 with strict settings
- `noImplicitAny` is **false** (allowing implicit any)
- `noUnusedLocals` and `noUnusedParameters` enabled

## Key Dependencies

### Peer Dependencies (must be installed by consumers)
- `antd` (Ant Design UI components)
- `react`, `react-dom`
- `@ant-design/icons`
- `classnames`
- `fast-deep-equal`
- `@jswork/next`, `@jswork/next-compact-object`
- `@jswork/react-ant-form-schema` (form schema renderer)

### Runtime Dependencies
- `fromentries` (polyfill)

## Build System

- **Library**: `tsup` (generates CJS, ESM, and TypeScript declarations)
- **Styles**: SCSS compiled to CSS via `postsass`
- **Example**: Vite for development and preview builds
- **Monorepo**: Lerna with Yarn workspaces

## Development Workflow

1. Make changes to library source in `packages/lib/src/`
2. Test changes in example app: `yarn dev`
3. Build library: `yarn run ln:build`
4. If publishing: `yarn run ln:publish`

## Important Implementation Details

1. **Class Component**: The component is intentionally a class component (not functional) to maintain stable form instance references. Do not convert to functional component.

2. **Loading State Warning**: As noted in source code comments, do not use Card's `loading` prop directly in class components as it causes formRef to be set to null. Use the internal `Spin` component instead.

3. **Blocker Prop**: The `blocker` prop prevents grid layout interference from `nice-form-react` when using non-Ant Design components.

4. **Change Detection**: Uses `fast-deep-equal` for deep comparison between initial values and current values to enable/disable save button in edit mode.

5. **Hotkey Save**: Ctrl/Cmd + S is enabled by default. Disable with `disableHotkeySave` prop.

## Documentation

Comprehensive documentation available in `llms.txt` (511 lines) including:
- Detailed usage examples
- TypeScript type definitions
- Props reference
- Best practices
- Troubleshooting guide

Auto-generated documentation available at: https://js.work
