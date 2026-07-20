const cursorLight = document.getElementById('cursorLightPng');

document.addEventListener('mousemove', (e) => {
  cursorLight.style.left = e.clientX + 'px';
  cursorLight.style.top = e.clientY + 'px';
});

document.addEventListener("DOMContentLoaded", () => {
  // 1. Select all the sections you want to animate
  const sections = document.querySelectorAll(".jsanimate");
  const headings = document.querySelectorAll(".heading-animate");
  const buttons = document.querySelectorAll(".btn");
  const cards = document.querySelectorAll(".card");

  // 2. Configure the observer settings
  const observerOptions = {
    root: null,         // Uses the device viewport as the bounding box
    rootMargin: "0px",  // No extra margin expansion
    threshold: 0.15     // Triggers when 15% of the section is visible
  }; 

  // 3. Define what happens when a section intersects the screen
  const sectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      // Check if the section has entered the viewport
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        
        // Stop watching this specific section once it has animated in
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // 4. Track each individual section element
  sections.forEach(section => {
    sectionObserver.observe(section);
  });

  headings.forEach(heading => {
    sectionObserver.observe(heading);
  });

  buttons.forEach(button => {
    sectionObserver.observe(button);
  });

  cards.forEach(card => {
    sectionObserver.observe(card);
  });

});


// Downloading CV
document.getElementById("cv-download").addEventListener('click', function(){
  const cv_path = "assets/download/my-cv.png";
  window.open(cv_path, '_blank');

  setTimeout(function(){
    const anchor = document.createElement('a');
    anchor.href = cv_path;
    anchor.download = 'sajid_rahi_cv.png';

    document.body.appendChild(anchor);
    anchor.click();
    document.removeChild(anchor);
  });

});