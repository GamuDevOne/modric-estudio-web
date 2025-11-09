document.addEventListener("DOMContentLoaded", () => {
    const boton = document.getElementById("activar-textil");
    const estado = document.getElementById("estado-textil");

    // Mostrar estado actual
    if (localStorage.getItem("textilActivo") === "true") {
        estado.textContent = "Activo";
        boton.textContent = "Desactivar Textil";
    }

    boton.addEventListener("click", () => {
        const activo = localStorage.getItem("textilActivo") === "true";

        if (activo) {
            localStorage.setItem("textilActivo", "false");
            estado.textContent = "Desactivado";
            boton.textContent = "Activar Textil";
        } else {
            localStorage.setItem("textilActivo", "true");
            estado.textContent = "Activo";
            boton.textContent = "Desactivar Textil";
        }
    });
});
