import js from "@eslint/js";
export default [
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
                hljs: "readonly"
            }
        },
        rules: {
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            "no-undef": "error"
        }
    }
];
