# 🤖 Dobot Magician WebAR Instructional Guide

<div align="center">

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-WebAR-orange.svg)
![Mobile](https://img.shields.io/badge/mobile-iOS%20%7C%20Android-brightgreen.svg)

**A step-by-step augmented reality guide for visualizing the Dobot Magician's Pick and Place operation.**

*This browser-based Augmented Reality application displays a 3D model of the Dobot Magician anchored to a marker, allowing users to cycle through 12 precise operational poses using simple on-screen navigation buttons.*

[✨ Features](#-features) • [🚀 Quick Start](#-quick-start) • [🛠️ Tech Stack](#️-tech-stack) • [📖 Documentation](#-documentation)

</div>

---

## 🎯 What Is This?

This project transforms a mobile device into an interactive instructional tool for robotics training. It is designed to clearly demonstrate complex robotic movements, such as a Pick and Place cycle, by visualizing each phase in 3D augmented reality.

**Key Functionality:**
- 📱 **Mobile Viewing:** Point your phone at a printed marker.
- 🦾 **Model Visualization:** A 3D Dobot Magician model appears, anchored precisely to the marker.
- ➡️ **Step-by-Step Navigation:** Use "Previous Step" and "Next Step" buttons to manually advance through **12 distinct positions** that illustrate the entire operation.

---

## ✨ Features

### 📖 Step-Cycling Navigation

| Control | Icon | Description | Use Case |
|------|------|-------------|----------|
| **Next Step** | ➡️ | Advance to the next pre-defined robot pose (e.g., approach to descend) | Demonstrating forward motion in a sequence |
| **Previous Step** | ⬅️ | Return to the preceding robot pose | Reviewing previous steps, checking alignment |

### 🔥 Core Capabilities

- **🎨 Marker-Based Tracking** - Instant AR anchoring using the standard Hiro pattern. 
- **📦 12 Distinct Steps** - Contains 12 separately optimized 3D models (`model1.glb` - `model12.glb`), each representing a specific phase of the operation.
- **🌐 Zero Install** - Runs entirely in the browser (WebAR), no app store downloads.
- **📱 Cross-Platform** - Works on modern iOS (Safari) and Android (Chrome) devices.
- **🎨 Instructional UI** - Clean interface displaying the current step number and description alongside the navigation controls.

---

## 🚀 Quick Start

### Prerequisites

```bash
# Check if you have Node.js installed
node --version
npm --version
```

Don't have Node.js? [Download it here](https://nodejs.org/) ⬇️

### 5-Minute Setup

```bash
# 1️⃣ Clone the repository or set up your local files
cd your-project-folder

# 2️⃣ Install simple HTTP server (Required for camera access)
npm install -g http-server

# 3️⃣ Start the server
http-server -p 8080

# 4️⃣ Note your local IP (shown in terminal)
# Example: [http://192.168.1.100:8080](http://192.168.1.100:8080)
```

### 📱 Mobile Access

The camera feed generally requires HTTPS, so accessing the app on a mobile device requires tunneling or a secure environment.

**Recommended Method (HTTPS Tunnel)**

```bash
# Install ngrok (one-time)
# Download from [https://ngrok.com/download](https://ngrok.com/download)

# Create HTTPS tunnel
ngrok http 8080

# Use the https:// URL on your mobile device
# Example: [https://abc123.ngrok.io](https://abc123.ngrok.io)
```

### 🖨️ Print the Marker

1.  Download a standard Hiro marker image (e.g., from AR.js documentation).
2.  Print on white A4/Letter paper.
3.  Size: At least 10×10cm (larger is better for stable tracking).
4.  Place on a flat surface with good lighting.

-----

## 🎮 How to Use

### Step-by-Step Guide

```
1️⃣ Open AR app on mobile → Camera activates
2️⃣ Grant camera permission
3️⃣ Point camera at printed marker → 3D model of Step 1 appears! 🎉
4️⃣ Read the instruction text at the top of the screen.
5️⃣ Tap [Next] to load model2.glb and proceed to the next position. ➡️
6️⃣ Tap [Previous] to load model1.glb and review the last position. ⬅️
```

-----

## 🛠️ Tech Stack

| Technology | Purpose |
| :---: | :--- |
| **Three.js** | 3D rendering and scene management |
| **AR.js** | Marker-based AR tracking |
| **HTML/CSS/JavaScript** | UI structure, styling, and step control logic |

### Architecture Overview

```
┌─────────────────────────────────────────┐
│          Mobile Browser (Client)         │
├─────────────────────────────────────────┤
│  📹 Camera Feed → AR.js Marker Tracking │
│           ↓                              │
│  📁 Model Loader → Loads modelX.glb      │
│           ↓                              │
│  🎨 Three.js → Renders current 3D Pose   │
│           ↓                              │
│  📱 WebGL Canvas → Display               │
└─────────────────────────────────────────┘
```

-----

## 📂 Project Structure

```
dobot-ar-instruction/
│
├── 📄 index.html              # Main application file (HTML structure & setup)
├── 🖼️ marker.png               # Hiro AR marker (print this!)
├── 📖 README.md               # You are here
│
├── 📁 models/
│   ├── model1.glb            # Step 1 model
│   ├── model2.glb            # Step 2 model
│   └── ... model12.glb       # Step 12 model
│
├── 📁 js/
│   └── script.js             # Core AR initialization and 12-step navigation logic
│
└── 📁 css/
    └── style.css             # UI styling for buttons and instructions
```

-----

## 🎨 Customization Guide

### 🔧 Adjust Model Size and Orientation

The model scale and rotation are defined in the `loadStep()` function within `js/script.js`.

```javascript
// In js/script.js, inside loadStep(index):
currentModelGroup.scale.set(0.001, 0.001, 0.001); // Scale adjustment
currentModelGroup.rotation.x = -Math.PI / 2;     // Rotation adjustment
```

You may need to change `0.001` to values like `0.1` or `1.0` depending on how your 3D models were exported.

### 📜 Update Step Instructions

Modify the `STEPS` array at the top of `js/script.js` to change the instruction text or link to different model files.

```javascript
// In js/script.js:
const STEPS = [
    { id: 1, file: 'models/model1.glb', text: "Your custom instruction for step 1." },
    // ...
];
```

-----

## 🐛 Troubleshooting

### Common Issues & Solutions

\<details\>
\<summary\>\<b\>❌ Cannot see Camera or Model (Blank Screen)\</b\>\</summary\>

**Problem:** Only the UI buttons are visible.

**Solution:**

1.  **Check Canvas in HTML:** Ensure `index.html` has `<canvas id="arjs-canvas"></canvas>` in the `<body>`.
2.  **Check Console:** Look for errors loading the script (`js/script.js`) or the 3D models (`models/modelX.glb`).
3.  **Check Camera Permission:** The browser must grant access to the camera.

\</details\>

\<details\>
\<summary\>\<b\>❌ Model Not Appearing After Finding Marker\</b\>\</summary\>

**Problem:** AR Status shows "Found" but the model is invisible.

**Solution:**

1.  **Check Model Path:** Verify that the model files (`models/model1.glb`, etc.) are correctly named and located.
2.  **Check Scale/Rotation:** If the model is too small or rotated incorrectly, it may be off-screen. Adjust the scale and rotation settings in `js/script.js`.

\</details\>

\<details\>
\<summary\>\<b\>❌ Jittery/Flickering Model\</b\>\</summary\>

**Problem:** Model jumps around, not stable.

**Solution:**

1.  **Print a larger marker** (full A4 page).
2.  **Ensure good, even lighting** (avoid shadows).
3.  **Keep the marker flat.**

\</details\>

-----

## 🎓 Educational Use Cases

  - 🏫 **Robotics Courses** - Visualizing specific kinematic poses.
  - 🏭 **Industry Training** - Detailed instruction for operators on machine cycles.
  - 👨‍🎓 **Student Projects** - AR/robotics portfolio piece demonstrating instructional design.

-----

## 📜 License

This project is licensed under the MIT License - see [LICENSE](https://www.google.com/search?q=LICENSE) file for details.

-----

## 🙏 Acknowledgments

  - **AR.js Team** - For accessible WebAR technology.
  - **Three.js Community** - For the powerful 3D rendering engine.

-----

\<div align="center"\>

**Made with ❤️ for robotics instruction**

⭐ **Star this repo if it helped you\!** ⭐

\</div\>

```
```