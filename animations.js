// Animation and Parallax System for Order of KALA
// Handles entrance animations and parallax effects for all elements

(function() {
    'use strict';

    // Configuration
    const ANIMATION_CONFIG = {
        fadeInDuration: 800,
        staggerDelay: 100,
        parallaxIntensity: 0.5,
        scrollThreshold: 0.1
    };

    // Initialize animations when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        setupEntranceAnimations();
        setupParallaxEffects();
        setupStaggerAnimations();
        initHeroTimelines();
    }

    // Setup fade-in animations for elements as they enter viewport
    function setupEntranceAnimations() {
        // Elements to animate on scroll
        const animatedElements = document.querySelectorAll(`
            .logo,
            .logo-small,
            .section-title,
            .manifesto-content p,
            .join-card,
            .release-card,
            .shop-intro,
            .theme-toggle,
            .back-link,
            .timelines-header,
            .control-panel,
            .join-footer p,
            .manifesto-intro,
            header,
            .shop-header,
            .shop-description
        `);

        // Add initial hidden state
        animatedElements.forEach((el, index) => {
            // Skip if already has animation class
            if (el.classList.contains('animate-on-scroll')) return;
            
            el.classList.add('animate-on-scroll');
            
            // Add initial state
            if (!el.style.opacity && !el.dataset.animated) {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
            }
        });

        // Intersection Observer for scroll-triggered animations
        const observerOptions = {
            threshold: ANIMATION_CONFIG.scrollThreshold,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.animated) {
                    animateElementIn(entry.target);
                    entry.target.dataset.animated = 'true';
                }
            });
        }, observerOptions);

        // Observe all animated elements
        animatedElements.forEach(el => {
            observer.observe(el);
        });

        // Animate elements that are already in viewport on page load
        animatedElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const isInView = rect.top < window.innerHeight * 0.9 && rect.bottom > 0;
            
            if (isInView && !el.dataset.animated) {
                // Stagger initial animations slightly
                const delay = Array.from(animatedElements).indexOf(el) * 50;
                setTimeout(() => {
                    animateElementIn(el);
                    el.dataset.animated = 'true';
                }, delay);
            }
        });
    }

    // Animate element entrance
    function animateElementIn(element) {
        // Store existing transform for parallax
        if (!element.dataset.initialTransform) {
            element.dataset.initialTransform = element.style.transform || '';
        }
        
        element.style.transition = `opacity ${ANIMATION_CONFIG.fadeInDuration}ms ease-out, transform ${ANIMATION_CONFIG.fadeInDuration}ms ease-out`;
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            // Only reset translateY part, preserve parallax
            const existingTransform = element.style.transform || '';
            if (existingTransform.includes('translateY')) {
                element.style.transform = existingTransform.replace(/translateY\([^)]*\)/, 'translateY(0)');
            } else {
                element.style.transform = 'translateY(0)';
            }
        });
    }

    // Setup parallax effects based on scroll position
    function setupParallaxEffects() {
        let ticking = false;

        function updateParallax() {
            const scrollY = window.pageYOffset || window.scrollY;
            const windowHeight = window.innerHeight;

            // Parallax for logo (only when not hovering)
            const logo = document.querySelector('.logo');
            if (logo && logo.dataset.animated) {
                // Check if logo is being hovered
                const isHovered = logo.matches(':hover');
                if (!isHovered) {
                    const logoRect = logo.getBoundingClientRect();
                    const logoCenter = logoRect.top + logoRect.height / 2;
                    const distanceFromCenter = (windowHeight / 2) - logoCenter;
                    const parallaxY = distanceFromCenter * ANIMATION_CONFIG.parallaxIntensity * 0.1;
                    logo.style.transform = `translateY(${parallaxY}px)`;
                }
            }

            // Parallax for cards
            const cards = document.querySelectorAll('.join-card, .release-card');
            cards.forEach((card, index) => {
                // Skip if card hasn't animated in yet
                if (!card.dataset.animated) return;
                
                const cardRect = card.getBoundingClientRect();
                const cardCenter = cardRect.top + cardRect.height / 2;
                const distanceFromViewport = cardCenter - windowHeight / 2;
                
                // Only apply parallax when card is in viewport
                if (cardRect.top < windowHeight && cardRect.bottom > 0) {
                    // Stagger parallax for visual interest
                    const staggerOffset = index * 0.1;
                    const parallaxY = distanceFromViewport * ANIMATION_CONFIG.parallaxIntensity * 0.05;
                    // Combine with existing transform (translateY(0) from animation)
                    card.style.transform = `translateY(${parallaxY + staggerOffset}px)`;
                }
            });

            // Parallax for text sections (subtle)
            const textSections = document.querySelectorAll('.manifesto-content p, .join-footer p');
            textSections.forEach((section, index) => {
                // Skip if section hasn't animated in yet
                if (!section.dataset.animated) return;
                
                const sectionRect = section.getBoundingClientRect();
                
                if (sectionRect.top < windowHeight && sectionRect.bottom > 0) {
                    const distanceFromViewport = (sectionRect.top + sectionRect.height / 2) - windowHeight / 2;
                    const parallaxY = distanceFromViewport * ANIMATION_CONFIG.parallaxIntensity * 0.03;
                    section.style.transform = `translateY(${parallaxY}px)`;
                }
            });

            ticking = false;
        }

        function requestTick() {
            if (!ticking) {
                window.requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }

        // Throttled scroll listener
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) {
                cancelAnimationFrame(scrollTimeout);
            }
            scrollTimeout = requestAnimationFrame(requestTick);
        }, { passive: true });

        // Initial parallax update
        updateParallax();
    }

    // Setup staggered animations for grouped elements
    function setupStaggerAnimations() {
        // Stagger join cards
        const joinCards = document.querySelectorAll('.join-card');
        joinCards.forEach((card, index) => {
            card.style.transitionDelay = `${index * ANIMATION_CONFIG.staggerDelay}ms`;
        });

        // Stagger release cards
        const releaseCards = document.querySelectorAll('.release-card');
        releaseCards.forEach((card, index) => {
            card.style.transitionDelay = `${index * ANIMATION_CONFIG.staggerDelay}ms`;
        });

        // Stagger manifesto paragraphs
        const manifestoParas = document.querySelectorAll('.manifesto-content p');
        manifestoParas.forEach((para, index) => {
            para.style.transitionDelay = `${index * 50}ms`;
        });

        // Stagger join footer paragraphs
        const joinFooterParas = document.querySelectorAll('.join-footer p');
        joinFooterParas.forEach((para, index) => {
            para.style.transitionDelay = `${index * 100}ms`;
        });
    }

    // Initialize hero timelines preview
    function initHeroTimelines() {
        const container = document.getElementById('hero-timelines-canvas');
        if (!container) return;
        
        // Create a mini p5 sketch instance with the timelines logic
        new p5((p) => {
            let rows = [];
            let hr, bcol, scol;
            let WIDTH, HEIGHT, DIM, M;
            let minutes;
            const DEFAULT_SIZE = 1000;
            
            // Mini Boid class for thumbnail
            class MiniBoid {
                constructor(j) {
                    this.position = p.createVector(p.random(WIDTH), 175);
                    this.velocity = p.createVector(1, 0);
                    this.velocity.setMag(p.random(-1 * M, 1 * M));
                    this.acceleration = p.createVector();
                    this.maxSpeed = 1 * M;
                    this.j = j;
                    this.rs = p.random(0, 1);
                    this.rsv = p.random(1, 2);
                    this.rsvb = p.random(10, 100);
                }
                
                edges() {
                    if (this.position.x > WIDTH - 20 * M) {
                        this.position.x = 0 + 20 * M;
                    } else if (this.position.x <= 0 + 20 * M) {
                        this.position.x = WIDTH - 20 * M;
                    }
                    if (this.position.y > DIM - 20 * M) {
                        this.position.y = 0;
                    } else if (this.position.y < 0 + 20 * M) {
                        this.position.y = HEIGHT - 20 * M;
                    }
                }
                
                update() {
                    this.position.add(this.velocity);
                    this.velocity.add(this.acceleration);
                    this.velocity.limit(this.maxSpeed);
                }
                
                show() {
                    let fsw = this.rs <= 0.9 ? this.rsv : this.rsvb;
                    
                    p.noStroke();
                    p.fill(scol);
                    p.push();
                    p.translate(this.position.x, this.j * (HEIGHT / hr) + HEIGHT / hr / 2);
                    let r = p.map(p.noise(this.position.x / (30 * M), this.position.y / (30 * M)), 0, 1, -p.PI / 30, p.PI / 30);
                    p.rotate(r);
                    p.rect(0, 0, 3 * M + p.noise(this.j / (100 * M) + this.position.x / (100 * M)) * fsw * M, HEIGHT / hr - 15 * M);
                    p.pop();
                }
            }
            
            // Mini Row class for thumbnail
            class MiniRow {
                constructor(j) {
                    this.flock = [];
                    this.j = j;
                    this.setup();
                }
                
                setup() {
                    this.flock = [];
                    for (let i = 0; i < minutes; i++) {
                        this.flock.push(new MiniBoid(this.j));
                    }
                }
                
                anim() {
                    for (let boid of this.flock) {
                        boid.edges();
                        boid.update();
                        boid.show();
                    }
                }
            }
            
            p.setup = function() {
                WIDTH = container.clientWidth;
                HEIGHT = container.clientHeight;
                DIM = Math.min(WIDTH, HEIGHT);
                M = DIM / DEFAULT_SIZE;
                
                const cnv = p.createCanvas(WIDTH, HEIGHT);
                cnv.parent(container);
                
                p.rectMode(p.CENTER);
                
                // Get current time
                const now = new Date();
                let hours = now.getHours();
                minutes = now.getMinutes();
                
                // Determine colors and hours based on time (matching timelines logic)
                if (hours > 12) {
                    hr = hours - 12;
                    bcol = p.color(255);
                    scol = p.color(0);
                } else if (hours === 12) {
                    hr = hours;
                    bcol = p.color(255);
                    scol = p.color(0);
                } else if (hours === 0) {
                    hr = 12;
                    bcol = p.color(0);
                    scol = p.color(255);
                } else {
                    hr = hours;
                    bcol = p.color(0);
                    scol = p.color(255);
                }
                
                // Create rows with boids (matching timelines logic)
                for (let j = 0; j < hr; j++) {
                    rows.push(new MiniRow(j));
                }
            };
            
            p.draw = function() {
                p.background(bcol);
                p.push();
                // Center and scale
                p.translate(WIDTH / 2, HEIGHT / 2);
                p.scale(0.75);
                p.translate(-WIDTH / 2, -HEIGHT / 2);
                p.smooth();
                
                // Draw all rows
                for (let j = 0; j < hr; j++) {
                    if (rows[j]) {
                        rows[j].anim();
                    }
                }
                p.pop();
            };
            
            p.windowResized = function() {
                WIDTH = container.clientWidth;
                HEIGHT = container.clientHeight;
                DIM = Math.min(WIDTH, HEIGHT);
                M = DIM / DEFAULT_SIZE;
                p.resizeCanvas(WIDTH, HEIGHT);
            };
        }, container);
    }

    // Re-initialize on dynamic content load (for shop page)
    if (typeof window !== 'undefined') {
        window.addEventListener('releasesLoaded', () => {
            setTimeout(() => {
                setupEntranceAnimations();
                setupStaggerAnimations();
            }, 100);
        });
    }

})();

