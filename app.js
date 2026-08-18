// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCgvWmArDCe15PfminipRlssuVX-ZIRZA0",
  authDomain: "luke-warm.firebaseapp.com",
  projectId: "luke-warm",
  storageBucket: "luke-warm.firebasestorage.app",
  messagingSenderId: "647340231773",
  appId: "1:647340231773:web:49bf76650fb897a73551b4",
  measurementId: "G-PG96DHYQ7X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.log("Analytics initialized in supported environment");
}

const db = getFirestore(app);
const logbookRef = collection(db, "logbook");

// DOM Elements
const logbookForm = document.getElementById("logbook-form");
const nameInput = document.getElementById("name-input");
const signBtn = document.getElementById("sign-btn");
const signBtnText = document.getElementById("sign-btn-text");
const logbookList = document.getElementById("logbook-list");
const logCountBadge = document.getElementById("log-count-badge");
const formFeedback = document.getElementById("form-feedback");

// Helper: Format Timestamp
function formatLogDate(timestamp) {
  if (!timestamp) return "JUST NOW";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).toUpperCase();
}

// Render Logbook entries
function renderLogbook(entries) {
  logCountBadge.textContent = `${entries.length} LOGGED`;

  if (entries.length === 0) {
    logbookList.innerHTML = `
      <div class="empty-log-state">
        <span class="pulse-indicator"></span>
        <p>NO TRANSMISSIONS YET // BE THE FIRST TO SIGN</p>
      </div>
    `;
    return;
  }

  logbookList.innerHTML = entries.map((entry, index) => {
    const formattedTime = formatLogDate(entry.timestamp);
    const sanitizedName = escapeHTML(entry.name);
    return `
      <li class="log-entry-item">
        <div class="log-entry-header">
          <span class="entry-index">#${String(entries.length - index).padStart(3, '0')}</span>
          <span class="entry-timestamp">${formattedTime}</span>
        </div>
        <div class="entry-name">${sanitizedName}</div>
      </li>
    `;
  }).join("");
}

// HTML sanitizer for user input
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

// Real-time listener for Firestore logbook
function subscribeToLogbook() {
  try {
    const logQuery = query(logbookRef, orderBy("timestamp", "desc"));
    
    onSnapshot(logQuery, (snapshot) => {
      const entries = [];
      snapshot.forEach((doc) => {
        entries.push({ id: doc.id, ...doc.data() });
      });
      renderLogbook(entries);
    }, (error) => {
      console.warn("Firestore query with orderBy failed, falling back to unordered query:", error);
      // Fallback in case timestamp index is initializing
      onSnapshot(logbookRef, (snapshot) => {
        const entries = [];
        snapshot.forEach((doc) => {
          entries.push({ id: doc.id, ...doc.data() });
        });
        entries.sort((a, b) => {
          const tA = a.timestamp?.seconds || 0;
          const tB = b.timestamp?.seconds || 0;
          return tB - tA;
        });
        renderLogbook(entries);
      }, (fallbackErr) => {
        console.error("Failed to load logbook:", fallbackErr);
        logbookList.innerHTML = `
          <div class="error-log-state">
            <p>UNABLE TO CONNECT TO QUANTUM DATABASE // CHECK FIRESTORE RULES</p>
          </div>
        `;
      });
    });
  } catch (err) {
    console.error("Initialization error:", err);
  }
}

// Handle Form Submission
logbookForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const rawName = nameInput.value.trim();
  if (!rawName) {
    showFeedback("PLEASE ENTER AN IDENTIFIER", "error");
    nameInput.focus();
    return;
  }

  // Set loading state
  signBtn.disabled = true;
  signBtn.classList.add("loading");
  signBtnText.textContent = "TRANSMITTING...";
  clearFeedback();

  try {
    await addDoc(logbookRef, {
      name: rawName,
      timestamp: serverTimestamp()
    });

    nameInput.value = "";
    showFeedback("ENTRY RECORDED IN SYSTEM", "success");
    signBtnText.textContent = "RECORDED ✓";
    
    setTimeout(() => {
      signBtnText.textContent = "SIGN LOGBOOK";
      signBtn.disabled = false;
      signBtn.classList.remove("loading");
    }, 1800);

  } catch (error) {
    console.error("Error signing logbook:", error);
    showFeedback("TRANSMISSION FAILED: " + (error.message || "CHECK NETWORK"), "error");
    signBtnText.textContent = "RETRY TRANSMISSION";
    signBtn.disabled = false;
    signBtn.classList.remove("loading");
  }
});

function showFeedback(msg, type) {
  formFeedback.textContent = msg;
  formFeedback.className = `form-feedback ${type}`;
}

function clearFeedback() {
  formFeedback.textContent = "";
  formFeedback.className = "form-feedback";
}

// Start listening
subscribeToLogbook();
