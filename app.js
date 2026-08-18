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
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
const auth = getAuth(app);
const logbookRef = collection(db, "logbook");

// ==========================================================================
// DOM Elements
// ==========================================================================

// Access Log (Right Drawer)
const logbookForm = document.getElementById("logbook-form");
const nameInput = document.getElementById("name-input");
const signBtn = document.getElementById("sign-btn");
const signBtnText = document.getElementById("sign-btn-text");
const logbookList = document.getElementById("logbook-list");
const logCountBadge = document.getElementById("log-count-badge");
const tabCountBadge = document.getElementById("tab-count-badge");
const formFeedback = document.getElementById("form-feedback");
const drawerToggleBtn = document.getElementById("drawer-toggle-btn");
const drawerCloseBtn = document.getElementById("drawer-close-btn");
const logbookDrawer = document.getElementById("logbook-drawer");

// Journal (Left Drawer)
const journalToggleBtn = document.getElementById("journal-toggle-btn");
const journalCloseBtn = document.getElementById("journal-close-btn");
const journalDrawer = document.getElementById("journal-drawer");
const journalTabBadge = document.getElementById("journal-tab-badge");
const journalCountBadge = document.getElementById("journal-count-badge");
const journalEntriesContainer = document.getElementById("journal-entries-container");
const toggleComposerBtn = document.getElementById("toggle-composer-btn");
const composerBtnText = document.getElementById("composer-btn-text");
const journalComposer = document.getElementById("journal-composer");
const journalForm = document.getElementById("journal-form");
const journalEditId = document.getElementById("journal-edit-id");
const journalTitleInput = document.getElementById("journal-title-input");
const journalBodyInput = document.getElementById("journal-body-input");
const cancelComposeBtn = document.getElementById("cancel-compose-btn");
const composerModeTitle = document.getElementById("composer-mode-title");
const saveJournalText = document.getElementById("save-journal-text");

// Authentication & Workspace Elements
const workspaceTriggerBtn = document.getElementById("workspace-trigger-btn");
const workspaceBtnLabel = document.getElementById("workspace-btn-label");
const authModal = document.getElementById("auth-modal");
const authModalBackdrop = document.getElementById("auth-modal-backdrop");
const authCloseBtn = document.getElementById("auth-close-btn");
const authForm = document.getElementById("auth-form");
const authEmailInput = document.getElementById("auth-email-input");
const authPasswordInput = document.getElementById("auth-password-input");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const authSubmitText = document.getElementById("auth-submit-text");
const authFeedback = document.getElementById("auth-feedback");

const workspaceModal = document.getElementById("workspace-modal");
const workspaceModalBackdrop = document.getElementById("workspace-modal-backdrop");
const workspaceCloseBtn = document.getElementById("workspace-close-btn");
const workspaceLogoutBtn = document.getElementById("workspace-logout-btn");
const workspaceUserEmail = document.getElementById("workspace-user-email");

// Shared Backdrop & Typewriter Target
const drawerBackdrop = document.getElementById("drawer-backdrop");
const typewriterTarget = document.getElementById("typewriter-target");

// ==========================================================================
// Tactical Typewriter Text Animation
// ==========================================================================
function startTypewriter(element, text, speed = 55) {
  if (!element) return;
  
  if (element._typewriterTimer) {
    clearTimeout(element._typewriterTimer);
  }
  
  element.textContent = "";
  let i = 0;
  
  function typeChar() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      element._typewriterTimer = setTimeout(typeChar, speed);
    }
  }
  
  typeChar();
}

function initHeroTypewriter() {
  const greetingHeading = document.getElementById("greeting");
  const fullGreeting = greetingHeading?.getAttribute("data-text") || "Hello, Mister Matthews";
  startTypewriter(typewriterTarget, fullGreeting, 50);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeroTypewriter, { once: true });
} else {
  initHeroTypewriter();
}

// ==========================================================================
// Live HUD Tactical Clock (Day of Week + Real-Time Military Clock)
// ==========================================================================
const hudDayOfWeek = document.getElementById("hud-day-of-week");
const hudLiveTime = document.getElementById("hud-live-time");
const DAYS_OF_WEEK = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

function updateHUDLiveClock() {
  const now = new Date();
  if (hudDayOfWeek) {
    hudDayOfWeek.textContent = DAYS_OF_WEEK[now.getDay()];
  }
  if (hudLiveTime) {
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    hudLiveTime.textContent = `${hours}:${minutes}:${seconds}`;
  }
}

updateHUDLiveClock();
setInterval(updateHUDLiveClock, 1000);

// ==========================================================================
// Drawer Open / Close Logic
// ==========================================================================
function closeAllDrawers() {
  document.body.classList.remove("logbook-open", "journal-open");
  if (drawerToggleBtn) drawerToggleBtn.setAttribute("aria-expanded", "false");
  if (journalToggleBtn) journalToggleBtn.setAttribute("aria-expanded", "false");
  if (logbookDrawer) logbookDrawer.setAttribute("aria-hidden", "true");
  if (journalDrawer) journalDrawer.setAttribute("aria-hidden", "true");
}

function openLogbookDrawer() {
  closeAllDrawers();
  closeAuthModal();
  closeWorkspaceModal();
  document.body.classList.add("logbook-open");
  if (drawerToggleBtn) drawerToggleBtn.setAttribute("aria-expanded", "true");
  if (logbookDrawer) logbookDrawer.setAttribute("aria-hidden", "false");
  
  const titleEl = logbookDrawer?.querySelector("[data-typewriter]");
  if (titleEl) {
    const rawText = titleEl.getAttribute("data-typewriter");
    startTypewriter(titleEl, rawText, 40);
  }

  setTimeout(() => {
    if (nameInput) nameInput.focus();
  }, 250);
}

function openJournalDrawer() {
  closeAllDrawers();
  closeAuthModal();
  closeWorkspaceModal();
  document.body.classList.add("journal-open");
  if (journalToggleBtn) journalToggleBtn.setAttribute("aria-expanded", "true");
  if (journalDrawer) journalDrawer.setAttribute("aria-hidden", "false");
  
  const titleEl = journalDrawer?.querySelector("[data-typewriter]");
  if (titleEl) {
    const rawText = titleEl.getAttribute("data-typewriter");
    startTypewriter(titleEl, rawText, 40);
  }
}

function toggleLogbookDrawer() {
  if (document.body.classList.contains("logbook-open")) {
    closeAllDrawers();
  } else {
    openLogbookDrawer();
  }
}

function toggleJournalDrawer() {
  if (document.body.classList.contains("journal-open")) {
    closeAllDrawers();
  } else {
    openJournalDrawer();
  }
}

if (drawerToggleBtn) drawerToggleBtn.addEventListener("click", toggleLogbookDrawer);
if (drawerCloseBtn) drawerCloseBtn.addEventListener("click", closeAllDrawers);

if (journalToggleBtn) journalToggleBtn.addEventListener("click", toggleJournalDrawer);
if (journalCloseBtn) journalCloseBtn.addEventListener("click", closeAllDrawers);

if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeAllDrawers);

// ==========================================================================
// Firebase Authentication & Private Workspace Logic
// ==========================================================================

function openAuthModal() {
  closeAllDrawers();
  if (authModal) {
    authModal.classList.add("open");
    authModal.setAttribute("aria-hidden", "false");
    clearAuthFeedback();
    setTimeout(() => {
      if (authEmailInput) authEmailInput.focus();
    }, 200);
  }
}

function closeAuthModal() {
  if (authModal) {
    authModal.classList.remove("open");
    authModal.setAttribute("aria-hidden", "true");
  }
}

function openWorkspaceModal() {
  closeAllDrawers();
  closeAuthModal();
  if (workspaceModal) {
    workspaceModal.classList.add("open");
    workspaceModal.setAttribute("aria-hidden", "false");
  }
}

function closeWorkspaceModal() {
  if (workspaceModal) {
    workspaceModal.classList.remove("open");
    workspaceModal.setAttribute("aria-hidden", "true");
  }
}

// Workspace Trigger Click Handler
if (workspaceTriggerBtn) {
  workspaceTriggerBtn.addEventListener("click", () => {
    if (auth.currentUser) {
      openWorkspaceModal();
    } else {
      openAuthModal();
    }
  });
}

if (authCloseBtn) authCloseBtn.addEventListener("click", closeAuthModal);
if (authModalBackdrop) authModalBackdrop.addEventListener("click", closeAuthModal);

if (workspaceCloseBtn) workspaceCloseBtn.addEventListener("click", closeWorkspaceModal);
if (workspaceModalBackdrop) workspaceModalBackdrop.addEventListener("click", closeWorkspaceModal);

// Handle Login Submission
if (authForm) {
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value;

    if (!email || !password) {
      showAuthFeedback("ENTER CREDENTIALS", "error");
      return;
    }

    authSubmitBtn.disabled = true;
    authSubmitText.textContent = "VERIFYING CIPHER...";
    clearAuthFeedback();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showAuthFeedback("CLEARANCE VERIFIED // ACCESS GRANTED", "success");
      authSubmitText.textContent = "ACCESS GRANTED ✓";
      
      setTimeout(() => {
        authEmailInput.value = "";
        authPasswordInput.value = "";
        authSubmitBtn.disabled = false;
        authSubmitText.textContent = "AUTHENTICATE ACCESS";
        closeAuthModal();
        openWorkspaceModal();
      }, 900);
    } catch (error) {
      console.error("Auth error:", error);
      let errorMsg = "AUTHENTICATION FAILED: INVALID CIPHER";
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        errorMsg = "ACCESS DENIED: INVALID EMAIL OR PASSPHRASE";
      } else if (error.code === "auth/too-many-requests") {
        errorMsg = "SECURITY LOCKOUT: TOO MANY ATTEMPTS. RETRY LATER.";
      } else if (error.code === "auth/network-request-failed") {
        errorMsg = "CONNECTION ERROR: CHECK NETWORK";
      }
      showAuthFeedback(errorMsg, "error");
      authSubmitBtn.disabled = false;
      authSubmitText.textContent = "RETRY AUTHENTICATION";
    }
  });
}

// Handle Logout
if (workspaceLogoutBtn) {
  workspaceLogoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      closeWorkspaceModal();
    } catch (err) {
      console.error("Logout error:", err);
    }
  });
}

// Track Auth State
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (workspaceBtnLabel) workspaceBtnLabel.textContent = "PRIVATE WORKSPACE";
    if (workspaceTriggerBtn) workspaceTriggerBtn.classList.add("authenticated");
    if (workspaceUserEmail) workspaceUserEmail.textContent = user.email || "AUTHORIZED USER";
  } else {
    if (workspaceBtnLabel) workspaceBtnLabel.textContent = "ACCESS WORKSPACE";
    if (workspaceTriggerBtn) workspaceTriggerBtn.classList.remove("authenticated");
    if (workspaceUserEmail) workspaceUserEmail.textContent = "DISCONNECTED";
  }
});

function showAuthFeedback(msg, type) {
  if (authFeedback) {
    authFeedback.textContent = msg;
    authFeedback.className = `form-feedback ${type}`;
  }
}

function clearAuthFeedback() {
  if (authFeedback) {
    authFeedback.textContent = "";
    authFeedback.className = "form-feedback";
  }
}

// Global Keydown Handler (ESC closes drawers and modals)
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeAllDrawers();
    closeAuthModal();
    closeWorkspaceModal();
  }
});

// ==========================================================================
// Personal Journal Storage & CRUD (Batman HUD Themed)
// ==========================================================================
const JOURNAL_STORAGE_KEY = "matthews_personal_journal_v1";

const DEFAULT_JOURNAL_ENTRIES = [
  {
    id: "initial-log-1",
    date: "2026.08.17 // 20:45",
    timestamp: 1787013900000,
    title: "SYSTEM INITIALIZATION & TELEMETRY",
    body: "Quantum communication relays and visitor subscriber channels have been successfully established. The cosmic backdrop is quiet tonight.\n\nCalibrated the sub-light sensory arrays, initialized the dark-theme terminal interface, and verified all core subroutines. Monitoring signals across all local sectors."
  }
];

function loadJournalEntries() {
  try {
    const raw = localStorage.getItem(JOURNAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(DEFAULT_JOURNAL_ENTRIES));
      return DEFAULT_JOURNAL_ENTRIES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load journal entries from storage:", e);
    return DEFAULT_JOURNAL_ENTRIES;
  }
}

function saveJournalEntries(entries) {
  try {
    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error("Failed to save journal entries to storage:", e);
  }
}

function formatCurrentJournalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}.${month}.${day} // ${hours}:${minutes}`;
}

function renderJournal() {
  const entries = loadJournalEntries();
  const total = entries.length;

  if (journalTabBadge) journalTabBadge.textContent = String(total).padStart(2, "0");
  if (journalCountBadge) journalCountBadge.textContent = `${String(total).padStart(2, "0")} ${total === 1 ? 'ENTRY' : 'ENTRIES'}`;

  if (!journalEntriesContainer) return;

  if (total === 0) {
    journalEntriesContainer.innerHTML = `
      <div class="empty-log-state">
        <span class="pulse-indicator"></span>
        <p>NO JOURNAL ENTRIES RECORDED // CLICK "NEW LOG ENTRY" ABOVE</p>
      </div>
    `;
    return;
  }

  journalEntriesContainer.innerHTML = entries.map((entry, index) => {
    const logNumber = String(total - index).padStart(3, "0");
    const sanitizedTitle = escapeHTML(entry.title);
    const sanitizedBody = escapeHTML(entry.body);

    return `
      <article class="journal-card hud-card" data-entry-id="${entry.id}">
        <span class="reticle reticle-tl" aria-hidden="true"></span>
        <span class="reticle reticle-tr" aria-hidden="true"></span>
        <span class="reticle reticle-bl" aria-hidden="true"></span>
        <span class="reticle reticle-br" aria-hidden="true"></span>

        <div class="journal-card-header">
          <span class="journal-tag">LOG // ${logNumber}</span>
          <time class="journal-date">${entry.date || "UNKNOWN TIME"}</time>
        </div>
        <h3 class="journal-title">${sanitizedTitle}</h3>
        <div class="journal-body">${sanitizedBody}</div>
        <div class="journal-card-footer">
          <span class="journal-status-indicator">
            <span class="mini-status-dot"></span> ENCRYPTED TRANSMISSION
          </span>
          <div class="journal-item-actions">
            <button type="button" class="journal-action-btn edit-btn" data-id="${entry.id}">EDIT</button>
            <button type="button" class="journal-action-btn delete-btn delete" data-id="${entry.id}">DELETE</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  // Attach Edit & Delete Listeners
  journalEntriesContainer.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      startEditJournalEntry(id);
    });
  });

  journalEntriesContainer.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      deleteJournalEntry(id);
    });
  });
}

function openComposer(mode = "new", entry = null) {
  if (!journalComposer) return;
  journalComposer.classList.remove("hidden");

  if (mode === "edit" && entry) {
    composerModeTitle.textContent = "// EDIT LOG ENTRY";
    saveJournalText.textContent = "UPDATE ENTRY";
    composerBtnText.textContent = "CLOSE COMPOSER";
    journalEditId.value = entry.id;
    journalTitleInput.value = entry.title;
    journalBodyInput.value = entry.body;
  } else {
    composerModeTitle.textContent = "// COMPOSE NEW LOG";
    saveJournalText.textContent = "SAVE ENTRY";
    composerBtnText.textContent = "CLOSE COMPOSER";
    journalEditId.value = "";
    journalTitleInput.value = "";
    journalBodyInput.value = "";
  }

  journalTitleInput.focus();
}

function closeComposer() {
  if (!journalComposer) return;
  journalComposer.classList.add("hidden");
  composerBtnText.textContent = "NEW LOG ENTRY";
  journalEditId.value = "";
  journalTitleInput.value = "";
  journalBodyInput.value = "";
}

function startEditJournalEntry(id) {
  const entries = loadJournalEntries();
  const entry = entries.find((item) => item.id === id);
  if (!entry) return;
  openComposer("edit", entry);
}

function deleteJournalEntry(id) {
  if (!confirm("CONFIRM DELETION: Purge this journal log from the quantum archive?")) {
    return;
  }
  let entries = loadJournalEntries();
  entries = entries.filter((item) => item.id !== id);
  saveJournalEntries(entries);
  renderJournal();
}

if (toggleComposerBtn) {
  toggleComposerBtn.addEventListener("click", () => {
    if (journalComposer.classList.contains("hidden")) {
      openComposer("new");
    } else {
      closeComposer();
    }
  });
}

if (cancelComposeBtn) {
  cancelComposeBtn.addEventListener("click", closeComposer);
}

if (journalForm) {
  journalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = journalTitleInput.value.trim();
    const body = journalBodyInput.value.trim();
    const editId = journalEditId.value;

    if (!title || !body) return;

    let entries = loadJournalEntries();

    if (editId) {
      entries = entries.map((item) => {
        if (item.id === editId) {
          return {
            ...item,
            title,
            body
          };
        }
        return item;
      });
    } else {
      const newEntry = {
        id: `log-${Date.now()}`,
        date: formatCurrentJournalDate(),
        timestamp: Date.now(),
        title,
        body
      };
      entries.unshift(newEntry);
    }

    saveJournalEntries(entries);
    renderJournal();
    closeComposer();
  });
}

// ==========================================================================
// Quantum Access Log (Firestore Realtime)
// ==========================================================================

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

function renderLogbook(entries) {
  const countText = `${entries.length} LOGGED`;
  if (logCountBadge) logCountBadge.textContent = countText;
  if (tabCountBadge) tabCountBadge.textContent = String(entries.length);

  if (entries.length === 0) {
    logbookList.innerHTML = `
      <div class="empty-log-state">
        <span class="pulse-indicator"></span>
        <p>NO OPERATIVES LOGGED // BE THE FIRST TO REGISTER ACCESS</p>
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
          <span class="entry-index">OP_ID #${String(entries.length - index).padStart(3, '0')}</span>
          <span class="entry-timestamp">${formattedTime}</span>
        </div>
        <div class="entry-name">${sanitizedName}</div>
      </li>
    `;
  }).join("");
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

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
        console.error("Failed to load access log:", fallbackErr);
        if (logbookList) {
          logbookList.innerHTML = `
            <div class="error-log-state">
              <p>ACCESS DATABASE DISCONNECTED // CHECK SECURITY PROTOCOLS</p>
            </div>
          `;
        }
      });
    });
  } catch (err) {
    console.error("Initialization error:", err);
  }
}

if (logbookForm) {
  logbookForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const rawName = nameInput.value.trim();
    if (!rawName) {
      showFeedback("ACCESS DENIED: ENTER OPERATIVE CALLSIGN", "error");
      nameInput.focus();
      return;
    }

    signBtn.disabled = true;
    signBtn.classList.add("loading");
    signBtnText.textContent = "LOGGING ACCESS...";
    clearFeedback();

    try {
      await addDoc(logbookRef, {
        name: rawName,
        timestamp: serverTimestamp()
      });

      nameInput.value = "";
      showFeedback("ACCESS RECORDED IN SYSTEM ARCHIVE", "success");
      signBtnText.textContent = "LOGGED ✓";
      
      setTimeout(() => {
        signBtnText.textContent = "LOG ACCESS";
        signBtn.disabled = false;
        signBtn.classList.remove("loading");
      }, 1800);

    } catch (error) {
      console.error("Error logging access:", error);
      showFeedback("TRANSMISSION FAILED: " + (error.message || "SECURITY ERROR"), "error");
      signBtnText.textContent = "RETRY ACCESS";
      signBtn.disabled = false;
      signBtn.classList.remove("loading");
    }
  });
}

function showFeedback(msg, type) {
  if (formFeedback) {
    formFeedback.textContent = msg;
    formFeedback.className = `form-feedback ${type}`;
  }
}

function clearFeedback() {
  if (formFeedback) {
    formFeedback.textContent = "";
    formFeedback.className = "form-feedback";
  }
}

// Initialize Everything
renderJournal();
subscribeToLogbook();
