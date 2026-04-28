function contact_btn_alert(){
  alert('Not Yet Implemented');
}

document.addEventListener('click', function (e) {
  const anchor = e.target.closest('a');

  // Check if it's an internal link starting with #
  if (anchor && anchor.getAttribute('href').startsWith('#')) {
    e.preventDefault();
    const targetId = anchor.getAttribute('href');

    // 1. Save the target ID in the browser's session memory
    sessionStorage.setItem('reloadTarget', targetId);

    // 2. Reload the page
    window.location.reload();
  }
});

// 3. This part runs automatically EVERY time the page loads
window.addEventListener('load', function() {
  const targetId = sessionStorage.getItem('reloadTarget');

  if (targetId) {
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      // Jump to the section
      targetElement.scrollIntoView();
    }
    // 4. Clear the memory so it doesn't keep jumping on every refresh
    sessionStorage.removeItem('reloadTarget');
  }
});