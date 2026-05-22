(function () {
  var buttons = document.querySelectorAll('.lang-btn');
  if (!buttons.length) return;

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var lang = this.getAttribute('data-lang');
      // toggle buttons
      document.querySelectorAll('.lang-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-lang') === lang);
      });
      // toggle content
      document.querySelectorAll('.lang-block').forEach(function (block) {
        block.classList.toggle('active', block.getAttribute('data-lang') === lang);
      });
      // remember preference
      try { localStorage.setItem('preferred-lang', lang); } catch (e) {}
    });
  });

  // restore preference
  try {
    var saved = localStorage.getItem('preferred-lang');
    if (saved) {
      var target = document.querySelector('.lang-btn[data-lang="' + saved + '"]');
      if (target) target.click();
    }
  } catch (e) {}
})();
