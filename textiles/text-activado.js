const cart = [];
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const cartPanel = document.getElementById("cart-panel");
const cartIcon = document.querySelector(".cart-icon");

document.querySelectorAll(".add-btn").forEach(button => {
    button.addEventListener("click", () => {
        const productoDiv = button.parentElement;
        const nombre = button.getAttribute("data-nombre");
        const precio = parseFloat(button.getAttribute("data-precio"));
        const cantidad = parseInt(productoDiv.querySelector(".cantidad").value);
        const talla = productoDiv.querySelector(".talla").value;

        const existing = cart.find(item => item.nombre === nombre && item.talla === talla);
        if (existing) {
            existing.cantidad += cantidad;
        } else {
            cart.push({ nombre, precio, cantidad, talla });
        }
        renderCart();
    });
});

function renderCart() {
    cartItems.innerHTML = "";
    let total = 0;
    cart.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.nombre} (${item.talla}) x${item.cantidad} - $${(item.precio * item.cantidad).toFixed(2)}`;
        cartItems.appendChild(li);
        total += item.precio * item.cantidad;
    });
    cartTotal.textContent = `Total: $${total.toFixed(2)}`;
    document.getElementById("cart-count").textContent = cart.length;
}

function toggleCart() {
    cartPanel.style.display = cartPanel.style.display === "block" ? "none" : "block";
}

function checkout() {
    if (cart.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }
    alert("Enviando cotización al contacto de Modric Estudio...");
    cart.length = 0;
    renderCart();
}
