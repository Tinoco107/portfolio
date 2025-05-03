import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from 'global.js';

function loadProjectsData() {
  fetchJSON('lib/projects.json')
    .then(projects => {
      const projectsContainer = document.querySelector('.projects');
      renderProjects(projects, projectsContainer, 'h2');

      // Update projects title with count
      const projectsTitleElem = document.querySelector('.projects-title');
      if (projectsTitleElem) {
        projectsTitleElem.textContent = `Projects (${projects ? projects.length : 0})`;
      }
    })
    .catch(error => console.error('Error loading projects:', error));
}

// D3 pie chart code
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
