const themeSelect = document.getElementById("themeSelect");

const savedTheme = localStorage.getItem("vapor-theme") || "dark";
applyTheme(savedTheme);
themeSelect.value = savedTheme;

themeSelect.addEventListener("change", () => {
  const selected = themeSelect.value;
  localStorage.setItem("vapor-theme", selected);
  applyTheme(selected);
});

function applyTheme(mode) {
  if (mode === "light") {
    document.body.style.background = "#f0f0f0";
    document.body.style.color = "#111";
    document.querySelectorAll(".navbar, .settings-box, #urlInput, #searchButton, #switcher, #iframeWindow").forEach(el => {
      el.style.background = "#fff";
      el.style.color = "#111";
      el.style.border = "1px solid #ccc";
    });
  } else {
    document.body.style.background = "#000";
    document.body.style.color = "#cfcfcf";
    document.querySelectorAll(".navbar, .settings-box, #urlInput, #searchButton, #switcher, #iframeWindow").forEach(el => {
      el.style.background = "#111";
      el.style.color = "#cfcfcf";
      el.style.border = "1px solid #222";
    });
  }
}
