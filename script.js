let scene, camera, renderer, sphere, states = [];
let gateSequence = [];
let stateCounter = 0;

function init() {
    const container = document.getElementById('blochSphere');
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    // Kamera
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Világítás
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    createBlochSphere();


    // Egér vezérlés
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    // Egér leütése
    renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
    });

    // Egér mozgás
    renderer.domElement.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;
            
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(camera.position);
            spherical.theta -= deltaX * 0.01;
            spherical.phi -= deltaY * 0.01;
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
            
            camera.position.setFromSpherical(spherical);
            camera.lookAt(0, 0, 0);
        }
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    // Egér felengedése
    renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Egér csúsztatása
    renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        const scale = e.deltaY > 0 ? 1.1 : 0.9;
        camera.position.multiplyScalar(scale);
    }, { passive: false });

    // Méretváltozás kezelése
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    animate();
}

// Bloch-gömb létrehozása
function createBlochSphere() {
    // Gömb
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x333333,
        wireframe: true,
        opacity: 0.3,
        transparent: true
    });
    sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);

    // Tengelyek
    const axesHelper = new THREE.AxesHelper(1.2);
    scene.add(axesHelper);

    // Tengely nevek
    const loader = new THREE.FontLoader();
    // Címkék
    const labelMaterial = new THREE.SpriteMaterial({ color: 0xffffff });
    
    // Címkék létrehozása
    function createLabel(text, position) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        context.fillStyle = 'white';
        context.font = '48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.copy(position);
        sprite.scale.set(0.2, 0.2, 1);
        scene.add(sprite);
    }

    createLabel('|0⟩', new THREE.Vector3(0, 0, 1.2));
    createLabel('|1⟩', new THREE.Vector3(0, 0, -1.2));
    createLabel('|+⟩', new THREE.Vector3(1.2, 0, 0));
    createLabel('|-⟩', new THREE.Vector3(-1.2, 0, 0));
    createLabel('|+i⟩', new THREE.Vector3(0, 1.2, 0));
    createLabel('|-i⟩', new THREE.Vector3(0, -1.2, 0));

    // Rács
    const gridHelper = new THREE.GridHelper(2.5, 10, 0x444444, 0x222222);
    scene.add(gridHelper);
}

// Állapot hozzáadása
function addState(theta, phi, name, color) {
    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);

    // Állapot vektor
    const stateVector = new THREE.Vector3(x, y, z);

    // Pont a gömbön
    const pointGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: color });
    const point = new THREE.Mesh(pointGeometry, pointMaterial);
    point.position.copy(stateVector);
    scene.add(point);

    // Nyíl a pontból a gömb középpontjába
    const arrowHelper = new THREE.ArrowHelper(
        stateVector.normalize(),
        new THREE.Vector3(0, 0, 0),
        1,
        color,
        0.1,
        0.05
    );
    scene.add(arrowHelper);

    // Állapot tárolása
    const state = {
        id: stateCounter++,
        name: name,
        theta: theta,
        phi: phi,
        x: x,
        y: y,
        z: z,
        color: color,
        point: point,
        arrow: arrowHelper
    };

    states.push(state);
    updateStatesList();
}

// Állapotok listájának frissítése
function updateStatesList() {
    const list = document.getElementById('statesList');
    list.innerHTML = '';
    states.forEach(state => {
        const item = document.createElement('div');
        item.className = 'state-item';
        const thetaDeg = state.theta * 180 / Math.PI;
        const phiDeg = state.phi * 180 / Math.PI;
        item.innerHTML = `
            <div class="state-info">
                <div class="state-name">${state.name}</div>
                <div class="state-coords">θ=${thetaDeg.toFixed(1)}°, φ=${phiDeg.toFixed(1)}°</div>
            </div>
            <button onclick="removeState(${state.id})">Törlés</button>
        `;
        list.appendChild(item);
    });
}

// Állapot törlése
function removeState(id) {
    const state = states.find(s => s.id === id);
    if (state) {
        scene.remove(state.point);
        scene.remove(state.arrow);
        states = states.filter(s => s.id !== id);
        updateStatesList();
    }
}

// Kezdeti állapot beállítása
function setInitialState() {
    const thetaDeg = parseFloat(document.getElementById('theta').value);
    const phiDeg = parseFloat(document.getElementById('phi').value);
    // Fokból radiánba konvertálás
    const theta = thetaDeg * Math.PI / 180;
    const phi = phiDeg * Math.PI / 180;
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
    const color = colors[states.length % colors.length];
    const name = `|ψ${states.length}⟩`;
    addState(theta, phi, name, color);
}

// Kvantumkapu hozzáadása
function addGate(gate) {
    gateSequence.push({ type: 'gate', name: gate });
    updateGateSequence();
}

// Forgatós kapu hozzáadása
function addRotationGate(gate, angleId) {
    const angleDeg = parseFloat(document.getElementById(angleId).value);
    // Fokból radiánba konvertálás
    const angle = angleDeg * Math.PI / 180;
    gateSequence.push({ type: 'rotation', name: gate, angle: angle });
    updateGateSequence();
}

// Kapu sorozat frissítése
function updateGateSequence() {
    const seq = document.getElementById('gateSequence');
    seq.innerHTML = '';
    gateSequence.forEach((gate, index) => {
        const item = document.createElement('span');
        item.className = 'gate-item ' + (gate.type === 'rotation' ? 'rotation' : '');
        if (gate.type === 'rotation') {
            item.textContent = `${gate.name}(${gate.angle.toFixed(2)})`;
        } else {
            item.textContent = gate.name;
        }
        seq.appendChild(item);
    });
}

// Kapu sorozat törlése
function clearGates() {
    gateSequence = [];
    updateGateSequence();
}

// Kvantumkapu mátrixok 4x4 valós mátrixként
// Minden komplex 2x2 mátrix 4x4 valós mátrixként ábrázolva
// Komplex szám a+bi esetén [[a, -b], [b, a]] használatos
const gates = {
    'X': [
        [0, 0, 1, 0],
        [0, 0, 0, 1],
        [1, 0, 0, 0],
        [0, 1, 0, 0]
    ],
    'Y': [
        [0, 0, 0, -1],
        [0, 0, 1, 0],
        [0, 1, 0, 0],
        [-1, 0, 0, 0]
    ],
    'Z': [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, -1, 0],
        [0, 0, 0, -1]
    ],
    'H': (() => {
        const h = 1 / Math.SQRT2;
        return [
            [h, 0, h, 0],
            [0, h, 0, h],
            [h, 0, -h, 0],
            [0, h, 0, -h]
        ];
    })(),
    'S': [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, -1],
        [0, 0, 1, 0]
    ],
    'T': (() => {
        const t = Math.cos(Math.PI / 4);
        const tIm = Math.sin(Math.PI / 4);
        return [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, t, -tIm],
            [0, 0, tIm, t]
        ];
    })()
};

// Forgatós kapu mátrixának kiszámítása
function rotationGate(axis, angle) {
    const c = Math.cos(angle / 2);
    const s = Math.sin(angle / 2);
    
    if (axis === 'x') {
        // Rx(a) = [[cos(a/2), -i sin(a/2)], [-i sin(a/2), cos(a/2)]]
        // -i valós formában [[0, 1], [-1, 0]]
        return [
            [c, 0, 0, s],
            [0, c, -s, 0],
            [0, s, c, 0],
            [-s, 0, 0, c]
        ];
    } else if (axis === 'y') {
        // Ry(a) = [[cos(a/2), -sin(a/2)], [sin(a/2), cos(a/2)]]
        return [
            [c, 0, -s, 0],
            [0, c, 0, -s],
            [s, 0, c, 0],
            [0, s, 0, c]
        ];
    } else if (axis === 'z') {
        // Rz(a) = [[e^(-ia/2), 0], [0, e^(ia/2)]]
        // e^(-ia/2) = cos(a/2) - i sin(a/2) = [[cos(a/2), sin(a/2)], [-sin(a/2), cos(a/2)]]
        // e^(ia/2) = cos(a/2) + i sin(a/2) = [[cos(a/2), -sin(a/2)], [sin(a/2), cos(a/2)]]
        const cosHalf = Math.cos(angle / 2);
        const sinHalf = Math.sin(angle / 2);
        return [
            [cosHalf, sinHalf, 0, 0],
            [-sinHalf, cosHalf, 0, 0],
            [0, 0, cosHalf, -sinHalf],
            [0, 0, sinHalf, cosHalf]
        ];
    }
}

// Állapot Bloch-gömbi koordinátái kiszámítása
function stateToBloch(alphaRe, alphaIm, betaRe, betaIm) {
    // |y> = a|0> + b|1> Bloch-gömbi koordinátái kiszámítása
    // Állapot vektor [a_re, a_im, b_re, b_im]
    const alphaNorm = Math.sqrt(alphaRe * alphaRe + alphaIm * alphaIm);
    
    const theta = 2 * Math.acos(Math.max(-1, Math.min(1, alphaNorm)));
    // phii szög kiszámítása
    let phi = 0;
    if (alphaNorm > 0.0001) {
        const alphaPhase = Math.atan2(alphaIm, alphaRe);
        const betaPhase = Math.atan2(betaIm, betaRe);
        phi = betaPhase - alphaPhase;
    } else {
        phi = Math.atan2(betaIm, betaRe);
    }
    
    // phi normalizálása [0, 2π] közé
    while (phi < 0) phi += 2 * Math.PI;
    while (phi >= 2 * Math.PI) phi -= 2 * Math.PI;
    
    return { theta, phi };
}

// Bloch-gömbi koordináták átváltása állapot vektorra
function blochToState(theta, phi) {
    //[a_re, a_im, b_re, b_im]
    const alphaRe = Math.cos(theta / 2);
    const alphaIm = 0;
    const betaRe = Math.sin(theta / 2) * Math.cos(phi);
    const betaIm = Math.sin(theta / 2) * Math.sin(phi);
    return [alphaRe, alphaIm, betaRe, betaIm];
}

// Kvantumkapuk alkalmazása
function applyGates() {
    if (gateSequence.length === 0 || states.length === 0) return;
    
    // A legutolsó állapotra alkalmazzuk a kapukat
    const lastState = states[states.length - 1];
    let stateVector = blochToState(lastState.theta, lastState.phi);
    
    // Minden kaput alkalmazunk
    gateSequence.forEach(gate => {
        let gateMatrix;
        
        if (gate.type === 'rotation') {
            const axis = gate.name.toLowerCase().replace('r', '');
            gateMatrix = rotationGate(axis, gate.angle);
        } else {
            gateMatrix = gates[gate.name];
        }
        
        if (gateMatrix) {
            // 4x4 valós mátrix szorzása
            const newState = [0, 0, 0, 0];
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    newState[i] += gateMatrix[i][j] * stateVector[j];
                }
            }
            
            // Normalizálás
            const norm = Math.sqrt(
                newState[0] * newState[0] + newState[1] * newState[1] +
                newState[2] * newState[2] + newState[3] * newState[3]
            );
            
            if (norm > 0.0001) {
                for (let i = 0; i < 4; i++) {
                    newState[i] /= norm;
                }
            }
            
            stateVector = newState;
        }
    });
    
    // Bloch-gömbi koordináták átváltása
    const bloch = stateToBloch(stateVector[0], stateVector[1], stateVector[2], stateVector[3]);
    
    // Új állapot hozzáadása
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff8800, 0x88ff00];
    const color = colors[states.length % colors.length];
    const gateNames = gateSequence.map(g => 
        g.type === 'rotation' ? `${g.name}(${(g.angle * 180 / Math.PI).toFixed(1)}°)` : g.name
    ).join('·');
    const name = `|ψ${states.length}⟩ = ${gateNames}`;
    
    addState(bloch.theta, bloch.phi, name, color);
}

// Animáció futtatása
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Kezdeti állapot beállítása
window.addEventListener('load', init);

