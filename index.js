import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

async function loadLatestProjects() {
  try {
    // Fetch all project data from the JSON file.
    const projects = await fetchJSON('./lib/projects.json');

    // Filter to get the first three projects.
    const latestProjects = projects.slice(0, 3);

    // Select the container where projects will be rendered.
    const projectsContainer = document.querySelector('.projects');

    // Render the latest projects using a dynamic heading level (h2).
    renderProjects(latestProjects, projectsContainer, 'h2');
  } catch (error) {
    console.error('Error loading latest projects:', error);
  }
}

async function loadGitHubProfile() {
  try {
    const githubData = await fetchGitHubData('Tinoco107');
    console.log('GitHub Data:', githubData);
    
    const profileStats = document.querySelector('#profile-stats');
    
    // Update the container with the GitHub data.
    if (profileStats) {
      profileStats.innerHTML = `
        <dl>
          <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
          <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
          <dt>Followers:</dt><dd>${githubData.followers}</dd>
          <dt>Following:</dt><dd>${githubData.following}</dd>
        </dl>
      `;
    }
  } catch (error) {
    console.error('Error loading GitHub data:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadLatestProjects();
  loadGitHubProfile();
});
