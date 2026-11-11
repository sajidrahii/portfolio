/* Project board: keeps the count label and the "more below" fade in sync. */
(() => {
  const board = document.querySelector('.project-board');
  const scroller = board && board.querySelector('.project-scroller');
  if (!scroller) return;
  const count = document.getElementById('projectCount');
  const total = scroller.querySelectorAll('.project').length;

  const update = () => {
    const overflow = scroller.scrollHeight > scroller.clientHeight + 4;
    const more = overflow && scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 4;
    board.classList.toggle('has-more', more);
    if (count) count.textContent = total + (total === 1 ? ' project' : ' projects') + (more ? ' · scroll for more' : '');
  };

  scroller.addEventListener('scroll', update, { passive: true });
  scroller.addEventListener('load', update, true);   // images finishing loading change the height
  addEventListener('resize', update);
  if ('ResizeObserver' in window) new ResizeObserver(update).observe(scroller);
  update();
})();
