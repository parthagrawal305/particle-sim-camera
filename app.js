import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class ParticleApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.points = null;
        this.material = null;
        this.geometry = null;
        this.controls = null;
        
        // State
        this.particleCount = 15000;
        this.baseColor = new THREE.Color(0xa29bfe);
        this.targetScale = 1.0;
        this.currentScale = 1.0;
        this.scatterFactor = 0; // Controlled by fist clench
        this.initialPositions = []; // Store original shape positions
        this.velocities = []; // For fireworks
        this.isFirework = false;

        // Bindings
        this.initThree();
        this.initListeners();
        this.animate();
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x050505, 0.02);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 30;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 1.0;

        // Default Shape
        this.loadShape('saturn');
    }

    initListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        document.getElementById('colorPicker').addEventListener('input', (e) => {
            this.baseColor.set(e.target.value);
            if (this.material) this.material.color.set(this.baseColor);
        });

        document.getElementById('imageUpload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => this.processImageToParticles(event.target.result);
                reader.readAsDataURL(file);
            }
        });
    }

    // --- Shape Generators ---

    loadShape(type) {
        this.isFirework = (type === 'fireworks');
        
        if (this.points) {
            this.scene.remove(this.points);
            if (this.geometry) this.geometry.dispose();
        }

        let positions = [];

        if (type === 'amphora') {
            // Try to load local image, fallback to text generation if fails
            const img = new Image();
            img.src = 'logo.png'; // EXPECTS A LOCAL FILE NAMED logo.png
            img.onload = () => this.processImageToParticles(img.src);
            img.onerror = () => this.createParticlesFromText("Amphora");
            return; 
        }
        
        if (type === 'heart') {
            for (let i = 0; i < this.particleCount; i++) {
                const t = Math.random() * Math.PI * 2;
                const r = Math.random(); 
                // Heart equation
                const x = 16 * Math.pow(Math.sin(t), 3);
                const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
                const z = (Math.random() - 0.5) * 5; // Thickness
                positions.push(x * 0.5, y * 0.5, z);
            }
        }
        else if (type === 'saturn') {
            // Planet
            for (let i = 0; i < this.particleCount * 0.4; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = 8;
                positions.push(
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi)
                );
            }
            // Rings
            for (let i = 0; i < this.particleCount * 0.6; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 12 + Math.random() * 10;
                positions.push(
                    Math.cos(angle) * dist,
                    (Math.random() - 0.5) * 1,
                    Math.sin(angle) * dist
                );
            }
        }
        else if (type === 'flower') {
            for (let i = 0; i < this.particleCount; i++) {
                const u = Math.random() * Math.PI * 2;
                const v = Math.random() * Math.PI;
                // Rose/Flower-like parametric
                const r = 10 * Math.sin(3 * u) * Math.sin(v); 
                positions.push(
                    r * Math.sin(u) * Math.cos(v),
                    r * Math.cos(u) * Math.cos(v),
                    r * Math.sin(v)
                );
            }
        }
        else if (type === 'buddha') {
            // Simulating a meditating figure with stacked primitives
            // Head
            this.addSphere(positions, 0, 8, 0, 3, 2000);
            // Body
            this.addSphere(positions, 0, 0, 0, 6, 5000);
            // Base/Legs (Flattened sphere)
            for(let i=0; i<4000; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = 8;
                positions.push(
                    r * Math.sin(phi) * Math.cos(theta),
                    (r * Math.sin(phi) * Math.sin(theta) * 0.4) - 5,
                    r * Math.cos(phi)
                );
            }
        }
        else if (type === 'fireworks') {
            this.velocities = [];
            for (let i = 0; i < this.particleCount; i++) {
                positions.push(0, 0, 0);
                // Store random velocities for explosion
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const speed = 0.2 + Math.random() * 0.5;
                this.velocities.push({
                    x: speed * Math.sin(phi) * Math.cos(theta),
                    y: speed * Math.sin(phi) * Math.sin(theta),
                    z: speed * Math.cos(phi)
                });
            }
        }

        this.createSystem(positions);
    }

    addSphere(arr, cx, cy, cz, radius, count) {
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            arr.push(
                cx + radius * Math.sin(phi) * Math.cos(theta),
                cy + radius * Math.sin(phi) * Math.sin(theta),
                cz + radius * Math.cos(phi)
            );
        }
    }

    createParticlesFromText(text) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 500;
        canvas.height = 200;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 500, 200);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 250, 100);
        this.processCanvasToParticles(canvas);
    }

    processImageToParticles(imgSrc) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            // Resize to manageable amount of pixels
            const aspect = img.width / img.height;
            const w = 200;
            const h = 200 / aspect;
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);
            this.processCanvasToParticles(canvas);
        };
        img.src = imgSrc;
    }

    processCanvasToParticles(canvas) {
        const ctx = canvas.getContext('2d');
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const positions = [];
        
        // Scan pixels
        for(let y = 0; y < canvas.height; y++) {
            for(let x = 0; x < canvas.width; x++) {
                const i = (y * canvas.width + x) * 4;
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];
                // Brightness check
                if (r > 50 || g > 50 || b > 50) {
                    // Center coordinates
                    const pX = (x - canvas.width/2) * 0.2;
                    const pY = -(y - canvas.height/2) * 0.2; // Flip Y
                    const pZ = (Math.random() - 0.5) * 1;
                    positions.push(pX, pY, pZ);
                }
            }
        }
        this.createSystem(positions);
    }

    createSystem(positions) {
        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        // Save initial state for restoration/scattering
        this.initialPositions = [...positions];

        // Create a soft glowing texture
        const sprite = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png');

        this.material = new THREE.PointsMaterial({
            color: this.baseColor,
            size: 0.5,
            map: sprite,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.points = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.points);
    }

    updateParticles() {
        if (!this.points) return;
        
        const positions = this.points.geometry.attributes.position.array;

        // Smoothly interpolate current scale to target scale (Hand distance)
        this.currentScale += (this.targetScale - this.currentScale) * 0.1;

        if (this.isFirework) {
            for(let i=0; i<positions.length; i+=3) {
                const vIndex = i/3;
                if(this.velocities[vIndex]) {
                    positions[i] += this.velocities[vIndex].x * this.currentScale;
                    positions[i+1] += this.velocities[vIndex].y * this.currentScale;
                    positions[i+2] += this.velocities[vIndex].z * this.currentScale;
                    
                    // Gravity
                    this.velocities[vIndex].y -= 0.005;

                    // Reset if too low
                    if(positions[i+1] < -20) {
                        positions[i] = 0; 
                        positions[i+1] = 0; 
                        positions[i+2] = 0;
                        this.velocities[vIndex].y = 0.5 + Math.random();
                    }
                }
            }
        } else {
            // Standard Shape logic with Hand Interactions
            for (let i = 0; i < positions.length; i += 3) {
                // 1. Get Base Position
                let ix = this.initialPositions[i];
                let iy = this.initialPositions[i+1];
                let iz = this.initialPositions[i+2];

                // 2. Apply Scaling (Hands moving apart)
                ix *= this.currentScale;
                iy *= this.currentScale;
                iz *= this.currentScale;

                // 3. Apply Scattering (Hand Fists/Tension)
                // If scatterFactor > 0, add noise
                if (this.scatterFactor > 0.01) {
                    ix += (Math.random() - 0.5) * this.scatterFactor * 10;
                    iy += (Math.random() - 0.5) * this.scatterFactor * 10;
                    iz += (Math.random() - 0.5) * this.scatterFactor * 10;
                }

                // Apply
                positions[i] = ix;
                positions[i+1] = iy;
                positions[i+2] = iz;
            }
        }

        this.points.geometry.attributes.position.needsUpdate = true;
        this.controls.update();
    }

    setHandData(distance, openness) {
        // Distance: 0 (close) to 1 (far) -> Maps to Scale 0.5 to 2.5
        // Openness: 0 (fist) to 1 (open) -> Maps to Scatter (inverse)
        
        const minScale = 0.5;
        const maxScale = 2.5;
        
        // Map hand distance to scale
        this.targetScale = minScale + (distance * (maxScale - minScale));

        // Map hand closing (fist) to Scatter
        // If Openness is low (fist), scatter is high
        this.scatterFactor = Math.max(0, 1.0 - openness);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.updateParticles();
        this.renderer.render(this.scene, this.camera);
    }
}

const app = new ParticleApp();
// Make app global for HTML buttons
window.app = app;


// --- MediaPipe Implementation ---
function initHandTracking() {
    const videoElement = document.getElementById('video-feed');
    
    if (!videoElement) {
        console.error('Video element not found');
        setTimeout(initHandTracking, 100);
        return;
    }

    // Wait for MediaPipe classes to be available
    if (typeof Hands === 'undefined' || typeof Camera === 'undefined') {
        console.log('Waiting for MediaPipe to load...');
        setTimeout(initHandTracking, 100);
        return;
    }

    console.log('Initializing camera...');

    function onResults(results) {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.style.opacity = 0;

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks;

            // 1. Calculate Hand Expansion (Scale) - Logic: Distance between two hands
            let handDistance = 0.5; // Default if only 1 hand
            let totalOpenness = 0;

            if (landmarks.length === 2) {
                const hand1 = landmarks[0][9]; // Middle finger MCP
                const hand2 = landmarks[1][9];
                
                // Simple Euclidean distance (x,y only roughly)
                const dx = hand1.x - hand2.x;
                const dy = hand1.y - hand2.y;
                const rawDist = Math.sqrt(dx*dx + dy*dy);
                
                // Normalize (approximate arm span is like 0.8 in camera view)
                handDistance = Math.min(Math.max((rawDist - 0.1) * 2, 0), 1);
            } 

            // 2. Calculate Hand Tension/Closing (Fist detection)
            // Logic: Average distance of fingertips to wrist
            let handCount = 0;
            landmarks.forEach(hand => {
                const wrist = hand[0];
                const tips = [8, 12, 16, 20]; // Finger tips
                let avgDist = 0;
                tips.forEach(tipIdx => {
                    const tip = hand[tipIdx];
                    const d = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
                    avgDist += d;
                });
                avgDist /= 4;
                
                // Thresholds: ~0.15 is fist, ~0.35 is open
                let openness = (avgDist - 0.15) / (0.35 - 0.15);
                openness = Math.max(0, Math.min(1, openness));
                totalOpenness += openness;
                handCount++;
            });

            if (handCount > 0) totalOpenness /= handCount;
            else totalOpenness = 1; // Default open

            // If only one hand, keep scale stable
            if (landmarks.length < 2) handDistance = 0.5;

            app.setHandData(handDistance, totalOpenness);
        }
    }

    const hands = new Hands({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }});

    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({image: videoElement});
        },
        width: 640,
        height: 480
    });

    console.log('Starting camera...');
    camera.start().then(() => {
        console.log('Camera started successfully');
        const loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.style.opacity = 0;
    }).catch((error) => {
        console.error('Camera access error:', error);
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.textContent = 'Camera access denied. Please allow camera access and refresh.';
            loadingEl.style.color = '#ff6b6b';
        }
    });
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHandTracking);
} else {
    // DOM is already ready
    initHandTracking();
}
