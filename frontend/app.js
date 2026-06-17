const chat = document.getElementById("messages");
const input = document.getElementById("chatInput2");

const sessionId = crypto.randomUUID();
let currentOptions = [];

// Check authentication
function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }
}

// Add profile link to navbar
function addProfileLink() {
  const navbar = document.querySelector("nav") || document.querySelector("header");
  if (navbar && !document.getElementById("profileLink")) {
    const profileLink = document.createElement("a");
    profileLink.id = "profileLink";
    profileLink.href = "profile.html";
    profileLink.textContent = "My Profile";
    profileLink.style.marginLeft = "20px";
    profileLink.style.color = "#0084ff";
    profileLink.style.textDecoration = "none";
    navbar.appendChild(profileLink);
  }
}

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = "msg " + sender;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function showLoading() {
  const div = document.createElement("div");
  div.className = "msg bot loading";
  div.textContent = "MedPet is thinking...";
  chat.appendChild(div);
  return div;
}

function displayOptions(options) {
  currentOptions = options;
  const optionsContainer = document.createElement("div");
  optionsContainer.className = "options-container";
  optionsContainer.style.display = "flex";
  optionsContainer.style.flexDirection = "column";
  optionsContainer.style.gap = "8px";
  optionsContainer.style.marginTop = "10px";

  options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "option-btn";
    button.textContent = option;
    button.style.padding = "10px 15px";
    button.style.border = "1px solid #0084ff";
    button.style.backgroundColor = "white";
    button.style.color = "#0084ff";
    button.style.borderRadius = "4px";
    button.style.cursor = "pointer";
    button.style.fontSize = "14px";
    button.style.fontWeight = "500";
    button.style.transition = "all 0.2s";

    button.onmouseover = () => {
      button.style.backgroundColor = "#0084ff";
      button.style.color = "white";
    };

    button.onmouseout = () => {
      button.style.backgroundColor = "white";
      button.style.color = "#0084ff";
    };

    button.onclick = () => {
      selectOption(option);
    };

    optionsContainer.appendChild(button);
  });

  chat.appendChild(optionsContainer);
  chat.scrollTop = chat.scrollHeight;
}

function selectOption(option) {
  // Remove all buttons
  const buttons = document.querySelectorAll(".option-btn");
  buttons.forEach((btn) => btn.parentElement.removeChild(btn));

  // Show selected answer
  addMessage(option, "user");

  // Send to server
  sendAnswer(option);
}

async function sendAnswer(message) {
  const loading = showLoading();

  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ sessionId, message })
    });

    const data = await res.json();

    if (res.status === 401) {
      loading.remove();
      addMessage("Session expired. Please login again.", "bot");
      setTimeout(() => (window.location.href = "login.html"), 2000);
      return;
    }

    loading.remove();
    addMessage(data.reply, "bot");

    if (data.done) {
      input.disabled = true;
      // Show final result
      if (data.data) {
        const resultText = `\n📊 Triage Result: ${data.data.level}\nScore: ${data.data.score}`;
        addMessage(resultText, "bot");
      }
    } else if (data.options) {
      // Display button options for next question
      displayOptions(data.options);
    }
  } catch (err) {
    loading.remove();
    addMessage("Server error — is the server running?", "bot");
  }
}

async function send() {
  const message = input.value.trim();
  if (!message) return;

  switchToChatMode();
  addMessage(message, "user");
  input.value = "";

  sendAnswer(message);
}

// Initialize on page load
checkAuth();
addProfileLink();