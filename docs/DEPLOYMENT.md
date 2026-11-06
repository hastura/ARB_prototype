# GitHub Pages preview

Target repository: [hastura/ARB_prototype](https://github.com/hastura/ARB_prototype).

Expected client URL after a successful deployment: [ARB client preview](https://hastura.github.io/ARB_prototype/). This address is a deployment target; a successful Actions run and an HTTP/browser check establish whether it is live.

## One-time repository setup

In the repository, open **Settings → Pages → Build and deployment → Source → GitHub Actions**. GitHub Pages must be available for the repository's visibility and account plan. The workflow uses the repository's automatic `GITHUB_TOKEN`; no personal access token or deployment secret is required.

The standalone `Prototype` directory is the repository root when pushed. Its `package.json`, `.github`, `src`, and `public` directories belong at the GitHub repository root.

## Main branch deployment

Every push to `main`, or a manual run of **QA and deploy client preview**, performs:

1. `npm ci` using the committed lockfile.
2. `npm run build` to create the static `dist` directory.
3. Version check of the Ubuntu 24.04 runner's preinstalled Google Chrome, followed by `npm run test:e2e` with Playwright's supported `chrome` channel (`PW_CHANNEL=chrome`). This avoids a separate apt/browser download during each run; it retains the complete browser suite. Local QA defaults to Playwright Chromium.
4. Upload of the tested build as a GitHub Pages artifact.
5. Deployment through the `github-pages` environment.

Deployment depends on the quality job succeeding. Failed browser tests prevent publication. Browser reports and failure evidence are retained as Actions artifacts for 14 days. Repository environment protection rules can require a reviewer before deployment; the workflow follows the repository's configured rules.

The static build uses relative asset paths, so it works below `/ARB_prototype/`. Browser routes use hashes; direct client links do not require server rewrites or custom 404 fallbacks.

## Pull requests

**Pull request preview QA** runs the same build and browser checks with read-only repository permissions. A successful run provides a downloadable static preview artifact and QA evidence. It does not deploy a separate hosted URL for each pull request. The published client preview remains the latest successful `main` deployment.

To view a downloaded artifact, extract it and start a static server in that directory, for example `npx serve .`. Opening `index.html` directly with a `file:` URL does not reliably support JavaScript modules.

## Local verification

Run from the repository root:

```text
npm ci
npx playwright install chromium
npm run build
npm run test:e2e
npm run preview -- --host 127.0.0.1
```

Use the server URL printed by Vite. The Playwright configuration starts its own preview server when needed. Review all Home alternatives and the complete journey in desktop and mobile viewports; verify browser back/forward, keyboard focus, menu/dialog closing and focus return, FAQ disclosure, and reduced-motion behavior. Confirm unavailable source content remains clearly identified and no mock payment, episode, policy, or contact information is presented as final.

## Official references

- [GitHub: custom workflows with Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub: configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub: checkout action](https://github.com/actions/checkout)
- [GitHub: setup-node action](https://github.com/actions/setup-node)
- [GitHub: upload-artifact action](https://github.com/actions/upload-artifact)
- [GSAP: matchMedia for responsive and reduced motion behavior](https://gsap.com/docs/v3/GSAP/gsap.matchMedia())
- [GSAP: ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
