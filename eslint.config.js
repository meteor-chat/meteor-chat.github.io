export default [
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                window: "readonly",
                document: "readonly",
                navigator: "readonly",
                console: "readonly",
                fetch: "readonly",
                requestAnimationFrame: "readonly",
                cancelAnimationFrame: "readonly",
                setTimeout: "readonly",
                FileReader: "readonly",
                Image: "readonly",
                TextDecoder: "readonly",
                AbortController: "readonly",
                marked: "readonly",
                katex: "readonly",
                hljs: "readonly",
                DOMPurify: "readonly",
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error"
        }
    }
];
