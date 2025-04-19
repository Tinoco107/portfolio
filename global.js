console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Automatic Navigation Menu

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

// Iterate over each page and add a corresponding link
for (let p of pages) {
  let { url, title } = p;
  
  // For relative URLs, prefix it with the BASE_PATH
  url = !url.startsWith('http') ? BASE_PATH + url : url;
  
  // Create an <a> element for the page
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  
  // Highlight the current page link if this link's host and pathname match the current page
  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add('current');
  }
  
  // For external links, open in a new tab
  if (a.host !== location.host) {
    a.target = "_blank";
  }
  
  // Add this link to the navigation element
  nav.append(a);
}
