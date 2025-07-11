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
      alert("Please fill all the fields");
      return;
    }

    const data = {
      Username,
      Email,
      Password,
      Role,
    };

    console.log(Role);

    try {
      const response = await fetch("http://localhost:5219/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Done!',
          text: 'User created successfully',
          customClass: {
            popup: 'alert',
            confirmButtonColor: 'btn-grad'
          },
          background: '#1f2937',
          color: '#ffffffff',
        });
        registerForm.reset(); // Limpia el formulario
      } else {
        const errorText = await response.text();
        console.error("❌ Request error:", errorText);
        await Swal.fire({
          icon: "error",
          title: "Error to register",
          text: errorText.includes("ya está registrado")
            ? "The email or username is already used"
            : errorText,
          background: "#1f2937",
          color: "#ffffff",
          confirmButtonColor: "#8f69f9"
        });
      }
    } catch (err) {
      console.error("🚨 Request error", err);
      await Swal.fire({
        icon: "warning",
        title: "Error de conexión",
        customClass: {
          popup: 'alert',
          confirmButtonColor: 'btn-grad'
        },
        background: "#1f2937",
        color: "#ffffff",
        text: "Cannot reach the server."
      });
    }
  });
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const Username = document.getElementById("login-username").value;
  const Password = document.getElementById("login-password").value;

  const data = { Username, Password };

  try {
    const response = await fetch("http://localhost:5219/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      const result = await response.json();
      // Guardar datos en localStorage
      localStorage.setItem("user", JSON.stringify(result.User));
      // Redireccionar al dashboard
      window.location.href = "../Main/Dashboard.html";
    } else {
      Swal.fire({
        icon: "error",
        title: "¡Oops!",
        text: "Username or password invalid",
        background: "#1f2937",
        color: "#ffffff",
        customClass: {
          popup: 'alert',
        },
        confirmButtonColor: "#8f69f9",
        confirmButtonText: "Try again",
        showClass: {
          popup: "animate__animated animate__fadeInDown"
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp"
        }
      });
    }
  } catch (err) {
    console.error("🚨 Error en la solicitud:", err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo conectar con el servidor.',
      background: '#1f2937',
      color: '#ffffff',
      customClass: {
        popup: 'alert',
      },
      buttonsStyling: false
    });
  }
});