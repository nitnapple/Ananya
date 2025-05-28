// Set the date when the website closed (UTC)
const closedDate = new Date("2025-05-20T00:00:00Z");

function updateReverseCountdown() {
  const now = new Date();
  const diff = now - closedDate;

  if (diff < 0) {
    // If the current date is before the closed date
    document.getElementById("reverseCountdown").textContent = "Website is not closed yet.";
    return;
  }

  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / (1000 * 60)) % 60;
  const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  document.getElementById("reverseCountdown").textContent =
    `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
}

// Update every second
setInterval(updateReverseCountdown, 1000);

// Initial call to display immediately on page load
updateReverseCountdown();
