import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import scrollama from "https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm";

// Global variables for data and scales.
let data, commits;
let xScale, yScale;

// --------------------------------------------------------------------------
// Data Loading and Processing
// --------------------------------------------------------------------------
async function loadData() {
  const data = await d3.csv("meta/loc.csv", (row) => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + "T00:00" + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  let commits = d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: "https://github.com/vis-society/lab-7/commit/" + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };
      Object.defineProperty(ret, "lines", {
        value: lines,
        writable: false,
        configurable: false,
        enumerable: false,
      });
      return ret;
    })
    .sort((a, b) => a.datetime - b.datetime); // Ensure chronological order.
  return commits;
}

// --------------------------------------------------------------------------
// Render Aggregate Statistics
// --------------------------------------------------------------------------
function renderCommitInfo(data, commits) {
  const dl = d3.select("#stats").append("dl").attr("class", "stats");

  dl.append("dt").html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append("dd").text(data.length);

  dl.append("dt").text("Total commits");
  dl.append("dd").text(commits.length);

  const filesMap = d3.group(data, (d) => d.filename);
  dl.append("dt").text("Unique files");
  dl.append("dd").text(filesMap.size);

  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (d) => d.line),
    (d) => d.filename
  );
  const longestFile = fileLengths.reduce(
    (a, b) => (b[1] > a[1] ? b : a),
    ["", 0]
  );
  dl.append("dt").html("Longest file");
  dl.append("dd").text(`${longestFile[0]} (${longestFile[1]} LOC)`);

  const avgFileLength = d3.mean(fileLengths, (d) => d[1]);
  dl.append("dt").html('Avg file <abbr title="Lines of Code">LOC</abbr>');
  dl.append("dd").text(Math.round(avgFileLength));

  const avgDepth = d3.mean(data, (d) => d.depth);
  dl.append("dt").text("Avg depth");
  dl.append("dd").text(avgDepth.toFixed(2));

  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) =>
      new Date(d.datetime).toLocaleString("en", {
        hour: "numeric",
        hour12: true,
        dayPeriod: "short",
      })
  );
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
  dl.append("dt").html("Peak period");
  dl.append("dd").text(maxPeriod);
}

// --------------------------------------------------------------------------
// Tooltip Functions
// --------------------------------------------------------------------------
function renderTooltipContent(commit) {
  const link = document.getElementById("commit-link");
  const date = document.getElementById("commit-date");
  if (Object.keys(commit).length === 0) {
    link.href = "";
    link.textContent = "";
    date.textContent = "";
    return;
  }
  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString("en", {
    dateStyle: "full",
    timeStyle: "short",
  });
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById("commit-tooltip");
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById("commit-tooltip");
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

// --------------------------------------------------------------------------
// Scatter Plot Rendering and Updating
// --------------------------------------------------------------------------
function renderScatterPlot(data, commits) {
  const width = 1000,
    height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("overflow", "visible");

  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();
  yScale = d3.scaleLinear().domain([0, 24]).range([usableArea.bottom, usableArea.top]);

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, "0") + ":00");

  svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  svg
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  const gridlines = svg.append("g")
    .attr("class", "gridlines")
    .attr("transform", `translate(${usableArea.left}, 0)`);
  gridlines
    .call(
      d3.axisLeft(yScale)
        .tickFormat("")
        .tickSize(-usableArea.width)
    )
    .selectAll("line")
    .attr("stroke", "#444")
    .attr("stroke-opacity", 0.5)
    .attr("stroke-dasharray", "4,4");
  gridlines.lower();

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  const dots = svg.append("g").attr("class", "dots");
  dots
    .selectAll("circle")
    .data(sortedCommits, (d) => d.id)
    .join("circle")
    .attr("cx", (d) => xScale(d.datetime))
    .attr("cy", (d) => yScale(d.hourFrac))
    .attr("r", (d) => rScale(d.totalLines))
    .attr("fill", "steelblue")
    .style("fill-opacity", 0.7)
    .on("mouseenter", (event, commit) => {
      d3.select(event.currentTarget).style("fill-opacity", 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on("mouseleave", (event) => {
      d3.select(event.currentTarget).style("fill-opacity", 0.7);
      updateTooltipVisibility(false);
    });

  console.log(commits);
}

function updateScatterPlot(data, commits) {
  const width = 1000,
    height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select("#chart").select("svg");
  xScale.domain(d3.extent(commits, (d) => d.datetime));
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);
  const xAxis = d3.axisBottom(xScale);

  const xAxisGroup = svg.select("g.x-axis");
  xAxisGroup.selectAll("*").remove();
  xAxisGroup.call(xAxis);

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  const dots = svg.select("g.dots");
  dots
    .selectAll("circle")
    .data(sortedCommits, (d) => d.id)
    .join("circle")
    .attr("cx", (d) => xScale(d.datetime))
    .attr("cy", (d) => yScale(d.hourFrac))
    .attr("r", (d) => rScale(d.totalLines))
    .attr("fill", "steelblue")
    .style("fill-opacity", 0.7)
    .on("mouseenter", (event, commit) => {
      d3.select(event.currentTarget).style("fill-opacity", 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on("mouseleave", (event) => {
      d3.select(event.currentTarget).style("fill-opacity", 0.7);
      updateTooltipVisibility(false);
    });
}

// --------------------------------------------------------------------------
// File Unit Visualization
// --------------------------------------------------------------------------
function updateFileDisplay(filteredCommits) {
  let lines = filteredCommits.flatMap((d) => d.lines);
  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length);

  let filesContainer = d3
    .select("#files")
    .selectAll("div")
    .data(files, (d) => d.name)
    .join((enter) =>
      enter.append("div").call((div) => {
        div.append("dt").append("code");
        div.append("dd");
      })
    );

  filesContainer
    .select("dt > code")
    .html((d) => `${d.name}<small>${d.lines.length} lines</small>`);
  filesContainer
    .select("dd")
    .html("")
    .selectAll("div")
    .data((d) => d.lines)
    .join("div")
    .attr("class", "loc");
}

// --------------------------------------------------------------------------
// Scrollytelling for Scatter Plot Narratives
// --------------------------------------------------------------------------
function generateCommitSteps(commits) {
  d3.select("#scatter-story")
    .selectAll(".step")
    .data(commits)
    .join("div")
    .attr("class", "step")
    .html((d, i) => `
      On ${d.datetime.toLocaleString("en", { dateStyle: "full", timeStyle: "short" })},
      I made <a href="${d.url}" target="_blank">${
    i > 0 ? "another glorious commit" : "my first commit, and it was glorious"
  }</a>.
      I edited ${d.totalLines} lines across ${
    d3.rollups(d.lines, (D) => D.length, (d) => d.file).length
  } files.
      Then I knew my work was awesome.
    `)
    .style("padding-bottom", "4rem");
}

// --------------------------------------------------------------------------
// Scrollytelling for File Visualization Narratives
// --------------------------------------------------------------------------
// Now generate steps that look exactly the same as for commits.
function generateFileSteps(commits) {
  d3.select("#files-story")
    .selectAll(".step")
    .data(commits)
    .join("div")
    .attr("class", "step")
    .html((d, i) => `
      On ${d.datetime.toLocaleString("en", { dateStyle: "full", timeStyle: "short" })},
      I made <a href="${d.url}" target="_blank">${
    i > 0 ? "another glorious commit" : "my first commit, and it was glorious"
  }</a>.
      I edited ${d.totalLines} lines across ${
    d3.rollups(d.lines, (D) => D.length, (d) => d.file).length
  } files.
      Then I knew my work was awesome.
    `)
    .style("padding-bottom", "4rem");
}

// --------------------------------------------------------------------------
// Scrollama Setup for Scatter Plot
// --------------------------------------------------------------------------
function onScatterStepEnter(response) {
  const commitDate = response.element.__data__.datetime;
  const filtered = commits.filter((d) => d.datetime <= commitDate);
  updateScatterPlot(data, filtered);
  console.log("Scatter step entered:", commitDate);
}

function initScatterScrollama() {
  scrollama()
    .setup({
      container: "#scrolly-1",
      step: "#scrolly-1 .step",
    })
    .onStepEnter(onScatterStepEnter);
}

// --------------------------------------------------------------------------
// Scrollama Setup for File Visualization
// --------------------------------------------------------------------------
function onFileStepEnter(response) {
  const commitDate = response.element.__data__.datetime;
  const filtered = commits.filter((d) => d.datetime <= commitDate);
  updateFileDisplay(filtered);
  console.log("File step entered:", commitDate);
}

function initFileScrollama() {
  scrollama()
    .setup({
      container: "#scrolly-2",
      step: "#scrolly-2 .step",
    })
    .onStepEnter(onFileStepEnter);
}

// --------------------------------------------------------------------------
// Main Async Function
// --------------------------------------------------------------------------
async function main() {
  data = await loadData();
  commits = processCommits(data);
  console.log(commits);

  renderCommitInfo(data, commits);
  renderScatterPlot(data, commits);
  updateFileDisplay(commits);

  generateCommitSteps(commits);
  generateFileSteps(commits);

  initScatterScrollama();
  initFileScrollama();
}

main();
