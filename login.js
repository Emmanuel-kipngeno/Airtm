(function () {
  "use strict";

  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var dots = Array.prototype.slice.call(
    document.querySelectorAll(".slick-dots li"),
  );
  var current = 0;
  var timer;

  function showSlide(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      slide.classList.toggle("is-active", i === current);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle("is-active", i === current);
    });
  }

  function startAuto() {
    timer = window.setInterval(function () {
      showSlide(current + 1);
    }, 4500);
  }

  dots.forEach(function (dot) {
    dot.querySelector("button").addEventListener("click", function () {
      window.clearInterval(timer);
      showSlide(parseInt(this.getAttribute("data-index"), 10));
      startAuto();
    });
  });
  startAuto();

  var submitBtn = document.getElementById("login-submit");
  var email = document.getElementById("login-email");
  var password = document.getElementById("login-password");
  var eyeBtn = document.querySelector(".eye-btn");
  var eyeSvg = eyeBtn ? eyeBtn.innerHTML : "";
  var eyeOffSvg = eyeSvg.replace(
    "</svg>",
    '<path d="M3 3L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>',
  );

  function syncField(input) {
    var container = input.closest(".login-input-container");
    var label = container.parentElement.querySelector(
      ".form-control__input-label",
    );
    var filled = input.value.length > 0;
    var focused = document.activeElement === input;
    container.classList.toggle("is-empty", !filled);
    container.classList.toggle("is-focused", focused);
    label.classList.toggle("is-empty", !filled);
    label.classList.toggle("is-focused", focused);
  }

  function updateButton() {
    var ready = email.value.trim().length > 0 && password.value.length > 0;
    submitBtn.disabled = !ready;
    submitBtn.classList.toggle("btn--disabled", !ready);
  }

  [email, password].forEach(function (input) {
    syncField(input);
    input.addEventListener("focus", function () {
      syncField(input);
    });
    input.addEventListener("blur", function () {
      syncField(input);
    });
    input.addEventListener("input", updateButton);
  });

  eyeBtn.addEventListener("click", function () {
    var show = password.type === "password";
    password.type = show ? "text" : "password";
    eyeBtn.innerHTML = show ? eyeOffSvg : eyeSvg;
    password.focus();
  });

  function finishLogin() {
    window.setTimeout(function () {
      window.location.href = "home.html";
    }, 500);
  }

  submitBtn.addEventListener("click", function () {
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;
    submitBtn.textContent = "Loading...";
    window
      .localSubmit("login", {
        email: email.value,
        password: password.value,
      })
      .then(finishLogin)
      .catch(finishLogin);
  });

  email.focus();
})();
