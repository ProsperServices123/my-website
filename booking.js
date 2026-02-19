```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

/* ---------------- FIREBASE ---------------- */
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

/* ---------------- ELEMENTS ---------------- */
const slotsDiv = document.getElementById("times");
const serviceSelect = document.getElementById("service");
const subServiceSelect = document.getElementById("subService");
const subContainer = document.getElementById("subServiceContainer");

const morningBtn = document.getElementById("morningBtn");
const noonBtn = document.getElementById("noonBtn");
const timeLabel = document.getElementById("timeLabel");

/* ---------------- STATE ---------------- */
let selectedDate = null;
let startTime = null;
let endTime = null;
let selectedPeriod = null;

/* ---------------- SERVICES ---------------- */
const serviceOptions = {
  "Pressure Cleaning": ["Driveway/ Paths","Car","Bins","Boat"],
  "Gardening": ["Lawn Mowing & Edging","Pruning Trees/Bushes","Leaf Cleanup"],
  "Gutter Cleaning": ["Single Storey House","Double Storey House"]
};

serviceSelect.onchange = () => {
  const selected = serviceSelect.value;
  subServiceSelect.innerHTML = "";

  if (!serviceOptions[selected]) {
    subContainer.style.display = "none";
    return;
  }

  subContainer.style.display = "block";

  serviceOptions[selected].forEach(option => {
    const opt = document.createElement("option");
    opt.value = option;
    opt.textContent = option;
    subServiceSelect.appendChild(opt);
  });
};

/* ---------------- TIME HELPERS ---------------- */
function toMinutes(t){
  const [h,m] = t.split(":");
  return parseInt(h)*60 + parseInt(m);
}

/* CORRECT TIME RANGES */
function generateSlotsForPeriod(period){
  let slots=[];

  if(period==="morning"){
    // 08:30 → 12:00
    let minutes = toMinutes("08:30");
    const end   = toMinutes("12:00");

    while(minutes <= end){
      const h = Math.floor(minutes/60);
      const m = minutes%60;
      slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
      minutes += 30;
    }
  }

  if(period==="noon"){
    // 12:30 → 17:00
    let minutes = toMinutes("12:30");
    const end   = toMinutes("17:00");

    while(minutes <= end){
      const h = Math.floor(minutes/60);
      const m = minutes%60;
      slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
      minutes += 30;
    }
  }

  return slots;
}

/* -------- MONTH BOOKING CACHE -------- */
let monthBookings = {};

async function loadMonthBookings(year, month){
  monthBookings = {};

  const start = `${year}-${String(month+1).padStart(2,'0')}-01`;
  const end   = `${year}-${String(month+1).padStart(2,'0')}-31`;

  const q = query(bookingsRef, where("date", ">=", start), where("date", "<=", end));
  const snap = await getDocs(q);

  snap.forEach(doc=>{
    const b = doc.data();
    if(!monthBookings[b.date]) monthBookings[b.date]=[];
    monthBookings[b.date].push(b);
  });
}

/* ---------------- CALENDAR ---------------- */
flatpickr("#datePicker",{
  minDate:"today",
  dateFormat:"Y-m-d",

  onReady: async function(selectedDates,dateStr,fp){
    await loadMonthBookings(fp.currentYear,fp.currentMonth);
  },

  onMonthChange: async function(selectedDates,dateStr,fp){
    await loadMonthBookings(fp.currentYear,fp.currentMonth);
  },

  onChange: async function(selectedDates,dateStr){
    selectedDate = dateStr;
    startTime = null;
    endTime = null;
    selectedPeriod = null;

    slotsDiv.innerHTML="";
    timeLabel.style.display="none";

    morningBtn.classList.remove("selected");
    noonBtn.classList.remove("selected");
  }
});
function getContinuousEndTimes(start, allowedSlots, bookedSlots){

  const valid = [];
  let started = false;

  for(const slot of allowedSlots){

    if(slot === start){
      started = true;
      continue;
    }

    if(!started) continue;

    // stop when we hit a booked slot
    if(bookedSlots.includes(slot)) break;

    valid.push(slot);
  }

  return valid;
}

/* ---------------- PERIOD SELECT ---------------- */
async function showTimes(period){

  if(!selectedDate){
    alert("Please select a date first.");
    return;
  }

  selectedPeriod = period;

  morningBtn.classList.remove("selected");
  noonBtn.classList.remove("selected");

  if(period==="morning") morningBtn.classList.add("selected");
  else noonBtn.classList.add("selected");

  timeLabel.style.display="block";
  slotsDiv.innerHTML="Loading times...";

  const allowedSlots = generateSlotsForPeriod(period);
  const bookings = monthBookings[selectedDate] || [];

  let booked=[];

  bookings.forEach(b=>{
    allowedSlots.forEach(slot=>{
      if(toMinutes(slot) < toMinutes(b.end) && toMinutes(slot)+30 > toMinutes(b.start)){
        booked.push(slot);
      }
    });
  });

  slotsDiv.innerHTML="";

  allowedSlots.forEach(time=>{
    if(booked.includes(time)) return;

    const div=document.createElement("div");
    div.className="time";
    div.textContent=time;
    div.dataset.time=time;

   div.onclick = () => {

  // -------- PICK START TIME --------
  if(!startTime){

    startTime = time;
    endTime = null;

    document.querySelectorAll("#times .time").forEach(s=>s.classList.remove("selected"));
    div.classList.add("selected");

    // Only allow valid end times
    const validEnds = getContinuousEndTimes(startTime, allowedSlots, booked);

    document.querySelectorAll("#times .time").forEach(slot=>{
      const t = slot.dataset.time;

      if(t !== startTime && !validEnds.includes(t)){
        slot.style.opacity="0.3";
        slot.style.pointerEvents="none";
      }
    });

    return;
  }

  // -------- PICK END TIME --------
  if(!endTime){

    if(toMinutes(time)<=toMinutes(startTime)) return;

    endTime = time;

    document.querySelectorAll("#times .time").forEach(slot=>{
      const t = slot.dataset.time;

      if(toMinutes(t)>=toMinutes(startTime)&&toMinutes(t)<=toMinutes(endTime)){
        slot.classList.add("selected");
      }
    });

    return;
  }

  // -------- RESET --------
  startTime = time;
  endTime = null;

  document.querySelectorAll("#times .time").forEach(s=>{
    s.classList.remove("selected");
    s.style.opacity="1";
    s.style.pointerEvents="auto";
  });

  div.classList.add("selected");
};

    slotsDiv.appendChild(div);
  });

  if(slotsDiv.innerHTML===""){
    slotsDiv.innerHTML="All times booked in this period.";
  }
}

morningBtn.onclick=()=>showTimes("morning");
noonBtn.onclick=()=>showTimes("noon");

/* ---------------- BOOK ---------------- */
document.getElementById("book").onclick=async()=>{

  const name=document.getElementById("bookingName").value.trim();
  const phone=document.getElementById("bookingPhone").value.trim();
  const service=serviceSelect.value;
  const subService=subServiceSelect.value;

  if(!name || !selectedDate || !startTime || !endTime || !service){
    alert("Please select a start AND end time.");
    return;
  }

  await addDoc(bookingsRef,{
    name,
    phone,
    service,
    subService,
    date:selectedDate,
    start:startTime,
    end:endTime,
    created:new Date()
  });

  alert("Booking Confirmed!");
  location.reload();
};
```
