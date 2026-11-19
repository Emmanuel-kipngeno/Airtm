(function () {
  'use strict';
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.slick-dots li'));
  var current = 2;
  var timer;
  function showSlide(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach(function (s, i) { s.classList.toggle('is-active', i === current); });
    dots.forEach(function (d, i) { d.classList.toggle('is-active', i === current); });
  }
  timer = window.setInterval(function () { showSlide(current + 1); }, 4500);
  dots.forEach(function (dot, i) {
    dot.querySelector('button').addEventListener('click', function () {
      window.clearInterval(timer);
      showSlide(i);
      timer = window.setInterval(function () { showSlide(current + 1); }, 4500);
    });
  });
})();
