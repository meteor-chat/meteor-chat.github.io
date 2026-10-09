import { refs } from "./dom-refs.js";
export function calculateMath7() {
    if (!refs.m7Steps) return;
    refs.m7Steps.textContent = '';
    const p1 = refs.m7InP1 ? refs.m7InP1.value.trim() : '';
    const p2 = refs.m7InP2 ? refs.m7InP2.value.trim() : '';
    const type = refs.m7InType ? refs.m7InType.value : 'single';
    if (!p1 || !p2) return;
    const errDiv = document.createElement('div');
    errDiv.className = 'math-step-box math-step-error';
    if (p1.length !== p2.length) {
        errDiv.textContent = '\u274C Error: Panjang kromosom Parent 1 dan Parent 2 harus sama!';
        refs.m7Steps.appendChild(errDiv);
        return;
    }
    const n = p1.length;
    const stepDiv = document.createElement('div');
    stepDiv.className = 'math-step-box';
    const h3_1 = document.createElement('h3');
    h3_1.style.marginBottom = '8px';
    stepDiv.appendChild(h3_1);
    const createP = (label, spans) => {
        const p = document.createElement('p');
        p.style.fontFamily = 'monospace';
        p.style.fontSize = '1.1em';
        p.style.letterSpacing = '2px';
        const str = document.createElement('strong');
        str.textContent = label;
        p.appendChild(str);
        spans.forEach(s => {
            if(typeof s === 'string') {
                p.appendChild(document.createTextNode(s));
            } else {
                const sp = document.createElement('span');
                sp.style.color = s.color;
                sp.textContent = s.text;
                p.appendChild(sp);
            }
        });
        return p;
    };
    let o1Spans = [];
    let o2Spans = [];
    if (type === 'single') {
        const kStr = refs.m7InK ? refs.m7InK.value : '';
        if (kStr === '') return;
        const k = parseInt(kStr);
        if (k < 1 || k >= n) {
            errDiv.textContent = `\u274C Error: Titik potong (k) harus antara 1 dan ${n - 1}.`;
            refs.m7Steps.appendChild(errDiv);
            return;
        }
        h3_1.textContent = `\u2702\uFE0F 1. Single-point Crossover (k = ${k})`;
        stepDiv.appendChild(createP('P1: ', [{color: '#60a5fa', text: p1.substring(0, k)}, ' | ', {color: '#60a5fa', text: p1.substring(k)}]));
        const p2Node = createP('P2: ', [{color: '#34d399', text: p2.substring(0, k)}, ' | ', {color: '#34d399', text: p2.substring(k)}]);
        p2Node.style.marginBottom = '15px';
        stepDiv.appendChild(p2Node);
        o1Spans = [{color: '#60a5fa', text: p1.substring(0, k)}, {color: '#34d399', text: p2.substring(k)}];
        o2Spans = [{color: '#34d399', text: p2.substring(0, k)}, {color: '#60a5fa', text: p1.substring(k)}];
    } else if (type === 'two') {
        const k1Str = refs.m7InK1 ? refs.m7InK1.value : '';
        const k2Str = refs.m7InK2 ? refs.m7InK2.value : '';
        if (k1Str === '' || k2Str === '') return;
        const k1 = parseInt(k1Str);
        const k2 = parseInt(k2Str);
        if (k1 < 1 || k2 >= n || k1 >= k2) {
            errDiv.textContent = `\u274C Error: Titik potong tidak valid (1 \u2264 k1 < k2 < ${n}).`;
            refs.m7Steps.appendChild(errDiv);
            return;
        }
        h3_1.textContent = `\u2702\uFE0F 1. Two-point Crossover (k1 = ${k1}, k2 = ${k2})`;
        stepDiv.appendChild(createP('P1: ', [{color: '#60a5fa', text: p1.substring(0, k1)}, ' | ', {color: '#60a5fa', text: p1.substring(k1, k2)}, ' | ', {color: '#60a5fa', text: p1.substring(k2)}]));
        const p2Node = createP('P2: ', [{color: '#34d399', text: p2.substring(0, k1)}, ' | ', {color: '#34d399', text: p2.substring(k1, k2)}, ' | ', {color: '#34d399', text: p2.substring(k2)}]);
        p2Node.style.marginBottom = '15px';
        stepDiv.appendChild(p2Node);
        o1Spans = [{color: '#60a5fa', text: p1.substring(0, k1)}, {color: '#34d399', text: p2.substring(k1, k2)}, {color: '#60a5fa', text: p1.substring(k2)}];
        o2Spans = [{color: '#34d399', text: p2.substring(0, k1)}, {color: '#60a5fa', text: p1.substring(k1, k2)}, {color: '#34d399', text: p2.substring(k2)}];
    } else if (type === 'uniform') {
        const mask = refs.m7InMask ? refs.m7InMask.value.trim() : '';
        if (mask === '') return;
        if (mask.length !== n || !/^[01]+$/.test(mask)) {
            errDiv.textContent = `\u274C Error: Mask harus biner dengan panjang ${n}.`;
            refs.m7Steps.appendChild(errDiv);
            return;
        }
        h3_1.textContent = `\uD83C\uDFB2 1. Uniform Crossover (mask = ${mask})`;
        stepDiv.appendChild(createP('P1: ', [{color: '#60a5fa', text: p1}]));
        stepDiv.appendChild(createP('P2: ', [{color: '#34d399', text: p2}]));
        const maskNode = createP('Mask: ', [{color: '#fbbf24', text: mask}]);
        maskNode.style.marginBottom = '15px';
        stepDiv.appendChild(maskNode);
        for (let i = 0; i < n; i++) {
            if (mask[i] === '1') {
                o1Spans.push({color: '#60a5fa', text: p1[i]});
                o2Spans.push({color: '#34d399', text: p2[i]});
            } else {
                o1Spans.push({color: '#34d399', text: p2[i]});
                o2Spans.push({color: '#60a5fa', text: p1[i]});
            }
        }
    }
    const h3_2 = document.createElement('h3');
    h3_2.style.marginBottom = '8px';
    h3_2.textContent = '\uD83D\uDD00 2. Hasil Persilangan (Offspring)';
    stepDiv.appendChild(h3_2);
    stepDiv.appendChild(createP('O1: ', o1Spans));
    stepDiv.appendChild(createP('O2: ', o2Spans));
    refs.m7Steps.appendChild(stepDiv);
}
export function calculateMath8() {
    if (!refs.m8Steps) return;
    refs.m8Steps.textContent = '';
    const strA = refs.m8InA ? refs.m8InA.value.trim() : '';
    const strB = refs.m8InB ? refs.m8InB.value.trim() : '';
    if (!strA || !strB) return;
    const parseVec = (str) => {
        const parts = str.split(',').map(s => parseFloat(s.trim()));
        return parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) ? parts : null;
    };
    const vecA = parseVec(strA);
    const vecB = parseVec(strB);
    const errDiv = document.createElement('div');
    errDiv.className = 'math-step-box math-step-error';
    if (!vecA || !vecB) {
        errDiv.textContent = '\u274C Error: Format tidak valid! Gunakan format "f1,f2" contoh: 3,45';
        refs.m8Steps.appendChild(errDiv);
        return;
    }
    const stepDiv = document.createElement('div');
    stepDiv.className = 'math-step-box';
    const pTest = document.createElement('p');
    pTest.style.fontFamily = 'monospace';
    pTest.style.fontSize = '1.1em';
    pTest.style.marginBottom = '15px';
    const aLTE1 = vecA[0] <= vecB[0];
    const aLTE2 = vecA[1] <= vecB[1];
    const aLT1 = vecA[0] < vecB[0];
    const aLT2 = vecA[1] < vecB[1];
    const aDominatesB = (aLTE1 && aLTE2) && (aLT1 || aLT2);
    const bLTE1 = vecB[0] <= vecA[0];
    const bLTE2 = vecB[1] <= vecA[1];
    const bLT1 = vecB[0] < vecA[0];
    const bLT2 = vecB[1] < vecA[1];
    const bDominatesA = (bLTE1 && bLTE2) && (bLT1 || bLT2);
    const identical = (vecA[0] === vecB[0] && vecA[1] === vecB[1]);
    const title = document.createElement('h3');
    title.style.marginBottom = '10px';
    title.textContent = '⚖️ Uji Pareto Dominance (Minimisasi)';
    stepDiv.appendChild(title);
    let testStr = `Test A ≤ B: ${vecA[0]} ≤ ${vecB[0]} ➔ ${aLTE1 ? 'True' : 'False'}, ${vecA[1]} ≤ ${vecB[1]} ➔ ${aLTE2 ? 'True' : 'False'}`;
    pTest.innerHTML = testStr + '<br>' + `Test B ≤ A: ${vecB[0]} ≤ ${vecA[0]} ➔ ${bLTE1 ? 'True' : 'False'}, ${vecB[1]} ≤ ${vecA[1]} ➔ ${bLTE2 ? 'True' : 'False'}`;
    stepDiv.appendChild(pTest);
    const resDiv = document.createElement('div');
    resDiv.style.fontWeight = '600';
    resDiv.style.fontSize = '1.2em';
    resDiv.style.padding = '10px';
    resDiv.style.borderRadius = '8px';
    resDiv.style.marginTop = '15px';
    if (identical) {
        resDiv.style.backgroundColor = '#4b5563';
        resDiv.style.color = 'white';
        resDiv.textContent = 'Result: Neither dominates (Identical)';
    } else if (aDominatesB) {
        resDiv.style.backgroundColor = '#059669';
        resDiv.style.color = 'white';
        resDiv.textContent = 'Result: A dominates B';
    } else if (bDominatesA) {
        resDiv.style.backgroundColor = '#2563eb';
        resDiv.style.color = 'white';
        resDiv.textContent = 'Result: B dominates A';
    } else {
        resDiv.style.backgroundColor = '#dc2626';
        resDiv.style.color = 'white';
        resDiv.textContent = 'Result: Neither dominates (Incomparable)';
    }
    stepDiv.appendChild(resDiv);
    refs.m8Steps.appendChild(stepDiv);
}