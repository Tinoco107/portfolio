console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Step 2: Automatic current page link
// Get an array of all nav links
let navLinks = $$("nav a");

// Find the link whose host and pathname match the current page
let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname
);

// If a link is found, add the 'current' class
currentLink?.classList.add('current');
