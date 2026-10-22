/* =====================================================================
   LuxeWear – contact.js
   Powers contact.html: validates the form and saves each demo message
   in LocalStorage (key: luxewear_messages) using saveContactMessage()
   from storage.js.

   DEMO ONLY: messages are never sent anywhere. They stay in this browser.
   Requires products.js, storage.js and common.js to be loaded first.
   ===================================================================== */

const MESSAGE_MIN = 10;
const MESSAGE_MAX = 500;
const ALLOWED_SUBJECTS = [
  "Order question", "Product question", "Returns & exchanges", "Feedback", "Other"
];

let sending = false; // blocks double submits

/* ---------------------------------------------------------------------
   1. Field checks. Each returns an error message, or "" when valid.
   ------------------------------------------------------------------ */
const CONTACT_FIELDS = [
  {
    id: "contact-name",
    check: function (value) {
      const name = value.replace(/\s+/g, " ").trim();
      if (name.length < 2) return "Please enter your name (at least 2 characters).";
      if (name.length > 60) return "Name must be 60 characters or fewer.";
      return "";
    }
  },
  {
    id: "contact-email",
    check: function (value) {
      if (!value.trim()) return "Email address is required.";
      return isValidEmail(value) ? "" : "Please enter a valid email address.";
    }
  },
  {
    id: "contact-subject",
    check: function (value) {
      return ALLOWED_SUBJECTS.indexOf(value) !== -1 ? "" : "Please choose a subject.";
    }
  },
  {
    id: "contact-message",
    check: function (value) {
      const length = value.trim().length;
      if (length < MESSAGE_MIN) return "Please write at least " + MESSAGE_MIN + " characters.";
      if (length > MESSAGE_MAX) return "Message must be " + MESSAGE_MAX + " characters or fewer.";
      return "";
    }
  }
];

// Check one field and show or clear its message. Returns true when valid.
function validateContactField(field) {
  const input = document.getElementById(field.id);
  const message = field.check(input.value);

  if (message) {
    setFieldError(input, message);
    return false;
  }
  setFieldSuccess(input);
  return true;
}

/* ---------------------------------------------------------------------
   2. Small UI helpers
   ------------------------------------------------------------------ */

// Live "123 / 500" counter under the message box.
function updateCharCounter() {
  const textarea = document.getElementById("contact-message");
  const counter = document.getElementById("char-counter");
  if (!textarea || !counter) return;

  const length = textarea.value.length;
  counter.textContent = length + " / " + MESSAGE_MAX;
  counter.classList.toggle("limit", length >= MESSAGE_MAX - 50);
}

// Fill name and email when a demo user is logged in.
function prefillContactForm() {
  const user = getCurrentUser();
  if (!user) return;

  const nameInput = document.getElementById("contact-name");
  const emailInput = document.getElementById("contact-email");
  if (user.name && !nameInput.value) nameInput.value = user.name;
  if (user.email && !emailInput.value) emailInput.value = user.email;
}

function showContactAlert(message, type) {
  const box = document.getElementById("contact-alert");
  box.className = "alert alert-" + type;
  box.textContent = message;
}

function hideContactAlert() {
  document.getElementById("contact-alert").className = "alert hidden";
}

function setSending(button, isSending) {
  sending = isSending;
  button.disabled = isSending;
  button.classList.toggle("loading", isSending);
}

/* ---------------------------------------------------------------------
   3. Saving the message
   ------------------------------------------------------------------ */
function saveMessage(form, button) {
  const data = {
    name: document.getElementById("contact-name").value.replace(/\s+/g, " ").trim(),
    email: document.getElementById("contact-email").value.trim().toLowerCase(),
    subject: document.getElementById("contact-subject").value,
    message: document.getElementById("contact-message").value.trim()
  };

  if (!saveContactMessage(data)) {
    setSending(button, false);
    showContactAlert("Could not save your message. Please check that browser storage is enabled.", "error");
    showToast("Message could not be saved", "error");
    return;
  }

  // Success: clear the form, then bring back the prefilled name/email
  form.reset();
  form.querySelectorAll(".form-group").forEach(function (group) {
    group.classList.remove("has-success", "has-error");
  });
  prefillContactForm();
  updateCharCounter();
  setSending(button, false);

  showContactAlert("Thank you, " + data.name.split(" ")[0] + "! Your demo message has been saved in this browser.", "success");
  showToast("Message sent (demo)", "success");
}

/* ---------------------------------------------------------------------
   4. Form events
   ------------------------------------------------------------------ */
function initContactForm() {
  const form = document.getElementById("contact-form");
  const button = document.getElementById("contact-submit");

  CONTACT_FIELDS.forEach(function (field) {
    const input = document.getElementById(field.id);

    input.addEventListener("input", function () { clearFieldState(input); });
    input.addEventListener("blur", function () {
      if (input.value !== "") validateContactField(field);
    });
    // Selects fire "change" instead of typing events
    input.addEventListener("change", function () {
      if (input.value !== "") validateContactField(field);
    });
  });

  document.getElementById("contact-message").addEventListener("input", updateCharCounter);

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (sending) return;
    hideContactAlert();

    // Check every field (no early exit) so all problems show together
    const results = CONTACT_FIELDS.map(validateContactField);
    if (results.indexOf(false) !== -1) {
      const firstBad = form.querySelector(".has-error .form-control");
      if (firstBad) firstBad.focus();
      return;
    }

    setSending(button, true);
    // Short delay to simulate sending (none for reduced-motion users)
    setTimeout(function () { saveMessage(form, button); }, prefersReducedMotion() ? 0 : 700);
  });
}

/* ---------------------------------------------------------------------
   5. Start
   ------------------------------------------------------------------ */
onReady(function () {
  prefillContactForm();
  updateCharCounter();
  initContactForm();
});