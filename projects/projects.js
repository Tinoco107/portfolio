// Import D3 from the CDN
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Select the SVG element created in index.html
const svg = d3.select('#projects-pie-plot');

// Create an arc generator for our pie slices with an outer radius of 50
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// Data for our pie chart; using six slices now (e.g., [1, 2, 3, 4, 5, 5])
const data = [1, 2, 3, 4, 5, 5];

// Use D3's pie() function to generate start and end angles for each slice
const pieGenerator = d3.pie();
const arcData = pieGenerator(data);

// Define an ordinal color scale using Tableau10
const colors = d3.scaleOrdinal(d3.schemeTableau10);

// For every slice, append a <path> element to the SVG using the arc generator.
// Use the color scale to fill each slice.
arcData.forEach((d, i) => {
  svg.append('path')
     .attr('d', arcGenerator(d))
     .attr('fill', colors(i));
});
