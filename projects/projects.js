// Import D3 from the CDN.
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
// Import helper functions from our simplified global module.
import { fetchJSON, renderProjects } from "/global.js";

// Global search query (used by the search input).
let query = "";
// Global array holding all projects.
let allProjects = [];
// Global variable to track the selected wedge index (-1 means none selected).
let selectedIndex = -1;
// Global variable to store the current pie chart data.
let currentPieData = [];
// Global variable to store the currently selected year (null means no selection).
let selectedYear = null;

/**
 * Loads project JSON from "lib/projects.json", renders the projects list,
 * updates the project title with the count, and returns the projects.
 */
async function loadProjectsData() {
  try {
    const projects = await fetchJSON("lib/projects.json");
    const projectsContainer = document.querySelector(".projects");
    renderProjects(projects, projectsContainer, "h2");
    const projectsTitleElem = document.querySelector(".projects-title");
    if (projectsTitleElem) {
      projectsTitleElem.textContent = `${projects.length} projects`;
    }
    return projects;
  } catch (error) {
    console.error("Error loading projects:", error);
    return [];
  }
}

/**
 * Renders the pie chart and legend using the provided projects.
 * Projects are grouped by year using d3.rollups, then mapped to:
 * { value: count, label: year }.
 * Both the pie slices and legend items toggle selection on click.
 */
function renderPieChart(projectsGiven) {
  // Select and clear the SVG element.
  const svg = d3.select("#projects-pie-plot");
  svg.selectAll("*").remove();

  // Group projects by year.
  const rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );
  // Map rolled data to objects.
  const data = rolledData.map(([year, count]) => ({ value: count, label: year }));
  // Store globally for filtering.
  currentPieData = data;

  // Create an arc generator (for a pie chart).
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  // Create a pie generator.
  const pieGenerator = d3.pie().value((d) => d.value);
  const arcData = pieGenerator(data);
  // Set up an ordinal color scale.
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  // Render each pie slice.
  arcData.forEach((d, i) => {
    svg.append("path")
      .attr("d", arcGenerator(d))
      .attr("fill", colors(i))
      .style("cursor", "pointer")
      .on("click", function () {
        if (selectedIndex === i) {
          selectedIndex = -1;
          selectedYear = null;
        } else {
          selectedIndex = i;
          selectedYear = currentPieData[i].label;
        }
        updateHighlight();
        updateFilteringAndVisualization();
      })
      .transition().duration(300);
  });

  // Build the legend.
  const legend = d3.select(".legend");
  legend.selectAll("*").remove();
  data.forEach((d, idx) => {
    legend.append("li")
      .attr("style", `--color:${colors(idx)}`)
      .attr("class", "legend-item")
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .style("cursor", "pointer")
      .on("click", function () {
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
 * Updates highlighting on pie slices and legend items based on selectedYear.
 */
function updateHighlight() {
  // Update pie slices.
  const svg = d3.select("#projects-pie-plot");
  svg.selectAll("path")
    .attr("class", (d, idx) =>
      selectedYear && currentPieData[idx].label === selectedYear ? "selected" : ""
    );

  // Update legend items.
  const legend = d3.select(".legend");
  legend.selectAll("li")
    .attr("class", (d, idx) =>
      selectedYear && currentPieData[idx].label === selectedYear
        ? "legend-item selected"
        : "legend-item"
    );
}

/**
 * Filters projects and re-renders the projects list, title, and pie chart.
 */
function updateFilteringAndVisualization() {
  const projectsContainer = document.querySelector(".projects");
  const projectsTitleElem = document.querySelector(".projects-title");
  let filteredProjects = allProjects;

  if (query.trim() !== "") {
    filteredProjects = filteredProjects.filter(project => {
      const values = Object.values(project).join("\n").toLowerCase();
      return values.includes(query.toLowerCase());
    });
  }

  if (selectedIndex !== -1 && selectedYear) {
    filteredProjects = filteredProjects.filter(
      project => project.year.trim() === selectedYear.trim()
    );
  }

  renderProjects(filteredProjects, projectsContainer, "h2");
  if (projectsTitleElem) {
    projectsTitleElem.textContent = `${filteredProjects.length} projects`;
  }

  renderPieChart(filteredProjects);
  updateHighlight();
  console.log(`Selected Year: "${selectedYear}" - Query: "${query}" - Filtered Projects: ${filteredProjects.length}`);
}

document.addEventListener("DOMContentLoaded", async () => {
  allProjects = await loadProjectsData();
  renderPieChart(allProjects);

  const searchInput = document.querySelector(".searchBar");
  const projectsContainer = document.querySelector(".projects");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      selectedIndex = -1;
      selectedYear = null;
      query = event.target.value;
      const filteredProjects = allProjects.filter(project => {
        const values = Object.values(project).join("\n").toLowerCase();
        return values.includes(query.toLowerCase());
      });
      renderProjects(filteredProjects, projectsContainer, "h2");
      const projectsTitleElem = document.querySelector(".projects-title");
      if (projectsTitleElem) {
        projectsTitleElem.textContent = `${filteredProjects.length} projects`;
      }
      renderPieChart(filteredProjects);
    });
  } else {
    console.error("Search input element with class 'searchBar' not found.");
  }
});
