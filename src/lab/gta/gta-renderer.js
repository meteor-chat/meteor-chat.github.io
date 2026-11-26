import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const SKY_VS = `
varying vec3 vDir;
void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vDir = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const SKY_FS = `
uniform vec3 uTopColor;
uniform vec3 uHorizonColor;
uniform vec3 uGroundColor;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uNight;
varying vec3 vDir;
void main() {
    vec3 d = normalize(vDir);
    float up = clamp(d.y, 0.0, 1.0);
    vec3 sky = mix(uHorizonColor, uTopColor, pow(up, 0.52));
    if (d.y < 0.0) {
        sky = mix(uHorizonColor, uGroundColor, clamp(-d.y * 4.5, 0.0, 1.0));
    }
    float sunDot = max(dot(d, normalize(uSunDir)), 0.0);
    float glow = pow(sunDot, 12.0) * 0.35 + pow(sunDot, 220.0) * 1.9;
    sky += uSunColor * glow * (1.0 - uNight * 0.85);
    if (uNight > 0.25 && d.y > 0.06) {
        vec2 st = floor(d.xz / (d.y + 0.15) * 95.0);
        float h = fract(sin(dot(st, vec2(127.1, 311.7))) * 43758.5453);
        float star = step(0.9965, h) * smoothstep(0.06, 0.35, d.y) * uNight;
        sky += vec3(0.85, 0.92, 1.0) * star * 1.4;
    }
    gl_FragColor = vec4(sky, 1.0);
}`;

function computeMoodPalette(timeOfDay, rain) {
    const angle = (timeOfDay - 0.15) * Math.PI * 2;
    const elev = Math.sin(angle);
    const sunDir = new THREE.Vector3(Math.cos(angle) * 0.65, Math.max(-0.25, elev), -0.52).normalize();
    const day = THREE.MathUtils.clamp((elev + 0.06) / 0.42, 0, 1);
    const sunset = THREE.MathUtils.clamp(1 - Math.abs(elev - 0.08) / 0.24, 0, 1);
    const night = 1 - day;

    const top = new THREE.Color(0x134da8)
        .lerp(new THREE.Color(0x28275c), sunset * 0.7)
        .lerp(new THREE.Color(0x060b18), night)
        .lerp(new THREE.Color(0x2e3b4e), rain * 0.55);

    const horizon = new THREE.Color(0x9ed2f4)
        .lerp(new THREE.Color(0xf28749), sunset * 0.85)
        .lerp(new THREE.Color(0x111a2e), night)
        .lerp(new THREE.Color(0x526173), rain * 0.55);

    const sunColor = new THREE.Color(0xfff5e0)
        .lerp(new THREE.Color(0xff9248), sunset * 0.85)
        .lerp(new THREE.Color(0x7aa2d8), night);

    const fogColor = horizon.clone();
    return { sunDir, top, horizon, sunColor, fogColor, day, sunset, night };
}

export function createGtaRenderer(canvas, hooks = {}) {
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            powerPreference: "high-performance"
        });
    } catch {
        return null;
    }
    if (!renderer.capabilities.isWebGL2) {
        renderer.dispose();
        return null;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x9ed2f4, 0.00175);

    const camera = new THREE.PerspectiveCamera(62, 16 / 9, 0.25, 1100);

    const skyUniforms = {
        uTopColor: { value: new THREE.Color(0x134da8) },
        uHorizonColor: { value: new THREE.Color(0x9ed2f4) },
        uGroundColor: { value: new THREE.Color(0x1c2432) },
        uSunDir: { value: new THREE.Vector3(0.5, 0.7, -0.5).normalize() },
        uSunColor: { value: new THREE.Color(0xfff5e0) },
        uNight: { value: 0 }
    };
    const skyMat = new THREE.ShaderMaterial({
        vertexShader: SKY_VS,
        fragmentShader: SKY_FS,
        uniforms: skyUniforms,
        side: THREE.BackSide,
        depthWrite: false
    });
    const skyDome = new THREE.Mesh(new THREE.SphereGeometry(850, 28, 18), skyMat);
    scene.add(skyDome);

    const envScene = new THREE.Scene();
    const envDome = new THREE.Mesh(new THREE.SphereGeometry(50, 20, 14), skyMat);
    envScene.add(envDome);
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    let envTarget = null;
    let lastMoodKey = "";

    const hemiLight = new THREE.HemisphereLight(0xbbe0ff, 0x262e3d, 0.85);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff4de, 2.7);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 360;
    const sc = 105;
    sunLight.shadow.camera.left = -sc;
    sunLight.shadow.camera.right = sc;
    sunLight.shadow.camera.top = sc;
    sunLight.shadow.camera.bottom = -sc;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.04;
    scene.add(sunLight);
    scene.add(sunLight.target);

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(640, 360), 0.28, 0.42, 0.96);
    const outputPass = new OutputPass();
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(outputPass);
    renderer.info.autoReset = false;

    let renderScale = 1.0;
    let lost = false;

    const onContextLost = (e) => {
        e.preventDefault();
        lost = true;
        if (hooks.onContextLost) hooks.onContextLost();
    };
    const onContextRestored = () => {
        lost = false;
        lastMoodKey = "";
        if (hooks.onContextRestored) hooks.onContextRestored();
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    const resize = (scale = renderScale) => {
        renderScale = Math.max(0.55, Math.min(1, scale));
        const w = Math.max(2, canvas.clientWidth || window.innerWidth || 1280);
        const h = Math.max(2, canvas.clientHeight || window.innerHeight || 720);
        const dpr = Math.min(window.devicePixelRatio || 1, 1.75) * renderScale;
        renderer.setPixelRatio(dpr);
        renderer.setSize(w, h, false);
        composer.setPixelRatio(dpr);
        composer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    };

    const updateAtmosphere = (timeOfDay, rainIntensity, focusPos) => {
        const m = computeMoodPalette(timeOfDay, rainIntensity);
        skyUniforms.uTopColor.value.copy(m.top);
        skyUniforms.uHorizonColor.value.copy(m.horizon);
        skyUniforms.uSunDir.value.copy(m.sunDir);
        skyUniforms.uSunColor.value.copy(m.sunColor);
        skyUniforms.uNight.value = m.night;

        scene.fog.color.copy(m.fogColor);
        scene.fog.density = 0.00145 + rainIntensity * 0.0012 + m.night * 0.0005;

        hemiLight.color.copy(m.horizon);
        hemiLight.intensity = 0.34 + m.day * 0.62 - rainIntensity * 0.14;
        sunLight.color.copy(m.sunColor);
        sunLight.intensity = (0.28 + m.day * 2.5) * (1 - rainIntensity * 0.45);
        renderer.toneMappingExposure = 0.94 + m.day * 0.16 + m.sunset * 0.08;
        bloomPass.strength = 0.22 + m.night * 0.22 + m.sunset * 0.1;

        if (focusPos) {
            skyDome.position.set(focusPos.x, 0, focusPos.z);
            const sx = Math.round(focusPos.x / 4) * 4;
            const sz = Math.round(focusPos.z / 4) * 4;
            sunLight.target.position.set(sx, focusPos.y || 0, sz);
            sunLight.position.set(
                sx + m.sunDir.x * 165,
                (focusPos.y || 0) + Math.max(25, m.sunDir.y * 165),
                sz + m.sunDir.z * 165
            );
            sunLight.target.updateMatrixWorld();
        }

        const moodKey = `${Math.round(timeOfDay * 36)}:${Math.round(rainIntensity * 4)}`;
        if (moodKey !== lastMoodKey && !lost) {
            lastMoodKey = moodKey;
            const nextEnv = pmrem.fromScene(envScene, 0.04);
            scene.environment = nextEnv.texture;
            if (envTarget) envTarget.dispose();
            envTarget = nextEnv;
        }
        return m;
    };

    const render = () => {
        if (lost) return { drawCalls: 0, triangles: 0 };
        renderer.info.reset();
        composer.render();
        return {
            drawCalls: renderer.info.render.calls,
            triangles: renderer.info.render.triangles
        };
    };

    const dispose = () => {
        canvas.removeEventListener("webglcontextlost", onContextLost);
        canvas.removeEventListener("webglcontextrestored", onContextRestored);
        if (envTarget) envTarget.dispose();
        pmrem.dispose();
        skyDome.geometry.dispose();
        envDome.geometry.dispose();
        skyMat.dispose();
        composer.dispose();
        renderer.dispose();
    };

    resize(1.0);
    return {
        renderer,
        scene,
        camera,
        resize,
        updateAtmosphere,
        render,
        getScale: () => renderScale,
        isLost: () => lost,
        dispose
    };
}
