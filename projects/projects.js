// Import D3 from the CDN
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
// Import global functions using the correct relative path
import { fetchJSON, renderProjects } from '../global.js';

// Global search query (used by the search input)
let query = '';
// Global array holding all projects (from the JSON file)
let allProjects = [];
// Global variable to track the selected wedge index (-1 = none selected)
let selectedIndex = -1;
// Global variable to store the current pie chart data (to use in filtering)
let currentPieData = [];
// Global variable to store the currently selected year (null means no selection)
let selectedYear = null; 

/**
 * Loads project JSON from `lib/projects.json`, renders the projects list,
 * updates the project title with the count, and returns the projects.
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
 * Renders the pie chart and legend using the provided projects.
 * Projects are grouped by year using d3.rollups, and then mapped to the format:
 * { value: count, label: year }.
 * Both the pie slices and legend items receive click events to toggle selection.
 *
 * @param {Array} projectsGiven - Array of projects to visualize.
 */
function renderPieChart(projectsGiven) {
  // Select and clear the SVG element
  const svg = d3.select('#projects-pie-plot');
  svg.selectAll('*').remove();

  // Group projects by year (count the number per year)
  const rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );
  // Map the rolled data to the format needed for the pie chart.
  // E.g., { value: count, label: year }
  const data = rolledData.map(([year, count]) => ({ value: count, label: year }));
  // Store the data globally so that we can use it when filtering projects.
  currentPieData = data;

  // Set up an arc generator (inner radius = 0 => pie chart)
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  // Create a pie generator that uses the 'value' property.
  const pieGenerator = d3.pie().value((d) => d.value);
  const arcData = pieGenerator(data);
  // Set up the ordinal color scale using d3.schemeTableau10.
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  // Render each pie slice, adding a click listener to toggle selection.
  arcData.forEach((d, i) => {
    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(i))
      .style('cursor', 'pointer')
      .on('click', function (event, datum) {
         // Toggle selection: if this wedge is already selected, deselect it;
         // otherwise, select it.
         if (selectedIndex === i) {
           selectedIndex = -1;
           selectedYear = null;
         } else {
           selectedIndex = i;
           // Set selectedYear to the label of the clicked wedge.
           selectedYear = currentPieData[i].label;
         }
         updateHighlight();
         updateFilteringAndVisualization();
      })
      .transition().duration(300);
  });

  // Build the legend by selecting the <ul class="legend"> element and clearing it.
  const legend = d3.select('.legend');
  legend.selectAll('*').remove();
  data.forEach((d, idx) => {
    legend.append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .style('cursor', 'pointer')
      .on('click', function(event, datum) {
         // Toggle the same way as the wedge.
         if (selectedIndex === idx) {
           selectedIndex = -1;
           selectedYear = null;
         } else {
           selectedIndex = idx;
           selectedYear = currentPieData[idx].label;
         }
         updateHighlight();
         updateFilteringAndVisualization();
      });
  });
}

/**
 * Updates the highlighting on pie slices and legend items based on the selectedIndex.
 * The selected wedge and corresponding legend item get the 'selected' class.
 */
function updateHighlight() {
  // Update pie slices: if the slice's corresponding year matches selectedYear, add the class.
  const svg = d3.select('#projects-pie-plot');
  svg.selectAll('path')
     .attr('class', function(d, idx) {
       return (selectedYear && currentPieData[idx].label === selectedYear)
         ? 'selected'
         : '';
     });

  // Update legend items in a similar way.
  const legend = d3.select('.legend');
  legend.selectAll('li')
        .attr('class', function(d, idx) {
          return (selectedYear && currentPieData[idx].label === selectedYear)
            ? 'legend-item selected'
            : 'legend-item';
        });
}

/**
 * Filters the projects and re-renders the projects list, project title,
 * and the pie chart based on the selected wedge.
 * If no wedge is selected (selectedIndex === -1), the full projects list is shown.
 * Otherwise, only projects for the selected year are shown.
 */
function updateFilteringAndVisualization() {
  const projectsContainer = document.querySelector('.projects');
  const projectsTitleElem = document.querySelector('.projects-title');

  // Filter projects based on selectedYear if a wedge is selected.
  let filteredProjects;
  if (selectedIndex !== -1 && selectedYear && typeof selectedYear === "string") {
    filteredProjects = allProjects.filter(
      project => project.year.trim() === selectedYear.trim()
    );
  } else {
    filteredProjects = allProjects;
  }

  // Render the filtered projects list.
  renderProjects(filteredProjects, projectsContainer, 'h2');
  if (projectsTitleElem) {
    projectsTitleElem.textContent = `${filteredProjects.length} projects`;
  }

  // To keep the wedge grouping consistent, re-render the pie chart using the full dataset.
  renderPieChart(allProjects);
  // Reapply highlights after re-rendering.
  updateHighlight();

  // Debug output to check selected year and filtered projects.
  console.log(`Selected Year: "${selectedYear}" - Filtered Projects: ${filteredProjects.length}`);
}

document.addEventListener('DOMContentLoaded', async () => {
  // Load the full set of projects.
  allProjects = await loadProjectsData();
  // Render the initial pie chart based on all projects.
  renderPieChart(allProjects);

  // Set up search functionality.
  const searchInput = document.querySelector('.searchBar');
  const projectsContainer = document.querySelector('.projects');
  if (searchInput) {
    // Use the 'input' event for real-time updates as you type.
    searchInput.addEventListener('input', (event) => {
      // Reset any wedge selection when using the search.
      selectedIndex = -1;
      selectedYear = null;
      query = event.target.value;
      // Filter projects based on all properties (case-insensitive).
      const filteredProjects = allProjects.filter(project => {
        const values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
      });
      renderProjects(filteredProjects, projectsContainer, 'h2');
      const projectsTitleElem = document.querySelector('.projects-title');
      if (projectsTitleElem) {
        projectsTitleElem.textContent = `${filteredProjects.length} projects`;
      }
      // Re-render the pie chart based on the search-filtered projects.
      renderPieChart(filteredProjects);
    });
  } else {
    console.error("Search input element with class 'searchBar' not found in the DOM.");
  }
});
