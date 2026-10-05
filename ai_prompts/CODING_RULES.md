# Universal Coding Rules

## 1. General Principles
- **Separation of Concerns**: Never mix business logic, UI, database access, and configuration in the same layer.
- **Single Responsibility Principle (SRP)**: Each function, class, file, and package should have exactly one clear purpose.
- **No Dummy Code**: Do not create boilerplate or scaffolding unless it is immediately useful or structurally required.

## 2. TypeScript Guidelines
- Enable `strict` mode in all `tsconfig.json` files.
- Avoid `any`. Use `unknown` if the type is truly dynamic, and narrow it down via type guards.
- Prefer interfaces over type aliases for object shapes.
- Use explicit return types for exported functions and class methods.

## 3. Formatting & Linting
- All code MUST comply with the centralized `packages/config/prettier` rules.
- All code MUST pass the centralized `packages/config/eslint` rules.
- Run `pnpm lint` and `pnpm typecheck` before committing.

## 4. Error Handling
- Use structured error handling.
- Do not silently swallow errors. Catch and log them appropriately.
- In APIs, always return consistent error responses (e.g., standard HTTP status codes and a consistent JSON error schema).

## 5. Security
- NEVER hardcode secrets, passwords, API keys, or JWT tokens in the codebase.
- Use environment variables for all sensitive configuration.
- Implement secure fallbacks: if a sensitive environment variable is missing in production, the application MUST fail to start rather than using an insecure default.
