console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/*------------------------------------------------*
 * Automatic Navigation Menu & Dark Mode Switcher
 *------------------------------------------------*/

// Determine the base path for internal links depending on the environment.
const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/"                   // Local server
    : "/portfolio/";        // GitHub Pages

// Define your site pages
let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'cv.html', title: 'CV' },
  { url: 'https://github.com/Tinoco107', title: 'GitHub' }
];

// Create a new <nav> element and add it to the beginning of <body>
let nav = document.createElement('nav');
document.body.prepend(nav);

// Iterate over each page and create a corresponding link
for (let p of pages) {
  let { url, title } = p;

  // For relative URLs, prefix with BASE_PATH
  url = !url.startsWith('http') ? BASE_PATH + url : url;

  // Create the <a> element
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  // If this link points to the current page, add the 'current' class
  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add('current');
  }

  // For external links, open in a new tab
  if (a.host !== location.host) {
    a.target = "_blank";
  }

  // Append the link to the nav element
  nav.append(a);
}

/*----------------------------*
 * Dark Mode Switcher
 *----------------------------*/

// Insert the dark mode switcher
document.body.insertAdjacentHTML(
  'afterbegin',
  `
    <label class="color-scheme">
        Theme:
        <select>
            <option value="light dark">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    </label>
    `
);

// Get a reference to the dark mode select element
const colorSchemeSelect = document.querySelector('.color-scheme select');

// Define a function that sets the CSS color-scheme and saves the preference
function setColorScheme(scheme) {
  document.documentElement.style.setProperty('color-scheme', scheme);
  localStorage.colorScheme = scheme;
}

// On page load, apply the user's preferred color scheme, if it exists
if (localStorage.colorScheme) {
  setColorScheme(localStorage.colorScheme);
  colorSchemeSelect.value = localStorage.colorScheme;
} else {
  // Default to automatic (OS-based) color scheme
  setColorScheme('light dark');
  colorSchemeSelect.value = 'light dark';
}

// Listen for changes on the select element and update the color scheme accordingly
colorSchemeSelect.addEventListener('input', function (event) {
  const newScheme = event.target.value;
  console.log('Color scheme changed to', newScheme);
  setColorScheme(newScheme);
});

/*------------------------------------------------*
 * Better Contact Form
 *------------------------------------------------*/

// Get a reference to the contact form which uses a mailto action. 
// (Ensure your contact form's <form> has an action that begins with "mailto:")
const contactForm = document.querySelector('form[action^="mailto:"]');
if (contactForm) {
  contactForm.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the default form submission

    // Create a new FormData object from the form.
    const data = new FormData(contactForm);
    let params = [];

    // Iterate over each field in the form.
    for (let [name, value] of data.entries()) {
      // Build properly encoded URL parameters (spaces will be encoded as %20).
      params.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
    }
    const queryString = params.join('&');

    // Build the final mailto URL using the form's action (mailto:...) and the parameters.
    const mailtoURL = contactForm.action + '?' + queryString;
    console.log('Opening mailto URL:', mailtoURL);
    
    // Redirect the browser to the mailto: URL to open the user's default mail client.
    location.href = mailtoURL;
  });
}

/*------------------------------------------------*
 * Project Data Functions for Modular Templating
 *------------------------------------------------*/

// Function to fetch and parse JSON data from a given URL.
// If the provided URL is not absolute, it is prefixed with BASE_PATH.
export async function fetchJSON(url) {
  try {
    const resolvedUrl = url.startsWith('http') ? url : BASE_PATH + url;
    console.log("Fetching JSON from:", resolvedUrl); // Debug: log the resolved URL
    const response = await fetch(resolvedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

// Function to dynamically render an array of projects into a container element.
// Projects are rendered using the specified heading level, which defaults to "h2".
// If the projects array is empty or undefined, a placeholder message is shown.
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!containerElement) {
    console.error("Invalid container element provided to renderProjects.");
    return;
  }

  // Clear any existing content to avoid duplications.
  containerElement.innerHTML = '';

  // If no projects available, show a placeholder message.
  if (!projects || projects.length === 0) {
    containerElement.innerHTML = '<p>No projects available.</p>';
    return;
  }

  // Validate the heading level to allow only valid HTML heading tags.
  const validHeadingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  const safeHeading = validHeadingLevels.includes(headingLevel) ? headingLevel : 'h2';

  // Iterate over the projects array and create an article element for each project.
  projects.forEach((project) => {
    const article = document.createElement('article');

    // Populate the article with dynamic HTML using template literals.
    article.innerHTML = `
      <${safeHeading}>${project.title || 'Untitled Project'}</${safeHeading}>
      <img src="${project.image || 'placeholder.png'}" alt="${project.title || 'Project Image'}">
      <p>${project.description || 'No description provided.'}</p>
    `;
    containerElement.appendChild(article);
  });
}
