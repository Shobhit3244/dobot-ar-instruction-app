// =====================================================
// STEP CONFIGURATION
// =====================================================

const STEPS = [
    { file: "models/model1.glb", text: "Step 1: Click the power button and wait for green light." },
    { file: "models/model2.glb", text: "Step 2: Select COM port and click connect." },
    { file: "models/model3.glb", text: "Step 3: Select teaching and playback mode." },
    { file: "models/model4.glb", text: "Step 4: Create a new empty file." },
    { file: "models/model5.glb", text: "Step 5: Select suction cup tool." },
    { file: "models/model6.glb", text: "Step 6: Locate button on robot arm." },
    { file: "models/model7.glb", text: "Step 7: Press button and move arm." },
    { file: "models/model8.glb", text: "Step 8: Enable SuctionCupOn." },
    { file: "models/model9.glb", text: "Step 9: Move arm to drop position." },
    { file: "models/model10.glb", text: "Step 10: Press start." },
    { file: "models/model11.glb", text: "Step 11: Exit and disconnect." },
    { file: "models/model12.glb", text: "Step 12: Power off robot." }
];

let scene, camera, renderer;
let arToolkitSource, arToolkitContext;
let markerRoot;
let currentModel = null;
let stepIndex = 0;

const loader = new THREE.GLTFLoader();

// =====================================================
// INIT
// =====================================================

function init() {
    console.log("🚀 Initializing AR Instruction App...");

    scene = new THREE.Scene();

    camera = new THREE.Camera();
    scene.add(camera);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(1, 2, 3);
    scene.add(dirLight);

    // Renderer
    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0px";
    renderer.domElement.style.left = "0px";
    document.body.appendChild(renderer.domElement);

    // AR Toolkit Source (CAMERA)
    arToolkitSource = new THREEx.ArToolkitSource({
        sourceType: "webcam"
    });

    arToolkitSource.init(() => {
        onResize();

        // 🔥 CRITICAL: Attach camera feed to DOM
        arToolkitSource.domElement.style.position = "absolute";
        arToolkitSource.domElement.style.top = "0px";
        arToolkitSource.domElement.style.left = "0px";
        arToolkitSource.domElement.style.zIndex = "-1";
        document.body.appendChild(arToolkitSource.domElement);
    });

    window.addEventListener("resize", onResize);

    // AR Context
    arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl:
            "https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/data/data/camera_para.dat",
        detectionMode: "mono"
    });

    arToolkitContext.init(() => {
        console.log("✅ AR Toolkit Context Ready");
    });

    // Marker
    markerRoot = new THREE.Group();
    scene.add(markerRoot);

    const markerControls = new THREEx.ArMarkerControls(
        arToolkitContext,
        markerRoot,
        {
            type: "pattern",
            patternUrl:
                "https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/data/data/patt.hiro"
        }
    );

    markerControls.addEventListener("markerFound", () => {
        document.getElementById("ar-status").innerText = "Marker Found";
    });

    markerControls.addEventListener("markerLost", () => {
        document.getElementById("ar-status").innerText = "Searching...";
    });

    setupUI();
    loadStep(0);
    animate();
}

// =====================================================
// LOAD STEP
// =====================================================

function loadStep(index) {
    stepIndex = index;
    const step = STEPS[index];

    document.getElementById("instruction-text").innerText = step.text;
    document.getElementById("step-counter").innerText = `${index + 1}/${STEPS.length}`;

    document.getElementById("prev-btn").disabled = index === 0;
    document.getElementById("next-btn").disabled = index === STEPS.length - 1;

    if (currentModel) {
        markerRoot.remove(currentModel);
        currentModel.traverse(obj => {
            if (obj.isMesh) {
                obj.geometry.dispose();
                if (obj.material.map) obj.material.map.dispose();
                obj.material.dispose();
            }
        });
        currentModel = null;
    }

    console.log("📦 Loading model:", step.file);

    loader.load(
        step.file,
        gltf => {
            currentModel = gltf.scene;
            currentModel.scale.set(0.05, 0.05, 0.05); // 🔥 Visible scale
            currentModel.rotation.x = -Math.PI / 2;
            markerRoot.add(currentModel);
            console.log("✅ Step Loaded Successfully");
        },
        undefined,
        err => {
            console.error("❌ Model load error:", err);
        }
    );
}

// =====================================================
// UI
// =====================================================

function setupUI() {
    document.getElementById("next-btn").onclick = () => {
        if (stepIndex < STEPS.length - 1) loadStep(stepIndex + 1);
    };

    document.getElementById("prev-btn").onclick = () => {
        if (stepIndex > 0) loadStep(stepIndex - 1);
    };
}

// =====================================================
// RENDER LOOP
// =====================================================

function animate() {
    requestAnimationFrame(animate);

    if (arToolkitSource.ready) {
        arToolkitContext.update(arToolkitSource.domElement);
    }

    renderer.render(scene, camera);
}

// =====================================================
// RESIZE
// =====================================================

function onResize() {
    arToolkitSource.onResizeElement();
    arToolkitSource.copyElementSizeTo(renderer.domElement);
    if (arToolkitContext.arController) {
        arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
    }
}

// =====================================================
// START
// =====================================================

window.addEventListener("load", init);
