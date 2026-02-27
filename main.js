import * as THREE from 'three';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

// 1. Setup 3D Scene
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 3);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// AI Core (Glowing Sphere)
const coreGeometry = new THREE.SphereGeometry(0.7, 32, 32);
const coreMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x00ffff, 
  emissive: 0x00ffff, 
  emissiveIntensity: 1 
});
const aiCore = new THREE.Mesh(coreGeometry, coreMaterial);
aiCore.position.set(0, 2, -5);
scene.add(aiCore);

// 2. Offline Android File Scanner
const scanBtn = document.getElementById('scan-btn');

scanBtn.addEventListener('click', async () => {
  scanBtn.textContent = "Scanning...";
  try {
    const result = await Filesystem.readdir({
      path: '',
      directory: Directory.Documents, // Or Directory.Data
    });

    const videoFiles = result.files
      .filter(file => file.name.endsWith('.mp4'))
      .map(file => Capacitor.convertFileSrc(file.uri));

    if (videoFiles.length > 0) {
      scanBtn.style.display = 'none'; // Hide button
      createHoloVideo(videoFiles[0], -3, 0, -2); // Load the first video found
    } else {
      scanBtn.textContent = "No MP4s Found";
    }
  } catch (error) {
    console.error("Scan failed:", error);
    scanBtn.textContent = "Scan Failed";
  }
});

// 3. Create 3D Video Player
function createHoloVideo(srcUri, x, y, z) {
  // Create an invisible HTML5 video element in memory
  const video = document.createElement('video');
  video.src = srcUri;
  video.crossOrigin = "anonymous";
  video.loop = true;
  video.muted = false;
  video.play();

  // Paint the video onto a 3D texture
  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.PlaneGeometry(6, 3.5);
  const material = new THREE.MeshBasicMaterial({ map: videoTexture });
  
  const screen = new THREE.Mesh(geometry, material);
  screen.position.set(x, y, z);
  scene.add(screen);
}

// 4. Animation Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  
  // Make the AI core breathe
  const elapsedTime = clock.getElapsedTime();
  aiCore.scale.setScalar(1 + Math.sin(elapsedTime * 2) * 0.1);

  renderer.render(scene, camera);
}

animate();

// Handle screen resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
