// ============================================================
// MÓDULO 4: Costo Acumulado y Pérdida del Poder Adquisitivo
// Métodos: Trapecio, Simpson 1/3, Simpson 3/8
// ============================================================
 
const Modulo4 = (() => {
 
    // ── Generación de precios diarios ──────────────────────────
    function generarPrecios(productoConfig, dias = 30) {
        const precios = [];
        for (let d = 0; d <= dias; d++) {
            const t = d / dias;
            // Crecimiento no lineal con ruido
            const precio = productoConfig.precioBase *
                (1 + productoConfig.tasaCrecimiento * t +
                    productoConfig.volatilidad * Math.sin(3 * Math.PI * t) * 0.1 +
                    productoConfig.volatilidad * (Math.random() - 0.5) * 0.05);
            precios.push(+precio.toFixed(4));
        }
        return precios;
    }
 
    // ── Regla del Trapecio ─────────────────────────────────────
    function trapecio(y, h) {
        const n = y.length - 1;
        let suma = y[0] + y[n];
        for (let i = 1; i < n; i++) suma += 2 * y[i];
        return (h / 2) * suma;
    }
 
    // ── Simpson 1/3 (n debe ser par) ───────────────────────────
    function simpson13(y, h) {
        const n = y.length - 1;
        if (n % 2 !== 0) return null;
        let suma = y[0] + y[n];
        for (let i = 1; i < n; i++) {
            suma += (i % 2 === 0 ? 2 : 4) * y[i];
        }
        return (h / 3) * suma;
    }
 
    // ── Simpson 3/8 (n debe ser múltiplo de 3) ─────────────────
    function simpson38(y, h) {
        const n = y.length - 1;
        if (n % 3 !== 0) return null;
        let suma = y[0] + y[n];
        for (let i = 1; i < n; i++) {
            suma += (i % 3 === 0 ? 2 : 3) * y[i];
        }
        return (3 * h / 8) * suma;
    }
 
    // ── Calcular gasto estable (precio fijo) ───────────────────
    function gastoEstable(precios, h) {
        const precioInicial = precios[0];
        const precioProm = precios.reduce((a, b) => a + b, 0) / precios.length;
        const n = precios.length - 1;
        return {
            inicial: precioInicial * n * h,
            promedio: precioProm * n * h
        };
    }
 
    // ── Runner principal ───────────────────────────────────────
    function calcular(params) {
        const DIAS = 30;
        const H = 1; // paso = 1 día
 
        const productos = [
            { nombre: 'Arroz (kg)',       precioBase: params.precioArroz,    tasaCrecimiento: params.tasaArroz,    volatilidad: 0.3 },
            { nombre: 'Aceite (lt)',      precioBase: params.precioAceite,   tasaCrecimiento: params.tasaAceite,   volatilidad: 0.4 },
            { nombre: 'Azúcar (kg)',      precioBase: params.precioAzucar,   tasaCrecimiento: params.tasaAzucar,   volatilidad: 0.2 },
            { nombre: 'Pan (unidad)',     precioBase: params.precioPan,      tasaCrecimiento: params.tasaPan,      volatilidad: 0.25 },
            { nombre: 'Leche (lt)',       precioBase: params.precioLeche,    tasaCrecimiento: params.tasaLeche,    volatilidad: 0.2 },
        ];
 
        const resultados = productos.map(prod => {
            const precios = generarPrecios(prod, DIAS);
            const trap = trapecio(precios, H);
            const s13  = simpson13(precios, H);
            const s38  = simpson38(precios, H);
            const estable = gastoEstable(precios, H);
            const gastoReal = trap; // trapecio como referencia
            const perdida = gastoReal - estable.inicial;
            const pctPerdida = (perdida / estable.inicial) * 100;
 
            return {
                nombre: prod.nombre,
                precios,
                precioFinal: precios[DIAS],
                precioInicial: precios[0],
                trap: +trap.toFixed(4),
                s13: s13 !== null ? +s13.toFixed(4) : null,
                s38: s38 !== null ? +s38.toFixed(4) : null,
                gastoEstable: +estable.inicial.toFixed(4),
                perdida: +perdida.toFixed(4),
                pctPerdida: +pctPerdida.toFixed(2),
            };
        });
 
        const totalGastoReal   = resultados.reduce((a, r) => a + r.trap, 0);
        const totalGastoEstable = resultados.reduce((a, r) => a + r.gastoEstable, 0);
        const totalPerdida     = totalGastoReal - totalGastoEstable;
        const pctTotalPerdida  = (totalPerdida / totalGastoEstable) * 100;
 
        return {
            resultados,
            resumen: {
                totalGastoReal: +totalGastoReal.toFixed(2),
                totalGastoEstable: +totalGastoEstable.toFixed(2),
                totalPerdida: +totalPerdida.toFixed(2),
                pctTotalPerdida: +pctTotalPerdida.toFixed(2),
                ingresoFamiliar: params.ingresoFamiliar,
                pctIngresoAfectado: +((totalGastoReal / params.ingresoFamiliar) * 100).toFixed(2),
            }
        };
    }
 
    return { calcular };
})();
