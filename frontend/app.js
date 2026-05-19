const chat = document.getElementById("messages");
const input = document.getElementById("chatInput2");
 
const sessionId = crypto.randomUUID();
 
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
 
async function send() {
  const message = input.value.trim();
  if (!message) return;
 
  switchToChatMode();
  addMessage(message, "user");
  input.value = "";
 
  const loading = showLoading();
 
  try {
    const res = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message })
    });
 
    const data = await res.json();
 
    loading.remove();
    addMessage(data.reply, "bot");
 
    if (data.done) {
      input.disabled = true;
    }
 
  } catch (err) {
    loading.remove();
    addMessage("Server error — is the server running?", "bot");
  }
}
 