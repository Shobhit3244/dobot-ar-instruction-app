let poseLocked = false;
let lockedMatrix = null;
let currentStep = 0;

const anchor = document.getElementById("dobotAnchor");
const model = document.getElementById("dobotModel");

const markers = [
  document.getElementById("m1"),
  document.getElementById("m2"),
  document.getElementById("m3")
];

// ================= POSE LOCK LOGIC =================
markers.forEach(marker => {
  marker.addEventListener("markerFound", () => {
    if (!poseLocked) {
      lockedMatrix = marker.object3D.matrixWorld.clone();
      anchor.object3D.matrix.copy(lockedMatrix);
      anchor.object3D.matrixAutoUpdate = false;
      poseLocked = true;
      console.log("Pose locked using marker");
    }
  });
});

// ================= TUTORIAL UI =================
function updateUI() {
  document.getElementById("stepTitle").innerText =
    tutorialSteps[currentStep].title;

  document.getElementById("stepText").innerText =
    tutorialSteps[currentStep].text;

  highlightPart(tutorialSteps[currentStep].highlight);
}

function nextStep() {
  if (currentStep < tutorialSteps.length - 1) {
    currentStep++;
    updateUI();
  }
}

function prevStep() {
  if (currentStep > 0) {
    currentStep--;
    updateUI();
  }
}

// ================= HIGHLIGHT LOGIC =================
function highlightPart(name) {
  if (!model || !name) return;

  model.object3D.traverse(obj => {
    if (obj.material && obj.material.emissive) {
      obj.material.emissive.setHex(0x000000);
    }
  });

  const part = model.object3D.getObjectByName(name);
  if (part && part.material && part.material.emissive) {
    part.material.emissive.setHex(0x00ff00);
  }
}

updateUI();
