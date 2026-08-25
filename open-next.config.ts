import { defineCloudflareConfig } from '@opennextjs/cloudflare';

const config = defineCloudflareConfig();

export default {
  ...config,
  cloudflare: {
    ...config.cloudflare,
    // The libSQL web entry is already selected in src/db/index.ts. Disabling the
    // adapter's package-condition rewrite keeps pnpm's nested dependencies intact.
    useWorkerdCondition: false,
  },
  // Keep the ordinary Next build unchanged and use Webpack only for the Cloudflare target.
  buildCommand: 'pnpm cf:next-build',
};
