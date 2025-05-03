// Import D3 from the CDN
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
// Import global functions using the correct relative path
import { fetchJSON, renderProjects } from '../global.js';

function loadProjectsData() {
  // Return the fetched project data (and render the projects list)
  return fetchJSON('lib/projects.json')
    .then(projects => {
      const projectsContainer = document.querySelector('.projects');
      renderProjects(projects, projectsContainer, 'h2');

      const projectsTitleElem = document.querySelector('.projects-title');
      if (projectsTitleElem) {
        const projectCount = projects ? projects.length : 0;
        // Update title to "12 projects" rather than "Projects (12)"
        projectsTitleElem.textContent = `${projectCount} projects`;
      }
      return projects;
    })
    .catch(error => {
      console.error('Error loading projects:', error);
      return [];
    });
}

function drawPieChart(projects) {
  // Group projects by year using d3.rollups:
  let rolledData = d3.rollups(
    projects,
    v => v.length,
    d => d.year
  );
  console.log('Rolled Data:', rolledData);

  // Transform rolledData into an array of objects with `value` and `label` keys
  let data = rolledData.map(([year, count]) => ({ value: count, label: year }));
  console.log('Legend Data:', data);

  // Select the SVG element by its id and clear previous content if any
  const svg = d3.select('#projects-pie-plot');
  svg.selectAll("*").remove();

  // Create an arc generator for each pie slice (inner radius = 0 gives a pie chart)
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

  // Create the pie generator; use the object's "value" property for the slice sizes
  const pieGenerator = d3.pie().value(d => d.value);
  const arcData = pieGenerator(data);

  // Define an ordinal color scale using d3.schemeTableau10
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  // Render each slice as a <path> element
  arcData.forEach((d, i) => {
    svg.append('path')
       .attr('d', arcGenerator(d))
       .attr('fill', colors(i));
  });

  // Build the legend below the pie chart.
  // Select the <ul class="legend"> element and clear previous content
  const legend = d3.select('.legend');
  legend.selectAll("*").remove();

  // Create a legend item for each data point
  data.forEach((d, idx) => {
    legend.append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // Fetch your project data and then draw the pie chart with that data.
  const projects = await loadProjectsData();
  drawPieChart(projects);
});
