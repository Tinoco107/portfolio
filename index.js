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
    // Replace 'your-username' with your actual GitHub username.
    const githubData = await fetchGitHubData('your-username');
    console.log('GitHub Data:', githubData);
    // You can now update your DOM with githubData as needed.
  } catch (error) {
    console.error('Error loading GitHub data:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadLatestProjects();
  loadGitHubProfile();
});
