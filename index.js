import { fetchJSON, renderProjects } from './global.js';

async function loadLatestProjects() {
  try {
    // Fetch all project data from the JSON file
    const projects = await fetchJSON('./lib/projects.json');

    // Filter to get the first three projects
    const latestProjects = projects.slice(0, 3);

    // Select the container where projects will be rendered
    const projectsContainer = document.querySelector('.projects');

    // Render the latest projects using a dynamic heading level (h2)
    renderProjects(latestProjects, projectsContainer, 'h2');
  } catch (error) {
    console.error('Error loading latest projects:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadLatestProjects);
