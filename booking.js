import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

let selectedTime = null;
let selectedDate = null;

/* ---------------- SERVICES ---------------- */

const serviceOptions = {
  "Pressure Cleaning": ["Driveway","Car","Bin","Boat"],
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

/* ---------------- CALENDAR ---------------- */

flatpickr("#datePicker", {
  minDate: "today",
  dateFormat: "Y-m-d",

  onChange: async function(selectedDates, dateStr) {

    selectedDate = dateStr;
    selectedTime = null;
    slotsDiv.innerHTML = "Loading times...";

    const chosenDate = new Date(dateStr);
    const day = chosenDate.getDay();

    let allowedSlots = [];

    // WEEKENDS → full day
    if (day === 0 || day === 6) {
      for (let h = 9; h < 17; h++) {
        allowedSlots.push(`${String(h).padStart(2,"0")}:00`);
        allowedSlots.push(`${String(h).padStart(2,"0")}:30`);
      }
    }

    // MONDAY, WEDNESDAY, THURSDAY → 4pm–5pm only
    else if (day === 1 || day === 3 || day === 4) {
      allowedSlots = ["16:00","16:30"];
    }

    // OTHER DAYS → no booking
    else {
      slotsDiv.innerHTML = "No availability on this day.";
      return;
    }

    // check booked times in Firebase
    const q = query(bookingsRef, where("date", "==", dateStr));
    const snapshot = await getDocs(q);

    const booked = [];
    snapshot.forEach(doc => booked.push(doc.data().time));

    slotsDiv.innerHTML = "";

    allowedSlots.forEach(time => {

      if (booked.includes(time)) return;

      const div = document.createElement("div");
      div.className = "time";
      div.textContent = time;

      div.onclick = () => {
        document.querySelectorAll(".time").forEach(s => s.classList.remove("selected"));
        div.classList.add("selected");
        selectedTime = time;
      };

      slotsDiv.appendChild(div);
    });

    if (slotsDiv.innerHTML === "") {
      slotsDiv.innerHTML = "All times are booked.";
    }
  }
});

/* ---------------- BOOK BUTTON ---------------- */

document.getElementById("book").onclick = async () => {

  const name = document.getElementById("bookingName").value.trim();
  const phone = document.getElementById("bookingPhone").value.trim();
  const service = serviceSelect.value;
  const subService = subServiceSelect.value;

  if (!name || !phone || !selectedDate || !selectedTime || !service) {
    alert("Please complete all fields");
    return;
  }

  await addDoc(bookingsRef, {
    name,
    phone,
    service,
    subService,
    date: selectedDate,
    time: selectedTime,
    created: new Date()
  });

  alert("Booking Confirmed! I will contact you shortly.");
  location.reload();
};
