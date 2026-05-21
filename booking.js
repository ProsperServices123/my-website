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

const slotsDiv        = document.getElementById("times");
const serviceSelect   = document.getElementById("service");
const subServiceSelect= document.getElementById("subService");
const subContainer    = document.getElementById("subServiceContainer");
const morningBtn      = document.getElementById("morningBtn");
const noonBtn         = document.getElementById("noonBtn");
const timeLabel       = document.getElementById("timeLabel");
const periodContainer = document.getElementById("periodContainer");

let selectedDate   = null;
let startTime      = null;
let endTime        = null;
let selectedPeriod = null;

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

function toMinutes(t) {
  const [h, m] = t.split(":");
  return parseInt(h) * 60 + parseInt(m);
}

function generateSlotsForPeriod(period) {
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

flatpickr("#datePicker", {
  minDate: "today",
  dateFormat: "Y-m-d",
  onReady: async (_, __, fp) => { await loadMonthBookings(fp.currentYear, fp.currentMonth); },
  onMonthChange: async (_, __, fp) => { await loadMonthBookings(fp.currentYear, fp.currentMonth); },
  onChange: async (_, dateStr) => {
    selectedDate = dateStr;
    startTime = null; endTime = null; selectedPeriod = null;
    slotsDiv.innerHTML = "";
    timeLabel.style.display = "none";
    morningBtn.classList.remove("selected");
    noonBtn.classList.remove("selected");
    periodContainer.style.display = "block";
  }
});

async function showTimes(period) {
  if (!selectedDate) { alert("Please select a date first."); return; }
  selectedPeriod = period;
  morningBtn.classList.toggle("selected", period === "morning");
  noonBtn.classList.toggle("selected", period === "noon");

  timeLabel.style.display = "block";
  slotsDiv.innerHTML = "Loading...";

  const allowedSlots = generateSlotsForPeriod(period);
  const bookings = monthBookings[selectedDate] || [];
  const booked = [];
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
    // Use .time-slot so CSS styles apply correctly
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
      // Reset and pick new start
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

morningBtn.onclick = () => showTimes("morning");
noonBtn.onclick    = () => showTimes("noon");

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
