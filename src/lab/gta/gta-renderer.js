import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { QUALITY_PRESETS } from "./gta-perf-governor.js";

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

    const horizon = new THREE.Color(0x9bc0dc)
        .lerp(new THREE.Color(0xd67c44), sunset * 0.84)
        .lerp(new THREE.Color(0x131e33), night)
        .lerp(new THREE.Color(0x6d7d8c), rainIntensity * 0.55);

    const sunColor = new THREE.Color(0xfff1d8)
        .lerp(new THREE.Color(0xf5924c), sunset * 0.82)
        .lerp(new THREE.Color(0x7898c8), night);

    const fogColor = horizon
        .clone()
        .lerp(new THREE.Color(0x8ea9c2), day * 0.34)
        .lerp(new THREE.Color(0xa66b48), sunset * 0.35);

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

    let quality = QUALITY_PRESETS.balanced;
    renderer.shadowMap.enabled = quality.shadowsEnabled;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.info.autoReset = false;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x9fbcd4, 0.00145);

    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.3, quality.farClip);

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
    const skyDome = new THREE.Mesh(new THREE.SphereGeometry(420, 24, 14), skyMat);
    scene.add(skyDome);

    const envScene = new THREE.Scene();
    const envDome = new THREE.Mesh(new THREE.SphereGeometry(50, 18, 12), skyMat);
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

    const hemiLight = new THREE.HemisphereLight(0xc2e2ff, 0x323842, 0.8);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff3d8, 3.1);
    sunLight.castShadow = quality.shadowsEnabled;
    sunLight.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 310;
    const sc0 = quality.shadowExtent;
    sunLight.shadow.camera.left = -sc0;
    sunLight.shadow.camera.right = sc0;
    sunLight.shadow.camera.top = sc0;
    sunLight.shadow.camera.bottom = -sc0;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.04;
    scene.add(sunLight);
    scene.add(sunLight.target);

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(320, 180), 0.08, 0.22, 1.6);
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
        const dpr = Math.min(window.devicePixelRatio || 1, quality.maxDpr) * renderScale;
        renderer.setPixelRatio(dpr);
        renderer.setSize(w, h, false);
        composer.setPixelRatio(dpr);
        composer.setSize(w, h);
        const bw = Math.max(2, Math.floor(w * dpr * quality.bloomScale));
        const bh = Math.max(2, Math.floor(h * dpr * quality.bloomScale));
        bloomPass.setSize(bw, bh);
        camera.aspect = w / h;
        camera.far = quality.farClip;
        camera.updateProjectionMatrix();
    };

    const setQuality = (presetKey, nextScale = null) => {
        quality = QUALITY_PRESETS[presetKey] || QUALITY_PRESETS.balanced;
        renderer.shadowMap.enabled = quality.shadowsEnabled;
        sunLight.castShadow = quality.shadowsEnabled;
        if (sunLight.shadow.mapSize.width !== quality.shadowSize) {
            sunLight.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
            if (sunLight.shadow.map) {
                sunLight.shadow.map.dispose();
                sunLight.shadow.map = null;
            }
        }
        const ex = quality.shadowExtent;
        sunLight.shadow.camera.left = -ex;
        sunLight.shadow.camera.right = ex;
        sunLight.shadow.camera.top = ex;
        sunLight.shadow.camera.bottom = -ex;
        sunLight.shadow.camera.updateProjectionMatrix();
        bloomPass.enabled = quality.bloomEnabled;
        resize(nextScale !== null ? nextScale : quality.maxResScale);
    };

    const warmShaders = async () => {
        if (lost) return;
        try {
            if (typeof renderer.compileAsync === "function") {
                await renderer.compileAsync(scene, camera);
            } else {
                renderer.compile(scene, camera);
            }
        } catch {
            renderer.compile(scene, camera);
        }
    };

    const updateAtmosphere = (timeOfDay, rainIntensity, focusPos) => {
        const m = computeMoodPalette(timeOfDay, rainIntensity);
        skyUniforms.uTopColor.value.copy(m.top);
        skyUniforms.uHorizonColor.value.copy(m.horizon);
        skyUniforms.uSunDir.value.copy(m.sunDir);
        skyUniforms.uSunColor.value.copy(m.sunColor);
        skyUniforms.uNight.value = m.night;

        scene.fog.color.copy(m.fogColor);
        const farFog = quality.farClip < 420 ? 0.00185 : 0.00138;
        scene.fog.density = farFog + rainIntensity * 0.0012 + m.night * 0.00055;

        hemiLight.color.copy(m.horizon);
        hemiLight.intensity = 0.24 + m.day * 0.36 - rainIntensity * 0.08;
        sunLight.color.copy(m.sunColor);
        sunLight.intensity = (0.22 + m.day * 1.48 + m.sunset * 0.22) * (1 - rainIntensity * 0.42);
        renderer.toneMappingExposure = 0.86 - m.sunset * 0.04 + m.night * 0.02;
        bloomPass.threshold = 1.62 - m.night * 0.56;
        bloomPass.strength = 0.06 + m.sunset * 0.03 + m.night * 0.16;
        bloomPass.radius = 0.22;

        if (focusPos) {
            skyDome.position.set(focusPos.x, 0, focusPos.z);
            const snap = 4;
            const sx = Math.round(focusPos.x / snap) * snap;
            const sz = Math.round(focusPos.z / snap) * snap;
            sunLight.target.position.set(sx, focusPos.y || 0, sz);
            sunLight.position.set(
                sx + m.sunDir.x * 155,
                (focusPos.y || 0) + Math.max(28, m.sunDir.y * 155),
                sz + m.sunDir.z * 155
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
            const baseBg = wantKey === "night" ? 0.52 : wantKey === "sunset" ? 0.72 : 0.84;
            const baseEnv = wantKey === "night" ? 0.38 : wantKey === "sunset" ? 0.52 : 0.62;
            scene.backgroundIntensity = Math.max(0.28, baseBg - rainIntensity * 0.22);
            scene.environmentIntensity = Math.max(0.24, baseEnv - rainIntensity * 0.14);
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
        if (quality.bloomEnabled) {
            composer.render();
        } else {
            renderer.render(scene, camera);
        }
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
        setQuality,
        warmShaders,
        resize,
        updateAtmosphere,
        render,
        getScale: () => renderScale,
        getQuality: () => quality.key,
        isLost: () => lost,
        dispose
    };
}
