import * as THREE from 'three';
import { SVGLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/SVGLoader.js';

// Vector2 helper class with p5.js-like methods
class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    mult(n) {
        this.x *= n;
        this.y *= n;
        return this;
    }

    div(n) {
        if (n !== 0) {
            this.x /= n;
            this.y /= n;
        }
        return this;
    }

    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    setMag(len) {
        const m = this.mag();
        if (m > 0) {
            this.div(m).mult(len);
        }
        return this;
    }

    limit(max) {
        const m = this.mag();
        if (m > max) {
            this.setMag(max);
        }
        return this;
    }

    copy() {
        return new Vector2(this.x, this.y);
    }

    static sub(v1, v2) {
        return new Vector2(v1.x - v2.x, v1.y - v2.y);
    }

    static dist(v1, v2) {
        const dx = v1.x - v2.x;
        const dy = v1.y - v2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// Simple noise function (Perlin-like approximation)
class SimplexNoise {
    constructor() {
        this.perm = [];
        for (let i = 0; i < 512; i++) {
            this.perm[i] = Math.floor(Math.random() * 256);
        }
    }

    noise(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        
        x -= Math.floor(x);
        y -= Math.floor(y);
        
        const u = this.fade(x);
        const v = this.fade(y);
        
        const a = this.perm[X] + Y;
        const b = this.perm[X + 1] + Y;
        
        return this.lerp(v,
            this.lerp(u, this.grad(this.perm[a], x, y), this.grad(this.perm[b], x - 1, y)),
            this.lerp(u, this.grad(this.perm[a + 1], x, y - 1), this.grad(this.perm[b + 1], x - 1, y - 1))
        );
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(t, a, b) {
        return a + t * (b - a);
    }

    grad(hash, x, y) {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
    }
}

const noiseGenerator = new SimplexNoise();

// Boid class
class Boid {
    constructor(x, y, width, height, M, startFromTop = true) {
        // Store target position (where cube should end up)
        this.targetPosition = new Vector2(x, y);
        
        // Start position depends on whether it comes from top or bottom
        const startY = startFromTop ? -200 : height + 200;
        this.position = new Vector2(x, startY);
        
        this.velocity = new Vector2(0, Math.random() * 2 - 1);
        this.velocity.setMag(Math.random() * 2 + 1);
        this.acceleration = new Vector2();
        this.maxForce = 0.2;
        this.maxSpeed = 4;
        this.size = Math.random() > 0.8 ? (Math.random() * 150 + 150) * M : (Math.random() * 30 + 50) * M;
        
        this.width = width;
        this.height = height;
        
        // Animation properties
        this.isAnimatingIn = false;
        this.animationComplete = false;
        this.animationStartTime = null;
        this.animationDelay = Math.random() * 300; // Stagger animation start (0-300ms)
        this.startFromTop = startFromTop;
        
        // Store initial position for consistent rotation offset (won't change with movement)
        this.rotationOffset = (x * 0.137 + y * 0.359) / 30;

        // Create Three.js mesh
        const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
        
        // Get initial theme for color
        const theme = (typeof window.getCurrentTheme === 'function') ? window.getCurrentTheme() : 'dark';
        const initialColor = theme === 'light' ? 0xffffff : 0x333333;
        
        const material = new THREE.MeshStandardMaterial({ 
            color: initialColor,
            roughness: 0.7,
            metalness: 0.3
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
    }

    edges() {
        if (this.position.x > this.width) this.position.x = 0;
        if (this.position.x < 0) this.position.x = this.width;
        if (this.position.y > this.height) this.position.y = 0;
        if (this.position.y < 0) this.position.y = this.height;
    }

    flock(boids) {
        let alignment = this.align(boids);
        let cohesion = this.cohere(boids);
        let separation = this.separate(boids);

        // Adjusting weights for behaviors
        alignment.mult(1.0);
        cohesion.mult(1.0);
        separation.mult(1.5);

        // Uncomment these to enable flocking behavior
        // this.acceleration.add(alignment);
        // this.acceleration.add(cohesion);
        // this.acceleration.add(separation);
    }

    align(boids) {
        let perceptionRadius = 50;
        let steering = new Vector2();
        let total = 0;
        for (let other of boids) {
            let d = Vector2.dist(this.position, other.position);
            if (other !== this && d < perceptionRadius) {
                steering.add(other.velocity);
                total++;
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.setMag(this.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    cohere(boids) {
        let perceptionRadius = 50;
        let steering = new Vector2();
        let total = 0;
        for (let other of boids) {
            let d = Vector2.dist(this.position, other.position);
            if (other !== this && d < perceptionRadius) {
                steering.add(other.position);
                total++;
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.sub(this.position);
            steering.setMag(this.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    separate(boids) {
        let perceptionRadius = 30;
        let steering = new Vector2();
        let total = 0;
        for (let other of boids) {
            let d = Vector2.dist(this.position, other.position);
            if (other !== this && d < perceptionRadius) {
                let diff = Vector2.sub(this.position, other.position);
                diff.div(d);
                steering.add(diff);
                total++;
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.setMag(this.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    update() {
        this.position.add(this.velocity);
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
        this.acceleration.mult(0);
    }

    animateIn(currentTime) {
        // Early return if animation already complete
        if (this.animationComplete) return;
        
        // Only animate if logo has loaded
        if (!logoLoaded || !cubeAnimationStartTime) return;
        
        // Check if enough time has passed for this cube's delay
        if (!this.isAnimatingIn) {
            const timeSinceLogoLoaded = currentTime - cubeAnimationStartTime;
            if (timeSinceLogoLoaded >= this.animationDelay) {
                this.animationStartTime = currentTime;
                this.isAnimatingIn = true;
            } else {
                // Still waiting for delay, keep at start position
                return;
            }
        }
        
        // Calculate animation progress (0 to 1)
        const elapsed = currentTime - this.animationStartTime;
        let progress = Math.min(elapsed / cubeAnimationDuration, 1);
        
        // Easing function (ease-out cubic)
        progress = 1 - Math.pow(1 - progress, 3);
        
        // Interpolate from start position to target position
        const startY = this.startFromTop ? -200 : this.height + 200;
        const currentY = startY + (this.targetPosition.y - startY) * progress;
        
        this.position.x = this.targetPosition.x;
        this.position.y = currentY;
        
        // Fade in opacity as it animates
        const opacity = Math.min(progress * 1.2, 1); // Slightly faster fade-in
        this.mesh.material.opacity = opacity;
        this.mesh.material.transparent = true;
        
        // If animation is complete, snap to target position and mark as complete
        if (progress >= 1) {
            this.position.x = this.targetPosition.x;
            this.position.y = this.targetPosition.y;
            this.mesh.material.opacity = 1;
            this.isAnimatingIn = false;
            this.animationComplete = true;
            return; // Exit early after completion
        }
    }

    show() {
        // Update mesh position
        this.mesh.position.x = this.position.x;
        this.mesh.position.y = this.position.y;
        this.mesh.position.z = 100;

        // Slow rotation based on time - each cube rotates uniquely but consistently
        const TWO_PI = Math.PI * 2;
        
        // Use stored rotation offset so movement doesn't affect rotation
        // Very slow rotation on multiple axes, plus scroll-based rotation offset
        this.mesh.rotation.x = TWO_PI * Math.sin(this.rotationOffset + time / 1000) * 0.15 + scrollRotationOffset;
        // this.mesh.rotation.y = TWO_PI * Math.cos(this.rotationOffset * 1.3 + time / 2500) * 0.1;
        // this.mesh.rotation.z = TWO_PI * Math.sin(this.rotationOffset * 0.7 + time / 3000) * 0.08;

        // Color based on noise - adjust for theme
        const noiseValue = noiseGenerator.noise(this.position.x / 100, this.position.y / 100);
        let brightness;
        
        // Get current theme
        const theme = (typeof window.getCurrentTheme === 'function') ? window.getCurrentTheme() : 'dark';
        
        if (theme === 'light') {
            // Much whiter cubes for light mode (very bright grayscale)
            brightness = 200 + 15 * (noiseValue * 0.5 + 0.5);
        } else {
            // Darker cubes for dark mode
            brightness = 15 * (noiseValue * 0.5 + 0.5);
        }
        
        const color = new THREE.Color().setRGB(brightness / 255, brightness / 255, brightness / 255);
        this.mesh.material.color = color;
    }
}

// Main scene setup
let scene, camera, renderer;
let boids = [];
let moveFrames = 0;
let dir = 0;
let currentTheme = 'dark';
let time = 0;
let scrollRotationOffset = 0; // Persistent rotation offset from scroll
let scrollRotationSpeed = 0; // Temporary speed boost from scroll
let logoLoaded = false; // Track if logo has loaded
let cubeAnimationStartTime = null; // When cube animation started
let cubeAnimationDuration = 2000; // 2 seconds animation duration

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const DIM = Math.min(WIDTH, HEIGHT);
const M = WIDTH > HEIGHT ? DIM / 1000 : DIM / 500;

function init() {
    // Scene
    scene = new THREE.Scene();
    
    // Set initial theme
    if (typeof window.getCurrentTheme === 'function') {
        currentTheme = window.getCurrentTheme();
    }
    scene.background = new THREE.Color(currentTheme === 'light' ? 0xffffff : 0x000000);

    // Camera - Perspective for distorted view
    camera = new THREE.PerspectiveCamera(
        65,                    // field of view
        WIDTH*1.2 / HEIGHT,        // aspect ratio
        0.1,                   // near clipping plane
        10000                  // far clipping plane
    );
    camera.position.set(WIDTH / 2, HEIGHT / 2, 800);
    camera.lookAt(WIDTH / 2, HEIGHT / 2, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap; // Better quality shadows
    
    // Try to append to background-container, fallback to canvas-container
    const container = document.getElementById('background-container') || document.getElementById('canvas-container');
    if (container) {
        container.appendChild(renderer.domElement);
    }

    // Lighting - setup with subtle blue and pink tints
    // Adjust ambient light based on theme for better shadow visibility
    // Higher ambient light to make shadows softer and less harsh
    const ambientIntensity = currentTheme === 'light' ? 0.85 : 0.4;
    window.ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
    scene.add(window.ambientLight);

    // Main light with subtle blue tint (stored globally for theme changes)
    // Position above center, shining down
    window.directionalLight1 = new THREE.DirectionalLight(0xddeeff, 0.1);
    window.directionalLight1.position.set(WIDTH / 2, HEIGHT / 2 - 400, 900);
    window.directionalLight1.target.position.set(WIDTH / 2, HEIGHT / 2, 100);
    window.directionalLight1.castShadow = true;
    window.directionalLight1.shadow.mapSize.width = 8192; // Higher resolution
    window.directionalLight1.shadow.mapSize.height = 8192;
    window.directionalLight1.shadow.camera.left = -WIDTH * 2;
    window.directionalLight1.shadow.camera.right = WIDTH * 2;
    window.directionalLight1.shadow.camera.top = HEIGHT * 2;
    window.directionalLight1.shadow.camera.bottom = -HEIGHT * 2;
    window.directionalLight1.shadow.camera.near = 1;
    window.directionalLight1.shadow.camera.far = 3000;
    window.directionalLight1.shadow.radius = 25; // Softer, more blurred shadows
    window.directionalLight1.shadow.bias = -0.0008; // Adjusted for better shadow quality
    window.directionalLight1.shadow.normalBias = 0.015;
    scene.add(window.directionalLight1);
    scene.add(window.directionalLight1.target);

    // Fill light with subtle pink tint (stored globally for theme changes)
    window.directionalLight2 = new THREE.DirectionalLight(0xffddee, 1.5);
    window.directionalLight2.position.set(WIDTH / 2, HEIGHT * 0.75, 400);
    scene.add(window.directionalLight2);

    // Create background plane to receive shadows (stored globally for theme changes)
    const planeGeometry = new THREE.PlaneGeometry(WIDTH * 3, HEIGHT * 2);
    window.planeMaterial = new THREE.MeshStandardMaterial({ 
        color: currentTheme === 'light' ? 0xffffff : 0x000000,
        roughness: 0.9,
        metalness: 0.1
    });
    const plane = new THREE.Mesh(planeGeometry, window.planeMaterial);
    plane.position.set(WIDTH / 2, HEIGHT / 2, -1000);
    plane.receiveShadow = true;
    scene.add(plane);

    // Create logo shadow caster from SVG shapes
    const svgLoader = new SVGLoader();
    svgLoader.load('logo.svg', (data) => {
        const paths = data.paths;
        const logoGroup = new THREE.Group();
        
        // Get current theme for logo color
        const logoColor = currentTheme === 'light' ? 0x000000 : 0xffffff;
        
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            
            const material = new THREE.MeshStandardMaterial({
                color: logoColor,
                opacity: 0, // Invisible but casts shadows
                transparent: true,
                side: THREE.DoubleSide
            });
            
            const shapes = SVGLoader.createShapes(path);
            
            for (let j = 0; j < shapes.length; j++) {
                const shape = shapes[j];
                
                // Extrude the shape slightly to give it depth for better shadows
                const geometry = new THREE.ExtrudeGeometry(shape, {
                    depth: 1,
                    bevelEnabled: false
                });
                
                const mesh = new THREE.Mesh(geometry, material);
                mesh.castShadow = false; // Disabled logo shadow
                mesh.receiveShadow = false;
                mesh.rotation.x = Math.PI;
                mesh.scale.set(0.8, 0.8, 0.8);
                logoGroup.add(mesh);
            }
        }
        
        // Scale and position the logo
        // SVG coordinates need to be scaled and centered
        const box = new THREE.Box3().setFromObject(logoGroup);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Scale to full width
        const scale = WIDTH / size.x;
        logoGroup.scale.set(scale, scale, 1);
        
        // Center and position
        logoGroup.position.set(
            WIDTH / 2 - (center.x * scale),
            HEIGHT / 6 - (center.y * scale),
            700
        );
        
        // Rotate to face forward
        logoGroup.rotation.x = 0;
        
        scene.add(logoGroup);
        
        console.log('Logo shadow caster added from SVG shapes');
        
        // Logo loaded - trigger cube animation
        logoLoaded = true;
        cubeAnimationStartTime = performance.now();
    }, undefined, (error) => {
        console.error('Error loading SVG for shadow casting:', error);
        
        // Even if logo fails to load, start cube animation after a delay
        setTimeout(() => {
            logoLoaded = true;
            cubeAnimationStartTime = performance.now();
        }, 500);
    });

    // Helper function to check if a position would overlap with existing boids
    function isPositionValid(x, y, size, existingBoids, minDistance = 1.2) {
        for (let boid of existingBoids) {
            const distance = Math.sqrt(
                Math.pow(x - boid.position.x, 2) + 
                Math.pow(y - boid.position.y, 2)
            );
            // Check if distance is less than combined radii plus a margin
            const combinedRadius = (size + boid.size) / 2 * minDistance;
            if (distance < combinedRadius) {
                return false;
            }
        }
        return true;
    }

    // Helper function to find a valid position for a new boid
    function findValidPosition(size, existingBoids, maxAttempts = 100) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = Math.random() * WIDTH;
            const y = Math.random() * HEIGHT;
            
            if (isPositionValid(x, y, size, existingBoids)) {
                return { x, y };
            }
        }
        // If we can't find a valid position after maxAttempts, return a random position anyway
        // This prevents infinite loops if the scene is too crowded
        return { 
            x: Math.random() * WIDTH, 
            y: Math.random() * HEIGHT 
        };
    }

    // Create boids with collision detection
    for (let i = 0; i < 10; i++) {
        // Pre-calculate size to check for overlaps before creating the boid
        const size = Math.random() > 0.8 ? (Math.random() * 150 + 150) * M : (Math.random() * 30 + 190) * M;
        
        // Find a valid position that doesn't overlap with existing boids
        const position = findValidPosition(size, boids);
        
        // Alternate between top and bottom for variety
        const startFromTop = i % 2 === 0;
        
        const boid = new Boid(
            position.x,
            position.y,
            WIDTH,
            HEIGHT,
            M,
            startFromTop
        );
        // Override the randomly generated size with our pre-calculated one
        boid.size = size;
        // Update the mesh geometry to match the size
        boid.mesh.geometry.dispose();
        boid.mesh.geometry = new THREE.BoxGeometry(size, size, size);
        
        // Start invisible until animation begins
        boid.mesh.material.opacity = 0;
        boid.mesh.material.transparent = true;
        
        boids.push(boid);
        scene.add(boid.mesh);
    }

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('wheel', onMouseWheel, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousedown', onMousePressed);
    window.addEventListener('themeChange', onThemeChange);
    
    // Mobile touch events
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
}

function onThemeChange(event) {
    const theme = event.detail.theme;
    currentTheme = theme;
    
    // Update scene background
    if (scene) {
        scene.background = new THREE.Color(theme === 'light' ? 0xffffff : 0x000000);
    }
    
    // Update plane material
    if (window.planeMaterial) {
        window.planeMaterial.color = new THREE.Color(theme === 'light' ? 0xffffff : 0x000000);
    }
    
    // Update ambient light (higher to make shadows softer)
    if (window.ambientLight) {
        window.ambientLight.intensity = theme === 'light' ? 0.85 : 0.4;
        window.ambientLight.color = new THREE.Color(theme === 'light' ? 0xffffff : 0xffffff);
    }
    
    // Update lighting for light mode
    if (window.directionalLight1 && window.directionalLight2) {
        if (theme === 'light') {
            // Brighter lights for light mode with softer shadows
            window.directionalLight1.color = new THREE.Color(0xffffff);
            window.directionalLight1.intensity = 1.5;
            window.directionalLight1.shadow.radius = 25; // Softer shadows
            window.directionalLight2.color = new THREE.Color(0xffffff); // Pure white instead of tinted
            window.directionalLight2.intensity = 0.5;
        } else {
            // Cooler lights for dark mode with softer shadows
            window.directionalLight1.color = new THREE.Color(0xddeeff);
            window.directionalLight1.intensity = 3.5;
            window.directionalLight1.shadow.radius = 75; // Softer shadows
            window.directionalLight2.color = new THREE.Color(0xffddee);
            window.directionalLight2.intensity = 0.8;
        }
    }
}

function onWindowResize() {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    camera.aspect = newWidth / newHeight;
    camera.position.set(newWidth / 2, newHeight / 2, 800);
    camera.lookAt(newWidth / 2, newHeight / 2, 0);
    camera.updateProjectionMatrix();

    renderer.setSize(newWidth, newHeight);

    // Update directional light positions to stay centered
    if (window.directionalLight1) {
        window.directionalLight1.position.set(newWidth / 2, newHeight / 2 - 400, 900);
        window.directionalLight1.target.position.set(newWidth / 2, newHeight / 2, 100);
    }
    
    if (window.directionalLight2) {
        window.directionalLight2.position.set(newWidth / 2, newHeight * 0.75, 400);
    }

    // Update boid boundaries
    boids.forEach(boid => {
        boid.width = newWidth;
        boid.height = newHeight;
    });
}

function onMouseWheel(event) {
    moveFrames = 1;
    dir = event.deltaY > 0 ? 1 : -1;
    // Add rotation impulse on scroll - this adds to both offset and speed
    scrollRotationSpeed += dir * 0.8; // Temporary speed boost
}

// Alternative scroll handler for some mobile browsers
let lastScrollY = window.scrollY || window.pageYOffset;
let scrollLastUpdate = 0;

function onScroll() {
    const now = Date.now();
    // Throttle to max 60fps for performance
    if (now - scrollLastUpdate < 16) return;
    scrollLastUpdate = now;
    
    const currentScrollY = window.scrollY || window.pageYOffset;
    const deltaY = currentScrollY - lastScrollY;
    
    if (Math.abs(deltaY) > 1) {
        moveFrames = 1;
        dir = deltaY > 0 ? 1 : -1;
        const intensity = Math.min(Math.abs(deltaY) * 0.02, 0.5);
        scrollRotationSpeed += dir * intensity;
    }
    
    lastScrollY = currentScrollY;
}

function onMousePressed() {
    moveFrames = 60;
}

// Touch event handling for mobile
let lastTouchY = null;
let touchLastUpdate = 0;

function onTouchStart(event) {
    if (event.touches.length === 1) {
        lastTouchY = event.touches[0].clientY;
        touchLastUpdate = Date.now();
    }
}

function onTouchMove(event) {
    if (lastTouchY !== null && event.touches.length === 1) {
        const now = Date.now();
        // Throttle to max 60fps for performance
        if (now - touchLastUpdate < 16) return;
        touchLastUpdate = now;
        
        const currentTouchY = event.touches[0].clientY;
        const deltaY = lastTouchY - currentTouchY;
        
        // Only process if there's meaningful movement
        if (Math.abs(deltaY) > 2) {
            // Trigger movement and rotation similar to mouse wheel
            moveFrames = 1;
            dir = deltaY > 0 ? 1 : -1;
            
            // Add rotation impulse on scroll
            const intensity = Math.min(Math.abs(deltaY) * 0.02, 0.6);
            scrollRotationSpeed += dir * intensity;
        }
        
        lastTouchY = currentTouchY;
    }
}

function onTouchEnd() {
    lastTouchY = null;
}

function animate() {
    requestAnimationFrame(animate);

    // Update time for rotation animation
    time += 1;

    // Add scroll speed to persistent offset, then decay the speed
    scrollRotationOffset += scrollRotationSpeed * 0.002;
    scrollRotationSpeed *= 0.92; // Decay speed back to 0

    // Animate cubes in from top/bottom if logo has loaded
    if (logoLoaded && cubeAnimationStartTime) {
        const currentTime = performance.now();
        for (let boid of boids) {
            // Only animate if not already complete
            if (!boid.animationComplete) {
                boid.animateIn(currentTime);
            }
        }
    }

    // Only update boids if moveFrames > 0
    if (moveFrames > 0) {
        for (let boid of boids) {
            // Only allow movement after animation is complete (or if logo hasn't loaded yet)
            const canMove = !logoLoaded || boid.animationComplete;
            
            if (canMove) {
                boid.edges();
                boid.flock(boids);
                boid.update();
            }
        }
        moveFrames--;
    }

    // Display all boids
    for (let boid of boids) {
        boid.show();
    }

    renderer.render(scene, camera);
}

// Start the application
init();
animate();

