// Release data only after Cloudflare successfully deployed this exact main commit.
const repository = process.env.GITHUB_REPOSITORY;
const sha = process.env.GITHUB_SHA;
const token = process.env.GITHUB_TOKEN;
if (!repository || !sha || !token) throw new Error('Missing GitHub workflow context');
const url = `https://api.github.com/repos/${repository}/commits/${sha}/check-runs`;
for (let attempt = 0; attempt < 100; attempt++) {
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' },
  });
  if (!response.ok) throw new Error(`Reading deployment check failed: ${response.status}`);
  const { check_runs: checks } = await response.json();
  const pages = checks.find(
    (check) =>
      check.name === 'Cloudflare Pages' && check.details_url?.includes('/pages/view/new-learn/'),
  );
  if (pages?.status === 'completed') {
    if (pages.conclusion !== 'success')
      throw new Error(`Cloudflare deployment: ${pages.conclusion}`);
    console.log(`Cloudflare deployed ${sha}; content sync can proceed.`);
    process.exit(0);
  }
  await new Promise((resolve) => setTimeout(resolve, 6000));
}
throw new Error('Cloudflare deployment did not succeed within ten minutes; content not released.');
