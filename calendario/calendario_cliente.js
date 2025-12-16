// =====================================
// STATE
// =====================================
const STATE = {
  tzMode: "local",
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(),
  selectedDate: null,
  selectedTime: null,
  purchase: {
    servicio: "Sesión fotográfica",
    cliente: null,
    paquete: null,
    duracion: "1 hr",
    precio: null,
    prioridad: "Pendiente"
  }
};

// Horarios
const DEFAULT_SLOTS = [
  "08:30","09:00","09:30","10:00",
  "10:30","11:00","11:30","12:00",
  "12:30","13:00"
];

// =====================================
// DOM
// =====================================
const daysGrid = document.getElementById("daysGrid");
const monthLabel = document.getElementById("monthLabel");
const selectedDayLabel = document.getElementById("selectedDayLabel");
const slotGrid = document.getElementById("slotGrid");

const tzSelect = document.getElementById("tzSelect");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");

const svcName = document.getElementById("svcName");
const svcDate = document.getElementById("svcDate");
const svcTime = document.getElementById("svcTime");
const svcClient = document.getElementById("svcClient");
const svcPack = document.getElementById("svcPack");
const svcDuration = document.getElementById("svcDuration");
const svcPrice = document.getElementById("svcPrice");
const svcPriority = document.getElementById("svcPriority");
const nextBtn = document.getElementById("nextBtn");

const collapseBtn = document.getElementById("collapseBtn");
const detailsBody = document.getElementById("detailsBody");
const showAllBtn = document.getElementById("showAllBtn");

// =====================================
// INIT
// =====================================
initFromLocalStorage();
renderHeader();
renderCalendar();
renderSlots();
renderDetails();

// =====================================
// EVENTS
// =====================================
tzSelect.addEventListener("change", () => {
  STATE.tzMode = tzSelect.value;
  renderDetails();
});

prevMonth.addEventListener("click", () => {
  STATE.viewMonth--;
  if (STATE.viewMonth < 0) {
    STATE.viewMonth = 11;
    STATE.viewYear--;
  }
  renderHeader();
  renderCalendar();
});

nextMonth.addEventListener("click", () => {
  STATE.viewMonth++;
  if (STATE.viewMonth > 11) {
    STATE.viewMonth = 0;
    STATE.viewYear++;
  }
  renderHeader();
  renderCalendar();
});

collapseBtn.addEventListener("click", () => {
  const hidden = detailsBody.style.display === "none";
  detailsBody.style.display = hidden ? "block" : "none";
  collapseBtn.textContent = hidden ? "^" : "v";
});

showAllBtn.addEventListener("click", () => {
  alert("Más sesiones próximamente.");
});

// =====================================
// BOTÓN FINAL → CREA COTIZACIÓN
// =====================================
nextBtn.addEventListener("click", () => {

  if (!STATE.selectedDate || !STATE.selectedTime) {
    alert("Selecciona una fecha y una hora");
    return;
  }

  const session = JSON.parse(localStorage.getItem("userSession"));
  if (!session) {
    window.location.href = "../login/login.html";
    return;
  }

  fetch("../php/cotizaciones.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "crear_cotizacion",

      idCliente: session.id,
      nombreCliente: session.nombre,
      correoCliente: session.correo,

      tipoSesion: STATE.purchase.paquete,
      descripcion: STATE.purchase.servicio,

      fechaSolicitada: fmtDate(STATE.selectedDate),
      horaSolicitada: STATE.selectedTime
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      localStorage.removeItem("paqueteSeleccionado");
      window.location.href = "../clientes/cotizaciones.html";
    } else {
      alert(data.message);
    }
  })
  .catch(() => {
    alert("Error de conexión con el servidor");
  });
});

// =====================================
// FUNCTIONS
// =====================================
function initFromLocalStorage(){
  try {
    const user = JSON.parse(localStorage.getItem("userSession"));
    const paquete = localStorage.getItem("paqueteSeleccionado");

    if (user) STATE.purchase.cliente = user.nombre;
    if (paquete) STATE.purchase.paquete = paquete;
  } catch (e) {
    console.error("Error cargando datos", e);
  }
}

function renderHeader(){
  const d = new Date(STATE.viewYear, STATE.viewMonth, 1);
  monthLabel.textContent = d.toLocaleString("es-ES", {
    month:"long", year:"numeric"
  });
}

function renderCalendar(){
  daysGrid.innerHTML = "";
  const today = new Date();
  const first = new Date(STATE.viewYear, STATE.viewMonth, 1);
  const last = new Date(STATE.viewYear, STATE.viewMonth + 1, 0);

  for (let i = 0; i < first.getDay(); i++) {
    daysGrid.appendChild(document.createElement("div"));
  }

  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(STATE.viewYear, STATE.viewMonth, d);
    const cell = document.createElement("div");
    cell.className = "day";
    cell.textContent = d;

    if (sameDay(date, today)) cell.classList.add("today");
    if (STATE.selectedDate && sameDay(date, STATE.selectedDate)) cell.classList.add("selected");

    cell.onclick = () => {
      STATE.selectedDate = date;
      STATE.selectedTime = null;
      renderCalendar();
      renderSlots();
      renderDetails();
    };

    daysGrid.appendChild(cell);
  }
}

function renderSlots(){
  slotGrid.innerHTML = "";
  if (!STATE.selectedDate) {
    selectedDayLabel.textContent = "Selecciona un día";
    nextBtn.disabled = true;
    return;
  }

  selectedDayLabel.textContent = STATE.selectedDate.toLocaleDateString("es-ES", {
    weekday:"long", month:"long", day:"numeric"
  });

  DEFAULT_SLOTS.forEach(t => {
    const btn = document.createElement("button");
    btn.className = "slot";
    btn.textContent = prettyTime(t);

    if (STATE.selectedTime === t) btn.classList.add("selected");

    btn.onclick = () => {
      STATE.selectedTime = t;
      renderSlots();
      renderDetails();
    };

    slotGrid.appendChild(btn);
  });

  nextBtn.disabled = !(STATE.selectedDate && STATE.selectedTime);
}

function renderDetails(){
  svcName.textContent = STATE.purchase.servicio;
  svcClient.textContent = STATE.purchase.cliente || "—";
  svcPack.textContent = STATE.purchase.paquete || "—";
  svcDuration.textContent = STATE.purchase.duracion;
  svcPrice.textContent = STATE.purchase.precio ? `$${STATE.purchase.precio}` : "—";
  svcPriority.textContent = STATE.purchase.prioridad;

  svcDate.textContent = STATE.selectedDate
    ? STATE.selectedDate.toLocaleDateString("es-ES")
    : "—";

  svcTime.textContent = STATE.selectedTime
    ? prettyTime(STATE.selectedTime)
    : "—";
}

// =====================================
// HELPERS
// =====================================
function sameDay(a,b){
  return a.getFullYear()===b.getFullYear() &&
         a.getMonth()===b.getMonth() &&
         a.getDate()===b.getDate();
}

function pad(n){ return String(n).padStart(2,"0"); }

function fmtDate(d){
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function prettyTime(hhmm){
  const [h,m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  return `${(h % 12)||12}:${pad(m)} ${ampm}`;
}
