// Subbly AI After Effects UXP Panel Core Logic
const SUPABASE_URL = "https://polshaqgsqhzcvtipssx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbHNoYXFnc3FoemN2dGlwc3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2ODI0NjYsImV4cCI6MjA5OTI1ODQ2Nn0.2lqBOkAvcmHRnrt6--CiCNGMMs9zpHzCla6OZnNNo0o";

// State
let sessionToken = localStorage.getItem("subbly_session_token") || null;
let userEmail = localStorage.getItem("subbly_user_email") || null;
let projects = [];
let templates = [];
let selectedProjectId = null;
let selectedTemplateId = null;

// Tab Routing
const views = ["view-login", "view-projects", "view-templates", "view-import", "view-settings"];
const tabButtons = document.querySelectorAll(".tab-btn");

function showView(viewId) {
  views.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === viewId) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    }
  });

  tabButtons.forEach(btn => {
    if (btn.getAttribute("data-view") === viewId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// Attach Tab Listeners
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const viewId = btn.getAttribute("data-view");
    if (!sessionToken && viewId !== "view-settings") {
      showView("view-login");
      showToast("Please sign in first");
    } else {
      showView(viewId);
    }
  });
});

// Toast popup utility
function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast");
  if (toast) {
    toast.textContent = message;
    toast.style.display = "block";
    setTimeout(() => {
      toast.style.display = "none";
    }, duration);
  }
}

// Authentication Logic
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value.trim();

    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || "Invalid login credentials");
      }

      const data = await response.json();
      sessionToken = data.access_token;
      userEmail = data.user.email;

      localStorage.setItem("subbly_session_token", sessionToken);
      localStorage.setItem("subbly_user_email", userEmail);

      showToast("Logged in successfully!");
      updateProfileUI();
      loadProjects();
      showView("view-projects");
    } catch (err) {
      showToast(err.message);
    }
  });
}

// Sign Out Logic
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    sessionToken = null;
    userEmail = null;
    localStorage.removeItem("subbly_session_token");
    localStorage.removeItem("subbly_user_email");
    
    updateProfileUI();
    document.getElementById("projectsContainer").innerHTML = `
      <div style="text-align: center; color: var(--text-dim); padding-top: 40px;">
        Logged out. Please log in to view projects.
      </div>
    `;
    showView("view-login");
    showToast("Signed out");
  });
}

function updateProfileUI() {
  const profileEmail = document.getElementById("profileEmail");
  const profileStatus = document.getElementById("profileStatus");
  if (profileEmail && profileStatus) {
    if (sessionToken) {
      profileEmail.textContent = userEmail;
      profileStatus.textContent = "Synced & Connected to Subbly AI cloud.";
    } else {
      profileEmail.textContent = "Not signed in";
      profileStatus.textContent = "Please log in to sync captions.";
    }
  }
}

// Fetch Projects from Supabase
async function loadProjects() {
  if (!sessionToken) return;

  const loader = document.getElementById("projectsLoader");
  const container = document.getElementById("projectsContainer");

  if (loader) loader.classList.remove("hidden");
  if (container) container.innerHTML = "";

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=*`, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${sessionToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Failed to load projects from Subbly servers.");
    }

    projects = await response.json();
    renderProjects(projects);
  } catch (err) {
    showToast(err.message);
  } finally {
    if (loader) loader.classList.add("hidden");
  }
}

function renderProjects(list) {
  const container = document.getElementById("projectsContainer");
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-dim); padding-top: 40px;">
        No caption projects found. Create one in Subbly web dashboard first!
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(proj => {
    const dateStr = new Date(proj.created_at).toLocaleDateString();
    const duration = proj.duration_seconds ? `${Math.round(proj.duration_seconds)}s` : "0s";
    const isActive = selectedProjectId === proj.id ? "border-color: var(--accent-color); background-color: #2b2b2b;" : "";

    return `
      <div class="project-item" style="${isActive}" data-id="${proj.id}">
        <div class="project-thumb">
          ${proj.thumbnail_path ? `<img src="${proj.thumbnail_path}">` : "🎥"}
        </div>
        <div class="project-info">
          <div class="project-title">${proj.title || "Untitled Project"}</div>
          <div class="project-meta">
            <span>${duration}</span>
            <span>•</span>
            <span>${dateStr}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");

  // Attach click handlers
  document.querySelectorAll(".project-item").forEach(item => {
    item.addEventListener("click", () => {
      selectedProjectId = item.getAttribute("data-id");
      renderProjects(list); // Re-render to show active state
      showToast(`Selected project: ${projects.find(p => p.id === selectedProjectId)?.title}`);
      
      // Enable import button
      document.getElementById("importBtn").removeAttribute("disabled");
      
      // Auto switch to Import view to style and verify captions
      setTimeout(() => {
        showView("view-import");
      }, 300);
    });
  });
}

// Search and Sort Filter
const searchInput = document.getElementById("searchProjects");
const sortSelect = document.getElementById("sortProjects");

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase();
    const filtered = projects.filter(p => (p.title || "").toLowerCase().includes(val));
    renderProjects(filtered);
  });
}

if (sortSelect) {
  sortSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    let sorted = [...projects];
    if (val === "name") {
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else {
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    renderProjects(sorted);
  });
}

// Load built-in style templates
async function loadTemplates() {
  try {
    const res = await fetch("templates.json");
    templates = await res.json();
    renderTemplates(templates);
  } catch (err) {
    console.warn("Could not load templates.json directly, using fallback presets.", err);
    // Fallback template presets
    templates = [
      {
        id: "tiktok-bold",
        name: "TikTok Bold",
        description: "Big uppercase text, yellow word highlight, bold outline.",
        style: { fontFamily: "Bebas Neue", fontSize: 72, color: "#ffffff", highlightColor: "#facc15", strokeWidth: 5, strokeColor: "#000000", uppercase: true, position: "bottom", animation: "pop" }
      },
      {
        id: "youtube-shorts",
        name: "YouTube Shorts",
        description: "Clean modern sans, red highlight, thick stroke.",
        style: { fontFamily: "Inter", fontSize: 54, color: "#ffffff", highlightColor: "#ef4444", strokeWidth: 6, strokeColor: "#000000", uppercase: true, position: "bottom", animation: "slide-up" }
      },
      {
        id: "gaming-stream",
        name: "Gaming Stream",
        description: "Twitch-style bold punch with purple border.",
        style: { fontFamily: "Russo One", fontSize: 56, color: "#ffffff", highlightColor: "#a855f7", strokeWidth: 5, strokeColor: "#1e1b4b", uppercase: true, position: "bottom", animation: "bounce" }
      }
    ];
    renderTemplates(templates);
  }
}

function renderTemplates(list) {
  const container = document.getElementById("templatesContainer");
  if (!container) return;

  container.innerHTML = list.map(t => {
    const isSelected = selectedTemplateId === t.id ? "selected" : "";
    return `
      <div class="template-card ${isSelected}" data-id="${t.id}">
        <div class="template-title">${t.name}</div>
        <div class="template-desc">${t.description}</div>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".template-card").forEach(card => {
    card.addEventListener("click", () => {
      selectedTemplateId = card.getAttribute("data-id");
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        applyTemplateStyle(template.style);
        showToast(`Applied style: ${template.name}`);
      }
      renderTemplates(list);
    });
  });
}

function applyTemplateStyle(style) {
  if (!style) return;

  if (style.fontFamily) document.getElementById("styleFont").value = style.fontFamily;
  if (style.fontSize) document.getElementById("styleSize").value = style.fontSize;
  if (style.color) {
    document.getElementById("styleColor").value = style.color;
    document.getElementById("styleColorText").textContent = style.color;
  }
  if (style.highlightColor) {
    document.getElementById("styleHighlight").value = style.highlightColor;
    document.getElementById("styleHighlightText").textContent = style.highlightColor;
  }
  if (style.strokeWidth !== undefined) document.getElementById("styleStroke").value = style.strokeWidth;
  if (style.strokeColor) {
    document.getElementById("styleStrokeColor").value = style.strokeColor;
    document.getElementById("styleStrokeColorText").textContent = style.strokeColor;
  }
  if (style.position) document.getElementById("stylePosition").value = style.position;
  if (style.animation) document.getElementById("styleAnimation").value = style.animation;
}

// Bind Color pickers text update
["styleColor", "styleHighlight", "styleStrokeColor"].forEach(id => {
  const picker = document.getElementById(id);
  const text = document.getElementById(`${id}Text`);
  if (picker && text) {
    picker.addEventListener("input", (e) => {
      text.textContent = e.target.value;
    });
  }
});

// Import Integration with After Effects Script
const importBtn = document.getElementById("importBtn");
if (importBtn) {
  importBtn.addEventListener("click", async () => {
    if (!selectedProjectId) {
      showToast("Select a project first");
      return;
    }

    const project = projects.find(p => p.id === selectedProjectId);
    if (!project || !project.captions) {
      showToast("Selected project does not contain valid caption data.");
      return;
    }

    // Prepare style parameters
    const font = document.getElementById("styleFont").value;
    const fontSize = parseFloat(document.getElementById("styleSize").value) || 60;
    const color = document.getElementById("styleColor").value;
    const highlightColor = document.getElementById("styleHighlight").value;
    const strokeWidth = parseFloat(document.getElementById("styleStroke").value) || 0;
    const strokeColor = document.getElementById("styleStrokeColor").value;
    const position = document.getElementById("stylePosition").value;
    const animation = document.getElementById("styleAnimation").value;
    const mode = document.getElementById("importMode").value;

    const styleParams = {
      font,
      fontSize,
      color,
      highlightColor,
      strokeWidth,
      strokeColor,
      position,
      animation,
      mode
    };

    // Show Progress Indicator
    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");
    const progressBar = document.getElementById("progressBar");

    progressBar.style.display = "block";
    progressText.style.display = "block";
    progressText.textContent = "Connecting to After Effects active composition...";
    progressFill.style.width = "20%";

    try {
      // Import the After Effects scripting module dynamically
      const aeAutomation = require("./ae-automation.js");

      progressText.textContent = "Injecting caption layers...";
      progressFill.style.width = "60%";

      // Run AE layer creation
      const success = aeAutomation.importCaptionsToAE(project.captions, styleParams, (progress) => {
        progressFill.style.width = `${60 + (progress * 0.4)}%`;
        progressText.textContent = `Processing caption ${Math.round(progress * 100)}%`;
      });

      if (success) {
        progressFill.style.width = "100%";
        progressText.textContent = "Successfully imported!";
        showToast("AI Captions imported successfully!");
      } else {
        throw new Error("Unable to import captions. Ensure a composition is active in After Effects.");
      }
    } catch (err) {
      showToast(`Error: ${err.message}`);
      progressText.textContent = `Import failed: ${err.message}`;
    } finally {
      setTimeout(() => {
        progressBar.style.display = "none";
        progressText.style.display = "none";
      }, 3500);
    }
  });
}

// Initial Loading
window.addEventListener("load", () => {
  updateProfileUI();
  loadTemplates();
  
  if (sessionToken) {
    loadProjects();
    showView("view-projects");
  } else {
    showView("view-login");
  }
  
  // Try to detect After Effects host name
  try {
    const ae = require("aftereffects");
    if (ae && ae.app) {
      document.getElementById("aeHostName").textContent = `After Effects v${ae.app.version}`;
    }
  } catch {
    document.getElementById("aeHostName").textContent = "After Effects (Offline Mode)";
  }
});
