document.addEventListener("DOMContentLoaded", () => {
    // ========================================
    // TEXTIL
    // ========================================
    const botonTextil = document.getElementById("activar-textil");
    const estadoTextil = document.getElementById("estado-textil");

    // Mostrar estado actual de Textil
    if (localStorage.getItem("textilActivo") === "true") {
        estadoTextil.textContent = "Activo";
        estadoTextil.style.color = "#4caf50";
        botonTextil.textContent = "Desactivar Textil";
    } else {
        estadoTextil.textContent = "Desactivado";
        estadoTextil.style.color = "#f44336";
        botonTextil.textContent = "Activar Textil";
    }

    botonTextil.addEventListener("click", () => {
        const activo = localStorage.getItem("textilActivo") === "true";

        if (activo) {
            localStorage.setItem("textilActivo", "false");
            estadoTextil.textContent = "Desactivado";
            estadoTextil.style.color = "#f44336";
            botonTextil.textContent = "Activar Textil";
            alert("Textil desactivado correctamente");
        } else {
            localStorage.setItem("textilActivo", "true");
            estadoTextil.textContent = "Activo";
            estadoTextil.style.color = "#4caf50";
            botonTextil.textContent = "Desactivar Textil";
            alert("Textil activado correctamente");
        }
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
});