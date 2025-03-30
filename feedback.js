// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// Firebase Configuration //
const firebaseConfig = {
  apiKey: "AIzaSyBEF5mU98esNmaP2vsPMSVi4Htq3-zpTfU",
  authDomain: "ananya-827e5.firebaseapp.com",
  projectId: "ananya-827e5",
  storageBucket: "ananya-827e5.firebasestorage.app",
  messagingSenderId: "985361099967",
  appId: "1:985361099967:web:952075a566fd7a4d1faa0a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const feedbackRef = doc(db, "feedback", "likes-dislikes");

// Fetch feedback data
async function getFeedback() {
  const docSnap = await getDoc(feedbackRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    await setDoc(feedbackRef, { likes: 0, dislikes: 0 });
    return { likes: 0, dislikes: 0 };
  }
}

// Update Like/Dislike count
async function updateFeedback(type) {
  const feedback = await getFeedback();
  if (type === "like") {
    await updateDoc(feedbackRef, { likes: feedback.likes + 1 });
  } else {
    await updateDoc(feedbackRef, { dislikes: feedback.dislikes + 1 });
  }
  renderFeedback();
}

// Display feedback counts
async function renderFeedback() {
  const feedback = await getFeedback();
  document.getElementById("like-count").textContent = feedback.likes;
  document.getElementById("dislike-count").textContent = feedback.dislikes;
}

// Load feedback on page load
document.addEventListener("DOMContentLoaded", renderFeedback);

// Inject Like/Dislike buttons into HTML
const feedbackContainer = document.createElement("div");
feedbackContainer.innerHTML = `
  <div class="flex space-x-4 mt-4">
    <button id="like-btn" class="px-4 py-2 bg-green-500 text-white rounded-lg">👍 Like (<span id="like-count">0</span>)</button>
    <button id="dislike-btn" class="px-4 py-2 bg-red-500 text-white rounded-lg">👎 Dislike (<span id="dislike-count">0</span>)</button>
  </div>
`;
document.body.appendChild(feedbackContainer);

document.getElementById("like-btn").addEventListener("click", () => updateFeedback("like"));
document.getElementById("dislike-btn").addEventListener("click", () => updateFeedback("dislike"));
