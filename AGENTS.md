
## Code style rules

- All TypeScript files must pass Biome checks before committing
- Run `pnpm exec biome check --write --unsafe <path>` after generating any TypeScript code
- Imports must be sorted: type imports before value imports, alphabetically within each group
- Use tabs for indentation, never spaces
- No non-null assertions (!). Use optional chaining (?.) or explicit null checks instead
- All generated code must pass `pnpm nx lint <package>` before considering a task complete
