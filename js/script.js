// =====================================================
// STEP CONFIGURATION (TEXT PRESERVED EXACTLY)
// =====================================================

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

// =====================================================
// GLOBAL VARIABLES
// =====================================================

let scene, camera, renderer;
let arSource, arContext, markerRoot;
let currentObject = null;
let currentStep = 0;

const gltfLoader = new THREE.GLTFLoader();
const textureLoader = new THREE.TextureLoader();

// =====================================================
// INITIALIZATION
// =====================================================

window.addEventListener("load", init);

function init() {
    console.log("🚀 Initializing AR Instruction App");

    // Scene & Camera
    scene = new THREE.Scene();
    camera = new THREE.Camera();
    scene.add(camera);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(1, 2, 3);
    scene.add(dirLight);

    // Renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0px";
    renderer.domElement.style.left = "0px";
    document.body.appendChild(renderer.domElement);

    // AR Toolkit Source (Camera)
    arSource = new THREEx.ArToolkitSource({
        sourceType: "webcam"
    });

    arSource.init(() => {
        arSource.domElement.style.position = "absolute";
        arSource.domElement.style.top = "0px";
        arSource.domElement.style.left = "0px";
        arSource.domElement.style.zIndex = "-1";
        document.body.appendChild(arSource.domElement);
        onResize();
    });

    window.addEventListener("resize", onResize);

    // AR Context
    arContext = new THREEx.ArToolkitContext({
        cameraParametersUrl:
            "https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/data/data/camera_para.dat",
        detectionMode: "mono"
    });

    arContext.init(() => {
        console.log("✅ AR Context initialized");
    });

    // Marker
    markerRoot = new THREE.Group();
    scene.add(markerRoot);

    new THREEx.ArMarkerControls(arContext, markerRoot, {
        type: "pattern",
        patternUrl:
            "https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/data/data/patt.hiro"
    });

    // UI Buttons
    document.getElementById("next").addEventListener("click", () => {
        if (currentStep < STEPS.length - 1) loadStep(currentStep + 1);
    });

    document.getElementById("prev").addEventListener("click", () => {
        if (currentStep > 0) loadStep(currentStep - 1);
    });

    // Start
    loadStep(0);
    animate();
}

// =====================================================
// LOAD STEP
// =====================================================

function loadStep(index) {
    currentStep = index;
    const step = STEPS[index];

    // Update instruction text
    document.getElementById("text").innerText = step.text;

    // Remove previous object
    if (currentObject) {
        markerRoot.remove(currentObject);
        disposeObject(currentObject);
        currentObject = null;
    }

    // Load new object
    if (step.type === "image") {
        loadImage(step.file);
    } else {
        loadModel(step.file);
    }
}

// =====================================================
// LOAD IMAGE (PNG)
// =====================================================

function loadImage(src) {
    textureLoader.load(src, texture => {
        const geometry = new THREE.PlaneGeometry(1.2, 0.8);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true
        });

        currentObject = new THREE.Mesh(geometry, material);
        currentObject.rotation.x = -Math.PI / 2;
        markerRoot.add(currentObject);
    });
}

// =====================================================
// LOAD MODEL (GLB)
// =====================================================

function loadModel(src) {
    gltfLoader.load(src, gltf => {
        currentObject = gltf.scene;
        currentObject.scale.set(0.05, 0.05, 0.05);
        currentObject.rotation.x = -Math.PI / 2;
        markerRoot.add(currentObject);
    });
}

// =====================================================
// CLEANUP (PREVENT MEMORY LEAKS)
// =====================================================

function disposeObject(obj) {
    obj.traverse(child => {
        if (child.isMesh) {
            child.geometry.dispose();
            if (child.material.map) child.material.map.dispose();
            child.material.dispose();
        }
    });
}

// =====================================================
// RENDER LOOP
// =====================================================

function animate() {
    requestAnimationFrame(animate);
    if (arSource.ready) arContext.update(arSource.domElement);
    renderer.render(scene, camera);
}

// =====================================================
// RESIZE HANDLER
// =====================================================

function onResize() {
    arSource.onResizeElement();
    arSource.copyElementSizeTo(renderer.domElement);
    if (arContext.arController) {
        arSource.copyElementSizeTo(arContext.arController.canvas);
    }
}
