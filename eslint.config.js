import js from "@eslint/js";
export default [
    { ignores: ["vendor/**"] },
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                window: "readonly",
                document: "readonly",
                console: "readonly",
                fetch: "readonly",
                AbortController: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                requestAnimationFrame: "readonly",
                cancelAnimationFrame: "readonly",
                URL: "readonly",
                Date: "readonly",
                Math: "readonly",
                String: "readonly",
                JSON: "readonly",
                TextDecoder: "readonly",
                localStorage: "readonly",
                navigator: "readonly",
                Blob: "readonly",
                marked: "readonly",
                DOMPurify: "readonly",
                katex: "readonly",
                hljs: "readonly",
                history: "readonly",
                performance: "readonly",
                IntersectionObserver: "readonly",
                MutationObserver: "readonly",
                math: "readonly"
            }
        },
        rules: {
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            "no-undef": "error",
            "no-empty": ["error", { "allowEmptyCatch": true }],
            "preserve-caught-error": "off",
            "no-useless-assignment": "off"
        }
    }
];