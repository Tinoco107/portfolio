import { fetchJSON, renderProjects } from '../global.js';

async function loadProjects() {
  try {
    // Fetch project data from the JSON file. Adjust the path if needed.
    const projects = await fetchJSON('lib/projects.json');
    const projectsContainer = document.querySelector('.projects');

    // Render the projects using a dynamic heading level (e.g., h2).
    renderProjects(projects, projectsContainer, 'h2');

    // BONUS: Update the projects title with a count.
    const projectsTitleElem = document.querySelector('.projects-title');
    if (projectsTitleElem) {
      projectsTitleElem.textContent = `Projects (${projects ? projects.length : 0})`;
    }
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadProjects);
