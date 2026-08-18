# Runbooks

## Failed deployment

1. Open the failed **Deploy Astro site to Pages** workflow run.
2. Re-run the failed build after checking the first failing step.
3. If the failure is caused by a content change, revert the offending commit,
   wait for the deployment workflow to complete, and verify the Pages URL.

## Local verification

Run `pnpm format:check`, `pnpm lint`, `pnpm test`, `pnpm check`, and `pnpm build`
before merging content or CLI changes.
