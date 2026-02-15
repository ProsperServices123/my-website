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

const slotsDiv = document.getElementById("slots");
const dateInput = document.getElementById("date");
let selectedTime = null;

/* -------- SERVICE DROPDOWN -------- */

const serviceSelect = document.getElementById("service");
const subServiceSelect = document.getElementById("subService");
const subContainer = document.getElementById("subServiceContainer");

const services = {
  "Pressure Cleaning": [
    "Driveway",
    "Car",
    "Bin",
    "Boat"
  ],
  "Gardening": [
    "Lawn Mowing and edging",
    "Pruning bushes and trees",
    "Leaf removal and yard cleanup"
  ],
  "Gutter Cleaning": [
    "Single story house",
    "Double story house"
  ]
};

serviceSelect.onchange = () => {
  const selected = serviceSelect.value;

  if (!selected) {
    subContainer.style.display = "none";
    return;
  }

  subServiceSelect.innerHTML = "";

  services[selected].forEach(option => {
    const opt = document.createElement("option");
    opt.value = option;
    opt.textContent = option;
    subServiceSelect.appendChild(opt);
  });

  subContainer.style.display = "block";
};

/* -------- TIME SLOTS -------- */

function generateSlots() {
  const slots = [];
  for (let h = 9; h < 17; h++) {
    slots.push(`${h.toString().padStart(2,"0")}:00`);
    slots.push(`${h.toString().padStart(2,"0")}:30`);
  }
  return slots;
}

dateInput.onchange = async () => {
  const date = dateInput.value;
  slotsDiv.innerHTML = "";
  selectedTime = null;

  const q = query(bookingsRef, where("date", "==", date));
  const snapshot = await getDocs(q);

  const booked = [];
  snapshot.forEach(doc => booked.push(doc.data().time));

  generateSlots().forEach(time => {
    if (booked.includes(time)) return;

    const div = document.createElement("div");
    div.className = "slot";
    div.textContent = time;

    div.onclick = () => {
      document.querySelectorAll(".slot").forEach(s => s.classList.remove("selected"));
      div.classList.add("selected");
      selectedTime = time;
    };

    slotsDiv.appendChild(div);
  });
};

/* -------- BOOKING -------- */

document.getElementById("book").onclick = async () => {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const service = serviceSelect.value;
  const subService = subServiceSelect.value;
  const date = dateInput.value;

  if (!name || !phone || !service || !subService || !selectedTime || !date) {
    alert("Please complete all fields");
    return;
  }

  await addDoc(bookingsRef, {
    name,
    phone,
    service,
    subService,
    date,
    time: selectedTime,
    created: new Date()
  });

  alert("Booking Confirmed! We will contact you shortly.");

  location.reload();
};
