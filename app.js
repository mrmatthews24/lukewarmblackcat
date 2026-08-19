// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp, 
  query, 
  where,
  orderBy, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ==========================================================================
// Central System Configuration (Single Source of Truth for Version & Metadata)
// ==========================================================================
export const APP_CONFIG = {
  version: "v1.1", // Update this single variable to increment site version
  organization: "GEORGE TECH",
  coordinates: "41.92556°N 111.47333°W",
  facility: "LOGAN CANYON, UT"
};

function applyAppConfig() {
  const versionTags = document.querySelectorAll("#hud-version-tag, #ws-version-tag, .hud-version-tag");
  versionTags.forEach(el => {
    el.textContent = APP_CONFIG.version;
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applyAppConfig, { once: true });
} else {
  applyAppConfig();
}

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
const tasksRef = collection(db, "tasks");

// ==========================================================================
// DOM Elements
// ==========================================================================

// Page Views
const publicView = document.getElementById("public-view");
const workspaceView = document.getElementById("workspace-view");

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

// Authentication Elements
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

// Workspace Header & Metrics
const workspaceUserEmail = document.getElementById("workspace-user-email");
const workspaceLockdownBtn = document.getElementById("workspace-lockdown-btn");
const wsPendingMetric = document.getElementById("ws-pending-metric");
const wsJournalMetric = document.getElementById("ws-journal-metric");

// Tasks Elements
const taskForm = document.getElementById("task-form");
const taskTitleInput = document.getElementById("task-title-input");
const taskDueDateInput = document.getElementById("task-due-date-input");
const taskNotesInput = document.getElementById("task-notes-input");
const taskSubmitBtn = document.getElementById("task-submit-btn");
const taskSubmitText = document.getElementById("task-submit-text");
const taskFormFeedback = document.getElementById("task-form-feedback");
const openTasksList = document.getElementById("open-tasks-list");
const openTasksCountBadge = document.getElementById("open-tasks-count-badge");
const completedTasksList = document.getElementById("completed-tasks-list");
const completedTasksCountBadge = document.getElementById("completed-tasks-count-badge");

// Workspace In-Page Journal Elements
const wsToggleComposerBtn = document.getElementById("ws-toggle-composer-btn");
const wsComposerBtnText = document.getElementById("ws-composer-btn-text");
const wsJournalComposer = document.getElementById("ws-journal-composer");
const wsJournalForm = document.getElementById("ws-journal-form");
const wsJournalEditId = document.getElementById("ws-journal-edit-id");
const wsJournalTitleInput = document.getElementById("ws-journal-title-input");
const wsJournalBodyInput = document.getElementById("ws-journal-body-input");
const wsCancelComposeBtn = document.getElementById("ws-cancel-compose-btn");
const wsComposerModeTitle = document.getElementById("ws-composer-mode-title");
const wsSaveJournalText = document.getElementById("ws-save-journal-text");
const wsJournalEntriesContainer = document.getElementById("ws-journal-entries-container");

// H.W. Directive Elements
const hwDirectiveBtn = document.getElementById("hw-directive-btn");
const hwPopup = document.getElementById("hw-popup");
const hwCloseBtn = document.getElementById("hw-close-btn");
const hwCarName = document.getElementById("hw-car-name");
const hwCarFact = document.getElementById("hw-car-fact");
const hwIndexTag = document.getElementById("hw-index-tag");

// Shared Backdrop & Typewriter Target
const drawerBackdrop = document.getElementById("drawer-backdrop");
const typewriterTarget = document.getElementById("typewriter-target");

// ==========================================================================
// View Routing & Navigation (Public View vs Dedicated Workspace View)
// ==========================================================================
function showPublicView() {
  if (workspaceView) workspaceView.classList.add("hidden");
  if (publicView) publicView.classList.remove("hidden");
  if (window.location.hash === "#workspace") {
    history.replaceState(null, "", window.location.pathname);
  }
}

function showWorkspaceView() {
  closeAllDrawers();
  closeAuthModal();
  if (publicView) publicView.classList.add("hidden");
  if (workspaceView) workspaceView.classList.remove("hidden");
  window.location.hash = "workspace";
  renderJournal();
}

// Workspace Trigger Click Handler
if (workspaceTriggerBtn) {
  workspaceTriggerBtn.addEventListener("click", () => {
    if (auth.currentUser) {
      showWorkspaceView();
    } else {
      openAuthModal();
    }
  });
}

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
// Live HUD Tactical Chronometer (Public View + Dedicated Workspace View)
// ==========================================================================
const hudDayOfWeek = document.getElementById("hud-day-of-week");
const hudLiveTime = document.getElementById("hud-live-time");
const wsDayOfWeek = document.getElementById("ws-day-of-week");
const wsLiveTime = document.getElementById("ws-live-time");
const DAYS_OF_WEEK = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

function updateHUDLiveClock() {
  const now = new Date();
  const dayName = DAYS_OF_WEEK[now.getDay()];
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const timeStr = `${hours}:${minutes}:${seconds}`;

  if (hudDayOfWeek) hudDayOfWeek.textContent = dayName;
  if (hudLiveTime) hudLiveTime.textContent = timeStr;
  if (wsDayOfWeek) wsDayOfWeek.textContent = dayName;
  if (wsLiveTime) wsLiveTime.textContent = timeStr;
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
// Authentication Gateway
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

if (authCloseBtn) authCloseBtn.addEventListener("click", closeAuthModal);
if (authModalBackdrop) authModalBackdrop.addEventListener("click", closeAuthModal);

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
        showWorkspaceView();
      }, 700);
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

// Tactical Lockdown / Disconnect Handler
if (workspaceLockdownBtn) {
  workspaceLockdownBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      showPublicView();
    } catch (err) {
      console.error("Logout error:", err);
    }
  });
}

// Track Auth State & Synchronize Dashboard
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (workspaceBtnLabel) workspaceBtnLabel.textContent = "OPEN WORKSPACE";
    if (workspaceTriggerBtn) workspaceTriggerBtn.classList.add("authenticated");
    if (workspaceUserEmail) workspaceUserEmail.textContent = user.email || "AUTHORIZED USER";
    subscribeToTasks(user.uid);
    if (window.location.hash === "#workspace") {
      showWorkspaceView();
    }
  } else {
    if (workspaceBtnLabel) workspaceBtnLabel.textContent = "ACCESS WORKSPACE";
    if (workspaceTriggerBtn) workspaceTriggerBtn.classList.remove("authenticated");
    if (workspaceUserEmail) workspaceUserEmail.textContent = "DISCONNECTED";
    unsubscribeFromTasks();
    showPublicView();
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

// Global Keydown Handler (ESC closes drawers, modals, and H.W. easter egg)
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeAllDrawers();
    closeAuthModal();
    closeHWPopup();
  }
});

// ==========================================================================
// H.W. Directive (Car of the Day Easter Egg - Daily Deterministic Rotation)
// ==========================================================================
const CARS_DATABASE = [
  {
    name: "1969 Dodge Charger R/T",
    fact: "The legendary 426 Hemi engine produced so much torque that Chrysler engineers had to reinforce the car's unibody frame to keep it from flexing under hard acceleration."
  },
  {
    name: "1989 Nissan Skyline GT-R (R32)",
    fact: "Earned the nickname 'Godzilla' by the Australian motoring press after winning all 29 races it entered in the Japanese Touring Car Championship."
  },
  {
    name: "1994 McLaren F1",
    fact: "Designed with a center-mounted driver's seat for pure weight distribution, its engine bay was lined with 0.8 ounces of pure gold foil for thermal heat shielding."
  },
  {
    name: "1967 Toyota 2000GT",
    fact: "Japan's first true supercar; only 351 were ever built, and two custom open-top convertible models were crafted specifically for Sean Connery in the James Bond film 'You Only Live Twice'."
  },
  {
    name: "1987 Ferrari F40",
    fact: "The final supercar personally signed off by Enzo Ferrari, it was the first road-legal production car to break the 200 mph barrier (clocking 201 mph) using carbon-kevlar bodywork."
  },
  {
    name: "1993 Mazda RX-7 (FD3S)",
    fact: "Powered by a sequential twin-turbocharged 13B rotary engine, it achieved a perfect 50:50 front-to-rear weight balance and remains one of the purest handling chassis ever made."
  },
  {
    name: "1963 Chevrolet Corvette Sting Ray",
    fact: "Designed by Larry Shinoda and Bill Mitchell with a distinctive split rear window that was only produced for the 1963 model year, making it an ultra-rare collector grail."
  },
  {
    name: "1974 Porsche 911 Turbo (930)",
    fact: "Dubbed the 'Widowmaker' due to massive turbo lag followed by explosive rear-engine snap-oversteer, it pioneered turbocharging technology in production sports cars."
  },
  {
    name: "1991 Acura NSX",
    fact: "Honed with direct test-track feedback from Formula 1 world champion Ayrton Senna, it introduced the world's first all-aluminum monocoque chassis to production cars."
  },
  {
    name: "1967 Shelby Cobra 427 S/C",
    fact: "With a massive 7.0-liter Ford V8 shoehorned into a lightweight aluminum roadster body, it could rocket from 0 to 100 mph and brake back to a complete stop in under 14 seconds."
  },
  {
    name: "2005 Ford GT",
    fact: "Built to commemorate Ford's centennial and the GT40's 1966 Le Mans sweep, its superplastic-formed aluminum body housed a supercharged 5.4L V8 capable of 205 mph."
  },
  {
    name: "1970 Plymouth Hemi 'Cuda",
    fact: "One of the most valuable muscle cars in the world; only 14 convertible models were produced in 1971, with pristine examples commanding several million dollars at auction."
  },
  {
    name: "1998 Subaru Impreza 22B STI",
    fact: "Built to celebrate Subaru's 40th anniversary and three consecutive World Rally Championship titles, only 424 widebody units were made and all sold out in under 48 hours."
  },
  {
    name: "1984 Audi Sport Quattro",
    fact: "Engineered with a short-wheelbase chassis and Kevlar-carbon body panels to dominate Group B rallying, forever revolutionizing all-wheel-drive performance."
  },
  {
    name: "1992 BMW M3 (E30 Sport Evolution)",
    fact: "Born as a homologation special for touring car racing, almost every body panel except the hood and roof was modified from standard 3-Series models for aerodynamic downforce."
  },
  {
    name: "2010 Lexus LFA",
    fact: "Toyota spent a decade perfecting its carbon-fiber chassis and a naturally aspirated 4.8L V10 so fast-revving that analog tachometer needles couldn't keep up, requiring a digital display."
  },
  {
    name: "1970 Datsun 240Z",
    fact: "Revolutionized the American sports car market in 1970 by offering European styling and smooth overhead-cam straight-six performance at an accessible price point."
  },
  {
    name: "1964 Aston Martin DB5",
    fact: "Equipped with a 4.0-liter inline-six and immortalized as the ultimate gadget-laden 007 vehicle with revolving license plates and an ejector seat in 'Goldfinger'."
  },
  {
    name: "1990 Mercedes-Benz 190E 2.5-16 Evo II",
    fact: "Famous for its radical adjustable rear wing and flared arches, its Cosworth-developed high-revving 16-valve engine dominated German DTM touring car battles."
  },
  {
    name: "2004 Porsche Carrera GT",
    fact: "Powered by a howling 5.7L V10 derived from a cancelled Le Mans prototype program, it is revered as one of the purest, most demanding analog supercars in automotive history."
  },
  {
    name: "1968 Ford Mustang GT Fastback",
    fact: "Immortalized by Steve McQueen in the film 'Bullitt', creating what is widely considered the greatest and most influential car chase scene in cinematic history."
  },
  {
    name: "1996 Dodge Viper GTS",
    fact: "Recognized by its iconic double-bubble roof designed to fit racing helmets, its 8.0-liter aluminum V10 generated 450 horsepower with zero electronic driver aids."
  }
];

function getCarOfTheDay() {
  const now = new Date();
  const dayNumber = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  const index = Math.abs(dayNumber) % CARS_DATABASE.length;
  return { car: CARS_DATABASE[index], index: index + 1 };
}

function openHWPopup() {
  const { car, index } = getCarOfTheDay();
  if (hwCarName) hwCarName.textContent = car.name;
  if (hwCarFact) hwCarFact.textContent = car.fact;
  if (hwIndexTag) hwIndexTag.textContent = `SPEC #${String(index).padStart(2, '0')}`;
  if (hwPopup) hwPopup.classList.remove("hidden");
}

function closeHWPopup() {
  if (hwPopup) hwPopup.classList.add("hidden");
}

function toggleHWPopup() {
  if (hwPopup && !hwPopup.classList.contains("hidden")) {
    closeHWPopup();
  } else {
    openHWPopup();
  }
}

if (hwDirectiveBtn) {
  hwDirectiveBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleHWPopup();
  });
}

if (hwCloseBtn) {
  hwCloseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeHWPopup();
  });
}

// Click outside closes H.W. Directive Popup
document.addEventListener("click", (e) => {
  if (hwPopup && !hwPopup.classList.contains("hidden")) {
    if (!hwPopup.contains(e.target) && (!hwDirectiveBtn || !hwDirectiveBtn.contains(e.target))) {
      closeHWPopup();
    }
  }
});

// ==========================================================================
// Tactical Tasks & Objectives Management (Private Workspace)
// ==========================================================================
let unsubscribeTasks = null;

function subscribeToTasks(userId) {
  if (unsubscribeTasks) unsubscribeTasks();

  const q = query(tasksRef, where("userId", "==", userId));
  
  unsubscribeTasks = onSnapshot(q, (snapshot) => {
    const tasks = [];
    snapshot.forEach((docSnap) => {
      tasks.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderTasks(tasks);
  }, (error) => {
    console.error("Tasks subscription error:", error);
    if (openTasksList) {
      openTasksList.innerHTML = `
        <div class="error-log-state">
          <p>FAILED TO QUERY OBJECTIVES // CHECK SECURITY PROTOCOLS</p>
        </div>
      `;
    }
  });
}

function unsubscribeFromTasks() {
  if (unsubscribeTasks) {
    unsubscribeTasks();
    unsubscribeTasks = null;
  }
  renderTasks([]);
}

function renderTasks(tasks) {
  const openTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  // Sort open tasks: by due date ascending (no due date goes to bottom), secondary by createdAt desc
  openTasks.sort((a, b) => {
    const dateA = a.dueDate || "";
    const dateB = b.dueDate || "";

    if (!dateA && dateB) return 1;
    if (dateA && !dateB) return -1;
    if (dateA && dateB) {
      const cmp = dateA.localeCompare(dateB);
      if (cmp !== 0) return cmp;
    }

    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });

  // Sort completed tasks by createdAt desc
  completedTasks.sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });

  if (openTasksCountBadge) openTasksCountBadge.textContent = `${openTasks.length} PENDING`;
  if (completedTasksCountBadge) completedTasksCountBadge.textContent = `${completedTasks.length} COMPLETED`;
  if (wsPendingMetric) wsPendingMetric.textContent = `${openTasks.length} ACTIVE`;

  if (openTasksList) {
    if (openTasks.length === 0) {
      openTasksList.innerHTML = `
        <div class="empty-log-state">
          <span class="pulse-indicator"></span>
          <p>NO ACTIVE DIRECTIVES // ALL OBJECTIVES FULFILLED</p>
        </div>
      `;
    } else {
      openTasksList.innerHTML = openTasks.map(t => renderTaskItemHTML(t, false)).join("");
    }
  }

  if (completedTasksList) {
    if (completedTasks.length === 0) {
      completedTasksList.innerHTML = `
        <div class="empty-log-state">
          <p>NO COMPLETED DIRECTIVES RECORDED</p>
        </div>
      `;
    } else {
      completedTasksList.innerHTML = completedTasks.map(t => renderTaskItemHTML(t, true)).join("");
    }
  }

  // Attach Checkbox Toggle Handlers
  document.querySelectorAll(".task-hud-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", async (e) => {
      const taskId = e.target.getAttribute("data-id");
      const isChecked = e.target.checked;
      try {
        await updateDoc(doc(db, "tasks", taskId), {
          completed: isChecked
        });
      } catch (err) {
        console.error("Error updating task status:", err);
        e.target.checked = !isChecked;
      }
    });
  });

  // Attach Delete Handlers
  document.querySelectorAll(".task-delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const taskId = btn.getAttribute("data-id");
      if (!confirm("CONFIRM DELETION: Purge this objective directive from the database?")) {
        return;
      }
      try {
        await deleteDoc(doc(db, "tasks", taskId));
      } catch (err) {
        console.error("Error deleting task:", err);
      }
    });
  });
}

function renderTaskItemHTML(task, isCompleted) {
  const sanitizedTitle = escapeHTML(task.title);
  const sanitizedNotes = task.notes ? escapeHTML(task.notes) : "";
  
  let dueBadgeHTML = '';
  if (task.dueDate) {
    const todayStr = new Date().toISOString().split("T")[0];
    const isOverdue = !isCompleted && task.dueDate < todayStr;
    const isToday = !isCompleted && task.dueDate === todayStr;
    const badgeClass = isOverdue ? "task-due-badge overdue" : (isToday ? "task-due-badge overdue" : "task-due-badge");
    const label = isOverdue ? `OVERDUE: ${task.dueDate}` : (isToday ? `DUE TODAY: ${task.dueDate}` : `DUE: ${task.dueDate}`);
    dueBadgeHTML = `<span class="${badgeClass}">${label}</span>`;
  } else {
    dueBadgeHTML = `<span class="task-due-badge no-due">NO DEADLINE</span>`;
  }

  const notesHTML = sanitizedNotes ? `<div class="task-notes">${sanitizedNotes}</div>` : '';

  return `
    <li class="task-item" data-id="${task.id}">
      <div class="task-checkbox-container">
        <input 
          type="checkbox" 
          class="task-hud-checkbox" 
          data-id="${task.id}" 
          ${isCompleted ? 'checked' : ''} 
          aria-label="Toggle task completion"
        >
      </div>
      <div class="task-content">
        <div class="task-title">${sanitizedTitle}</div>
        <div class="task-meta-row">
          ${dueBadgeHTML}
        </div>
        ${notesHTML}
      </div>
      <div class="task-actions">
        <button type="button" class="task-delete-btn" data-id="${task.id}" title="Permanently delete objective">
          PURGE [✕]
        </button>
      </div>
    </li>
  `;
}

// Handle Task Form Submission
if (taskForm) {
  taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      showTaskFeedback("AUTHENTICATION REQUIRED TO ASSIGN DIRECTIVES", "error");
      return;
    }

    const title = taskTitleInput.value.trim();
    const dueDate = taskDueDateInput.value || null;
    const notes = taskNotesInput.value.trim() || null;

    if (!title) {
      showTaskFeedback("ENTER DIRECTIVE TITLE", "error");
      return;
    }

    taskSubmitBtn.disabled = true;
    taskSubmitText.textContent = "TRANSMITTING...";
    clearTaskFeedback();

    try {
      await addDoc(tasksRef, {
        title,
        dueDate,
        notes,
        completed: false,
        createdAt: serverTimestamp(),
        userId: auth.currentUser.uid
      });

      taskTitleInput.value = "";
      taskDueDateInput.value = "";
      taskNotesInput.value = "";
      showTaskFeedback("OBJECTIVE INITIALIZED IN DATABASE", "success");
      taskSubmitText.textContent = "RECORDED ✓";

      setTimeout(() => {
        taskSubmitText.textContent = "+ ASSIGN DIRECTIVE";
        taskSubmitBtn.disabled = false;
      }, 1200);
    } catch (err) {
      console.error("Error creating task:", err);
      showTaskFeedback("TRANSMISSION ERROR: " + (err.message || "SECURITY FAILURE"), "error");
      taskSubmitBtn.disabled = false;
      taskSubmitText.textContent = "+ ASSIGN DIRECTIVE";
    }
  });
}

function showTaskFeedback(msg, type) {
  if (taskFormFeedback) {
    taskFormFeedback.textContent = msg;
    taskFormFeedback.className = `form-feedback ${type}`;
  }
}

function clearTaskFeedback() {
  if (taskFormFeedback) {
    taskFormFeedback.textContent = "";
    taskFormFeedback.className = "form-feedback";
  }
}

// ==========================================================================
// Personal Journal Storage & Management (Shared across Drawer & Dashboard)
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
  if (wsJournalMetric) wsJournalMetric.textContent = `${total} RECORDED`;

  const renderedHTML = total === 0 ? `
    <div class="empty-log-state">
      <span class="pulse-indicator"></span>
      <p>NO JOURNAL ENTRIES RECORDED</p>
    </div>
  ` : entries.map((entry, index) => {
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

  if (journalEntriesContainer) journalEntriesContainer.innerHTML = renderedHTML;
  if (wsJournalEntriesContainer) wsJournalEntriesContainer.innerHTML = renderedHTML;

  // Attach Edit & Delete Listeners across all containers
  document.querySelectorAll(".journal-action-btn.edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      startEditJournalEntry(id);
    });
  });

  document.querySelectorAll(".journal-action-btn.delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      deleteJournalEntry(id);
    });
  });
}

function openComposer(mode = "new", entry = null, target = "drawer") {
  const composer = target === "workspace" ? wsJournalComposer : journalComposer;
  const modeTitle = target === "workspace" ? wsComposerModeTitle : composerModeTitle;
  const saveText = target === "workspace" ? wsSaveJournalText : saveJournalText;
  const btnText = target === "workspace" ? wsComposerBtnText : composerBtnText;
  const editId = target === "workspace" ? wsJournalEditId : journalEditId;
  const titleInput = target === "workspace" ? wsJournalTitleInput : journalTitleInput;
  const bodyInput = target === "workspace" ? wsJournalBodyInput : journalBodyInput;

  if (!composer) return;
  composer.classList.remove("hidden");

  if (mode === "edit" && entry) {
    if (modeTitle) modeTitle.textContent = "// EDIT LOG ENTRY";
    if (saveText) saveText.textContent = "UPDATE ENTRY";
    if (btnText) btnText.textContent = "CLOSE";
    if (editId) editId.value = entry.id;
    if (titleInput) titleInput.value = entry.title;
    if (bodyInput) bodyInput.value = entry.body;
  } else {
    if (modeTitle) modeTitle.textContent = "// COMPOSE LOG ENTRY";
    if (saveText) saveText.textContent = "SAVE ENTRY";
    if (btnText) btnText.textContent = "CLOSE";
    if (editId) editId.value = "";
    if (titleInput) titleInput.value = "";
    if (bodyInput) bodyInput.value = "";
  }

  if (titleInput) titleInput.focus();
}

function closeComposer(target = "drawer") {
  const composer = target === "workspace" ? wsJournalComposer : journalComposer;
  const btnText = target === "workspace" ? wsComposerBtnText : composerBtnText;
  const editId = target === "workspace" ? wsJournalEditId : journalEditId;
  const titleInput = target === "workspace" ? wsJournalTitleInput : journalTitleInput;
  const bodyInput = target === "workspace" ? wsJournalBodyInput : journalBodyInput;

  if (!composer) return;
  composer.classList.add("hidden");
  if (btnText) btnText.textContent = target === "workspace" ? "NEW LOG" : "NEW LOG ENTRY";
  if (editId) editId.value = "";
  if (titleInput) titleInput.value = "";
  if (bodyInput) bodyInput.value = "";
}

function startEditJournalEntry(id) {
  const entries = loadJournalEntries();
  const entry = entries.find((item) => item.id === id);
  if (!entry) return;

  if (workspaceView && !workspaceView.classList.contains("hidden")) {
    openComposer("edit", entry, "workspace");
  } else {
    openComposer("edit", entry, "drawer");
  }
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

// Drawer Composer Controls
if (toggleComposerBtn) {
  toggleComposerBtn.addEventListener("click", () => {
    if (journalComposer.classList.contains("hidden")) {
      openComposer("new", null, "drawer");
    } else {
      closeComposer("drawer");
    }
  });
}
if (cancelComposeBtn) cancelComposeBtn.addEventListener("click", () => closeComposer("drawer"));

// Workspace Dashboard Composer Controls
if (wsToggleComposerBtn) {
  wsToggleComposerBtn.addEventListener("click", () => {
    if (wsJournalComposer.classList.contains("hidden")) {
      openComposer("new", null, "workspace");
    } else {
      closeComposer("workspace");
    }
  });
}
if (wsCancelComposeBtn) wsCancelComposeBtn.addEventListener("click", () => closeComposer("workspace"));

function handleJournalFormSubmit(e, editIdEl, titleEl, bodyEl, target) {
  e.preventDefault();
  const title = titleEl.value.trim();
  const body = bodyEl.value.trim();
  const editId = editIdEl.value;

  if (!title || !body) return;

  let entries = loadJournalEntries();

  if (editId) {
    entries = entries.map((item) => {
      if (item.id === editId) {
        return { ...item, title, body };
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
  closeComposer(target);
}

if (journalForm) {
  journalForm.addEventListener("submit", (e) => {
    handleJournalFormSubmit(e, journalEditId, journalTitleInput, journalBodyInput, "drawer");
  });
}

if (wsJournalForm) {
  wsJournalForm.addEventListener("submit", (e) => {
    handleJournalFormSubmit(e, wsJournalEditId, wsJournalTitleInput, wsJournalBodyInput, "workspace");
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
      snapshot.forEach((docSnap) => {
        entries.push({ id: docSnap.id, ...docSnap.data() });
      });
      renderLogbook(entries);
    }, (error) => {
      console.warn("Firestore query with orderBy failed, falling back to unordered query:", error);
      onSnapshot(logbookRef, (snapshot) => {
        const entries = [];
        snapshot.forEach((docSnap) => {
          entries.push({ id: docSnap.id, ...docSnap.data() });
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

// ==========================================================================
// Initialize Everything on Load
// ==========================================================================
renderJournal();
subscribeToLogbook();
