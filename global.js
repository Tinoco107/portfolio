console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/*------------------------------------------------*
 * Automatic Navigation Menu & Dark Mode Switcher
 *------------------------------------------------*/

// This script will add the navigation and dark mode switcher automatically

// Determine the base path for internal links depending on the environment.
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  // Local server
  : "/portfolio/";       // GitHub Pages

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
