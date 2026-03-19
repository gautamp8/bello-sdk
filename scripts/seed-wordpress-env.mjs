import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const wpEnvConfig = 'docs/wordpress/.wp-env.json';
const shortcode = '[zaidop_bello_widget]';
const pageSlug = 'bello-widget-demo';
const pageTitle = 'Bello Widget Demo';

runWp(['plugin', 'activate', 'bello-widget']);

updateOptionFromEnv(
  'BELLO_WORDPRESS_PROJECT_ID',
  'zaidop_bello_widget_project_id'
);
updateOptionFromEnv(
  'BELLO_WORDPRESS_WIDGET_API_KEY',
  'zaidop_bello_widget_widget_api_key'
);
updateOptionFromEnv(
  'BELLO_WORDPRESS_API_BASE_URL',
  'zaidop_bello_widget_api_base_url'
);

const existingId = runWp(
  ['post', 'list', '--post_type=page', `--name=${pageSlug}`, '--format=ids'],
  { capture: true }
).trim();

const pageId = existingId
  ? updatePage(existingId)
  : createPage();

const homeUrl = runWp(['option', 'get', 'home'], { capture: true }).trim();

console.log(`Seeded demo page: ${homeUrl}/?page_id=${pageId}`);

function createPage() {
  return runWp(
    [
      'post',
      'create',
      `--post_title=${pageTitle}`,
      `--post_name=${pageSlug}`,
      '--post_type=page',
      '--post_status=publish',
      `--post_content=${shortcode}`,
      '--porcelain',
    ],
    { capture: true }
  ).trim();
}

function updatePage(pageId) {
  runWp([
    'post',
    'update',
    pageId,
    `--post_title=${pageTitle}`,
    '--post_status=publish',
    `--post_content=${shortcode}`,
  ]);
  return pageId;
}

function updateOptionFromEnv(envKey, optionKey) {
  const value = process.env[envKey];
  if (!value) {
    return;
  }

  runWp(['option', 'update', optionKey, value]);
}

function runWp(args, options = {}) {
  const command = [
    'exec',
    'wp-env',
    `--config=${wpEnvConfig}`,
    'run',
    'cli',
    'wp',
    ...args,
    '--allow-root',
  ];

  const result = spawnSync(pnpmCmd, command, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: options.capture ? ['inherit', 'pipe', 'inherit'] : 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return options.capture ? result.stdout : '';
}
