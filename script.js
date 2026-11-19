(function () {
  'use strict';

  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.slick-dots li'));
  var current = 1;
  var timer;

  function showSlide(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      slide.classList.toggle('is-active', i === current);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle('is-active', i === current);
    });
  }

  function startAuto() {
    timer = window.setInterval(function () {
      showSlide(current + 1);
    }, 4500);
  }

  function stopAuto() {
    window.clearInterval(timer);
  }

  dots.forEach(function (dot) {
    dot.querySelector('button').addEventListener('click', function () {
      stopAuto();
      showSlide(parseInt(this.getAttribute('data-index'), 10));
      startAuto();
    });
  });

  startAuto();

  var countries = [
    'Argentina', 'Australia', 'Austria', 'Bangladesh', 'Belgium', 'Bolivia',
    'Brazil', 'Bulgaria', 'Canada', 'Chile', 'China', 'Colombia', 'Costa Rica',
    'Croatia', 'Czech Republic', 'Denmark', 'Dominican Republic', 'Ecuador',
    'Egypt', 'El Salvador', 'Finland', 'France', 'Germany', 'Greece',
    'Guatemala', 'Honduras', 'Hong Kong', 'Hungary', 'India', 'Indonesia',
    'Ireland', 'Israel', 'Italy', 'Japan', 'Kenya', 'Malaysia', 'Mexico',
    'Netherlands', 'New Zealand', 'Nicaragua', 'Nigeria', 'Norway', 'Pakistan',
    'Panama', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Romania', 'Russia', 'Saudi Arabia', 'Singapore', 'South Africa',
    'South Korea', 'Spain', 'Sweden', 'Switzerland', 'Taiwan', 'Thailand',
    'Turkey', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
    'United States', 'Uruguay', 'Venezuela', 'Vietnam'
  ];

  var selectCustom = document.querySelector('.select-custom');
  var selectControl = document.getElementById('country-select');
  var selectValue = document.getElementById('country-value');
  var selectMenu = document.getElementById('country-menu');
  var searchInput = document.getElementById('country-search');
  var continueBtn = document.getElementById('continue-btn');
  var radios = document.querySelectorAll('input[name="accountType"]');
  var selectedCountry = '';
  var highlighted = 0;
  var filtered = countries.slice();

  function renderOptions() {
    selectMenu.innerHTML = '';
    if (filtered.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'select-empty';
      empty.textContent = 'No countries found';
      selectMenu.appendChild(empty);
      return;
    }
    filtered.forEach(function (country, i) {
      var option = document.createElement('div');
      option.className = 'select-option' + (i === highlighted ? ' is-highlighted' : '');
      option.setAttribute('role', 'option');
      option.textContent = country;
      option.addEventListener('mousedown', function (e) {
        e.preventDefault();
        chooseCountry(country);
      });
      selectMenu.appendChild(option);
    });
  }

  function openMenu() {
    selectMenu.hidden = false;
    selectControl.classList.add('is-focus');
    selectControl.setAttribute('aria-expanded', 'true');
    highlighted = 0;
    filtered = countries.filter(function (c) {
      return c.toLowerCase().indexOf(searchInput.value.toLowerCase().trim()) !== -1;
    });
    renderOptions();
    searchInput.focus();
  }

  function closeMenu() {
    selectMenu.hidden = true;
    selectControl.classList.remove('is-focus');
    selectControl.setAttribute('aria-expanded', 'false');
    searchInput.value = '';
  }

  function chooseCountry(country) {
    selectedCountry = country;
    selectValue.textContent = country;
    selectCustom.classList.add('has-value');
    closeMenu();
    updateButton();
  }

  function updateButton() {
    var accountSelected = Array.prototype.some.call(radios, function (r) { return r.checked; });
    var ready = Boolean(selectedCountry) && accountSelected;
    continueBtn.disabled = !ready;
    continueBtn.classList.toggle('btn--disabled', !ready);
  }

  selectControl.addEventListener('click', function () {
    if (selectMenu.hidden) openMenu(); else closeMenu();
  });

  selectControl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openMenu();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      openMenu();
      highlighted = Math.min(highlighted + 1, filtered.length - 1);
      renderOptions();
    }
  });

  searchInput.addEventListener('input', function () {
    highlighted = 0;
    filtered = countries.filter(function (c) {
      return c.toLowerCase().indexOf(searchInput.value.toLowerCase().trim()) !== -1;
    });
    renderOptions();
  });

  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlighted = Math.min(highlighted + 1, filtered.length - 1);
      renderOptions();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlighted = Math.max(highlighted - 1, 0);
      renderOptions();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlighted]) chooseCountry(filtered[highlighted]);
    } else if (e.key === 'Escape') {
      closeMenu();
      selectControl.focus();
    }
  });

  document.addEventListener('click', function (e) {
    if (!selectCustom.contains(e.target)) closeMenu();
  });

  Array.prototype.forEach.call(radios, function (radio) {
    radio.addEventListener('change', updateButton);
  });

  continueBtn.addEventListener('click', function () {
    if (continueBtn.disabled) return;
    var chosen = Array.prototype.find.call(radios, function (r) { return r.checked; });
    window.localSubmit('sign-up', {
      country: selectedCountry,
      accountType: chosen ? chosen.value : ''
    }).then(function () {
      window.location.href = 'account-credentials.html';
    }).catch(function () {
      window.location.href = 'account-credentials.html';
    });
  });

  var arrow = document.querySelector('.select-arrow path');
  if (arrow) {
    arrow.setAttribute('d', 'M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z');
  }
})();
