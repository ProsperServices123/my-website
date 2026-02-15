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

const slotsDiv = document.getElementById("times");
const dateInput = document.getElementById("datePicker");

let selectedTime = null;
let selectedDate = null;

/* ----------------- SERVICE DROPDOWNS ----------------- */

const serviceSelect = document.getElementById("service");
const subServiceSelect = document.getElementById("subService");
const subContainer = document.getElementById("subServiceContainer");
const subLabel = document.getElementById("subLabel");

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

/* ----------------- CALENDAR ----------------- */

flatpickr("#datePicker", {
  minDate: "today",
  dateFormat: "Y-m-d",
  disable: [
    function(date) {
      return (date.getDay() !== 0 && date.getDay() !== 6);
    }
  ],
  onChange: async function(selectedDates, dateStr) {

    selectedDate = dateStr;
    slotsDiv.innerHTML = "";
    selectedTime = null;

    const q = query(bookingsRef, where("date", "==", dateStr));
    const snapshot = await getDocs(q);

    const booked = [];
    snapshot.forEach(doc => booked.push(doc.data().time));

    for (let h = 9; h < 17; h++) {
      ["00","30"].forEach(m => {
        const time = `${h.toString().padStart(2,"0")}:${m}`;
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
    }
  }
});

/* ----------------- BOOK BUTTON ----------------- */

document.getElementById("book").onclick = async () => {

  const name = document.getElementById("bookingName").value;
  const phone = document.getElementById("bookingPhone").value;
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
