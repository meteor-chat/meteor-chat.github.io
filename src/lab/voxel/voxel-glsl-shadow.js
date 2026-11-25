export const GLSL_SHADOW = `
uniform sampler2DShadow uShadowMap;
uniform mat4 uShadowMat;
uniform vec3 uShadowCenter;
uniform vec2 uShadowParams;

float sunShadow(vec3 worldPos, vec3 normal) {
    if (uSunDir.y <= -0.04) return 1.0;
    float texelWorld = uShadowParams.x * 2.0 * uShadowParams.y;
    vec4 sp = uShadowMat * vec4(worldPos + normal * texelWorld * 0.58, 1.0);
    vec3 sc = sp.xyz * 0.5 + 0.5;
    if (sc.x < 0.0 || sc.x > 1.0 || sc.y < 0.0 || sc.y > 1.0 || sc.z > 1.0) return 1.0;
    float ref = sc.z - 0.00045;
    float o = uShadowParams.x * 1.15;
    float sum = texture(uShadowMap, vec3(sc.xy + vec2(-o, -o), ref))
        + texture(uShadowMap, vec3(sc.xy + vec2(o, -o), ref))
        + texture(uShadowMap, vec3(sc.xy + vec2(-o, o), ref))
        + texture(uShadowMap, vec3(sc.xy + vec2(o, o), ref));
    float edge = smoothstep(0.76, 0.96, length(worldPos.xz - uShadowCenter.xz) / uShadowParams.y);
    return mix(sum * 0.25, 1.0, edge);
}
`;
