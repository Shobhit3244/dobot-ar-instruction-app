// ====================================================================
// CONFIGURATION
// ====================================================================

// Define your steps here. 
// 'file' must point to the actual location of your GLB files.
const STEPS = [
    {
        id: 1,
        file: 'models/model1.glb',
        text: "Step 1: Click the power button and Wait for light to become green."
    },
    {
        id: 2,
        file: 'models/model2.glb',
        text: "Step 2: In the software select com port and hit connect ."
    },
    {
        id: 3,
        file: 'models/model3.glb',
        text: "Step 3: Select teaching and playback mode."
    },
    {
        id: 4,
        file: 'models/model4.glb',
        text: "Step 4: Click on new file and press discard to create an empty new file."
    },
    {
        id: 5,
        file: 'models/model5.glb',
        text: "Step 5: In tools, Select suction cup."
    },
    {
        id: 6,
        file: 'models/model6.glb',
        text: "Step 6: Come to robot and find the button on top."
    },
    {
        id: 7,
        file: 'models/model7.glb',
        text: "Step 7: Press it and move the robot arm, release to set the position. You can see the entry in software."
    },
    {
        id: 8,
        file: 'models/model8.glb',
        text: "Step 8: In the latest entry go to suction cup and set it to SuctionCupOn."
    },
    {
        id: 9,
        file: 'models/model9.glb',
        text: "Step 9: Move the arm up and to the position you want to drop the cube. Make sure that all the path in between have SuctionCupOn."
    },
    {
        id: 10,
        file: 'models/model10.glb',
        text: "Step 10: Bring it to center and press start. You can adjust the loop multiplier to repeat the motion."
    },
    {
        id: 11,
        file: 'models/model11.glb',
        text: "Step 11: Hit exit then hit disconnect ."
    },
    {
        id: 12,
        file: 'models/model12.glb',
        text: "Step 12: Hit the power button and the machine will go to home position and then turn off."
    }
];

// ====================================================================
// GLOBAL VARIABLES
// ====================================================================

let scene, camera, renderer;
let arToolkitSource, arToolkitContext, arMarkerRoot;
let currentModelGroup = null;
let currentStepIndex = 0;
const loader = new THREE.GLTFLoader();

// ====================================================================
// INITIALIZATION
// ====================================================================

function init() {
    console.log('🚀 Initializing AR Instruction App for 12 Steps...');

    // 1. Setup Three.js Scene and Lighting
    scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 2, 3);
    scene.add(directionalLight);

    // 2. Setup Renderer (CRITICAL FIX: Attach to the canvas)
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        logarithmicDepthBuffer: true,
        // *** FIX: Explicitly target the canvas element ***
        canvas: document.getElementById('arjs-canvas')
    });

    renderer.setClearColor(new THREE.Color('lightgrey'), 0);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 3. Setup AR Source (Webcam)
    arToolkitSource = new THREEx.ArToolkitSource({
        sourceType: 'webcam',
    });

    arToolkitSource.init(function onReady() {
        onResize();
    });

    window.addEventListener('resize', function () {
        onResize();
    });

    // 4. Setup AR Context
    arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl: 'https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/data/data/camera_para.dat',
        detectionMode: 'mono',
    });

    arToolkitContext.init(function onCompleted() {
        camera = new THREE.Camera();
        arToolkitContext.getProjectionMatrix(camera.projectionMatrix);
        scene.add(camera);
    });

    // 5. Setup Marker Controls
    arMarkerRoot = new THREE.Group();
    scene.add(arMarkerRoot);

    let markerControls = new THREEx.ArMarkerControls(arToolkitContext, arMarkerRoot, {
        type: 'pattern',
        patternUrl: 'https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/data/data/patt.hiro', // 
        changeMatrixMode: 'modelViewMatrix'
    });

    // 6. Add Marker Status Listeners
    markerControls.addEventListener('markerFound', () => {
        const statusEl = document.getElementById('ar-status');
        if (statusEl) {
            statusEl.textContent = "Marker Found";
            statusEl.className = "status-ok";
        }
    });

    markerControls.addEventListener('markerLost', () => {
        const statusEl = document.getElementById('ar-status');
        if (statusEl) {
            statusEl.textContent = "Searching...";
            statusEl.className = "status-loading";
        }
    });

    // 7. Start Application Logic
    setupUI();
    loadStep(0);
    animate();
}

// ====================================================================
// CORE FUNCTIONS
// ====================================================================

/**
 * Loads the specific model for the given index in the STEPS array.
 */
function loadStep(index) {
    // Safety check for index boundaries
    if (index < 0 || index >= STEPS.length) return;

    const stepData = STEPS[index];
    currentStepIndex = index;

    // --- UPDATE UI ---
    document.getElementById('instruction-text').textContent = stepData.text;
    document.getElementById('step-counter').textContent = `${index + 1}/${STEPS.length}`;
    document.getElementById('prev-btn').disabled = (index === 0);
    document.getElementById('next-btn').disabled = (index === STEPS.length - 1);

    // --- CLEANUP OLD MODEL ---
    if (currentModelGroup) {
        arMarkerRoot.remove(currentModelGroup);
        currentModelGroup.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
        currentModelGroup = null;
    }

    // --- LOAD NEW MODEL ---
    console.log(`Loading model: ${stepData.file}`);

    loader.load(
        stepData.file,
        function (gltf) {
            currentModelGroup = gltf.scene;

            // --- MODEL ADJUSTMENTS ---
            // Ensure this scale/rotation matches your Dobot model
            currentModelGroup.scale.set(0.001, 0.001, 0.001);
            currentModelGroup.rotation.x = -Math.PI / 2;

            arMarkerRoot.add(currentModelGroup);
            console.log(`✅ Step ${index + 1} Loaded Successfully`);
        },
        function (xhr) {
            // Progress callback (optional)
        },
        function (error) {
            console.error('❌ Error loading model:', error);
            document.getElementById('instruction-text').textContent = `Error: Could not load ${stepData.file}. Check browser console.`;
        }
    );
}

/**
 * Attaches event listeners to the Previous and Next buttons.
 */
function setupUI() {
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            loadStep(currentStepIndex + 1);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            loadStep(currentStepIndex - 1);
        });
    }
}

/**
 * Handles window resizing.
 */
function onResize() {
    arToolkitSource.onResizeElement();
    arToolkitSource.copyElementSizeTo(renderer.domElement);
    if (arToolkitContext.arController !== null) {
        arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
    }
}

/**
 * Main Render Loop
 */
function animate() {
    requestAnimationFrame(animate);

    if (arToolkitSource.ready) {
        arToolkitContext.update(arToolkitSource.domElement);
    }

    renderer.render(scene, camera);
}

// ====================================================================
// START
// ====================================================================

// Initialize the app once the HTML page is fully loaded
window.addEventListener('load', init);