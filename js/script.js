/* =====================================================
   STEP CONFIGURATION (TEXT UNCHANGED)
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
   INIT
===================================================== */

window.addEventListener("load", initAR);

function initAR() {
    scene = new THREE.Scene();

    arCamera = new THREE.Camera();
    scene.add(arCamera);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(new THREE.Color("lightgrey"), 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    const arContainer = document.getElementById("ar-container");
    if (!arContainer) {
        console.error("❌ #ar-container not found in DOM");
        return;
    }
    arContainer.appendChild(renderer.domElement);


    arToolkitSource = new THREEx.ArToolkitSource({ sourceType: "webcam" });
    arToolkitSource.init(() => {
        onResize();
        hideLoader();
    });

    window.addEventListener("resize", onResize);

    arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl:
            "https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/data/data/camera_para.dat",
        detectionMode: "mono"
    });

    arToolkitContext.init(() => {
        arCamera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    });

    markerRoot = new THREE.Group();
    scene.add(markerRoot);

    new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
        type: "pattern",
        patternUrl:
            "https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/data/data/patt.hiro"
    });

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));

    const d = new THREE.DirectionalLight(0xffffff, 0.6);
    d.position.set(1, 1, 1);
    scene.add(d);

    document.getElementById("next").onclick = () =>
        currentStep < STEPS.length - 1 && loadStep(currentStep + 1);

    document.getElementById("prev").onclick = () =>
        currentStep > 0 && loadStep(currentStep - 1);

    loadStep(0);
    animate();
}

/* =====================================================
   STEP LOADING
===================================================== */

function loadStep(index) {
    currentStep = index;
    const step = STEPS[index];
    document.getElementById("text").innerText = step.text;

    if (currentObject) {
        markerRoot.remove(currentObject);
        dispose(currentObject);
    }

    step.type === "image"
        ? loadImage(step.file)
        : loadModel(step.file);
}

function loadImage(src) {
    textureLoader.load(src, tex => {
        const geo = new THREE.PlaneGeometry(1.2, 0.8);
        const mat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            side: THREE.DoubleSide
        });
        currentObject = new THREE.Mesh(geo, mat);
        currentObject.rotation.y = 0;
        currentObject.rotation.x = -0.2; // ~11°
        currentObject.position.z = 0.2;
        markerRoot.add(currentObject);
    });
}

function loadModel(src) {
    gltfLoader.load(src, gltf => {
        currentObject = gltf.scene;
        currentObject.scale.set(0.001, 0.001, 0.001);
        currentObject.rotation.x = Math.PI / 2;
        markerRoot.add(currentObject);
    });
}

function dispose(obj) {
    obj.traverse(c => {
        if (c.isMesh) {
            c.geometry.dispose();
            c.material.map?.dispose();
            c.material.dispose();
        }
    });
}

/* =====================================================
   LOOP & RESIZE
===================================================== */

function animate() {
    requestAnimationFrame(animate);
    if (arToolkitSource.ready)
        arToolkitContext.update(arToolkitSource.domElement);
    renderer.render(scene, arCamera);
}

function onResize() {
    arToolkitSource.onResizeElement();
    arToolkitSource.copyElementSizeTo(renderer.domElement);
    if (arToolkitContext.arController)
        arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
}

function hideLoader() {
    const l = document.getElementById("loading-screen");
    l.style.opacity = "0";
    setTimeout(() => l.style.display = "none", 400);
}
