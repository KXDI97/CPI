document.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem("user");

  if (!user) {
    // Si no hay usuario logueado, redirige al login
    window.location.href = "../Landing Page/Login.html";
  }
});


  function logout() {
    localStorage.removeItem("user");
    window.location.href = "../Landing Page/Login.html";
  }
