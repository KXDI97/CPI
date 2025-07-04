document.querySelector(".register form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = this.querySelector('input[placeholder="Username"]').value;
    const email = this.querySelector('input[placeholder="Email"]').value;
    const password = this.querySelector('input[placeholder="Password"]').value;

    const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
    });

    const data = await response.text();
    alert(data);
});


document.querySelector(".login form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = this.querySelector('input[placeholder="Username"]').value;
    const password = this.querySelector('input[placeholder="Password"]').value;

    const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email: "" }) // email no requerido en login
    });

    if (response.ok) {
        alert("Login exitoso");
        // window.location.href = "dashboard.html";
    } else {
        alert("Credenciales inválidas");
    }
});
