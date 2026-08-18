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

// ==========================================================================
// DOM Elements
// ==========================================================================

// Logbook (Right Drawer)
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

// Shared Backdrop
const drawerBackdrop = document.getElementById("drawer-backdrop");

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
  document.body.classList.add("logbook-open");
  if (drawerToggleBtn) drawerToggleBtn.setAttribute("aria-expanded", "true");
  if (logbookDrawer) logbookDrawer.setAttribute("aria-hidden", "false");
  setTimeout(() => {
    if (nameInput) nameInput.focus();
  }, 250);
}

function openJournalDrawer() {
  closeAllDrawers();
  document.body.classList.add("journal-open");
  if (journalToggleBtn) journalToggleBtn.setAttribute("aria-expanded", "true");
  if (journalDrawer) journalDrawer.setAttribute("aria-hidden", "false");
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

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeAllDrawers();
  }
});

// ==========================================================================
// Personal Journal Storage & CRUD
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
      <article class="journal-card" data-entry-id="${entry.id}">
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
      // Edit existing entry
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
      // Create new entry (added to top)
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
// Quantum Logbook (Firestore Realtime)
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
        console.error("Failed to load logbook:", fallbackErr);
        if (logbookList) {
          logbookList.innerHTML = `
            <div class="error-log-state">
              <p>UNABLE TO CONNECT TO QUANTUM DATABASE // CHECK FIRESTORE RULES</p>
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
      showFeedback("PLEASE ENTER AN IDENTIFIER", "error");
      nameInput.focus();
      return;
    }

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
