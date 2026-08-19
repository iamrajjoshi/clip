import { LocalGitPublisher } from "./local-git";
import type { Publisher } from "./types";

export interface PublisherFactoryOptions {
  repoRoot: string;
  /** True when --local flag is passed (forces local mode). */
  local: boolean;
  /** GitHub access token or null when not logged in. */
  token: string | null;
}

/**
 * Selects a publisher based on mode and token availability.
 *
 * - No token or --local flag → LocalGitPublisher (existing git behavior)
 * - Token and no --local → GitHubApiPublisher (remote mode)
 *
 * The remote publisher is implemented in a separate feature; until then
 * requesting remote mode throws a clear, actionable error.
 */
export function createPublisher(options: PublisherFactoryOptions): Publisher {
  const useLocal = options.local || !options.token;

  if (useLocal) {
    return new LocalGitPublisher({ repoRoot: options.repoRoot });
  }

  // GitHubApiPublisher will be implemented in a subsequent feature.
  throw new Error(
    "Remote publishing is not yet available. Use --local for local mode, or run 'clip login' first.",
  );
}

export { LocalGitPublisher } from "./local-git";
export type { GitExec, LocalGitPublisherOptions } from "./local-git";
export type { Publisher, PublishParams, PublishResult, Asset } from "./types";
