import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBv8Iap6L0Zz8U_Ok3tQ-Bkb6KI9vGDbtI",
  authDomain: "prosper-e5c0d.firebaseapp.com",
  projectId: "prosper-e5c0d",
  storageBucket: "prosper-e5c0d.appspot.com",
  messagingSenderId: "745275197601",
  appId: "1:745275197601:web:e2f1f1e86013a382f048e0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const reviewsRef = collection(db, "reviews");

// Load and display reviews
async function loadReviews() {
  const container = document.getElementById("testimonials-container");
  container.innerHTML = "";

  const q = query(reviewsRef, orderBy("created", "desc"));
  const snap = await getDocs(q);

  if (snap.empty) {
    container.innerHTML = "<p style='text-align:center;color:#888;'>No reviews yet. Be the first!</p>";
    return;
  }

  snap.forEach(doc => {
    const r = doc.data();
    const div = document.createElement("div");
    div.className = "testimonial";
    div.innerHTML = `
      <p>"${r.message}"</p>
      <h4>— ${r.name}</h4>
    `;
    container.appendChild(div);
  });
}

// Submit a new review
document.getElementById("review-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name || !message) return;

  await addDoc(reviewsRef, {
    name,
    message,
    created: new Date()
  });

  document.getElementById("name").value = "";
  document.getElementById("message").value = "";

  alert("Thanks for your review!");
  loadReviews();
});

loadReviews();
