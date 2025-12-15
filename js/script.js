/* =====================================================
   STEP CONFIGURATION (TEXT UNCHANGED)
===================================================== */

const STEPS = [
    { type: "model", file: "models/model1a.glb", text: "Step 1: Click the power button and wait for the light to turn green." },
    { type: "image", file: "models/model2.png", text: "Step 2: Select COM port and click connect. If prompted to update firmware click cancel." },
    { type: "image", file: "models/model3.png", text: "Step 3: Select teaching and playback mode." },
    { type: "image", file: "models/model4.png", text: "Step 4: Create a new empty file. It prompted to save the file, hit discard." },
    { type: "image", file: "models/model5.png", text: "Step 5: Select suction cup tool from the attachments." },
    { type: "model", file: "models/model6a.glb", text: "Step 6: Locate button on robot arm." },
    { type: "image", file: "models/model7.png", text: "Step 7: Press button and move arm to any position. Release the button to see entry in the Software." },
    { type: "image", file: "models/model8.png", text: "Step 8: Move it to the pickup position and release the button. Enable SuctionCupOn on the entry in the software." },
    { type: "image", file: "models/model9.png", text: "Step 9: Move it to the drop position and release the button. Disable SuctionCupOn on the entry in the software. Ensure that entries between pick and drop position should have SuctionCupOn" },
    { type: "image", file: "models/model10.png", text: "Step 10: Press start. For repetetion of movement adjust the loop count." },
    { type: "image", file: "models/model11.png", text: "Step 11: To close the program hit exit and then disconnect." },
    { type: "model", file: "models/model12a.glb", text: "Step 12: Power off robot via the power button." }
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

let isImageStep = false;
const IMAGE_SCALE_MIN = 0.6;
const IMAGE_SCALE_MAX = 1.8;


/* ---------- Gesture state ---------- */
let initialPinchDistance = null;
let initialScale = 1;
let initialRotation = 0;
let lastTouchTime = 0;

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

    /* ---- Touch listeners ---- */
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: false });
    renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: false });
    renderer.domElement.addEventListener("touchend", onTouchEnd);

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

    isImageStep = step.type === "image";

    toggleImageZoomUI(isImageStep);

    if (isImageStep) {
        loadImage(step.file);
    } else {
        loadModel(step.file);
    }
}

function toggleImageZoomUI(show) {
    const sliderBox = document.getElementById("image-zoom-container");
    if (sliderBox) {
        sliderBox.style.display = show ? "block" : "none";
    }
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

        // Fixed orientation for images
        currentObject.rotation.x = -0.2;
        currentObject.position.z = 0.2;

        // Default safe scale
        currentObject.scale.set(1, 1, 1);

        markerRoot.add(currentObject);

        setupImageZoomSlider();
    });
}

function setupImageZoomSlider() {
    const slider = document.getElementById("image-zoom");
    if (!slider || !currentObject) return;

    slider.value = 1;

    slider.oninput = () => {
        const scale = THREE.MathUtils.clamp(
            parseFloat(slider.value),
            IMAGE_SCALE_MIN,
            IMAGE_SCALE_MAX
        );

        currentObject.scale.set(scale, scale, scale);
    };
}

function loadModel(src) {
    gltfLoader.load(src, gltf => {
        currentObject = gltf.scene;
        resetTransform();
        currentObject.scale.set(0.001, 0.001, 0.001);
        markerRoot.add(currentObject);
    });
}

function resetTransform() {
    if (!currentObject) return;
    currentObject.position.set(0, 0, 0);
    currentObject.rotation.set(0, 0, 0);
}

/* =====================================================
   GESTURES
===================================================== */

function onTouchStart(e) {
    if (!currentObject || isImageStep) return;

    // Double tap → reset
    const now = Date.now();
    if (now - lastTouchTime < 300) {
        resetTransform();
    }
    lastTouchTime = now;

    if (e.touches.length === 2) {
        e.preventDefault();
        initialPinchDistance = getTouchDistance(e.touches);
        initialScale = currentObject.scale.x;
        initialRotation = currentObject.rotation.y;
    }
}

function onTouchMove(e) {
    if (!currentObject || isImageStep) return;

    // One finger → drag
    if (e.touches.length === 1) {
        e.preventDefault();
        const dx = e.touches[0].movementX || 0;
        const dy = e.touches[0].movementY || 0;
        currentObject.position.x += dx * 0.0005;
        currentObject.position.z -= dy * 0.0005;
    }

    // Two fingers → zoom + rotate
    if (e.touches.length === 2 && initialPinchDistance) {
        e.preventDefault();
        const dist = getTouchDistance(e.touches);
        const scale = THREE.MathUtils.clamp(
            initialScale * (dist / initialPinchDistance),
            0.0005,
            0.01
        );
        currentObject.scale.set(scale, scale, scale);

        const angle = Math.atan2(
            e.touches[1].pageX - e.touches[0].pageX,
            e.touches[1].pageY - e.touches[0].pageY
        );
        currentObject.rotation.y = initialRotation + angle;
    }
}

function onTouchEnd() {
    if (isImageStep) return;
    initialPinchDistance = null;
}

function getTouchDistance(touches) {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
}

/* =====================================================
   CLEANUP
===================================================== */

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
