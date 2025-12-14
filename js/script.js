/* =====================================================
    STEP CONFIGURATION (UNCHANGED)
===================================================== */

const STEPS = [
    { type: "model", file: "models/model1.glb", text: "Step 1: Click the power button and wait for green light." },

    { type: "image", file: "models/model2.png", text: "Step 2: Select COM port and click connect." },
    { type: "image", file: "models/model3.png", text: "Step 3: Select teaching and playback mode." },
    { type: "image", file: "models/model4.png", text: "Step 4: Create a new empty file." },
    { type: "image", file: "models/model5.png", text: "Step 5: Select suction cup tool." },

    { type: "model", file: "models/model6.glb", text: "Step 6: Locate button on robot arm." },

    { type: "image", file: "models/model7.png", text: "Step 7: Press button and move arm." },
    { type: "image", file: "models/model8.png", text: "Step 8: Enable SuctionCupOn." },
    { type: "image", file: "models/model9.png", text: "Step 9: Move arm to drop position." },
    { type: "image", file: "models/model10.png", text: "Step 10: Press start." },
    { type: "image", file: "models/model11.png", text: "Step 11: Exit and disconnect." },

    { type: "model", file: "models/model12.glb", text: "Step 12: Power off robot." }
];

/* =====================================================
   GLOBALS
===================================================== */

let scene, arCamera, renderer;
let arToolkitSource, arToolkitContext, markerRoot;
let currentObject = null;
let currentStep = 0;

const gltfLoader = new THREE.GLTFLoader();
const textureLoader = new THREE.TextureLoader();

/* =====================================================
   INIT AR (MATCHES WORKING PROJECT)
===================================================== */

function initAR() {

    console.log("🚀 Initializing AR Instruction App");

    scene = new THREE.Scene();

    arCamera = new THREE.Camera();
    scene.add(arCamera);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setClearColor(new THREE.Color("lightgrey"), 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0px";
    renderer.domElement.style.left = "0px";

    const arContainer = document.getElementById("ar-container");
    if (arContainer) {
        arContainer.appendChild(renderer.domElement);
    } else {
        console.error("❌ #ar-container missing in HTML");
        return;
    }

    /* ---------- AR SOURCE ---------- */
    arToolkitSource = new THREEx.ArToolkitSource({ sourceType: "webcam" });

    arToolkitSource.init(() => {
        console.log("✅ Camera ready");
        onResize();

        const loading = document.getElementById("loading-screen");
        if (loading) {
            loading.style.opacity = "0";
            setTimeout(() => loading.style.display = "none", 500);
        }
    });

    window.addEventListener("resize", onResize);

    /* ---------- AR CONTEXT ---------- */
    arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl:
            "https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/data/data/camera_para.dat",
        detectionMode: "mono"
    });

    arToolkitContext.init(() => {
        arCamera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
        console.log("✅ AR context initialized");
    });

    /* ---------- MARKER ---------- */
    markerRoot = new THREE.Group();
    scene.add(markerRoot);

    new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
        type: "pattern",
        patternUrl:
            "https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/data/data/patt.hiro"
    });

    /* ---------- LIGHTING ---------- */
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(1, 1, 1);
    scene.add(dirLight);

    /* ---------- UI ---------- */
    const nextBtn = document.getElementById("next");
    const prevBtn = document.getElementById("prev");

    if (nextBtn) nextBtn.onclick = () => currentStep < STEPS.length - 1 && loadStep(currentStep + 1);
    if (prevBtn) prevBtn.onclick = () => currentStep > 0 && loadStep(currentStep - 1);

    loadStep(0);
    animate();
}

/* =====================================================
   STEP LOADER
===================================================== */

function loadStep(index) {
    currentStep = index;
    const step = STEPS[index];

    const textEl = document.getElementById("text");
    if (textEl) textEl.innerText = step.text;

    if (currentObject) {
        markerRoot.remove(currentObject);
        disposeObject(currentObject);
        currentObject = null;
    }

    step.type === "image"
        ? loadImage(step.file)
        : loadModel(step.file);
}

/* ---------- IMAGE ---------- */
function loadImage(src) {
    textureLoader.load(src, texture => {
        const geo = new THREE.PlaneGeometry(1.2, 0.8);
        const mat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        currentObject = new THREE.Mesh(geo, mat);
        currentObject.scale.set(1, 1, 1);
        currentObject.rotation.x = -Math.PI / 2;
        markerRoot.add(currentObject);
    });
}

/* ---------- MODEL ---------- */
function loadModel(src) {
    gltfLoader.load(src, gltf => {
        currentObject = gltf.scene;
        currentObject.scale.set(0.001, 0.001, 0.001);
        currentObject.rotation.x = Math.PI / 2;
        markerRoot.add(currentObject);
    });
}

/* ---------- CLEANUP ---------- */
function disposeObject(obj) {
    if (!obj) return;
    obj.traverse(child => {
        if (child.isMesh) {
            child.geometry?.dispose();
            if (child.material?.map) child.material.map.dispose();
            child.material?.dispose();
        }
    });
}

/* =====================================================
   LOOP
===================================================== */

function animate() {
    requestAnimationFrame(animate);

    if (arToolkitSource?.ready) {
        arToolkitContext.update(arToolkitSource.domElement);
    }

    renderer.render(scene, arCamera);
}

/* =====================================================
   RESIZE
===================================================== */

function onResize() {
    arToolkitSource.onResizeElement();
    arToolkitSource.copyElementSizeTo(renderer.domElement);
    if (arToolkitContext.arController) {
        arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
    }
}

/* =====================================================
   START
===================================================== */

window.addEventListener("load", initAR);
