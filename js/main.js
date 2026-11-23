(function () {
  "use strict";

  // 1. Mobile Navigation Toggle
  var navToggle = document.getElementById("nav-toggle");
  var primaryNav = document.getElementById("primary-nav");

  if (navToggle && primaryNav) {
    var setNavState = function (open) {
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Cerrar menú de navegación" : "Abrir menú de navegación");
      primaryNav.classList.toggle("is-open", open);
    };

    navToggle.addEventListener("click", function () {
      var isOpen = navToggle.getAttribute("aria-expanded") === "true";
      setNavState(!isOpen);
    });

    primaryNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setNavState(false);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        setNavState(false);
      }
    });
  }

  // 2. Floating WhatsApp Quick Selector
  var waTrigger = document.getElementById("wa-trigger");
  var waPopover = document.getElementById("wa-popover");
  var waClose = document.getElementById("wa-popover-close");

  if (waTrigger && waPopover) {
    var setWaState = function (open) {
      waTrigger.setAttribute("aria-expanded", open ? "true" : "false");
      waPopover.hidden = !open;
    };

    waTrigger.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = waTrigger.getAttribute("aria-expanded") === "true";
      setWaState(!isOpen);
    });

    if (waClose) {
      waClose.addEventListener("click", function () {
        setWaState(false);
      });
    }

    document.addEventListener("click", function (e) {
      if (!waPopover.hidden && !waPopover.contains(e.target) && !waTrigger.contains(e.target)) {
        setWaState(false);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !waPopover.hidden) {
        setWaState(false);
      }
    });
  }

  // 3. Multi-layer Bot Verification for Contact & Quote Forms
  var protectedForms = document.querySelectorAll(".js-protected-form");

  protectedForms.forEach(function (form) {
    var loadedAt = Date.now();
    var minElapsedMs = 2500;
    var expectedAnswer = 0;

    var tsInput = form.querySelector(".js-form-timestamp");
    var promptEl = form.querySelector(".js-captcha-prompt");
    var answerInput = form.querySelector(".js-captcha-answer");
    var refreshBtn = form.querySelector(".js-captcha-refresh");
    var botStatus = form.querySelector(".js-bot-status");
    var feedbackEl = form.querySelector(".js-form-feedback");
    var waBtn = form.querySelector(".js-whatsapp-submit");
    var botBox = form.querySelector(".bot-check-box");

    if (tsInput) {
      tsInput.value = String(loadedAt);
    }

    var generateChallenge = function () {
      var isSub = Math.random() > 0.65;
      var a, b;
      if (isSub) {
        a = Math.floor(Math.random() * 8) + 6; // 6..13
        b = Math.floor(Math.random() * 5) + 1; // 1..5
        expectedAnswer = a - b;
        if (promptEl) {
          promptEl.textContent = "¿Cuánto es " + a + " − " + b + "?";
        }
      } else {
        a = Math.floor(Math.random() * 8) + 2; // 2..9
        b = Math.floor(Math.random() * 8) + 1; // 1..8
        expectedAnswer = a + b;
        if (promptEl) {
          promptEl.textContent = "¿Cuánto es " + a + " + " + b + "?";
        }
      }
      if (answerInput) {
        answerInput.value = "";
        answerInput.classList.remove("is-valid", "is-invalid");
      }
      if (botBox) {
        botBox.classList.remove("is-verified", "is-error");
      }
      if (botStatus) {
        botStatus.textContent = "Completa la operación matemática para confirmar que eres una persona real.";
        botStatus.className = "bot-status js-bot-status";
      }
    };

    var showFeedback = function (type, message) {
      if (!feedbackEl) return;
      feedbackEl.hidden = false;
      feedbackEl.className = "form-feedback js-form-feedback is-" + type;
      feedbackEl.textContent = message;
    };

    var clearFeedback = function () {
      if (!feedbackEl) return;
      feedbackEl.hidden = true;
      feedbackEl.textContent = "";
    };

    var validateHumanAndFields = function () {
      clearFeedback();

      // Layer 1: Honeypot check
      var honeypots = form.querySelectorAll('.hp-field input[type="text"]');
      for (var i = 0; i < honeypots.length; i++) {
        if (honeypots[i].value.trim() !== "") {
          showFeedback("error", "No se pudo procesar el envío por seguridad.");
          return false;
        }
      }

      // Layer 2: Minimum human interaction time
      if (Date.now() - loadedAt < minElapsedMs) {
        generateChallenge();
        showFeedback("error", "Detectamos un envío demasiado rápido. Por favor, revisa tus datos y resuelve la nueva verificación de seguridad.");
        if (answerInput) answerInput.focus();
        return false;
      }

      // Required fields check
      var nameInput = form.querySelector('input[name="FNAME"]');
      var emailInput = form.querySelector('input[name="EMAIL"]');
      var phoneInput = form.querySelector('input[name="PHONE"]');

      if (nameInput && nameInput.value.trim().length < 2) {
        showFeedback("error", "Por favor, ingresa tu nombre y apellido.");
        nameInput.focus();
        return false;
      }

      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (emailInput && !emailRegex.test(emailInput.value.trim())) {
        showFeedback("error", "Por favor, ingresa un correo electrónico válido.");
        emailInput.focus();
        return false;
      }

      if (phoneInput && phoneInput.value.replace(/\D/g, "").length < 7) {
        showFeedback("error", "Por favor, ingresa un número de teléfono o WhatsApp válido.");
        phoneInput.focus();
        return false;
      }

      // Layer 3: Interactive math verification
      var userVal = answerInput ? parseInt(answerInput.value.trim(), 10) : NaN;
      if (isNaN(userVal) || userVal !== expectedAnswer) {
        if (botBox) {
          botBox.classList.remove("is-verified");
          botBox.classList.add("is-error");
        }
        if (answerInput) {
          answerInput.classList.add("is-invalid");
          answerInput.focus();
        }
        if (botStatus) {
          botStatus.textContent = "Respuesta incorrecta. Intenta nuevamente para verificar que no eres un bot.";
          botStatus.className = "bot-status js-bot-status is-error";
        }
        showFeedback("error", "Completa correctamente la verificación anti-bots antes de enviar el formulario.");
        return false;
      }

      // Optional Cloudflare Turnstile check if active on the form
      var turnstileToken = form.querySelector('input[name="cf-turnstile-response"]');
      if (turnstileToken && turnstileToken.value.trim() === "") {
        showFeedback("error", "Por favor, completa la casilla de verificación Cloudflare Turnstile.");
        return false;
      }

      return true;
    };

    generateChallenge();

    if (refreshBtn) {
      refreshBtn.addEventListener("click", function () {
        generateChallenge();
        if (answerInput) answerInput.focus();
      });
    }

    if (answerInput) {
      answerInput.addEventListener("input", function () {
        var val = parseInt(answerInput.value.trim(), 10);
        if (!isNaN(val) && val === expectedAnswer) {
          answerInput.classList.remove("is-invalid");
          answerInput.classList.add("is-valid");
          if (botBox) {
            botBox.classList.remove("is-error");
            botBox.classList.add("is-verified");
          }
          if (botStatus) {
            botStatus.textContent = "Verificación humana completada. Ya puedes enviar tu solicitud.";
            botStatus.className = "bot-status js-bot-status is-verified";
          }
        } else {
          answerInput.classList.remove("is-valid");
          if (botBox) {
            botBox.classList.remove("is-verified");
          }
        }
      });
    }

    form.addEventListener("submit", function (e) {
      if (!validateHumanAndFields()) {
        e.preventDefault();
        return;
      }
      showFeedback("success", "Verificación aprobada. Estamos enviando tu solicitud por correo...");
      window.setTimeout(function () {
        generateChallenge();
      }, 1500);
    });

    if (waBtn) {
      waBtn.addEventListener("click", function () {
        if (!validateHumanAndFields()) {
          return;
        }
        var waNumber = form.getAttribute("data-whatsapp") || "593993920505";
        var name = (form.querySelector('input[name="FNAME"]') || {}).value || "";
        var company = (form.querySelector('input[name="COMPANY"]') || {}).value || "";
        var email = (form.querySelector('input[name="EMAIL"]') || {}).value || "";
        var phone = (form.querySelector('input[name="PHONE"]') || {}).value || "";
        var service = (form.querySelector('select[name="SERVICE"]') || {}).value || "";
        var city = (form.querySelector('input[name="CITY"]') || {}).value || "";
        var message = (form.querySelector('textarea[name="MESSAGE"]') || {}).value || "";

        var lines = [
          "Hola Dolsite, solicito una cotización:",
          "• Servicio: " + service.trim(),
          "• Nombre: " + name.trim()
        ];
        if (company.trim()) lines.push("• Empresa: " + company.trim());
        lines.push("• Correo: " + email.trim());
        lines.push("• Teléfono: " + phone.trim());
        if (city.trim()) lines.push("• Ciudad: " + city.trim());
        if (message.trim()) lines.push("• Detalle: " + message.trim());

        var waUrl = "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(lines.join("\n"));
        showFeedback("success", "Verificación aprobada. Abriendo WhatsApp con tu consulta prellenada...");
        window.open(waUrl, "_blank", "noopener,noreferrer");
      });
    }
  });
})();
