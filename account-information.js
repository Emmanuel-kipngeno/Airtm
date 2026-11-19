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

  var fields = Array.prototype.slice.call(document.querySelectorAll('.info-field'));
  fields.forEach(function (field) {
    var input = field.querySelector('input.form-control__input');
    var label = field.querySelector('.form-control__input-label');
    var container = field.querySelector('.login-input-container');
    if (!input || !label || !container) return;
    input.addEventListener('focus', function () {
      container.classList.add('is-focused');
      container.classList.remove('is-empty');
      label.classList.remove('is-empty');
    });
    input.addEventListener('blur', function () {
      container.classList.remove('is-focused');
      if (!input.value) {
        container.classList.add('is-empty');
        label.classList.add('is-empty');
      }
    });
    input.addEventListener('input', validate);
  });

  document.querySelectorAll('.eye-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = btn.closest('.login-input-container').querySelector('input');
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.setAttribute('aria-label', 'Hide password');
      } else {
        input.type = 'password';
        btn.setAttribute('aria-label', 'Show password');
      }
    });
  });

  var captcha = document.getElementById('captcha');
  if (captcha) {
    function verify() {
      if (captcha.classList.contains('is-verified')) return;
      captcha.classList.add('is-verified');
      captcha.querySelector('.info-captcha__tip').textContent = 'Verified';
      validate();
    }
    captcha.addEventListener('click', verify);
    captcha.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); verify(); }
    });
  }

  var submit = document.getElementById('submit');
  var email = document.getElementById('email');
  var password = document.getElementById('password');
  var confirmation = document.getElementById('passwordConfirmation');
  var firstName = document.getElementById('firstName');
  var lastName = document.getElementById('lastName');
  var noLegalLastName = document.getElementById('noLegalLastName');

  function validPassword(v) {
    return /[0-9]/.test(v) && /[a-zA-Z]/.test(v) && /[@!#$%^&*\-=+]/.test(v) && v.length >= 8;
  }
  function validate() {
    if (!submit || !email || !password || !confirmation || !firstName || !lastName) return;
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value) &&
      validPassword(password.value) &&
      confirmation.value === password.value && confirmation.value.length > 0 &&
      firstName.value.trim().length > 0 &&
      (noLegalLastName.checked || lastName.value.trim().length > 0) &&
      captcha && captcha.classList.contains('is-verified');
    submit.disabled = !ok;
    submit.classList.toggle('btn--disabled', !ok);
  }
  if (noLegalLastName) noLegalLastName.addEventListener('change', validate);
  validate();

  var form = document.getElementById('sign-up');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submit.disabled) return;
      submit.disabled = true;
      submit.textContent = 'Loading...';
      window.localSubmit('account-information', {
        email: email.value,
        password: password.value,
        passwordConfirmation: confirmation.value,
        firstName: firstName.value,
        lastName: lastName.value,
        noLegalLastName: noLegalLastName.checked,
        secondLastName: document.getElementById('secondLastName').value
      }).then(function () {
        window.setTimeout(function () {
          window.location.href = 'home.html';
        }, 500);
      }).catch(function () {
        submit.disabled = false;
        submit.textContent = 'Create account';
        var old = form.querySelector('.info-success');
        if (old) old.remove();
        var msg = document.createElement('div');
        msg.className = 'info-success login-error';
        msg.textContent = 'Could not reach the local server. Start it with node server.js.';
        form.insertBefore(msg, form.firstChild);
      });
    });
  }
})();
