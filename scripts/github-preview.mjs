// Target-scoped GitHub administration. Credentials remain in this process only.
// Commands: status | runs | run <id> | jobs <id> | enable-pages
import { spawnSync } from 'node:child_process';

const repository = 'hastura/ARB_prototype';
const apiBase = `https://api.github.com/repos/${repository}`;
const [command = 'status', runId] = process.argv.slice(2);
const allowed = new Set(['status', 'runs', 'run', 'jobs', 'enable-pages']);
if (!allowed.has(command) || (['run', 'jobs'].includes(command) && !/^\d+$/.test(runId ?? ''))) {
  console.error('Usage: node scripts/github-preview.mjs status|runs|run <id>|jobs <id>|enable-pages');
  process.exit(2);
}

let secret = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
let authRoute = secret ? 'standard-token-environment' : 'anonymous';
if (!secret) {
  const credential = spawnSync('git', ['credential', 'fill'], {
    input: 'protocol=https\nhost=github.com\npath=hastura/ARB_prototype.git\n\n',
    encoding: 'utf8',
    windowsHide: true,
    timeout: 15000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (credential.status === 0) {
    // Never forward the credential helper's raw output or diagnostics.
    const passwordLine = credential.stdout.split(/\r?\n/).find((line) => line.startsWith('password='));
    secret = passwordLine?.slice('password='.length) || '';
    if (secret) authRoute = 'git-credential-helper';
  }
}

const headers = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2026-03-10',
  'User-Agent': 'ARB-prototype-deployment',
};
if (secret) headers.Authorization = `Bearer ${secret}`;

async function request(path = '', options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: { ...headers, ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
    signal: AbortSignal.timeout(20000),
    redirect: 'error',
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { /* No raw response output. */ }
  return { status: response.status, data };
}

function runSummary(run) {
  return {
    id: run.id,
    name: run.name,
    event: run.event,
    status: run.status,
    conclusion: run.conclusion,
    head_branch: run.head_branch,
    head_sha: run.head_sha,
    html_url: run.html_url,
    created_at: run.created_at,
    updated_at: run.updated_at,
  };
}

function pageSummary(page) {
  return page && {
    html_url: page.html_url,
    status: page.status,
    build_type: page.build_type,
    public: page.public,
    https_enforced: page.https_enforced,
    source: page.source,
  };
}

try {
  let result;
  if (command === 'status') {
    const [repo, pages, runs] = await Promise.all([
      request(), request('/pages'), request('/actions/runs?per_page=5'),
    ]);
    result = {
      repository, auth_route: authRoute,
      repo: {
        http_status: repo.status,
        ...(repo.status === 200 ? {
          full_name: repo.data.full_name,
          html_url: repo.data.html_url,
          visibility: repo.data.visibility,
          private: repo.data.private,
          default_branch: repo.data.default_branch,
          size: repo.data.size,
          archived: repo.data.archived,
          disabled: repo.data.disabled,
          permissions: repo.data.permissions,
          pushed_at: repo.data.pushed_at,
        } : { message: repo.data?.message }),
      },
      pages: { http_status: pages.status, ...(pages.status === 200 ? pageSummary(pages.data) : { message: pages.data?.message }) },
      runs: { http_status: runs.status, total_count: runs.data?.total_count, runs: runs.data?.workflow_runs?.map(runSummary) },
    };
  } else if (command === 'runs') {
    const response = await request('/actions/runs?per_page=10');
    result = { repository, http_status: response.status, total_count: response.data?.total_count, runs: response.data?.workflow_runs?.map(runSummary), message: response.data?.message };
  } else if (command === 'run') {
    const response = await request(`/actions/runs/${runId}`);
    result = { repository, http_status: response.status, ...(response.status === 200 ? runSummary(response.data) : { message: response.data?.message }) };
  } else if (command === 'jobs') {
    const response = await request(`/actions/runs/${runId}/jobs?per_page=100`);
    result = {
      repository, http_status: response.status,
      jobs: response.data?.jobs?.map((job) => ({
        id: job.id, name: job.name, status: job.status, conclusion: job.conclusion,
        html_url: job.html_url,
        steps: job.steps?.map((step) => ({ name: step.name, status: step.status, conclusion: step.conclusion })),
      })),
      message: response.data?.message,
    };
  } else if (command === 'enable-pages') {
    if (!secret) throw new Error('GitHub authentication is required to configure Pages.');
    const current = await request('/pages');
    if (![200, 404].includes(current.status)) {
      result = { repository, http_status: current.status, message: current.data?.message, changed: false };
    } else if (current.status === 200 && current.data.build_type === 'workflow') {
      result = { repository, http_status: 200, changed: false, pages: pageSummary(current.data) };
    } else {
      const update = await request('/pages', {
        method: current.status === 200 ? 'PUT' : 'POST',
        body: JSON.stringify({ build_type: 'workflow' }),
      });
      const verify = [201, 204].includes(update.status) ? await request('/pages') : null;
      result = {
        repository, http_status: update.status,
        changed: [201, 204].includes(update.status),
        message: update.data?.message,
        pages: verify?.status === 200 ? pageSummary(verify.data) : undefined,
      };
    }
  }
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  // Do not serialize request objects, headers, credential output or process env.
  console.error(JSON.stringify({ repository, command, error: error.name, message: error.message === 'GitHub authentication is required to configure Pages.' ? error.message : 'GitHub request failed; check network access and target repository permissions.' }));
  process.exitCode = 1;
}
