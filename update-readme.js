// update-readme.js
const fs = require('fs');
const { Octokit } = require('@octokit/rest');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // fourni par Actions
const USERNAME = process.env.GITHUB_ACTOR || 'ton-username'; // remplacer si besoin

if (!GITHUB_TOKEN) {
  console.error('Il faut définir GITHUB_TOKEN');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function main() {
  // Récupère les infos utilisateur
  const { data: user } = await octokit.users.getByUsername({ username: USERNAME });

  // Récupère le nombre total de repos publics (user.public_repos)
  const publicRepos = user.public_repos;
  const followers = user.followers;
  const following = user.following;

  // Récupérer nombre d'étoiles totales (nécessite parcourir les repos)
  let totalStars = 0;
  let page = 1;
  while (true) {
    const { data: repos } = await octokit.repos.listForUser({
      username: USERNAME,
      per_page: 100,
      page
    });
    if (repos.length === 0) break;
    for (const r of repos) totalStars += r.stargazers_count;
    page++;
  }

  const newSection = `<!--START_SECTION:stats-->
**Repos publics** : ${publicRepos}  
**Étoiles totales** : ${totalStars}  
**Followers** : ${followers}  
**Following** : ${following}
<!--END_SECTION:stats-->`;

  const readmePath = 'README.md';
  const md = fs.readFileSync(readmePath, 'utf8');

  const updated = md.replace(
    /<!--START_SECTION:stats-->[\s\S]*?<!--END_SECTION:stats-->/,
    newSection
  );

  if (md !== updated) {
    fs.writeFileSync(readmePath, updated, 'utf8');
    console.log('README mis à jour');
    process.exit(0);
  } else {
    console.log('Pas de changement');
    process.exit(0);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
