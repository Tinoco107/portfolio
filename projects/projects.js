// Import D3 from the CDN
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
// Import global functions using the correct relative path
import { fetchJSON, renderProjects } from '../global.js';

// Global variable to hold all projects data
let allProjects = [];

/**
 * Loads the project JSON data, renders the project list,
 * updates the title with the project count, and returns the projects.
 */
function loadProjectsData() {
  return fetchJSON('lib/projects.json')
    .then(projects => {
      const projectsContainer = document.querySelector('.projects');
      renderProjects(projects, projectsContainer, 'h2');
      const projectsTitleElem = document.querySelector('.projects-title');
      if (projectsTitleElem) {
        projectsTitleElem.textContent = `${projects.length} projects`;
      }
      return projects;
    })
    .catch((error) => {
      console.error('Error loading projects:', error);
      return [];
    });
}

/**
 * Renders the pie chart and legend for the given projects.
 * It groups the projects by year and then uses D3 to calculate the
 * pie slices and create a corresponding legend.
 *
 * @param {Array} projectsGiven - Array of projects to render stats for.
 */
function renderPieChart(projectsGiven) {
  // Select the SVG element and clear any existing content
  const svg = d3.select('#projects-pie-plot');
  svg.selectAll('*').remove();

  // Group projects by year using d3.rollups
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );
  // Debug output: check rolled-up results
  console.log('Rolled Data:', rolledData);

  // Map the rolled data into the format needed for the pie chart
  // { value: count, label: year }
  let data = rolledData.map(([year, count]) => ({ value: count, label: year }));
  console.log('Legend Data:', data);

  // Create an arc generator for pie slices (innerRadius = 0 => pie chart)
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  // Create the pie generator; value() accessor now pulls d.value
  const pieGenerator = d3.pie().value((d) => d.value);
  let arcData = pieGenerator(data);

  // Define an ordinal color scale (using Tableau10)
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  // Render pie slices: append a <path> element for each slice
  arcData.forEach((d, i) => {
    svg.append('path')
       .attr('d', arcGenerator(d))
       .attr('fill', colors(i));
  });

  // Update the legend
  const legend = d3.select('.legend');
  legend.selectAll('*').remove(); // Clear previous legend items

  data.forEach((d, idx) => {
    legend.append('li')
          .attr('style', `--color:${colors(idx)}`)
          .attr('class', 'legend-item')
          .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // Load projects data & render initial project list and pie chart
  allProjects = await loadProjectsData();
  renderPieChart(allProjects);

  // Add search functionality for filtering projects and updating stats
  const searchInput = document.querySelector('.searchBar');
  const projectsContainer = document.querySelector('.projects');

  searchInput.addEventListener('input', (event) => {
    // Update query and filter projects (case-insensitive over all properties)
    const query = event.target.value.toLowerCase();
    const filteredProjects = allProjects.filter((project) => {
      const values = Object.values(project).join('\n').toLowerCase();
      return values.includes(query);
    });

    // Re-render the project list with filtered projects
    renderProjects(filteredProjects, projectsContainer, 'h2');

    // Update the projects title with the new count
    const projectsTitleElem = document.querySelector('.projects-title');
    if (projectsTitleElem) {
      projectsTitleElem.textContent = `${filteredProjects.length} projects`;
    }

    // Re-render the pie chart and legend based only on the filtered projects
    renderPieChart(filteredProjects);
  });
});
