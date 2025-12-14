// ====================================================================
// CONFIGURATION
// ====================================================================

// Define your steps here. 
// 'file' must point to the actual location of your GLB files.
const STEPS = [
    {
        id: 1,
        file: 'models/step1.glb',
        text: "Step 1: Home Position - The Dobot starts at its defined home coordinates (X:200, Y:0, Z:0)."
    },
    {
        id: 2,
        file: 'models/step2.glb',
        text: "Step 2: Approach - The arm moves horizontally to the target object's location."
    },
    {
        id: 3,
        file: 'models/step3.glb',
        text: "Step 3: Descend - The Z-axis lowers the end-effector towards the object."
    },
    {
        id: 4,
        file: 'models/step4.glb',
        text: "Step 4: Grip - The pneumatic gripper activates (or suction cup) to grab the object."
    },
    {
        id: 5,
        file: 'models/step5.glb',
        text: "Step 5: Lift - The arm raises the object vertically to clear obstacles."
    },
    {
        id: 6,
        file: 'models/step6.glb',
        text: "Step 6: Transport - The arm rotates the base to move the object to the destination."
    },
    {
        id: 7,
        file: 'models/step7.glb',
        text: "Step 7: Lower - The arm lowers the object at the drop-off coordinates."
    },
    {
        id: 8,
        file: 'models/step8.glb',
        text: "Step 8: Release - The gripper deactivates, releasing the object."
    },
    {
        id: 9,
        file: 'models/step9.glb',
        text: "Step 9: Return - The arm returns to the safe Home position."
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