document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");

  if (!registerForm) {
    console.error("No se encontró el formulario con id 'registerForm'");
    return;
  }

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const Username = document.getElementById("reg-username")?.value.trim();
    const Email = document.getElementById("reg-email")?.value.trim();
    const Password = document.getElementById("reg-password")?.value.trim();
    const Role = document.getElementById("reg-role")?.value;

    // Validación simple
    if (!Username || !Email || !Password || !Role) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    const data = {
      Username,
      Email,
      Password,
      Role,
    };
    console.log(Role)
    try {
      const response = await fetch("http://localhost:5219/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert("✅ Usuario registrado exitosamente.");
        registerForm.reset(); // Limpia el formulario
      } else {
        const errorText = await response.text();
        console.error("❌ Error en respuesta:", errorText);
        alert("❌ Error al registrar usuario.\n" + errorText);
      }
    } catch (err) {
      console.error("🚨 Error en la solicitud:", err);
      alert("🚨 Error al conectar con el servidor.");
    }
  });
});
