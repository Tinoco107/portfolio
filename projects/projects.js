import { fetchJSON, renderProjects } from '../global.js';

async function loadProjects() {
  try {
    // Adjust the path to your projects.json file to match your folder structure.
    const projects = await fetchJSON('lib/projects.json');
    const projectsContainer = document.querySelector('.projects');

    // Render the projects using a heading level of 'h2'
    renderProjects(projects, projectsContainer, 'h2');

    // BONUS: Update the projects title with a project count.
    const projectsTitleElem = document.querySelector('.projects-title');
    if (projectsTitleElem) {
      projectsTitleElem.textContent = `Projects (${projects ? projects.length : 0})`;
    }
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadProjects);
