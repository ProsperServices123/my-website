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

let selectedDate = null;
let startTime = null;
let endTime = null;

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

function generateSlots(day){
  let slots=[];

  // WEEKENDS 9am–5pm
  if(day===0 || day===6){
    for(let h=9;h<17;h++){
      slots.push(`${String(h).padStart(2,'0')}:00`);
      slots.push(`${String(h).padStart(2,'0')}:30`);
    }
  }
  // MON WED THU 4pm–5pm
  else if(day===1 || day===3 || day===4){
    slots=["16:00","16:30"];
  }
  // TUE FRI CLOSED
  else{
    return [];
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
    fp.redraw();
  },

  onMonthChange: async function(selectedDates,dateStr,fp){
    await loadMonthBookings(fp.currentYear,fp.currentMonth);
    fp.redraw();
  },

  /* COLOUR DAYS */
  onDayCreate: function(dObj,dStr,fp,dayElem){

    const dateStr = fp.formatDate(dayElem.dateObj,"Y-m-d");
    const day = dayElem.dateObj.getDay();
    const allowedSlots = generateSlots(day);

    if(allowedSlots.length===0){
      dayElem.classList.add("available-none");
      return;
    }

    const bookings = monthBookings[dateStr] || [];

    let bookedMinutes=0;
    bookings.forEach(b=>{
      if(!b.start||!b.end) return;
      bookedMinutes += (toMinutes(b.end)-toMinutes(b.start));
    });

    const totalMinutes = allowedSlots.length*30;
    const freeMinutes = totalMinutes-bookedMinutes;

    if(freeMinutes<=0){
      dayElem.classList.add("available-none");
    }
    else if(freeMinutes<=180){
      dayElem.classList.add("available-some");
    }
    else{
      dayElem.classList.add("available-full");
    }
  },

  /* SHOW TIMES */
  onChange: async function(selectedDates,dateStr){

    selectedDate=dateStr;
    startTime=null;
    endTime=null;
    slotsDiv.innerHTML="Loading times...";

    const chosenDate=new Date(dateStr);
    const allowedSlots=generateSlots(chosenDate.getDay());

    if(allowedSlots.length===0){
      slotsDiv.innerHTML="No availability on this day.";
      return;
    }

    const bookings = monthBookings[dateStr] || [];
    let booked=[];

    bookings.forEach(b=>{
      if(!b.start||!b.end) return;
      allowedSlots.forEach(slot=>{
        if(toMinutes(slot)>=toMinutes(b.start) && toMinutes(slot)<toMinutes(b.end)){
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

      div.onclick=()=>{

        if(!startTime){
          startTime=time;
          div.classList.add("selected");
          return;
        }

        if(!endTime){
          if(toMinutes(time)<=toMinutes(startTime)){
            startTime=time;
            document.querySelectorAll(".time").forEach(s=>s.classList.remove("selected"));
            div.classList.add("selected");
            return;
          }

          endTime=time;

          document.querySelectorAll(".time").forEach(slot=>{
            const t=slot.dataset.time;
            if(toMinutes(t)>=toMinutes(startTime) && toMinutes(t)<=toMinutes(endTime)){
              slot.classList.add("selected");
            }
          });
          return;
        }

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
  }
});

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
    phone:phone||"",
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
