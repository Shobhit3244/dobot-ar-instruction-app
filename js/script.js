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
let currentModelGroup = null; // Container for the currently visible 3D model
let currentStepIndex = 0;     // Tracks which step we are on (0 to 8)
const loader = new THREE.GLTFLoader(); // Loader for GLTF/GLB files

// ====================================================================
// INITIALIZATION
// ====================================================================

function init() {
    console.log('🚀 Initializing AR Instruction App...');

    // 1. Setup Three.js Scene
    scene = new THREE.Scene();

    // 2. Setup Lighting
    // Ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // Directional light to create depth and shadows on the model
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 2, 3);
    scene.add(directionalLight);

    // 3. Setup Renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true, // Crucial for AR: allows camera feed to show through
        logarithmicDepthBuffer: true
    });
    renderer.setClearColor(new THREE.Color('lightgrey'), 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0px';
    renderer.domElement.style.left = '0px';
    document.body.appendChild(renderer.domElement);

    // 4. Setup AR Source (Webcam)
    arToolkitSource = new THREEx.ArToolkitSource({
        sourceType: 'webcam',
    });

    arToolkitSource.init(function onReady() {
        onResize();
    });

    // Handle window resizing
    window.addEventListener('resize', function () {
        onResize();
    });

    // 5. Setup AR Context
    arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl: 'https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/data/data/camera_para.dat',
        detectionMode: 'mono',
    });

    arToolkitContext.init(function onCompleted() {
        // Copy projection matrix to camera
        camera = new THREE.Camera();
        arToolkitContext.getProjectionMatrix(camera.projectionMatrix);
        scene.add(camera);
    });

    // 6. Setup Marker Controls (Hiro Pattern)
    //  
    // This group will follow the physical marker
    arMarkerRoot = new THREE.Group();
    scene.add(arMarkerRoot);

    let markerControls = new THREEx.ArMarkerControls(arToolkitContext, arMarkerRoot, {
        type: 'pattern',
        patternUrl: 'https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/data/data/patt.hiro',
        changeMatrixMode: 'modelViewMatrix'
    });

    // 7. Add Marker Status Listeners (For UI feedback)
    markerControls.addEventListener('markerFound', () => {
        const statusEl = document.getElementById('ar-status');
        if (statusEl) {
            statusEl.textContent = "Marker Found";
            statusEl.className = "status-ok"; // Green text via CSS
        }
    });

    markerControls.addEventListener('markerLost', () => {
        const statusEl = document.getElementById('ar-status');
        if (statusEl) {
            statusEl.textContent = "Searching...";
            statusEl.className = "status-loading"; // Orange text via CSS
        }
    });

    // 8. Start Application Logic
    setupUI();       // Attach click listeners to buttons
    loadStep(0);     // Load the first model
    animate();       // Start the render loop
}

// ====================================================================
// CORE FUNCTIONS
// ====================================================================

/**
 * Loads the specific model for the given index in the STEPS array.
 * Handles cleanup of previous models to save memory.
 */
function loadStep(index) {
    const stepData = STEPS[index];
    currentStepIndex = index;

    // --- UPDATE UI ---
    // Update instruction text
    document.getElementById('instruction-text').textContent = stepData.text;

    // Update counter (e.g., "1/9")
    document.getElementById('step-counter').textContent = `${index + 1}/${STEPS.length}`;

    // Enable/Disable buttons based on position
    document.getElementById('prev-btn').disabled = (index === 0);
    document.getElementById('next-btn').disabled = (index === STEPS.length - 1);

    // --- CLEANUP OLD MODEL ---
    if (currentModelGroup) {
        arMarkerRoot.remove(currentModelGroup);

        // Deep cleanup to prevent memory leaks (Crucial for WebGL)
        currentModelGroup.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
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

            // --- ADJUSTMENTS ---
            // SCALE: Adjust this if your model looks too big or too small.
            // 0.001 is common if the model was exported in millimeters.
            // 0.1 or 1.0 might be needed depending on your export settings.
            currentModelGroup.scale.set(0.001, 0.001, 0.001);

            // ROTATION: GLTF often exports Y-up, but AR.js markers might need X rotation.
            // Adjust this if your robot is lying sideways.
            currentModelGroup.rotation.x = -Math.PI / 2;

            arMarkerRoot.add(currentModelGroup);
            console.log(`✅ Step ${index + 1} Loaded Successfully`);
        },
        function (xhr) {
            // Optional: Progress indicator could go here
        },
        function (error) {
            console.error('❌ Error loading model:', error);
            document.getElementById('instruction-text').textContent = `Error: Could not load ${stepData.file}. Please check file path.`;
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
            if (currentStepIndex < STEPS.length - 1) {
                loadStep(currentStepIndex + 1);
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentStepIndex > 0) {
                loadStep(currentStepIndex - 1);
            }
        });
    }
}

/**
 * Handles window resizing to keep AR video and canvas aligned.
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

    // Update AR context (finds marker in video)
    if (arToolkitSource.ready) {
        arToolkitContext.update(arToolkitSource.domElement);
    }

    // Render the 3D scene
    renderer.render(scene, camera);
}

// ====================================================================
// START
// ====================================================================

// Initialize the app once the HTML page is fully loaded
window.addEventListener('load', init);