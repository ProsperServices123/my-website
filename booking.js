import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

const slotsDiv         = document.getElementById("times");
const serviceSelect    = document.getElementById("service");
const subServiceSelect = document.getElementById("subService");
const subContainer     = document.getElementById("subServiceContainer");
const morningBtn       = document.getElementById("morningBtn");
const noonBtn          = document.getElementById("noonBtn");
const timeLabel        = document.getElementById("timeLabel");
const periodContainer  = document.getElementById("periodContainer");

let selectedDate   = null;
let startTime      = null;
let endTime        = null;
let selectedPeriod = null;

/* ── AVAILABILITY ──────────────────────────────────────────
   0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
   "unavailable" → red, not clickable
   "limited"     → yellow, 16:00–17:00 only
   "open"        → green, full day
──────────────────────────────────────────────────────────── */
const DAY_STATUS = {
  0: "open",        // Sunday
  1: "limited",     // Monday   (4–5 pm only)
  2: "unavailable", // Tuesday
  3: "unavailable", // Wednesday
  4: "limited",     // Thursday (4–5 pm only)
  5: "unavailable", // Friday
  6: "open"         // Saturday
};

function getDayStatus(dateStr) {
  // dateStr is "YYYY-MM-DD"
  const [y, m, d] = dateStr.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return DAY_STATUS[day];
}

/* ── SERVICES ─────────────────────────────────────────────── */
const serviceOptions = {
  "Pressure Cleaning": ["Driveway / Paths","Car","Bins","Boat"],
  "Gardening":         ["Lawn Mowing & Edging","Pruning Trees/Bushes","Leaf Cleanup"],
  "Gutter Cleaning":   ["Single Storey House","Double Storey House"]
};

serviceSelect.onchange = () => {
  const selected = serviceSelect.value;
  subServiceSelect.innerHTML = "";
  if (!serviceOptions[selected]) { subContainer.style.display = "none"; return; }
  subContainer.style.display = "block";
  serviceOptions[selected].forEach(opt => {
    const o = document.createElement("option");
    o.value = opt; o.textContent = opt;
    subServiceSelect.appendChild(o);
  });
};

/* ── TIME HELPERS ─────────────────────────────────────────── */
function toMinutes(t) {
  const [h, m] = t.split(":");
  return parseInt(h) * 60 + parseInt(m);
}

function generateSlotsForPeriod(period, dateStr) {
  const status = getDayStatus(dateStr);

  // Limited days: only 16:00–17:00 regardless of period
  if (status === "limited") {
    return ["16:00", "16:30", "17:00"];
  }

  // Open days: normal morning / afternoon slots
  const slots = [];
  const [start, end] = period === "morning" ? ["08:30","12:00"] : ["12:30","17:00"];
  let minutes = toMinutes(start);
  while (minutes <= toMinutes(end)) {
    const h = Math.floor(minutes / 60), m = minutes % 60;
    slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    minutes += 30;
  }
  return slots;
}

function getContinuousEndTimes(start, allowedSlots, bookedSlots) {
  const valid = []; let started = false;
  for (const slot of allowedSlots) {
    if (slot === start) { started = true; continue; }
    if (!started) continue;
    if (bookedSlots.includes(slot)) break;
    valid.push(slot);
  }
  return valid;
}

/* ── MONTH BOOKING CACHE ──────────────────────────────────── */
let monthBookings = {};

async function loadMonthBookings(year, month) {
  monthBookings = {};
  const start = `${year}-${String(month+1).padStart(2,'0')}-01`;
  const end   = `${year}-${String(month+1).padStart(2,'0')}-31`;
  const q = query(bookingsRef, where("date",">=",start), where("date","<=",end));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    const b = doc.data();
    if (!monthBookings[b.date]) monthBookings[b.date] = [];
    monthBookings[b.date].push(b);
  });
}

/* ── FLATPICKR ────────────────────────────────────────────── */
flatpickr("#datePicker", {
  minDate: "today",
  dateFormat: "Y-m-d",

  // Colour each day circle
  onDayCreate: function(dObj, dStr, fp, dayElem) {
    const dateStr = fp.formatDate(dayElem.dateObj, "Y-m-d");
    const status  = getDayStatus(dateStr);

    if (status === "unavailable") {
      dayElem.style.backgroundColor = "#e74c3c";
      dayElem.style.color = "#fff";
      dayElem.style.borderRadius = "50%";
      dayElem.classList.add("flatpickr-disabled");
      dayElem.style.pointerEvents = "none";
      dayElem.style.opacity = "0.6";
    } else if (status === "limited") {
      dayElem.style.backgroundColor = "#f0c040";
      dayElem.style.color = "#1a1a2e";
      dayElem.style.borderRadius = "50%";
    } else if (status === "open") {
      dayElem.style.backgroundColor = "#27ae60";
      dayElem.style.color = "#fff";
      dayElem.style.borderRadius = "50%";
    }
  },

  onReady: async (_, __, fp) => {
    await loadMonthBookings(fp.currentYear, fp.currentMonth);
  },
  onMonthChange: async (_, __, fp) => {
    await loadMonthBookings(fp.currentYear, fp.currentMonth);
  },
  onChange: async (_, dateStr) => {
    selectedDate = dateStr;
    startTime = null; endTime = null; selectedPeriod = null;
    slotsDiv.innerHTML = "";
    timeLabel.style.display = "none";
    morningBtn.classList.remove("selected");
    noonBtn.classList.remove("selected");

    const status = getDayStatus(dateStr);

    if (status === "unavailable") {
      periodContainer.style.display = "none";
      slotsDiv.innerHTML = "<p style='font-size:13px;color:#e74c3c;font-weight:600;'>Not available on this day.</p>";
      return;
    }

    if (status === "limited") {
      // Skip period buttons, show 4–5pm slots directly
      periodContainer.style.display = "none";
      timeLabel.style.display = "block";
      await renderSlots("noon", dateStr); // period arg doesn't matter for limited
      return;
    }

    // Open day — show morning/afternoon buttons
    periodContainer.style.display = "block";
  }
});

/* ── RENDER TIME SLOTS ────────────────────────────────────── */
async function renderSlots(period, dateStr) {
  slotsDiv.innerHTML = "Loading...";

  const allowedSlots = generateSlotsForPeriod(period, dateStr);
  const bookings     = monthBookings[dateStr] || [];
  const booked       = [];

  bookings.forEach(b => {
    allowedSlots.forEach(slot => {
      if (toMinutes(slot) < toMinutes(b.end) && toMinutes(slot) + 30 > toMinutes(b.start))
        booked.push(slot);
    });
  });

  slotsDiv.innerHTML = "";

  allowedSlots.forEach(time => {
    if (booked.includes(time)) return;
    const div = document.createElement("div");
    div.className = "time-slot";
    div.textContent = time;
    div.dataset.time = time;

    div.onclick = () => {
      if (!startTime) {
        startTime = time; endTime = null;
        document.querySelectorAll(".time-slot").forEach(s => {
          s.classList.remove("selected");
          s.style.opacity = "1";
          s.style.pointerEvents = "auto";
        });
        div.classList.add("selected");
        const validEnds = getContinuousEndTimes(startTime, allowedSlots, booked);
        document.querySelectorAll(".time-slot").forEach(s => {
          if (s.dataset.time !== startTime && !validEnds.includes(s.dataset.time)) {
            s.style.opacity = "0.3";
            s.style.pointerEvents = "none";
          }
        });
        return;
      }
      if (!endTime) {
        if (toMinutes(time) <= toMinutes(startTime)) return;
        endTime = time;
        document.querySelectorAll(".time-slot").forEach(s => {
          const t = s.dataset.time;
          if (toMinutes(t) >= toMinutes(startTime) && toMinutes(t) <= toMinutes(endTime))
            s.classList.add("selected");
        });
        return;
      }
      // Reset
      startTime = time; endTime = null;
      document.querySelectorAll(".time-slot").forEach(s => {
        s.classList.remove("selected");
        s.style.opacity = "1";
        s.style.pointerEvents = "auto";
      });
      div.classList.add("selected");
    };

    slotsDiv.appendChild(div);
  });

  if (!slotsDiv.children.length)
    slotsDiv.innerHTML = "<p style='font-size:13px;color:var(--muted)'>All times booked in this period.</p>";
}

/* ── PERIOD BUTTONS ───────────────────────────────────────── */
async function showTimes(period) {
  if (!selectedDate) { alert("Please select a date first."); return; }
  selectedPeriod = period;
  morningBtn.classList.toggle("selected", period === "morning");
  noonBtn.classList.toggle("selected", period === "noon");
  timeLabel.style.display = "block";
  await renderSlots(period, selectedDate);
}

morningBtn.onclick = () => showTimes("morning");
noonBtn.onclick    = () => showTimes("noon");

/* ── CONFIRM BOOKING ──────────────────────────────────────── */
document.getElementById("book").onclick = async () => {
  const name       = document.getElementById("bookingName").value.trim();
  const phone      = document.getElementById("bookingPhone").value.trim();
  const service    = serviceSelect.value;
  const subService = subServiceSelect.value;
  const msg        = document.getElementById("msg");

  if (!name || !selectedDate || !startTime || !endTime || !service) {
    msg.textContent = "Please fill in all fields and select a start & end time.";
    msg.style.color = "#e74c3c";
    return;
  }

  await addDoc(bookingsRef, {
    name, phone, service, subService,
    date: selectedDate, start: startTime, end: endTime,
    created: new Date()
  });

  msg.textContent = "✅ Booking confirmed!";
  msg.style.color = "#1e3c72";
  setTimeout(() => location.reload(), 2000);
};
