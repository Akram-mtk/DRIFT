import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// Works whether prisma is invoked from apps/api (local scripts) or from the
// repo root (Render's build and pre-deploy commands). On Render neither file
// exists and DATABASE_URL simply comes from the environment.
config({ path: ['.env', 'apps/api/.env'] });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // tsx, not ts-node: the generated client imports with ".js" specifiers
    // that ts-node cannot resolve back to their ".ts" sources.
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
