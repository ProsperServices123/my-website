import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBv8Iap6L0Zz8U_0k3tQ-Bkb6KI9vGDbtI",
  authDomain: "prosper-e5c0d.firebaseapp.com",
  projectId: "prosper-e5c0d",
  storageBucket: "prosper-e5c0d.appspot.com",
  messagingSenderId: "745275197601",
  appId: "1:745275197601:web:e2f1f1e86013a382f048e0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const bookingsRef = collection(db, "bookings");

/* ---- ELEMENTS ---- */
const serviceSelect    = document.getElementById("service");
const subServiceSelect = document.getElementById("subService");
const subContainer     = document.getElementById("subServiceContainer");
const slotsDiv         = document.getElementById("times");
const morningBtn       = document.getElementById("morningBtn");
const noonBtn          = document.getElementById("noonBtn");
const periodContainer  = document.getElementById("periodContainer");
const timeSlotSection  = document.getElementById("timeSlotSection");
const timeLabel        = document.getElementById("timeLabel");
const msg              = document.getElementById("msg");

/* ---- STATE ---- */
let selectedDate   = null;
let startTime      = null;
let endTime        = null;
let selectedPeriod = null; // "morning" | "afternoon"

/* ---- PERIOD CONFIG ---- */
// Morning:   08:30 – 11:30
// Afternoon: 12:30 – 17:00
const PERIODS = {
  morning:   { start: "08:30", end: "11:30" },
  afternoon: { start: "12:30", end: "17:00" }
};

/* ---- SUB-SERVICES ---- */
const serviceOptions = {
  "Pressure Cleaning": ["Driveway / Paths", "Car", "Bins", "Boat"],
  "Gardening":         ["Lawn Mowing & Edging", "Pruning Trees/Bushes", "Leaf Cleanup"],
  "Gutter Cleaning":   ["Single Storey House", "Double Storey House"]
};

serviceSelect.onchange = () => {
  const selected = serviceSelect.value;
  subServiceSelect.innerHTML = "";
  if (!serviceOptions[selected]) { subContainer.style.display = "none"; return; }
  subContainer.style.display = "block";
  serviceOptions[selected].forEach(option => {
    const opt = document.createElement("option");
    opt.value = option; opt.textContent = option;
    subServiceSelect.appendChild(opt);
  });
};

/* ---- HELPERS ---- */
function toMinutes(t) {
  const [h, m] = t.split(":");
  return parseInt(h) * 60 + parseInt(m);
}

function toLabel(t) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function generateSlotsForPeriod(period) {
  const { start, end } = PERIODS[period];
  const slots = [];
  let minutes = toMinutes(start);
  const last  = toMinutes(end);
  while (minutes <= last) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    minutes += 30;
  }
  return slots;
}

function getContinuousEndTimes(start, allowedSlots, bookedSlots) {
  const valid = [];
  let started = false;
  for (const slot of allowedSlots) {
    if (slot === start) { started = true; continue; }
    if (!started) continue;
    if (bookedSlots.includes(slot)) break;
    valid.push(slot);
  }
  return valid;
}

/* ---- MONTH BOOKING CACHE ---- */
let monthBookings = {};

async function loadMonthBookings(year, month) {
  monthBookings = {};
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const end   = `${year}-${String(month + 1).padStart(2, "0")}-31`;
  const q = query(bookingsRef, where("date", ">=", start), where("date", "<=", end));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    const b = doc.data();
    if (!monthBookings[b.date]) monthBookings[b.date] = [];
    monthBookings[b.date].push(b);
  });
}

/* ---- FLATPICKR ---- */
flatpickr("#datePicker", {
  minDate: "today",
  dateFormat: "Y-m-d",
  onReady: async (_, __, fp) => {
    await loadMonthBookings(fp.currentYear, fp.currentMonth);
  },
  onMonthChange: async (_, __, fp) => {
    await loadMonthBookings(fp.currentYear, fp.currentMonth);
  },
  onChange: async (_, dateStr) => {
    selectedDate   = dateStr;
    startTime      = null;
    endTime        = null;
    selectedPeriod = null;

    slotsDiv.innerHTML = "";
    if (timeSlotSection) timeSlotSection.style.display = "none";
    if (timeLabel) {
      timeLabel.style.display  = "none";
      timeLabel.textContent    = "Select Start & End Time";
    }

    morningBtn.classList.remove("selected");
    noonBtn.classList.remove("selected");
    periodContainer.style.display = "block";
  }
});

/* ---- SHOW TIME SLOTS ---- */
async function showTimes(period) {
  if (!selectedDate) { alert("Please select a date first."); return; }

  selectedPeriod = period;
  startTime      = null;
  endTime        = null;

  morningBtn.classList.toggle("selected",  period === "morning");
  noonBtn.classList.toggle("selected",     period === "afternoon");

  if (timeSlotSection) timeSlotSection.style.display = "block";

  if (timeLabel) {
    timeLabel.style.display = "block";
    timeLabel.textContent   = "Select a start time";
  }

  slotsDiv.innerHTML = "Loading...";

  const allowedSlots = generateSlotsForPeriod(period);
  const bookings     = monthBookings[selectedDate] || [];
  const booked       = [];

  bookings.forEach(b => {
    allowedSlots.forEach(slot => {
      if (toMinutes(slot) < toMinutes(b.end) && toMinutes(slot) + 30 > toMinutes(b.start)) {
        booked.push(slot);
      }
    });
  });

  slotsDiv.innerHTML = "";

  allowedSlots.forEach(time => {
    const div = document.createElement("div");
    div.className    = "time-slot";
    div.textContent  = toLabel(time);
    div.dataset.time = time;

    if (booked.includes(time)) {
      div.classList.add("booked");
    } else {
      div.onclick = () => handleSlotClick(time, allowedSlots, booked);
    }

    slotsDiv.appendChild(div);
  });

  if (!slotsDiv.children.length) {
    slotsDiv.innerHTML = "<p style='font-size:13px;color:var(--muted);grid-column:1/-1;'>All times are booked for this period.</p>";
  }
}

/* ---- SLOT CLICK LOGIC ---- */
function handleSlotClick(time, allowedSlots, booked) {
  const allSlots = document.querySelectorAll(".time-slot");

  // No start yet → set start
  if (!startTime) {
    startTime = time;
    endTime   = null;
    refreshSlotStyles(allowedSlots, booked);
    updateLabel();
    return;
  }

  // Start set, no end → set end (must be after start)
  if (!endTime) {
    if (toMinutes(time) <= toMinutes(startTime)) {
      // Treat as a new start
      startTime = time;
      refreshSlotStyles(allowedSlots, booked);
      updateLabel();
      return;
    }
    endTime = time;
    refreshSlotStyles(allowedSlots, booked);
    updateLabel();
    return;
  }

  // Both set → start over with new start
  startTime = time;
  endTime   = null;
  refreshSlotStyles(allowedSlots, booked);
  updateLabel();
}

function refreshSlotStyles(allowedSlots, booked) {
  const validEnds = startTime && !endTime
    ? getContinuousEndTimes(startTime, allowedSlots, booked)
    : [];

  document.querySelectorAll(".time-slot").forEach(s => {
    const t = s.dataset.time;
    s.classList.remove("selected", "in-range");

    if (booked.includes(t)) {
      s.style.opacity       = "1";
      s.style.pointerEvents = "none";
      return;
    }

    if (endTime) {
      // Range is locked — restore full interactivity
      s.style.opacity       = "1";
      s.style.pointerEvents = "auto";
      const mins = toMinutes(t);
      if (t === startTime || t === endTime) s.classList.add("selected");
      else if (mins > toMinutes(startTime) && mins < toMinutes(endTime)) s.classList.add("in-range");
    } else if (startTime) {
      // Waiting for end — dim invalid slots
      if (t === startTime) {
        s.classList.add("selected");
        s.style.opacity       = "1";
        s.style.pointerEvents = "auto";
      } else if (validEnds.includes(t)) {
        s.style.opacity       = "1";
        s.style.pointerEvents = "auto";
      } else {
        s.style.opacity       = "0.3";
        s.style.pointerEvents = "none";
      }
    } else {
      s.style.opacity       = "1";
      s.style.pointerEvents = "auto";
    }
  });
}

function updateLabel() {
  if (!timeLabel) return;
  if (startTime && endTime) {
    timeLabel.textContent = `✅ ${toLabel(startTime)} → ${toLabel(endTime)}`;
  } else if (startTime) {
    timeLabel.textContent = `Start: ${toLabel(startTime)} — now pick an end time`;
  } else {
    timeLabel.textContent = "Select a start time";
  }
}

morningBtn.onclick = () => showTimes("morning");
noonBtn.onclick    = () => showTimes("afternoon");

/* ---- CONFIRM BOOKING ---- */
document.getElementById("book").onclick = async () => {
  const name       = document.getElementById("bookingName").value.trim();
  const phone      = document.getElementById("bookingPhone").value.trim();
  const service    = serviceSelect.value;
  const subService = subServiceSelect.value;

  if (!name || !selectedDate || !startTime || !endTime || !service) {
    msg.textContent = "Please fill in all fields and select a start & end time.";
    msg.style.color = "var(--red)";
    return;
  }

  await addDoc(bookingsRef, {
    name, phone, service, subService,
    date:    selectedDate,
    start:   startTime,
    end:     endTime,
    period:  selectedPeriod,
    created: new Date()
  });

  msg.textContent = "✅ Booking confirmed! We'll be in touch.";
  msg.style.color = "var(--navy)";
  setTimeout(() => location.reload(), 2500);
};
