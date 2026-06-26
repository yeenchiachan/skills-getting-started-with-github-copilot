document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const defaultActivityOption = '<option value="">-- Select an activity --</option>';

  function escapeHtml(value) {
    const temp = document.createElement("div");
    temp.textContent = value;
    return temp.innerHTML;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = defaultActivityOption;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = Math.max(details.max_participants - details.participants.length, 0);

        const participantsList =
          details.participants.length > 0
            ? details.participants
                .map((participant) => {
                  const encodedActivity = encodeURIComponent(name);
                  const encodedParticipant = encodeURIComponent(participant);
                  return `
                    <li class="participant-item">
                      <span class="participant-email">${escapeHtml(participant)}</span>
                      <button
                        type="button"
                        class="remove-participant-btn"
                        aria-label="Remove ${escapeHtml(participant)} from ${escapeHtml(name)}"
                        data-activity="${encodedActivity}"
                        data-email="${encodedParticipant}"
                      >
                        <span class="owl-icon" aria-hidden="true">&#129417;</span>
                      </button>
                    </li>
                  `;
                })
                .join("")
            : "<li class=\"empty-state\">No participants yet. Be the first to sign up!</li>";

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-title"><strong>Participants</strong></p>
            <ul class="participants-list">
              ${participantsList}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const button = event.target.closest(".remove-participant-btn");
    if (!button) {
      return;
    }

    const encodedActivity = button.dataset.activity;
    const encodedEmail = button.dataset.email;

    if (!encodedActivity || !encodedEmail) {
      return;
    }

    button.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodedActivity}/participants?email=${encodedEmail}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to unregister participant");
      }

      messageDiv.textContent = result.message;
      messageDiv.className = "success";
      messageDiv.classList.remove("hidden");

      await fetchActivities();

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = error.message || "Failed to unregister participant";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    } finally {
      button.disabled = false;
    }
  });

  // Initialize app
  fetchActivities();
});
