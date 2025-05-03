// Import D3 from the CDN
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
// Import global functions using the correct relative path
import { fetchJSON, renderProjects } from '../global.js';

function loadProjectsData() {
  fetchJSON('lib/projects.json')
    .then(projects => {
      const projectsContainer = document.querySelector('.projects');
      renderProjects(projects, projectsContainer, 'h2');
      const projectsTitleElem = document.querySelector('.projects-title');
      if (projectsTitleElem) {
        const projectCount = projects ? projects.length : 0;
        projectsTitleElem.textContent = `${projectCount} Projects`;
      }
    })
    .catch(error => console.error('Error loading projects:', error));
}

function drawPieChart() {

  const data = [
    { value: 1, label: 'apples' },
    { value: 2, label: 'oranges' },
    { value: 3, label: 'mangos' },
    { value: 4, label: 'pears' },
    { value: 5, label: 'limes' },
    { value: 5, label: 'cherries' },
  ];

  // Select the SVG element by its id.
  const svg = d3.select('#projects-pie-plot');

  // Create an arc generator for pie slices (full circle; innerRadius = 0 for a traditional pie chart)
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

  // Use d3.pie() with a custom value accessor.
  const pieGenerator = d3.pie().value(d => d.value);
  const arcData = pieGenerator(data);

  // Define an ordinal color scale.
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  // Draw each pie slice as an SVG <path> element.
  arcData.forEach((d, i) => {
    svg.append('path')
       .attr('d', arcGenerator(d))
       .attr('fill', colors(i));
  });

  const legend = d3.select('.legend');
  data.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadProjectsData();
  drawPieChart();
});
