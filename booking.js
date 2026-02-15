import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ----------------- YOUR FIREBASE CONFIG ----------------- */
/* KEEP YOUR OWN CONFIG — DO NOT CHANGE VALUES */
const firebaseConfig = {
apiKey: "PASTE_YOURS",
authDomain: "PASTE_YOURS",
projectId: "PASTE_YOURS",
storageBucket: "PASTE_YOURS",
messagingSenderId: "PASTE_YOURS",
appId: "PASTE_YOURS"
};
/* -------------------------------------------------------- */

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const timesDiv = document.getElementById("times");
let selectedDate = null;
let selectedTime = null;

/* ALL AVAILABLE TIMES */
const allTimes = [
"8:00 AM","9:00 AM","10:00 AM",
"11:00 AM","12:00 PM","1:00 PM",
"2:00 PM","3:00 PM","4:00 PM"
];

/* ---------- LOAD TIMES FOR SELECTED DATE ---------- */
async function loadTimes(dateStr){

timesDiv.innerHTML = "Loading times...";

const bookingsRef = collection(db, "bookings");
const q = query(bookingsRef, where("date","==",dateStr));
const snapshot = await getDocs(q);

let bookedTimes = [];
snapshot.forEach(doc=>{
bookedTimes.push(doc.data().time);
});

timesDiv.innerHTML = "";
selectedTime = null;

allTimes.forEach(time=>{
if(!bookedTimes.includes(time)){
const div = document.createElement("div");
div.className = "time";
div.textContent = time;

```
  div.onclick = ()=>{
    document.querySelectorAll(".time").forEach(t=>t.classList.remove("selected"));
    div.classList.add("selected");
    selectedTime = time;
  };

  timesDiv.appendChild(div);
}
```

});

if(timesDiv.innerHTML === ""){
timesDiv.innerHTML = "<b>No available times for this day</b>";
}
}

/* ---------- CALENDAR ---------- */
flatpickr("#datePicker",{
minDate:"today",
dateFormat:"Y-m-d",

onChange:function(selectedDates,dateStr){
selectedDate = dateStr;
loadTimes(dateStr);
}
});

/* ---------- BOOKING BUTTON ---------- */
document.getElementById("book").onclick = async ()=>{

const name = document.getElementById("bookingName").value;
const phone = document.getElementById("bookingPhone").value;
const service = document.getElementById("service").value;

if(!selectedDate || !selectedTime || !name || !phone || !service){
alert("Please fill out all fields and choose a time");
return;
}

await addDoc(collection(db,"bookings"),{
name:name,
phone:phone,
service:service,
date:selectedDate,
time:selectedTime,
created:Date.now()
});

alert("Booking Confirmed!");

location.reload();
};
