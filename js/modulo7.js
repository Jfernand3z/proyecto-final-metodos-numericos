// ============================================================
// MÓDULO 7: Modelo de Difusión de Opinión / Descontento Social
// EDO Sistema: N(t), M(t), D(t)
// Métodos: Heun, Runge-Kutta 4to Orden
// ============================================================
 
const Modulo7 = (() => {
 
    // ── Sistema de EDOs ────────────────────────────────────────
    // dN/dt = -alpha*N*M + beta*M + gamma*D*M    (neutrales)
    // dM/dt =  alpha*N*M - beta*M - gamma*D*M    (manifestantes)
    // dD/dt =  delta*M - epsilon*D               (mediadores)
    //
    // alpha:   tasa de influencia por descontento (N→M)
    // beta:    tasa de retorno a neutralidad (M→N)
    // gamma:   efectividad del diálogo (M→N via D)
    // delta:   surgimiento de mediadores ante protesta (M→D)
    // epsilon: desgaste de mediadores
 
    function sistema(t, estado, params) {
        const { N, M, D } = estado;
        const { alpha, beta, gamma, delta, epsilon } = params;
        const total = N + M;
        const dN = -alpha * N * M / total + beta * M + gamma * D * M / total;
        const dM =  alpha * N * M / total - beta * M - gamma * D * M / total;
        const dD =  delta * M - epsilon * D;
        return { dN, dM, dD };
    }
 
    // ── Método de Heun ─────────────────────────────────────────
    function heun(params, estado0, tFin, h) {
        const puntos = [];
        let estado = { ...estado0 };
        let t = 0;
 
        while (t <= tFin + 1e-9) {
            puntos.push({ t: +t.toFixed(4), ...Object.fromEntries(Object.entries(estado).map(([k, v]) => [k, +v.toFixed(6)])) });
 
            const k1 = sistema(t, estado, params);
            const pred = {
                N: estado.N + h * k1.dN,
                M: estado.M + h * k1.dM,
                D: estado.D + h * k1.dD,
            };
            // Clamp negativos
            pred.N = Math.max(pred.N, 0);
            pred.M = Math.max(pred.M, 0);
            pred.D = Math.max(pred.D, 0);
 
            const k2 = sistema(t + h, pred, params);
            estado = {
                N: Math.max(estado.N + (h / 2) * (k1.dN + k2.dN), 0),
                M: Math.max(estado.M + (h / 2) * (k1.dM + k2.dM), 0),
                D: Math.max(estado.D + (h / 2) * (k1.dD + k2.dD), 0),
            };
            t = +(t + h).toFixed(10);
        }
        return puntos;
    }
 
    // ── Runge-Kutta 4to Orden ──────────────────────────────────
    function rk4(params, estado0, tFin, h) {
        const puntos = [];
        let estado = { ...estado0 };
        let t = 0;
 
        while (t <= tFin + 1e-9) {
            puntos.push({ t: +t.toFixed(4), ...Object.fromEntries(Object.entries(estado).map(([k, v]) => [k, +v.toFixed(6)])) });
 
            const k1 = sistema(t, estado, params);
 
            const e2 = {
                N: Math.max(estado.N + (h / 2) * k1.dN, 0),
                M: Math.max(estado.M + (h / 2) * k1.dM, 0),
                D: Math.max(estado.D + (h / 2) * k1.dD, 0),
            };
            const k2 = sistema(t + h / 2, e2, params);
 
            const e3 = {
                N: Math.max(estado.N + (h / 2) * k2.dN, 0),
                M: Math.max(estado.M + (h / 2) * k2.dM, 0),
                D: Math.max(estado.D + (h / 2) * k2.dD, 0),
            };
            const k3 = sistema(t + h / 2, e3, params);
 
            const e4 = {
                N: Math.max(estado.N + h * k3.dN, 0),
                M: Math.max(estado.M + h * k3.dM, 0),
                D: Math.max(estado.D + h * k3.dD, 0),
            };
            const k4 = sistema(t + h, e4, params);
 
            estado = {
                N: Math.max(estado.N + (h / 6) * (k1.dN + 2 * k2.dN + 2 * k3.dN + k4.dN), 0),
                M: Math.max(estado.M + (h / 6) * (k1.dM + 2 * k2.dM + 2 * k3.dM + k4.dM), 0),
                D: Math.max(estado.D + (h / 6) * (k1.dD + 2 * k2.dD + 2 * k3.dD + k4.dD), 0),
            };
            t = +(t + h).toFixed(10);
        }
        return puntos;
    }
 
    // ── Análisis de punto final ────────────────────────────────
    function analizar(puntos) {
        const fin = puntos[puntos.length - 1];
        const total = fin.N + fin.M + fin.D;
        const pctM = (fin.M / total) * 100;
        const pctN = (fin.N / total) * 100;
 
        const maxM = Math.max(...puntos.map(p => p.M));
        const tMaxM = puntos.find(p => p.M === maxM)?.t;
 
        let tendencia;
        const recientes = puntos.slice(-Math.min(20, puntos.length));
        const dMReciente = recientes[recientes.length - 1].M - recientes[0].M;
        if (Math.abs(dMReciente) < total * 0.01) tendencia = 'Estabilizado';
        else if (dMReciente > 0) tendencia = 'Escalando';
        else tendencia = 'Disminuyendo';
 
        return {
            estadoFinal: { N: +fin.N.toFixed(2), M: +fin.M.toFixed(2), D: +fin.D.toFixed(2) },
            pctManifestantes: +pctM.toFixed(2),
            pctNeutrales: +pctN.toFixed(2),
            picoManifestantes: +maxM.toFixed(2),
            tiempoPico: tMaxM,
            tendencia,
            riesgo: pctM > 50 ? 'ALTO' : pctM > 25 ? 'MEDIO' : 'BAJO'
        };
    }
 
    // ── Runner principal ───────────────────────────────────────
    function calcular(params) {
        const estado0 = {
            N: params.N0,
            M: params.M0,
            D: params.D0,
        };
 
        const edoParams = {
            alpha:   params.alpha,
            beta:    params.beta,
            gamma:   params.gamma,
            delta:   params.delta,
            epsilon: params.epsilon,
        };
 
        const tFin = params.tFin || 30;
        const h    = params.h    || 0.1;
 
        const puntosHeun = heun(edoParams, estado0, tFin, h);
        const puntosRK4  = rk4(edoParams,  estado0, tFin, h);
 
        // Escenarios hipotéticos
        const sinMediadores = rk4({ ...edoParams, delta: 0, gamma: 0 }, estado0, tFin, h);
        const mejorDialogo  = rk4({ ...edoParams, gamma: edoParams.gamma * 3 }, estado0, tFin, h);
 
        // Tabla comparativa (cada 5 pasos)
        const stride = Math.max(1, Math.floor(puntosRK4.length / 20));
        const tablaComparativa = puntosRK4
            .filter((_, i) => i % stride === 0)
            .map((p, i) => {
                const ph = puntosHeun[i * stride] || {};
                return {
                    t: p.t,
                    N_rk4: p.N, M_rk4: p.M, D_rk4: p.D,
                    N_heun: ph.N, M_heun: ph.M, D_heun: ph.D,
                    errM: ph.M !== undefined ? +Math.abs(p.M - ph.M).toFixed(6) : '-'
                };
            });
 
        return {
            puntosHeun,
            puntosRK4,
            sinMediadores,
            mejorDialogo,
            tablaComparativa,
            analisisRK4:  analizar(puntosRK4),
            analisisHeun: analizar(puntosHeun),
            analisisSinMed: analizar(sinMediadores),
            analisisMejDial: analizar(mejorDialogo),
        };
    }
 
    return { calcular };
})();