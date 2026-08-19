import { OAuthClient } from "../auth/oauth";
import { KeychainStore } from "../auth/keychain";

export interface LoginCommandOptions {
  oauth?: OAuthClient;
  keychain?: KeychainStore;
}

/** Run the login command: OAuth Device Flow → verify → store → print success. */
export async function runLoginCommand(options?: LoginCommandOptions): Promise<void> {
  const keychain = options?.keychain ?? new KeychainStore();
  const oauth = options?.oauth ?? new OAuthClient();

  // Check if already logged in
  const existingToken = await keychain.read();
  if (existingToken) {
    console.log("Already logged in. Run 'clip logout' first to switch accounts.");
    return;
  }

  // Run OAuth Device Flow
  const accessToken = await oauth.authenticate((info) => {
    console.log(`Please visit: ${info.verificationUri}`);
    console.log(`Enter code: ${info.userCode}`);
    console.log("");
    console.log("Waiting for authorization...");
  });

  // Verify token with GET /user
  const login = await oauth.verifyToken(accessToken);

  // Store token (Keychain on macOS, file fallback otherwise)
  await keychain.store(accessToken);

  // Print success message (without token)
  console.log(`Logged in as ${login}`);
}
