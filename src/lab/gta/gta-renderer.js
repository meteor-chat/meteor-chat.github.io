import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const SKY_VS = `
varying vec3 vWorldDir;
void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldDir = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const SKY_FS = `
uniform vec3 uTopColor;
uniform vec3 uHorizonColor;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uNight;
varying vec3 vWorldDir;
void main() {
    vec3 d = normalize(vWorldDir);
    float h = clamp(d.y, 0.0, 1.0);
    vec3 col = mix(uHorizonColor, uTopColor, pow(h, 0.52));
    float sunAmt = max(dot(d, normalize(uSunDir)), 0.0);
    col += uSunColor * (pow(sunAmt, 240.0) * 1.4 + pow(sunAmt, 16.0) * 0.24);
    if (uNight > 0.2) {
        vec2 g = floor(d.xz / max(0.15, d.y + 0.15) * 42.0);
        float st = fract(sin(dot(g, vec2(12.9898, 78.233))) * 43758.5453);
        float star = step(0.994, st) * smoothstep(0.12, 0.45, d.y) * uNight;
        col += vec3(0.85, 0.92, 1.0) * star * 0.7;
    }
    gl_FragColor = vec4(col, 1.0);
}
`;

export function computeMoodPalette(timeOfDay, rainIntensity = 0) {
    const angle = (timeOfDay - 0.18) * Math.PI * 2;
    const elev = Math.sin(angle);
    const day = THREE.MathUtils.clamp((elev + 0.12) / 0.55, 0, 1);
    const sunset = THREE.MathUtils.clamp(1 - Math.abs(elev - 0.06) / 0.3, 0, 1);
    const night = THREE.MathUtils.clamp((-elev + 0.04) / 0.34, 0, 1);

    const sunDir = new THREE.Vector3(
        Math.cos(angle) * 0.78,
        Math.max(0.16, elev * 0.85 + 0.22),
        Math.sin(angle) * 0.48 - 0.38
    ).normalize();

    const top = new THREE.Color(0x1f62a8)
        .lerp(new THREE.Color(0x2d4172), sunset * 0.75)
        .lerp(new THREE.Color(0x060b16), night)
        .lerp(new THREE.Color(0x4a5b6e), rainIntensity * 0.5);

    const horizon = new THREE.Color(0xa6cde8)
        .lerp(new THREE.Color(0xf09356), sunset * 0.85)
        .lerp(new THREE.Color(0x131e33), night)
        .lerp(new THREE.Color(0x6d7d8c), rainIntensity * 0.55);

    const sunColor = new THREE.Color(0xfff4df)
        .lerp(new THREE.Color(0xff9b54), sunset * 0.82)
        .lerp(new THREE.Color(0x7898c8), night);

    const fogColor = horizon.clone().lerp(new THREE.Color(0x9cb9d2), day * 0.32);

    return {
        day,
        sunset,
        night,
        sunDir,
        top,
        horizon,
        sunColor,
        fogColor,
        hdriKey: night > 0.55 ? "night" : sunset > 0.45 ? "sunset" : "day"
    };
}

export function createGtaRenderer(canvas, hooks = {}) {
    let renderer = null;
    try {
        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            powerPreference: "high-performance",
            stencil: false
        });
    } catch {
        return null;
    }
    if (!renderer.capabilities.isWebGL2) {
        renderer.dispose();
        return null;
    }

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.info.autoReset = false;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x9fbcd4, 0.00115);

    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.25, 1100);

    const skyUniforms = {
        uTopColor: { value: new THREE.Color(0x1f62a8) },
        uHorizonColor: { value: new THREE.Color(0xa6cde8) },
        uSunDir: { value: new THREE.Vector3(0.45, 0.72, -0.5).normalize() },
        uSunColor: { value: new THREE.Color(0xfff4df) },
        uNight: { value: 0 }
    };
    const skyMat = new THREE.ShaderMaterial({
        vertexShader: SKY_VS,
        fragmentShader: SKY_FS,
        uniforms: skyUniforms,
        side: THREE.BackSide,
        depthWrite: false
    });
    const skyDome = new THREE.Mesh(new THREE.SphereGeometry(880, 28, 18), skyMat);
    scene.add(skyDome);

    const envScene = new THREE.Scene();
    const envDome = new THREE.Mesh(new THREE.SphereGeometry(50, 20, 14), skyMat);
    envScene.add(envDome);
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();

    const hdriRaw = { day: null, sunset: null, night: null };
    const hdriPmrem = { day: null, sunset: null, night: null };
    let fallbackEnvTarget = null;
    let activeHdriKey = "";
    let lastMoodKey = "";

    const setHdris = (hdris) => {
        if (!hdris) return;
        for (const key of ["day", "sunset", "night"]) {
            if (hdris[key]) {
                hdriRaw[key] = hdris[key];
                if (hdriPmrem[key]) hdriPmrem[key].dispose();
                hdriPmrem[key] = pmrem.fromEquirectangular(hdris[key]);
            }
        }
        activeHdriKey = "";
        lastMoodKey = "";
    };

    const hemiLight = new THREE.HemisphereLight(0xc2e2ff, 0x323842, 0.78);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff3d8, 3.1);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 360;
    const sc = 96;
    sunLight.shadow.camera.left = -sc;
    sunLight.shadow.camera.right = sc;
    sunLight.shadow.camera.top = sc;
    sunLight.shadow.camera.bottom = -sc;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 0.035;
    scene.add(sunLight);
    scene.add(sunLight.target);

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(640, 360), 0.24, 0.38, 1.02);
    const outputPass = new OutputPass();
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(outputPass);

    let renderScale = 1.0;
    let lost = false;

    const onContextLost = (e) => {
        e.preventDefault();
        lost = true;
        if (hooks.onContextLost) hooks.onContextLost();
    };
    const onContextRestored = () => {
        lost = false;
        activeHdriKey = "";
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
        scene.fog.density = 0.0011 + rainIntensity * 0.0013 + m.night * 0.00055;

        hemiLight.color.copy(m.horizon);
        hemiLight.intensity = 0.28 + m.day * 0.56 - rainIntensity * 0.14;
        sunLight.color.copy(m.sunColor);
        sunLight.intensity = (0.24 + m.day * 2.95) * (1 - rainIntensity * 0.48);
        renderer.toneMappingExposure = 0.96 + m.day * 0.14 + m.sunset * 0.08 - m.night * 0.08;
        bloomPass.strength = 0.18 + m.night * 0.24 + m.sunset * 0.08;

        if (focusPos) {
            skyDome.position.set(focusPos.x, 0, focusPos.z);
            const sx = Math.round(focusPos.x / 4) * 4;
            const sz = Math.round(focusPos.z / 4) * 4;
            sunLight.target.position.set(sx, focusPos.y || 0, sz);
            sunLight.position.set(
                sx + m.sunDir.x * 165,
                (focusPos.y || 0) + Math.max(28, m.sunDir.y * 165),
                sz + m.sunDir.z * 165
            );
            sunLight.target.updateMatrixWorld();
        }

        const wantKey = m.hdriKey;
        if (!lost && hdriPmrem[wantKey] && hdriRaw[wantKey]) {
            if (activeHdriKey !== wantKey) {
                activeHdriKey = wantKey;
                scene.environment = hdriPmrem[wantKey].texture;
                scene.background = hdriRaw[wantKey];
                skyDome.visible = false;
            }
            scene.backgroundIntensity = wantKey === "night" ? 0.55 : 1.0 - rainIntensity * 0.32;
            scene.environmentIntensity = wantKey === "night" ? 0.42 : 1.05 - rainIntensity * 0.25;
        } else {
            skyDome.visible = true;
            scene.background = null;
            const moodKey = `${Math.round(timeOfDay * 36)}:${Math.round(rainIntensity * 4)}`;
            if (moodKey !== lastMoodKey && !lost) {
                lastMoodKey = moodKey;
                const nextEnv = pmrem.fromScene(envScene, 0.04);
                scene.environment = nextEnv.texture;
                if (fallbackEnvTarget) fallbackEnvTarget.dispose();
                fallbackEnvTarget = nextEnv;
            }
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
        for (const k of ["day", "sunset", "night"]) {
            if (hdriPmrem[k]) hdriPmrem[k].dispose();
        }
        if (fallbackEnvTarget) fallbackEnvTarget.dispose();
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
        setHdris,
        resize,
        updateAtmosphere,
        render,
        getScale: () => renderScale,
        isLost: () => lost,
        dispose
    };
}
