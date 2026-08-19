// GitHubApiPublisher — publishes clips to a remote GitHub repository via
// the Git Data API (blobs → tree → commit → ref update). One coherent commit
// contains the markdown file and all assets. The ref update is fast-forward
// only (force: false).

import { GitHubClient, GitDataApi } from "../github";
import type { TreeEntry } from "../github";
import type { Publisher, PublishParams, PublishResult } from "./types";

export interface GitHubApiPublisherOptions {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  fetchFn?: typeof fetch;
  baseUrl?: string;
}

/**
 * Publishes clips to a GitHub repository via the Git Data REST API.
 *
 * Flow:
 *   1. GET branch ref → base commit SHA
 *   2. GET base commit → base tree SHA
 *   3. POST blobs for markdown (UTF-8) and each asset (base64)
 *   4. POST tree with all entries (base_tree, 100644 mode, nested paths)
 *   5. POST commit with the new tree and the base commit as parent
 *   6. PATCH branch ref (force: false — fast-forward only)
 *
 * The token is never printed, logged, or included in error messages.
 */
export class GitHubApiPublisher implements Publisher {
  private readonly gitData: GitDataApi;
  private readonly branch: string;

  constructor(options: GitHubApiPublisherOptions) {
    const client = new GitHubClient({
      token: options.token,
      owner: options.owner,
      repo: options.repo,
      fetchFn: options.fetchFn,
      baseUrl: options.baseUrl,
    });
    this.gitData = new GitDataApi(client);
    this.branch = options.branch;
  }

  async publish(params: PublishParams): Promise<PublishResult> {
    if (params.dryRun) {
      console.log("dry run: skipping GitHub API calls");
      return {
        mode: "remote",
        committed: false,
        pushed: false,
        location: "",
      };
    }

    // 1. Resolve the branch ref to get the base commit SHA
    const ref = await this.gitData.getRef(this.branch);
    const baseCommitSha = ref.object.sha;

    // 2. Get the base commit to find its tree SHA
    const baseCommit = await this.gitData.getCommit(baseCommitSha);
    const baseTreeSha = baseCommit.tree.sha;

    // 3. Create blobs and collect tree entries
    const entries: TreeEntry[] = [];

    // Markdown is always UTF-8 text
    const markdownBlob = await this.gitData.createBlob(params.markdownContent, "utf-8");
    entries.push({
      path: params.markdownPath,
      mode: "100644",
      type: "blob",
      sha: markdownBlob.sha,
    });

    // Assets are binary — encode as base64
    for (const asset of params.assets) {
      const base64Content = asset.buffer.toString("base64");
      const blob = await this.gitData.createBlob(base64Content, "base64");
      entries.push({
        path: asset.path,
        mode: "100644",
        type: "blob",
        sha: blob.sha,
      });
    }

    // 4. Create a tree with all entries, preserving existing files via base_tree
    const tree = await this.gitData.createTree(baseTreeSha, entries);

    // 5. Create a commit with the new tree and the base commit as parent
    const commit = await this.gitData.createCommit(tree.sha, [baseCommitSha], params.commitMessage);

    // 6. Update the branch ref (fast-forward only — force: false)
    await this.gitData.updateRef(this.branch, commit.sha, false);

    return {
      mode: "remote",
      committed: true,
      pushed: true,
      location: commit.sha,
    };
  }
}
