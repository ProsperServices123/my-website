// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const reviewsRef = collection(db, "reviews");

// Submit Review Handler
document.getElementById("review-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const message = document.getElementById("message").value.trim();

  if (name && message) {
    try {
      await addDoc(reviewsRef, {
        name,
        message,
        timestamp: new Date()
      });
      document.getElementById("review-form").reset();
      alert("Thanks for your review!");
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  }
});

// Load Reviews and Render Slider
onSnapshot(query(reviewsRef, orderBy("timestamp", "desc")), (snapshot) => {
  const container = document.getElementById("testimonials-container");
  container.innerHTML = "";

  snapshot.forEach((doc) => {
    const review = doc.data();
    const slide = document.createElement("div");
    slide.className = "testimonial";
    slide.innerHTML = `
      <p>"${review.message}"</p>
      <h4>- ${review.name}</h4>
    `;
    container.appendChild(slide);
  });

  // Ensure slider scroll buttons are setup after rendering
  setupScrollButtons();
});

// Scroll Button Setup
function setupScrollButtons() {
  const slider = document.getElementById("testimonials-slider");
  const testimonial = slider.querySelector(".testimonial");

  if (!slider || !testimonial) return;

  const scrollAmount = testimonial.offsetWidth + 20; // dynamic scroll amount

  const leftBtn = document.querySelector(".slider-button.left");
  const rightBtn = document.querySelector(".slider-button.right");

  if (leftBtn && rightBtn) {
    leftBtn.onclick = () => slider.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    rightBtn.onclick = () => slider.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }
}
