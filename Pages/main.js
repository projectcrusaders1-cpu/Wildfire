const checklist = Array.from(
  document.querySelectorAll("#prepare input[type='checkbox']")
);
const progressBar = document.querySelector("#checklist-progress");
const checklistCount = document.querySelector("#checklist-count");
const resetButton = document.querySelector("#reset-checklist");

if (checklist.length && progressBar && checklistCount && resetButton) {
  const progressTrack = progressBar.closest("[role='progressbar']");

  function updateChecklist() {
    const completed = checklist.filter((item) => item.checked).length;
    const percentage = Math.round((completed / checklist.length) * 100);

    progressBar.style.width = `${percentage}%`;
    progressTrack.setAttribute("aria-valuenow", percentage);
    checklistCount.textContent = `${completed} of ${checklist.length} ready`;
  }

  checklist.forEach((item) => item.addEventListener("change", updateChecklist));

  resetButton.addEventListener("click", () => {
    checklist.forEach((item) => {
      item.checked = false;
    });
    updateChecklist();
    checklist[0].focus();
  });
}

const filterForm = document.querySelector("#map-filters");
const periodSelect = document.querySelector("#map-period");
const filterSummary = document.querySelector("#filter-summary");
const mapStage = document.querySelector(".asia-map-stage");
const mapImage = document.querySelector(".asia-map-image");
const mapDotTargets = document.querySelector(".map-dot-targets");
const mapDotDetails = document.querySelector("#map-dot-details");
const mapDotDetailsRegion = document.querySelector("#map-dot-details-region");

if (filterForm && periodSelect && filterSummary && mapStage && mapImage && mapDotTargets && mapDotDetails && mapDotDetailsRegion) {
  const mapDotDetailsModal = bootstrap.Modal.getOrCreateInstance(mapDotDetails);

  function findMapDots() {
    const canvas = document.createElement("canvas");
    canvas.width = mapImage.naturalWidth;
    canvas.height = mapImage.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(mapImage, 0, 0);

    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const visited = new Uint8Array(canvas.width * canvas.height);
    const queue = new Int32Array(visited.length);
    const dots = [];

    for (let pixel = 0; pixel < visited.length; pixel += 1) {
      const color = pixel * 4;
      if (visited[pixel] || data[color] <= 120 || data[color + 1] >= 100 || data[color + 2] >= 130) {
        continue;
      }

      let queueLength = 1;
      let xTotal = 0;
      let yTotal = 0;
      let componentSize = 0;
      queue[0] = pixel;
      visited[pixel] = 1;

      for (let index = 0; index < queueLength; index += 1) {
        const current = queue[index];
        const x = current % canvas.width;
        const y = Math.floor(current / canvas.width);
        componentSize += 1;
        xTotal += x;
        yTotal += y;

        for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
          for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
            const nextX = x + xOffset;
            const nextY = y + yOffset;
            const nextPixel = nextY * canvas.width + nextX;

            if (nextX < 0 || nextX >= canvas.width || nextY < 0 || nextY >= canvas.height || visited[nextPixel]) {
              continue;
            }

            const nextColor = nextPixel * 4;
            if (data[nextColor] > 120 && data[nextColor + 1] < 100 && data[nextColor + 2] < 130) {
              visited[nextPixel] = 1;
              queue[queueLength] = nextPixel;
              queueLength += 1;
            }
          }
        }
      }

      if (componentSize >= 3 && componentSize <= 80) {
        const dot = { x: xTotal / componentSize, y: yTotal / componentSize };
        // Keep the decorative Arabian Sea speck out of the interactive hotspots.
        const isArabianSeaSpeck = Math.hypot(dot.x - 198.7, dot.y - 284.7) < 3;
        if (!isArabianSeaSpeck) dots.push(dot);
      }
    }

    return dots;
  }

  function regionForDot(dot) {
    const x = dot.x / mapImage.naturalWidth;
    const y = dot.y / mapImage.naturalHeight;

    if (y < 0.3) return "Northern Asia";
    if (y > 0.68 && x > 0.6) return "Southeast Asia";
    if (y > 0.5 && x > 0.3 && x < 0.7) return "South Asia";
    if (x > 0.58 && y > 0.32) return "East Asia";
    if (x < 0.35) return "Western Asia";
    return "Central Asia";
  }

  function initializeMapDots() {
    const mapDots = findMapDots();

    mapDots.forEach((dot) => {
      const target = document.createElement("button");
      target.type = "button";
      target.className = "map-dot-target position-absolute translate-middle border-0 rounded-circle p-0";
      target.style.left = `${(dot.x / mapImage.naturalWidth) * 100}%`;
      target.style.top = `${(dot.y / mapImage.naturalHeight) * 100}%`;
      target.dataset.region = regionForDot(dot);
      target.setAttribute("aria-label", `View ${target.dataset.region} map dot details`);
      target.setAttribute("data-bs-toggle", "tooltip");
      target.setAttribute("data-bs-title", `${target.dataset.region} — click for details. This is not a live wildfire report.`);
      mapDotTargets.append(target);
    });

    bootstrap.Tooltip.getOrCreateInstance(mapDotTargets, {
      selector: ".map-dot-target",
      trigger: "hover",
      placement: "top",
      container: "body",
    });
  }

  mapDotTargets.addEventListener("click", (event) => {
    const target = event.target.closest(".map-dot-target");
    if (!target) return;

    bootstrap.Tooltip.getInstance(target)?.hide();
    mapDotDetailsRegion.textContent = `This marker is located in the ${target.dataset.region} area of the illustrative map.`;
    mapDotDetailsModal.show();
  });

  if (mapImage.complete) {
    initializeMapDots();
  } else {
    mapImage.addEventListener("load", initializeMapDots, { once: true });
  }

  filterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    filterSummary.textContent = `Preview period selected: ${periodSelect.value}. The illustrative map is unchanged; live wildfire data is not connected.`;
  });

  filterForm.addEventListener("reset", () => {
    filterSummary.textContent = "Showing the illustrative map. No live wildfire data is connected.";
  });
}
