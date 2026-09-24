const required = ['FIREBASE_PROJECT_ID', 'VITE_API_URL', 'VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_APP_ID', 'VITE_RECAPTCHA_ENTERPRISE_SITE_KEY'];
const absent = required.filter((key) => !process.env[key]);
if (absent.length || process.env.VITE_E2E_AUTH_BYPASS === 'true' || !process.env.VITE_API_URL?.startsWith('https://')) {
  console.error(JSON.stringify({ error: 'Release environment is incomplete or unsafe', missing: absent }));
  process.exitCode = 1;
} else console.info('Build configuration present. Human sign-offs, active memberships, source retention, IAM and backup recovery still require separate release evidence.');
