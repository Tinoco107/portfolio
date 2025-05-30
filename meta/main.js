import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Declare global scale variables so updateScatterPlot() can re-use them.
let xScale, yScale;

// --------------------------------------------------------------------------
// Data Loading and Processing
// --------------------------------------------------------------------------
async function loadData() {
  const data = await d3.csv('meta/loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  // Uncomment for debugging:
  // console.log(data);
  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/vis-society/lab-7/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        // Compute the hour as a decimal (e.g., 2:30 PM → 14.5)
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };
      // Store the original lines as a hidden property.
      Object.defineProperty(ret, 'lines', {
        value: lines,
        writable: false,
        configurable: false,
        enumerable: false,
      });
      return ret;
    });
}

// --------------------------------------------------------------------------
// Render Aggregate Statistics
// --------------------------------------------------------------------------
function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Total LOC
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  // Total Commits
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  // Unique Files
  const filesMap = d3.group(data, (d) => d.filename);
  dl.append('dt').text('Unique files');
  dl.append('dd').text(filesMap.size);

  // Longest File & Average File LOC
  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (d) => d.line),
    (d) => d.filename
  );
  const longestFile = fileLengths.reduce(
    (a, b) => (b[1] > a[1] ? b : a),
    ['', 0]
  );
  dl.append('dt').html('Longest file');
  dl.append('dd').text(`${longestFile[0]} (${longestFile[1]} LOC)`);

  const avgFileLength = d3.mean(fileLengths, (d) => d[1]);
  dl.append('dt').html('Avg file <abbr title="Lines of Code">LOC</abbr>');
  dl.append('dd').text(Math.round(avgFileLength));

  // Average Depth
  const avgDepth = d3.mean(data, (d) => d.depth);
  dl.append('dt').text('Avg depth');
  dl.append('dd').text(avgDepth.toFixed(2));

  // Peak Period (Time of Day)
  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) =>
      new Date(d.datetime).toLocaleString('en', {
        hour: 'numeric',
        hour12: true,
        dayPeriod: 'short'
      })
  );
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
  dl.append('dt').html('Peak period');
  dl.append('dd').text(maxPeriod);
}

// --------------------------------------------------------------------------
// Tooltip Functions
// --------------------------------------------------------------------------

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');

  if (Object.keys(commit).length === 0) {
    link.href = '';
    link.textContent = '';
    date.textContent = '';
    return;
  }

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' });
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

// --------------------------------------------------------------------------
// Render Scatterplot with Tooltip, Dot Sizing, and Brushing
// --------------------------------------------------------------------------
function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
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
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // Create scales (assigned to global variables for later updating)
  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();
  yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  // Render Axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  // Append x-axis with a class for later updating.
  svg
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  // Append y-axis (for consistency).
  svg
    .append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  // Render Dashed Horizontal Gridlines
  const gridlines = svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  gridlines.call(
    d3.axisLeft(yScale)
      .tickFormat('')
      .tickSize(-usableArea.width)
  );

  gridlines.selectAll('line')
    .attr('stroke', '#444')
    .attr('stroke-opacity', 0.5)
    .attr('stroke-dasharray', '4,4');

  gridlines.lower();

  // Create a Radius Scale Based on Total Lines Edited
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  // Sort commits so that larger dots are rendered first (and smaller on top)
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  // Append a container for dots.
  const dots = svg.append('g').attr('class', 'dots');

  dots.selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  // Brush-related Helper Functions (unchanged)
  function isCommitSelected(selection, commit) {
    if (!selection) return false;
    const [[x0, y0], [x1, y1]] = selection;
    const cx = xScale(commit.datetime);
    const cy = yScale(commit.hourFrac);
    return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
  }
  
  function renderSelectionCount(selection) {
    const selectedCommits = selection ? sortedCommits.filter(d => isCommitSelected(selection, d)) : [];
    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${selectedCommits.length || 'No'} commits selected`;
    return selectedCommits;
  }
  
  function renderLanguageBreakdown(selection) {
    const selectedCommits = selection ? sortedCommits.filter(d => isCommitSelected(selection, d)) : [];
    const container = document.getElementById('language-breakdown');
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
    const lines = selectedCommits.flatMap(d => d.lines);
    const breakdown = d3.rollup(lines, v => v.length, d => d.type);
    container.innerHTML = '';
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
      container.innerHTML += `<dt>${language}</dt><dd>${count} lines (${formatted})</dd>`;
    }
  }
  
  function brushed(event) {
    const selection = event.selection;
    svg.selectAll('circle').classed('selected', d => isCommitSelected(selection, d));
    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
  }
  
  svg.call(d3.brush().on('start brush end', brushed));
  svg.selectAll('.dots, .overlay ~ *').raise();

  // For debugging
  console.log(commits);
}

// --------------------------------------------------------------------------
// Update Scatterplot (for filtered commits) with Minimal Revisions
// --------------------------------------------------------------------------
function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');

  // Update xScale's domain based on the filtered commits.
  xScale.domain(d3.extent(commits, (d) => d.datetime));

  // Update the radius scale based on the filtered commits.
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);

  // Clear and update the x-axis.
  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(xAxis);

  // Update the dots.
  const dots = svg.select('g.dots');
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  dots.selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

// --------------------------------------------------------------------------
// Main Async Function
// --------------------------------------------------------------------------
async function main() {
  const data = await loadData();
  const commits = processCommits(data);
  console.log(commits);

  // Render the initial (unfiltered) visualization.
  renderCommitInfo(data, commits);
  renderScatterPlot(data, commits);

  // Evolution Visualization: Filtering UI & Setup
  // commitProgress represents a percentage (0–100) along the timeline.
  let commitProgress = 100;
  // Start with all commits shown.
  let filteredCommits = commits;
  
  // Create a time scale to map slider values (0–100) to commit datetimes.
  let timeScaleSlider = d3.scaleTime()
    .domain([
      d3.min(commits, (d) => d.datetime),
      d3.max(commits, (d) => d.datetime)
    ])
    .range([0, 100]);
  let commitMaxTime = timeScaleSlider.invert(commitProgress);

  function onTimeSliderChange(event) {
    commitProgress = +event.target.value;
    commitMaxTime = timeScaleSlider.invert(commitProgress);
    d3.select('#commit-time')
      .text(commitMaxTime.toLocaleString('en', { dateStyle: 'long', timeStyle: 'short' }));
    
    // Filter commits by commitMaxTime.
    filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
    updateScatterPlot(data, filteredCommits);
    // (Optionally, update commit stats here too.)
  }
  
  // Attach the slider event listener.
  d3.select('#commit-progress').on('input', onTimeSliderChange);
  // Initialize the time display AFTER the scatterplot is rendered.
  onTimeSliderChange({ target: { value: commitProgress } });
}

main();
