// Import D3 from the CDN
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
// Import global functions using the correct relative path
import { fetchJSON, renderProjects } from '../global.js';

// Global search query variable
let query = '';
// Global array to hold all projects once loaded
let allProjects = [];

/**
 * Loads the project JSON data, renders the projects list,
 * updates the title with the project count, and returns the projects.
 */
async function loadProjectsData() {
  try {
    const projects = await fetchJSON('lib/projects.json');
    const projectsContainer = document.querySelector('.projects');
    renderProjects(projects, projectsContainer, 'h2');

    const projectsTitleElem = document.querySelector('.projects-title');
    if (projectsTitleElem) {
      projectsTitleElem.textContent = `${projects.length} projects`;
    }
    return projects;
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
}

/**
 * Renders a pie chart and legend for the provided projects.
 * Projects are grouped by year using d3.rollups. Then, the grouped data is
 * mapped to an array of objects with properties 'value' (project count)
 * and 'label' (the year) to feed into the pie chart.
 *
 * @param {Array} projectsGiven - The array of projects to render stats for.
 */
function renderPieChart(projectsGiven) {
  // Select the SVG element for our pie chart and clear any previous content.
  const svg = d3.select('#projects-pie-plot');
  svg.selectAll('*').remove();

  // Group projects by year and count them.
  const rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );
  // Debug: log the rolled-up data.
  console.log('Rolled Data:', rolledData);

  // Map the rolled-up data to the required format: { value: count, label: year }
  const data = rolledData.map(([year, count]) => ({ value: count, label: year }));
  console.log('Legend Data:', data);

  // Create an arc generator (for a full pie chart, innerRadius = 0)
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  // Create a pie generator that uses the 'value' property.
  const pieGenerator = d3.pie().value((d) => d.value);
  const arcData = pieGenerator(data);

  // Set up an ordinal color scale (using d3.schemeTableau10).
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  // Render each pie slice as a <path> element.
  arcData.forEach((d, i) => {
    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(i));
  });

  // Build the legend: select the <ul class="legend"> element and clear any previous legend items.
  const legend = d3.select('.legend');
  legend.selectAll('*').remove();

  // For each datum, append an <li> element with a swatch and label.
  data.forEach((d, idx) => {
    legend.append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

// Initialize after the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', async () => {
  // Load all projects
  allProjects = await loadProjectsData();
  // Initial rendering of the pie chart for all projects.
  renderPieChart(allProjects);

  // Select the search input element.
  const searchInput = document.querySelector('.searchBar');
  // Also grab the projects container for re-rendering the project list.
  const projectsContainer = document.querySelector('.projects');

  // Attach an event listener for change events (you may also use 'input' for real-time updates).
  if (searchInput) {
    searchInput.addEventListener('change', (event) => {
      // Update the search query.
      query = event.target.value;
      // Filter projects based on a case-insensitive search across all project properties.
      const filteredProjects = allProjects.filter((project) => {
        const values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
      });

      // Re-render the projects list with the filtered array.
      renderProjects(filteredProjects, projectsContainer, 'h2');

      // Update the projects title with the new count.
      const projectsTitleElem = document.querySelector('.projects-title');
      if (projectsTitleElem) {
        projectsTitleElem.textContent = `${filteredProjects.length} projects`;
      }

      // Re-render the pie chart (and legend) based on the filtered projects.
      renderPieChart(filteredProjects);
    });
  } else {
    console.error("Search input element with class 'searchBar' not found in the DOM.");
  }
});
