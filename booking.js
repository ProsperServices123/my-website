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

let selectedDate = null;
let startTime = null;
let endTime = null;

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

/* ---------------- TIME HELPERS ---------------- */

function timeToMinutes(t){
const [h,m]=t.split(":");
return parseInt(h)*60+parseInt(m);
}

function minutesToTime(min){
const h=Math.floor(min/60);
const m=min%60;
return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

/* ---------------- LOAD TIMES FUNCTION ---------------- */

async function loadTimes(dateStr){

try{

selectedDate = dateStr;
startTime = null;
endTime = null;
slotsDiv.innerHTML = "Loading times...";

const chosenDate = new Date(dateStr);
const day = chosenDate.getDay();

let allowedSlots = [];

/* WEEKENDS full day */
if (day === 0 || day === 6) {
for (let h = 9; h < 17; h++) {
allowedSlots.push(`${String(h).padStart(2,"0")}:00`);
allowedSlots.push(`${String(h).padStart(2,"0")}:30`);
}
}

/* MON WED THU */
else if (day === 1 || day === 3 || day === 4) {
allowedSlots = ["16:00","16:30"];
}

/* CLOSED DAYS */
else{
slotsDiv.innerHTML = "No availability on this day.";
return;
}

/* GET BOOKINGS SAFELY */
const snapshot = await getDocs(query(bookingsRef, where("date","==",dateStr)));

let bookedMinutes = [];

snapshot.forEach(doc=>{
const b = doc.data();

/* SUPPORT OLD BOOKINGS (time field) */
if(b.time){
bookedMinutes.push(b.time);
return;
}

/* NEW RANGE BOOKINGS */
if(!b.start || !b.end) return;

let current=timeToMinutes(b.start);
const end=timeToMinutes(b.end);

while(current < end){
bookedMinutes.push(minutesToTime(current));
current+=30;
}
});

/* BUILD BUTTONS */
slotsDiv.innerHTML="";

allowedSlots.forEach(time=>{

if(bookedMinutes.includes(time)) return;

const div=document.createElement("div");
div.className="time";
div.textContent=time;
div.dataset.time=time;

div.onclick=()=>{

/* FIRST CLICK */
if(!startTime){
startTime=time;
div.classList.add("selected");
return;
}

/* SECOND CLICK */
if(!endTime){

if(timeToMinutes(time)<=timeToMinutes(startTime)){
startTime=time;
document.querySelectorAll(".time").forEach(s=>s.classList.remove("selected"));
div.classList.add("selected");
return;
}

endTime=time;

document.querySelectorAll(".time").forEach(slot=>{
const t=slot.dataset.time;
if(timeToMinutes(t)>=timeToMinutes(startTime) &&
timeToMinutes(t)<=timeToMinutes(endTime)){
slot.classList.add("selected");
}
});

return;
}

/* THIRD CLICK RESET */
startTime=time;
endTime=null;
document.querySelectorAll(".time").forEach(s=>s.classList.remove("selected"));
div.classList.add("selected");

};

slotsDiv.appendChild(div);

});

if(slotsDiv.innerHTML===""){
slotsDiv.innerHTML="All times are booked.";
}

}catch(err){
console.error(err);
slotsDiv.innerHTML="Error loading times (check Firestore rules)";
}

}

/* ---------------- CALENDAR ---------------- */

flatpickr("#datePicker", {
minDate:"today",
dateFormat:"Y-m-d",
onChange:function(selectedDates,dateStr){
loadTimes(dateStr);
}
});

/* ---------------- BOOK BUTTON ---------------- */

document.getElementById("book").onclick=async()=>{

const name=document.getElementById("bookingName").value.trim();
const phone=document.getElementById("bookingPhone").value.trim();
const service=serviceSelect.value;
const subService=subServiceSelect.value;

if(!name || !selectedDate || !startTime || !endTime || !service){
alert("Please select a time range and fill required fields");
return;
}

await addDoc(bookingsRef,{
name,
phone: phone || "",
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
