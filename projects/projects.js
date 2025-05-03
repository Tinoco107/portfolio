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
        // Change the title format from "Projects (12)" to "12 projects"
        const projectCount = projects ? projects.length : 0;
        projectsTitleElem.textContent = `${projectCount} projects`;
      }
    })
    .catch(error => console.error('Error loading projects:', error));
}

function drawPieChart() {
  const svg = d3.select('#projects-pie-plot');
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const data = [1, 2, 3, 4, 5, 5];
  const pieGenerator = d3.pie();
  const arcData = pieGenerator(data);
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  arcData.forEach((d, i) => {
    svg.append('path')
       .attr('d', arcGenerator(d))
       .attr('fill', colors(i));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadProjectsData();
  drawPieChart();
});
