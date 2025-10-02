import { keys as auth } from '@repo/auth/keys';
import { createEnv } from '@t3-oss/env-nextjs';

export const env = createEnv({
  extends: [
    auth(),
  ],
  server: {},
  client: {},
  runtimeEnv: {},
});
