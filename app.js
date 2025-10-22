window.addEventListener("scroll", () => {
  const header = document.querySelector(".header");
  const headerHeight = header.offsetHeight;
  const headerBottom = header.getBoundingClientRect().bottom;

  document.querySelectorAll(".middle").forEach(box => {
    const rect = box.getBoundingClientRect();

    // How far the top of the element is under the header
    const overlap = headerBottom - rect.top;

    if (overlap > 0 && overlap < rect.height) {
      // Element is partially behind header — calculate opacity
      const visibleRatio = 1 - (overlap / rect.height);
      box.style.opacity = visibleRatio;
    } else if (overlap <= 0) {
      // Fully visible below header
      box.style.opacity = 1;
    } else {
      // Fully hidden behind header
      box.style.opacity = 0;
    }
  });
});