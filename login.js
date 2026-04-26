



document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const loginInput = document.getElementById("telephone");
  const passwordInput = document.getElementById("password");

  const errorTelephone = document.getElementById("error_telephone");
  const errorPassword = document.getElementById("error_password");
  const messageBox = document.getElementById("messageBox");

const API_URL = "https://shopnet-immo-backend.onrender.com/api/commissionnaires/login";

  function clearErrors() {
    errorTelephone.textContent = "";
    errorTelephone.style.display = "none";

    errorPassword.textContent = "";
    errorPassword.style.display = "none";
  }

  function showMessage(msg, type = "error") {
    messageBox.style.display = "block";
    messageBox.className = `message-box ${type}`;
    messageBox.innerHTML = msg;
  }

  function setLoading(state) {
    const btn = form.querySelector(".btn-login");
    btn.disabled = state;
    btn.textContent = state ? "Connexion..." : "Se connecter";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const login = loginInput.value.trim();
    const password = passwordInput.value.trim();

    if (!login) {
      errorTelephone.textContent = "⚠️ Email ou téléphone requis";
      errorTelephone.style.display = "block";
      return;
    }

    if (!password) {
      errorPassword.textContent = "⚠️ Mot de passe requis";
      errorPassword.style.display = "block";
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ login, password }),
      });

      const data = await response.json();

      // ❌ ERREUR SERVEUR
      if (!response.ok) {
        if (response.status === 400) {
          showMessage(data.message || "Erreur de connexion", "error");
        } else if (response.status === 403) {
          showMessage("⏳ Compte en attente de validation", "error");
        } else {
          showMessage("❌ Erreur serveur", "error");
        }
        return;
      }

      // ✅ STOCKER TOKEN (IMPORTANT)
      localStorage.setItem("token", data.token);

      showMessage("🎉 Connexion réussie", "success");

      // 🔥 REDIRECTION CORRIGÉE
      setTimeout(() => {
        window.location.href = "./dashboard-commissionnaire.html";
      }, 800);

    } catch (err) {
      console.error(err);

      showMessage(
        "🌐 Erreur réseau. Vérifie ton serveur ou internet.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  });
});
