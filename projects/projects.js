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
  // Use d3.rollups to group projects by year and count them
  let rolledData = d3.rollups(
    projects,
    v => v.length,
    d => d.year
  );

  // Convert the rolled-up data into the format needed for the pie chart:
  // [{ value: count, label: year }, …]
  let data = rolledData.map(([year, count]) => ({ value: count, label: year }));

  // Select the SVG element by its id and clear previous content if any
  const svg = d3.select('#projects-pie-plot');
  svg.selectAll("*").remove();

  // Create an arc generator for each pie slice (innerRadius=0 gives a pie chart)
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

  // Create the pie generator; use the object's "value" property
  const pieGenerator = d3.pie().value(d => d.value);
  const arcData = pieGenerator(data);

  // Define an ordinal color scale (using d3.schemeTableau10)
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  // Render each slice as a <path> element
  arcData.forEach((d, i) => {
    svg.append('path')
       .attr('d', arcGenerator(d))
       .attr('fill', colors(i));
  });

  // Build the legend below the pie chart
  // Select the <ul class="legend"> element and clear any existing legend items
  const legend = d3.select('.legend');
  legend.selectAll("*").remove();

  // For each data point, create a legend item that specifies the label and value
  data.forEach((d, idx) => {
    legend.append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // First, load the project data, then render the pie chart with that data.
  const projects = await loadProjectsData();
  drawPieChart(projects);
});
