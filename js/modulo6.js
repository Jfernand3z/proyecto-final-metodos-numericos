// ============================================================
// MÓDULO 6: Rumores de Desabastecimiento y Pánico en la Red
// Sistemas de ecuaciones lineales — Número de condición
// ============================================================
 
const Modulo6 = (() => {
 
    // ── Álgebra matricial básica ───────────────────────────────
 
    function matMul(A, B) {
        const n = A.length, m = B[0].length, p = B.length;
        return Array.from({ length: n }, (_, i) =>
            Array.from({ length: m }, (_, j) =>
                A[i].reduce((s, _, k) => s + A[i][k] * B[k][j], 0)));
    }
 
    function matVec(A, x) {
        return A.map(row => row.reduce((s, a, j) => s + a * x[j], 0));
    }
 
    function vecNorm(v) {
        return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    }
 
    function matNorm(A) { // norma de Frobenius
        return Math.sqrt(A.flat().reduce((s, x) => s + x * x, 0));
    }
 
    // ── Eliminación gaussiana con pivoteo parcial ──────────────
    function gaussianElimination(A, b) {
        const n = A.length;
        const M = A.map((row, i) => [...row, b[i]]);
        const pivotOrder = [];
 
        for (let col = 0; col < n; col++) {
            // Pivoteo parcial
            let maxVal = Math.abs(M[col][col]), maxRow = col;
            for (let row = col + 1; row < n; row++) {
                if (Math.abs(M[row][col]) > maxVal) { maxVal = Math.abs(M[row][col]); maxRow = row; }
            }
            [M[col], M[maxRow]] = [M[maxRow], M[col]];
            pivotOrder.push({ col, pivotFila: maxRow, valor: +maxVal.toFixed(6) });
 
            if (Math.abs(M[col][col]) < 1e-12) return { error: 'Sistema singular o casi singular.' };
 
            for (let row = col + 1; row < n; row++) {
                const factor = M[row][col] / M[col][col];
                for (let j = col; j <= n; j++) M[row][j] -= factor * M[col][j];
            }
        }
 
        // Sustitución hacia atrás
        const x = new Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            x[i] = M[i][n];
            for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j];
            x[i] /= M[i][i];
        }
        return { x, pivotOrder };
    }
 
    // ── Número de condición (aproximado via método de la potencia) ──
    function numeroCond(A) {
        // Norma 1 (máxima suma de columnas) para aproximar cond
        const n = A.length;
        // ||A||_1
        let normA = 0;
        for (let j = 0; j < n; j++) {
            let s = 0;
            for (let i = 0; i < n; i++) s += Math.abs(A[i][j]);
            if (s > normA) normA = s;
        }
        // Invertir A para ||A^-1||_1 usando Gauss con columnas identidad
        const invA = [];
        for (let k = 0; k < n; k++) {
            const ek = Array(n).fill(0); ek[k] = 1;
            const res = gaussianElimination(A.map(r => [...r]), ek);
            if (res.error) return { cond: Infinity, normA, normInvA: Infinity };
            invA.push(res.x);
        }
        // invA está en filas (fila k = col k de A^-1), hay que transponer
        const invAT = Array.from({ length: n }, (_, i) => invA.map(row => row[i]));
        let normInvA = 0;
        for (let j = 0; j < n; j++) {
            let s = 0;
            for (let i = 0; i < n; i++) s += Math.abs(invAT[i][j]);
            if (s > normInvA) normInvA = s;
        }
        return { cond: +(normA * normInvA).toFixed(4), normA: +normA.toFixed(4), normInvA: +normInvA.toFixed(4) };
    }
 
    // ── Construir sistema según nivel de rumor ─────────────────
    function construirSistema(params) {
        const { nivelRumor, demandaBase, stock } = params;
 
        const factorRumor = { bajo: 1.0, medio: 1.5, alto: 2.5 }[nivelRumor] || 1.0;
        const perturbacion = { bajo: 0.01, medio: 0.05, alto: 0.20 }[nivelRumor] || 0.01;
 
        // Sistema: distribución de stock entre 4 zonas
        // A * x = b  donde x = [zona1, zona2, zona3, zona4]
        // Coeficientes representan dependencia inter-zona (cadena de suministro)
        const A = [
            [4.0,             -1.0,              0.5 * factorRumor, -0.2],
            [-1.0 * factorRumor, 3.5,            -1.0,              0.3 * factorRumor],
            [0.3,             -1.0 * factorRumor, 4.2,             -1.5],
            [-0.1,             0.2 * factorRumor, -1.2,             3.8],
        ];
 
        const b = [
            demandaBase * factorRumor,
            demandaBase * 0.9 * factorRumor,
            demandaBase * 1.1,
            demandaBase * 0.8 * factorRumor,
        ];
 
        // Sistema perturbado (aumento del 5% de demanda representando el rumor)
        const bPert = b.map(v => v * (1 + perturbacion));
 
        return { A, b, bPert, factorRumor, perturbacion };
    }
 
    // ── Runner principal ───────────────────────────────────────
    function calcular(params) {
        const niveles = ['bajo', 'medio', 'alto'];
        const zonas = ['Zona Norte', 'Zona Sur', 'Zona Este', 'Zona Oeste'];
        const resultados = [];
 
        for (const nivel of niveles) {
            const { A, b, bPert, factorRumor, perturbacion } = construirSistema({ ...params, nivelRumor: nivel });
            const solOriginal = gaussianElimination(A.map(r => [...r]), [...b]);
            const solPerturbada = gaussianElimination(A.map(r => [...r]), [...bPert]);
            const condInfo = numeroCond(A.map(r => [...r]));
 
            let sensibilidad = null;
            if (!solOriginal.error && !solPerturbada.error) {
                const dx = solOriginal.x.map((v, i) => solPerturbada.x[i] - v);
                const normDx = vecNorm(dx);
                const normX  = vecNorm(solOriginal.x);
                const normDb = vecNorm(b.map((v, i) => bPert[i] - v));
                const normB  = vecNorm(b);
                const errRelX = normX > 0 ? normDx / normX : 0;
                const errRelB = normB > 0 ? normDb / normB : 0;
                sensibilidad = {
                    errRelSolucion: +(errRelX * 100).toFixed(4),
                    errRelDemanda:  +(errRelB * 100).toFixed(4),
                    ratio: errRelB > 0 ? +(errRelX / errRelB).toFixed(4) : null
                };
            }
 
            resultados.push({
                nivel,
                factorRumor,
                perturbacion: +(perturbacion * 100).toFixed(0),
                A,
                b,
                bPert,
                distribucion: solOriginal.error ? null : solOriginal.x.map((v, i) => ({ zona: zonas[i], stock: +v.toFixed(4) })),
                distribucionPert: solPerturbada.error ? null : solPerturbada.x.map((v, i) => ({ zona: zonas[i], stock: +v.toFixed(4) })),
                condicion: condInfo,
                sensibilidad,
                error: solOriginal.error || null
            });
        }
 
        // Análisis comparativo
        const analisis = resultados.map(r => ({
            nivel: r.nivel,
            cond: r.condicion.cond,
            estabilidad: r.condicion.cond < 10 ? 'Estable' : r.condicion.cond < 100 ? 'Moderadamente sensible' : 'Altamente inestable',
            cambioStock: r.sensibilidad ? r.sensibilidad.errRelSolucion : null
        }));
 
        return { resultados, analisis, zonas };
    }
 
    return { calcular };
})();