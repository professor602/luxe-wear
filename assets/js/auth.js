/* =====================================================================
   LuxeWear – auth.js
   Powers login.html and signup.html.

   SECURITY NOTE (academic demo only):
   Accounts and passwords are saved in LocalStorage WITHOUT any protection.
   Anyone who can open this browser can read them. Never use a real
   password. A real website needs a secure backend that hashes passwords.

   Requires products.js, storage.js and common.js to be loaded first.
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. Redirects (only our own pages are allowed)
   login.html?redirect=cart.html  -> after login the user lands on cart.html
   Anything not in this list (e.g. another website) is ignored.
   ------------------------------------------------------------------ */
const ALLOWED_REDIRECTS = [
  "index.html", "shop.html", "men.html", "women.html", "kids.html",
  "cart.html", "wishlist.html", "profile.html", "checkout.html",
  "about.html", "contact.html"
];
const DEFAULT_AFTER_LOGIN = "profile.html";
const REDIRECT_DELAY = 800; // lets the welcome toast be seen

function getSafeRedirect() {
  const target = getQueryParam("redirect");
  return ALLOWED_REDIRECTS.indexOf(target) !== -1 ? target : DEFAULT_AFTER_LOGIN;
}

// "?redirect=cart.html" (or "&redirect=..."), or "" when there is none.
function redirectQuery(joiner) {
  const target = getQueryParam("redirect");
  return ALLOWED_REDIRECTS.indexOf(target) !== -1
    ? joiner + "redirect=" + encodeURIComponent(target)
    : "";
}

/* ---------------------------------------------------------------------
   2. Page alert box (<div id="form-alert" class="alert hidden">)
   ------------------------------------------------------------------ */
function showFormAlert(message, type) {
  const box = document.getElementById("form-alert");
  if (!box) return;
  box.className = "alert alert-" + (type || "error");
  box.textContent = message;
}

function hideFormAlert() {
  const box = document.getElementById("form-alert");
  if (box) box.className = "alert hidden";
}

/* ---------------------------------------------------------------------
   3. Validators. Each returns true/false and shows or clears the message.
   ------------------------------------------------------------------ */
function validateName(input) {
  const value = input.value.replace(/\s+/g, " ").trim();
  if (value.length < 2) {
    setFieldError(input, "Please enter your full name (at least 2 characters).");
    return false;
  }
  if (value.length > 60) {
    setFieldError(input, "Name must be 60 characters or fewer.");
    return false;
  }
  setFieldSuccess(input);
  return true;
}

function validateEmailInput(input) {
  const value = input.value.trim();
  if (!value) {
    setFieldError(input, "Email address is required.");
    return false;
  }
  if (!isValidEmail(value)) {
    setFieldError(input, "Please enter a valid email address, e.g. name@example.com.");
    return false;
  }
  setFieldSuccess(input);
  return true;
}

// Login only checks that something was typed.
function validateRequired(input, message) {
  if (!input.value) {
    setFieldError(input, message);
    return false;
  }
  clearFieldState(input);
  return true;
}

// Sign up: at least 8 characters with a letter and a number.
function validateNewPassword(input) {
  const value = input.value;
  if (value.length < 8) {
    setFieldError(input, "Password must be at least 8 characters.");
    return false;
  }
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    setFieldError(input, "Password must include at least one letter and one number.");
    return false;
  }
  setFieldSuccess(input);
  return true;
}

function validateConfirm(input, passwordInput) {
  if (!input.value) {
    setFieldError(input, "Please confirm your password.");
    return false;
  }
  if (input.value !== passwordInput.value) {
    setFieldError(input, "Passwords do not match.");
    return false;
  }
  setFieldSuccess(input);
  return true;
}

// "weak" | "medium" | "strong" (a simple score, for the hint only)
function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return "weak";
  if (score === 3) return "medium";
  return "strong";
}

function updatePasswordHint(input, hint) {
  if (!hint) return;
  if (!input.value) {
    hint.textContent = "";
    hint.className = "password-hint";
    return;
  }
  const level = getPasswordStrength(input.value);
  hint.textContent = "Strength: " + capitalize(level);
  hint.className = "password-hint " + level;
}

/* ---------------------------------------------------------------------
   4. Shared form helpers
   ------------------------------------------------------------------ */

// Clear errors while typing and validate when leaving a non-empty field.
function attachLiveValidation(fields) {
  fields.forEach(function (field) {
    field.input.addEventListener("input", function () { clearFieldState(field.input); });
    field.input.addEventListener("blur", function () {
      if (field.input.value !== "") field.validate(field.input);
    });
  });
}

function focusFirstError(form) {
  const bad = form.querySelector(".has-error .form-control");
  if (bad) bad.focus();
}

// Eye button: show or hide the password in the same .input-wrapper.
function initPasswordToggles() {
  document.querySelectorAll(".password-toggle").forEach(function (button) {
    button.addEventListener("click", function () {
      const wrapper = button.closest(".input-wrapper");
      const input = wrapper ? wrapper.querySelector("input") : null;
      if (!input) return;

      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.setAttribute("aria-pressed", String(show));
      button.setAttribute("aria-label", show ? "Hide password" : "Show password");

      const icon = button.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-eye", !show);
        icon.classList.toggle("fa-eye-slash", show);
      }
    });
  });
}

// Keep the Log in / Sign up links pointing at each other with the redirect.
function updateSwitchLinks() {
  document.querySelectorAll("[data-auth-switch]").forEach(function (link) {
    link.setAttribute("href", link.dataset.authSwitch + redirectQuery("?"));
  });
}

/* ---------------------------------------------------------------------
   5. Login form
   ------------------------------------------------------------------ */
function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const rememberBox = document.getElementById("remember-me");
  const submitButton = form.querySelector('button[type="submit"]');

  attachLiveValidation([{ input: emailInput, validate: validateEmailInput }]);
  passwordInput.addEventListener("input", function () { clearFieldState(passwordInput); });

  if (getQueryParam("registered") === "1") {
    showFormAlert("Account created! You can now log in.", "success");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    hideFormAlert();

    const emailOk = validateEmailInput(emailInput);
    const passwordOk = validateRequired(passwordInput, "Please enter your password.");
    if (!emailOk || !passwordOk) {
      focusFirstError(form);
      return;
    }

    // One message for both problems, so it never reveals which emails exist
    const user = findUserByEmail(emailInput.value);
    if (!user || user.password !== passwordInput.value) {
      showFormAlert("Incorrect email or password. Please try again.", "error");
      passwordInput.value = "";
      passwordInput.focus();
      return;
    }

    setSession(user.email, rememberBox ? rememberBox.checked : true);

    const firstName = String(user.name || "").split(" ")[0] || "there";
    showToast("Welcome back, " + firstName + "!", "success");

    submitButton.disabled = true;
    submitButton.classList.add("loading");
    setTimeout(function () { window.location.href = getSafeRedirect(); }, REDIRECT_DELAY);
  });
}

/* ---------------------------------------------------------------------
   6. Sign up form
   ------------------------------------------------------------------ */
function initSignupForm() {
  const form = document.getElementById("signup-form");
  if (!form) return;

  const nameInput = document.getElementById("signup-name");
  const emailInput = document.getElementById("signup-email");
  const passwordInput = document.getElementById("signup-password");
  const confirmInput = document.getElementById("signup-confirm");
  const hint = document.getElementById("password-hint");
  const submitButton = form.querySelector('button[type="submit"]');

  attachLiveValidation([
    { input: nameInput, validate: validateName },
    { input: emailInput, validate: validateEmailInput },
    { input: passwordInput, validate: validateNewPassword },
    { input: confirmInput, validate: function (input) { return validateConfirm(input, passwordInput); } }
  ]);

  passwordInput.addEventListener("input", function () {
    updatePasswordHint(passwordInput, hint);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    hideFormAlert();

    // Run every check (no early exit) so all problems show at once
    const results = [
      validateName(nameInput),
      validateEmailInput(emailInput),
      validateNewPassword(passwordInput),
      validateConfirm(confirmInput, passwordInput)
    ];
    if (results.indexOf(false) !== -1) {
      focusFirstError(form);
      return;
    }

    const result = registerUser({
      name: nameInput.value.replace(/\s+/g, " ").trim(),
      email: emailInput.value,
      password: passwordInput.value
    });

    if (!result.ok) {
      setFieldError(emailInput, result.message); // e.g. email already registered
      emailInput.focus();
      return;
    }

    showToast("Account created! Please log in.", "success");
    submitButton.disabled = true;
    submitButton.classList.add("loading");
    setTimeout(function () {
      window.location.href = "login.html?registered=1" + redirectQuery("&");
    }, REDIRECT_DELAY);
  });
}

/* ---------------------------------------------------------------------
   7. Start
   ------------------------------------------------------------------ */
onReady(function () {
  // Already logged in? No need to see these pages.
  if (isLoggedIn()) {
    window.location.replace(getSafeRedirect());
    return;
  }

  initPasswordToggles();
  updateSwitchLinks();
  initLoginForm();
  initSignupForm();
});