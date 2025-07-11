document.addEventListener("DOMContentLoaded", () => {
  fetch("http://localhost:5219/usuarios")
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.getElementById("usersTableBody");

      if (!tbody) {
        console.error("No se encontró el tbody con id 'usersTableBody'");
        return;
      }

      // Limpiar contenido actual
      tbody.innerHTML = "";

      data.forEach((user) => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${user.username}</td>
          <td>${user.email}</td>
          <td>${user.role}</td>
          <td>
            <ion-icon name="pencil-outline" class="icon edit"></ion-icon>
            <ion-icon name="trash-outline" class="icon delete"></ion-icon>
          </td>
        `;

        tbody.appendChild(row);
      });
    })
    .catch((error) => {
      console.error("Error cargando usuarios:", error);
    });
});