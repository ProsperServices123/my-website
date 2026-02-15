// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
getFirestore,
collection,
addDoc,
onSnapshot,
query,
orderBy,
where,
getDocs
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
apiKey: "AIzaSyBv8Iap6L0Zz8U_0k3tQ-Bkb6KI9vGDbtI",
authDomain: "prosper-e5c0d.firebaseapp.com",
projectId: "prosper-e5c0d",
storageBucket: "prosper-e5c0d.appspot.com",
messagingSenderId: "745275197601",
appId: "1:745275197601:web:e2f1f1e86013a382f048e0",
measurementId: "G-5QL48FV10C"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================= REVIEWS SYSTEM =================
const reviewsRef = collection(db, "reviews");

const reviewForm = document.getElementById("review-form");
if (reviewForm) {
reviewForm.addEventListener("submit", async (e) => {
e.preventDefault();

```
const name = document.getElementById("name").value.trim();
const message = document.getElementById("message").value.trim();

if (name && message) {
  await addDoc(reviewsRef, {
    name,
    message,
    timestamp: new Date()
  });

  reviewForm.reset();
  alert("Thanks for your review!");
}
```

});
}

// Load reviews
onSnapshot(query(reviewsRef, orderBy("timestamp", "desc")), (snapshot) => {
const container = document.getElementById("testimonials-container");
if (!container) return;

container.innerHTML = "";

snapshot.forEach((doc) => {
const review = doc.data();
const slide = document.createElement("div");
slide.className = "testimonial";
slide.innerHTML = `       <p>"${review.message}"</p>       <h4>- ${review.name}</h4>
    `;
container.appendChild(slide);
});
});

// ================= BOOKING SYSTEM =================
const bookingsRef = collection(db, "bookings");

const dateInput = document.getElementById("date");
const slotsDiv = document.getElementById("slots");
const msg = document.getElementById("msg");

let selectedDate = null;
let selectedTime = null;

// Generate times (9am–5pm every 30min)
function generateSlots(){
const slots=[];
for(let h=9; h<17; h++){
slots.push(`${String(h).padStart(2,'0')}:00`);
slots.push(`${String(h).padStart(2,'0')}:30`);
}
return slots;
}

// When user picks a date
if(dateInput){
dateInput.onchange = async () => {
selectedDate = dateInput.value;
selectedTime = null;
slotsDiv.innerHTML = "Loading...";

const q = query(bookingsRef, where("date","==",selectedDate));
const snap = await getDocs(q);

const taken=[];
snap.forEach(doc=>taken.push(doc.data().time));

slotsDiv.innerHTML="";

generateSlots().forEach(time=>{
const div=document.createElement("div");
div.className="slot";
div.textContent=time;

```
if(taken.includes(time)){
  div.style.opacity="0.3";
  div.style.pointerEvents="none";
}else{
  div.onclick=()=>{
    document.querySelectorAll(".slot").forEach(s=>s.classList.remove("selected"));
    div.classList.add("selected");
    selectedTime=time;
  };
}
slotsDiv.appendChild(div);
```

});
};
}

// Booking submit
const bookBtn=document.getElementById("book");
if(bookBtn){
bookBtn.onclick=async()=>{
const name=document.getElementById("bookingName").value.trim();
const phone=document.getElementById("bookingPhone").value.trim();
const email=document.getElementById("bookingEmail").value.trim();

if(!selectedDate||!selectedTime||!name){
msg.textContent="Please fill all required fields";
return;
}

await addDoc(bookingsRef,{
name,
phone,
email,
date:selectedDate,
time:selectedTime,
created:new Date()
});

msg.textContent="Booking Confirmed!";
dateInput.onchange();
};
}
