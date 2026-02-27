import 'dotenv/config';

function required(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const config = {
  port: parseInt(optional('PORT', '3001'), 10),
  supabase: {
    url: required('SUPABASE_URL'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
    anonKey: optional('SUPABASE_ANON_KEY'),
  },
  tika: {
    url: optional('TIKA_URL', 'http://localhost:9998'),
  },
  github: {
    defaultToken: optional('GITHUB_TOKEN_DEFAULT'),
  },
  isDev: optional('NODE_ENV', 'development') === 'development',
} as const;
