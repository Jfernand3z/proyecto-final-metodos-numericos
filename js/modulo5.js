// ============================================================
// MÓDULO 5: Umbrales Críticos de Abastecimiento
// Métodos: Bisección, Newton-Raphson, Secante
// ============================================================
 
const Modulo5 = (() => {
 
    const MAX_ITER = 100;
    const TOL_DEFAULT = 1e-6;
 
    // ── Bisección ──────────────────────────────────────────────
    function biseccion(f, a, b, tol = TOL_DEFAULT) {
        if (f(a) * f(b) > 0) return { error: 'f(a) y f(b) deben tener signos opuestos.' };
        const iteraciones = [];
        let iter = 0;
        let c, fa, fb, fc;
        fa = f(a); fb = f(b);
 
        while (iter < MAX_ITER) {
            c = (a + b) / 2;
            fc = f(c);
            const err = Math.abs(b - a) / 2;
            iteraciones.push({ iter: iter + 1, a: +a.toFixed(8), b: +b.toFixed(8), c: +c.toFixed(8), fc: +fc.toFixed(8), error: +err.toFixed(8) });
            if (Math.abs(fc) < tol || err < tol) break;
            if (fa * fc < 0) { b = c; fb = fc; }
            else            { a = c; fa = fc; }
            iter++;
        }
        return { raiz: +c.toFixed(8), iteraciones, metodo: 'Bisección' };
    }
 
    // ── Newton-Raphson ─────────────────────────────────────────
    function newtonRaphson(f, df, x0, tol = TOL_DEFAULT) {
        const iteraciones = [];
        let x = x0;
        for (let i = 0; i < MAX_ITER; i++) {
            const fx  = f(x);
            const dfx = df(x);
            if (Math.abs(dfx) < 1e-14) return { error: 'Derivada cercana a cero.' };
            const x1 = x - fx / dfx;
            const err = Math.abs(x1 - x);
            iteraciones.push({ iter: i + 1, x: +x.toFixed(8), fx: +fx.toFixed(8), dfx: +dfx.toFixed(8), x1: +x1.toFixed(8), error: +err.toFixed(8) });
            x = x1;
            if (err < tol) break;
        }
        return { raiz: +x.toFixed(8), iteraciones, metodo: 'Newton-Raphson' };
    }
 
    // ── Secante ────────────────────────────────────────────────
    function secante(f, x0, x1, tol = TOL_DEFAULT) {
        const iteraciones = [];
        let xa = x0, xb = x1;
        for (let i = 0; i < MAX_ITER; i++) {
            const fa = f(xa), fb = f(xb);
            if (Math.abs(fb - fa) < 1e-14) return { error: 'División por cero en secante.' };
            const xc = xb - fb * (xb - xa) / (fb - fa);
            const err = Math.abs(xc - xb);
            iteraciones.push({ iter: i + 1, x0: +xa.toFixed(8), x1: +xb.toFixed(8), x2: +xc.toFixed(8), fx2: +f(xc).toFixed(8), error: +err.toFixed(8) });
            xa = xb; xb = xc;
            if (err < tol) break;
        }
        return { raiz: +xb.toFixed(8), iteraciones, metodo: 'Secante' };
    }
 
    // ── Escenarios predefinidos ────────────────────────────────
 
    /**
     * Escenario A: Día exacto en que el costo acumulado supera el ingreso mensual.
     * Costo diario: c(t) = c0*(1 + alpha*t)   →   Costo acumulado: C(t) = c0*t + c0*alpha*t²/2
     * Raíz: C(t) - ingreso = 0
     */
    function escenarioCostoIngreso(params) {
        const { c0, alpha, ingreso } = params;
        const f  = t => c0 * t + c0 * alpha * t * t / 2 - ingreso;
        const df = t => c0 + c0 * alpha * t;
        // Curva para graficar
        const puntos = Array.from({ length: 100 }, (_, i) => {
            const t = (i / 99) * 60;
            return { t: +t.toFixed(2), y: +f(t).toFixed(4) };
        });
        return {
            titulo: 'Día en que el gasto supera el ingreso familiar',
            xLabel: 'Día (t)',
            yLabel: 'Gasto Acumulado − Ingreso (Bs.)',
            biseccion:      biseccion(f, 1, 60),
            newtonRaphson:  newtonRaphson(f, df, 30),
            secante:        secante(f, 1, 60),
            puntos,
            unidad: 'día'
        };
    }
 
    /**
     * Escenario B: Tasa de reposición necesaria para igualar consumo.
     * r(x) = consumo_diario - tasa_repo * x   →   raíz = tasa de equilibrio
     */
    function escenarioTasaReposicion(params) {
        const { consumo, stock0, dias } = params;
        // Stock(x) = stock0 + x*dias - consumo*dias   →   = 0
        const f  = x => stock0 + x * dias - consumo * dias;
        const df = x => dias;
        const puntos = Array.from({ length: 100 }, (_, i) => {
            const x = (i / 99) * consumo * 2;
            return { t: +x.toFixed(4), y: +f(x).toFixed(4) };
        });
        return {
            titulo: 'Tasa de reposición para igualar consumo de carburante',
            xLabel: 'Tasa de Reposición Diaria (unidades)',
            yLabel: 'Balance de Stock',
            biseccion:      biseccion(f, 0, consumo * 2),
            newtonRaphson:  newtonRaphson(f, df, consumo),
            secante:        secante(f, 0, consumo * 2),
            puntos,
            unidad: 'unidades/día'
        };
    }
 
    /**
     * Escenario C: Umbral de opinión que dispara una protesta masiva.
     * Modelo logístico: P(x) = L/(1+e^(-k*(x-x0))) - umbral_protesta
     */
    function escenarioProtesta(params) {
        const { k, x0, L, umbralProtesta } = params;
        const f  = x => L / (1 + Math.exp(-k * (x - x0))) - umbralProtesta;
        const df = x => { const e = Math.exp(-k * (x - x0)); return L * k * e / ((1 + e) ** 2); };
        const puntos = Array.from({ length: 100 }, (_, i) => {
            const x = (i / 99) * 100;
            return { t: +x.toFixed(2), y: +f(x).toFixed(6) };
        });
        return {
            titulo: 'Umbral de descontento que detonará protesta masiva',
            xLabel: 'Índice de Descontento (%)',
            yLabel: 'P(x) − Umbral de Protesta',
            biseccion:      biseccion(f, 0, 100),
            newtonRaphson:  newtonRaphson(f, df, 50),
            secante:        secante(f, 1, 99),
            puntos,
            unidad: '% descontento'
        };
    }
 
    // ── Runner principal ───────────────────────────────────────
    function calcular(tipo, params) {
        switch (tipo) {
            case 'costo_ingreso':   return escenarioCostoIngreso(params);
            case 'tasa_reposicion': return escenarioTasaReposicion(params);
            case 'protesta':        return escenarioProtesta(params);
            default:                return { error: 'Tipo de escenario no reconocido.' };
        }
    }
 
    return { calcular, biseccion, newtonRaphson, secante };
})();