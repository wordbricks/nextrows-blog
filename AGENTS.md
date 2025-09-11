This is Wordbricks blog repository.

## IMPORTANT

- Try to keep things in one function unless composable or reusable
- DO NOT do unnecessary destructuring of variables
- AVOID `try`/`catch` where possible
- AVOID `else` statements
- AVOID using `any` type
- AVOID using `as` assertion
- AVOID `let` statements
- DO NOT care about backward compatibility unless user mentioned to do so.
- DO NOT use alias or re-export. Edit the existing code in-place.
- We have `"strict": true` in TSConfig.

### Commands
- lint: `npm run lint`
- format: `npm run format`
- typecheck: `npm run check-types`
- Don't run `build` manually

## Code Style

- **Runtime**: Bun with TypeScript ESM modules
- **Imports**: Use absolute import

When you need to better understand how to use a package/library consider using the context7 tool to search information about the library
