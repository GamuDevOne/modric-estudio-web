document.addEventListener("DOMContentLoaded", () => {
    const textilActivo = localStorage.getItem("textilActivo") === "true";

    // Solo redirigir si Textil está activo y no estamos ya en texadmin
    if (textilActivo && !window.location.href.includes("texadmin.html")) {
        window.location.href = "./texadmin.html"; // ruta relativa desde textiles.html
    }
});
