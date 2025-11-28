document.addEventListener("DOMContentLoaded", () => {

    const botonTextil = document.getElementById("activar-textil");
    const botonEditar = document.getElementById("editar-textil");
    const estadoTextil = document.getElementById("estado-textil");

    // Inicializa localStorage
    if (!localStorage.getItem("textilActivo")) {
        localStorage.setItem("textilActivo", "false");
    }

    function actualizarEstado() {
        const activo = localStorage.getItem("textilActivo") === "true";
        estadoTextil.textContent = activo ? "Activo" : "Desactivado";
        estadoTextil.style.color = activo ? "#4caf50" : "#f44336";
        botonTextil.textContent = activo ? "Desactivar Textiles" : "Activar Textiles";
    }

    // Eventos
    botonTextil.addEventListener("click", () => {
        const activo = localStorage.getItem("textilActivo") === "true";
        localStorage.setItem("textilActivo", (!activo).toString());
        actualizarEstado();
        alert(`Textil ${!activo ? "activado" : "desactivado"} correctamente`);
    });


botonEditar.addEventListener("click", () => {
    window.location.href = "Editar-Textiles/editar-textiles.html";
});

    actualizarEstado();
});


    // ========================================
    // CARNÉS
    // ========================================
    const botonCarnes = document.getElementById("activar-carnes");
    const estadoCarnes = document.getElementById("estado-carnes");

    // Mostrar estado actual de Carnés (por defecto activo)
    if (localStorage.getItem("carnesActivo") === "false") {
        estadoCarnes.textContent = "Desactivado";
        estadoCarnes.style.color = "#f44336";
        botonCarnes.textContent = "Activar Carnés";
    } else {
        estadoCarnes.textContent = "Activo";
        estadoCarnes.style.color = "#4caf50";
        botonCarnes.textContent = "Desactivar Carnés";
    }

    botonCarnes.addEventListener("click", () => {
        const activo = localStorage.getItem("carnesActivo") !== "false";

        if (activo) {
            localStorage.setItem("carnesActivo", "false");
            estadoCarnes.textContent = "Desactivado";
            estadoCarnes.style.color = "#f44336";
            botonCarnes.textContent = "Activar Carnés";
            alert("Carnés desactivado correctamente");
        } else {
            localStorage.setItem("carnesActivo", "true");
            estadoCarnes.textContent = "Activo";
            estadoCarnes.style.color = "#4caf50";
            botonCarnes.textContent = "Desactivar Carnés";
            alert("Carnés activado correctamente");
        }
    });

    // ========================================
    // COMBOS DE GRADUACIÓN
    // ========================================
    const botonCombos = document.getElementById("activar-combos");
    const estadoCombos = document.getElementById("estado-combos");

    // Mostrar estado actual de Combos (por defecto activo)
    if (localStorage.getItem("combosActivo") === "false") {
        estadoCombos.textContent = "Desactivado";
        estadoCombos.style.color = "#f44336";
        botonCombos.textContent = "Activar Combos";
    } else {
        estadoCombos.textContent = "Activo";
        estadoCombos.style.color = "#4caf50";
        botonCombos.textContent = "Desactivar Combos";
    }

    botonCombos.addEventListener("click", () => {
        const activo = localStorage.getItem("combosActivo") !== "false";

        if (activo) {
            localStorage.setItem("combosActivo", "false");
            estadoCombos.textContent = "Desactivado";
            estadoCombos.style.color = "#f44336";
            botonCombos.textContent = "Activar Combos";
            alert("Combos desactivado correctamente");
        } else {
            localStorage.setItem("combosActivo", "true");
            estadoCombos.textContent = "Activo";
            estadoCombos.style.color = "#4caf50";
            botonCombos.textContent = "Desactivar Combos";
            alert("Combos activado correctamente");
        }
    });

