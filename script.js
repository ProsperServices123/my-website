import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
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
const reviewsRef = collection(db, "reviews");

// Load reviews live
const container = document.getElementById("testimonials-container");
if (container) {
  onSnapshot(query(reviewsRef, orderBy("timestamp", "desc")), (snapshot) => {
    container.innerHTML = "";
    if (snapshot.empty) {
      container.innerHTML = "<div class='testimonial'><p>No reviews yet — be the first!</p></div>";
      return;
    }
    snapshot.forEach(doc => {
      const r = doc.data();
      const div = document.createElement("div");
      div.className = "testimonial";
      div.innerHTML = `<p>"${r.message}"</p><h4>— ${r.name}</h4>`;
      container.appendChild(div);
    });
  });
}

// Submit review
const reviewForm = document.getElementById("review-form");
if (reviewForm) {
  reviewForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const message = document.getElementById("message").value.trim();
    if (!name || !message) return;
    await addDoc(reviewsRef, { name, message, timestamp: new Date() });
    reviewForm.reset();
    alert("Thanks for your review!");
  });
}
