// js/modulo2.js

// Variable global para Chart
let edoChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    const btnSimular = document.getElementById('btnSimularEdo');
    if(btnSimular) {
        btnSimular.addEventListener('click', runEDOSimulation);
    }
});

// --- LÓGICA DE LA ECUACIÓN DIFERENCIAL ---
// Función f(t, R) = R' = Entrada - Consumo_real - Pérdidas
function f_edo(t, R, params) {
    const E = params.entrada;
    const C = params.consumoBase;
    const P = params.panico / 100;
    
    // El consumo incluye el factor de pánico
    let consumo = C * (1 + P);
    
    // Pérdidas por evaporación o filtración del 1% de la reserva actual
    // Esto hace que la EDO dependa de R y muestre diferencia entre Euler y RK4
    let perdidas = 0.01 * R; 
    
    return E - consumo - perdidas;
}

// --- MÉTODOS NUMÉRICOS (EDO) ---

// 1. Método de Euler
function eulerMethod(f, R0, t0, tf, h, params) {
    let t = [t0];
    let R = [R0];
    let derivs = [f(t0, R0, params)];
    
    let n = Math.ceil((tf - t0) / h);
    
    for (let i = 0; i < n; i++) {
        let t_curr = t[i];
        let r_curr = R[i];
        
        // R_{i+1} = R_i + h * f(t_i, R_i)
        let pendiente = f(t_curr, r_curr, params);
        let r_next = r_curr + h * pendiente;
        let t_next = t_curr + h;
        
        // Evitar reservas negativas físicamente imposibles
        if (r_next < 0) r_next = 0;
        
        t.push(t_next);
        R.push(r_next);
        derivs.push(f(t_next, r_next, params));
        
        if (r_next === 0) break; // Si se vacía, terminamos temprano
    }
    
    return { t, R, derivs };
}

// 2. Método de Heun (Euler Mejorado)
function heunMethod(f, R0, t0, tf, h, params) {
    let t = [t0];
    let R = [R0];
    let derivs = [f(t0, R0, params)];
    
    let n = Math.ceil((tf - t0) / h);
    
    for (let i = 0; i < n; i++) {
        let t_curr = t[i];
        let r_curr = R[i];
        
        // Pendiente inicial
        let k1 = f(t_curr, r_curr, params);
        
        // Predicción (Euler)
        let r_pred = r_curr + h * k1;
        let t_next = t_curr + h;
        
        // Pendiente en predicción
        let k2 = f(t_next, r_pred, params);
        
        // Corrección
        let r_next = r_curr + (h / 2) * (k1 + k2);
        
        if (r_next < 0) r_next = 0;
        
        t.push(t_next);
        R.push(r_next);
        derivs.push(f(t_next, r_next, params));
        
        if (r_next === 0) break;
    }
    
    return { t, R, derivs };
}

// 3. Método de Runge-Kutta de 4to Orden (RK4)
function rk4Method(f, R0, t0, tf, h, params) {
    let t = [t0];
    let R = [R0];
    let derivs = [f(t0, R0, params)];
    
    let n = Math.ceil((tf - t0) / h);
    
    for (let i = 0; i < n; i++) {
        let t_curr = t[i];
        let r_curr = R[i];
        
        let k1 = f(t_curr, r_curr, params);
        let k2 = f(t_curr + h/2, r_curr + (h/2)*k1, params);
        let k3 = f(t_curr + h/2, r_curr + (h/2)*k2, params);
        let k4 = f(t_curr + h, r_curr + h*k3, params);
        
        let r_next = r_curr + (h / 6) * (k1 + 2*k2 + 2*k3 + k4);
        let t_next = t_curr + h;
        
        if (r_next < 0) r_next = 0;
        
        t.push(t_next);
        R.push(r_next);
        derivs.push(f(t_next, r_next, params));
        
        if (r_next === 0) break;
    }
    
    return { t, R, derivs };
}


// --- ORQUESTADOR ---
function runEDOSimulation() {
    // 1. Obtener datos
    const R0 = parseFloat(document.getElementById('r0').value);
    const entrada = parseFloat(document.getElementById('entrada').value);
    const consumoBase = parseFloat(document.getElementById('consumo').value);
    const panico = parseFloat(document.getElementById('panico').value);
    const diasTotales = parseFloat(document.getElementById('dias').value);
    const h = parseFloat(document.getElementById('paso').value);
    const metodo = document.getElementById('metodoEdo').value;

    if (h <= 0 || diasTotales <= 0) {
        alert("El paso (h) y los días totales deben ser mayores a 0.");
        return;
    }

    const params = { entrada, consumoBase, panico };
    const t0 = 0;
    
    document.getElementById('resultsSection').classList.remove('d-none');

    // 2. Ejecutar método seleccionado
    let resultados;
    switch(metodo) {
        case 'euler':
            resultados = eulerMethod(f_edo, R0, t0, diasTotales, h, params);
            break;
        case 'heun':
            resultados = heunMethod(f_edo, R0, t0, diasTotales, h, params);
            break;
        case 'rk4':
            resultados = rk4Method(f_edo, R0, t0, diasTotales, h, params);
            break;
    }

    // 3. Renderizar Gráfico y Tabla
    const nivelCritico = R0 * 0.15; // Nivel crítico al 15% de R0
    renderEDOChart(resultados.t, resultados.R, nivelCritico, metodo);
    renderEDOTable(resultados.t, resultados.R, resultados.derivs, nivelCritico);
    generateEDOInterpretation(resultados.t, resultados.R, nivelCritico, metodo, h, params);
}

// --- ACTUALIZACIÓN DE INTERFAZ ---
function renderEDOTable(t_arr, r_arr, d_arr, nivelCritico) {
    const tbody = document.getElementById('edoTableBody');
    tbody.innerHTML = '';
    
    for(let i = 0; i < t_arr.length; i++) {
        let t = t_arr[i];
        let r = r_arr[i];
        let d = d_arr[i];
        
        let rowClass = '';
        let statusText = 'Normal';
        
        if (r <= 0) {
            rowClass = 'table-dark text-white';
            statusText = 'VACIADO TOTAL';
        } else if (r < nivelCritico) {
            rowClass = 'table-danger';
            statusText = 'CRÍTICO';
        } else if (r < nivelCritico * 2) {
            rowClass = 'table-warning';
            statusText = 'Advertencia';
        }
        
        let tr = document.createElement('tr');
        if (rowClass) tr.className = rowClass;
        
        tr.innerHTML = `
            <td>Día ${t.toFixed(2)}</td>
            <td class="fw-bold">${r.toFixed(2)}</td>
            <td>${d.toFixed(2)}</td>
            <td>${statusText}</td>
        `;
        tbody.appendChild(tr);
    }
}

// --- GRAFICO CON CHART.JS ---
function renderEDOChart(t_arr, r_arr, nivelCritico, metodoName) {
    const ctx = document.getElementById('edoChart').getContext('2d');
    
    if (edoChartInstance) {
        edoChartInstance.destroy();
    }
    
    let labelMethod = metodoName.toUpperCase();

    // Requerimos chartjs-plugin-annotation que hemos importado en HTML
    edoChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: t_arr.map(t => t.toFixed(1)),
            datasets: [{
                label: `Reserva R(t) - Método: ${labelMethod}`,
                data: r_arr,
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderWidth: 3,
                pointRadius: 3,
                fill: true,
                tension: 0.2 // Suavizado de la curva
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeInOutCubic'
            },
            scales: {
                x: {
                    title: { display: true, text: 'Tiempo (Días)' }
                },
                y: {
                    title: { display: true, text: 'Volumen de Reserva (Barriles)' },
                    min: 0
                }
            },
            plugins: {
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: nivelCritico,
                            yMax: nivelCritico,
                            borderColor: 'red',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                                content: 'Límite Crítico (15%)',
                                enabled: true,
                                position: 'end',
                                backgroundColor: 'rgba(255, 0, 0, 0.7)'
                            }
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Reserva: ' + context.raw.toFixed(2) + ' bbls';
                        }
                    }
                }
            }
        }
    });
}

// --- INTERPRETACIÓN DINÁMICA ---
function generateEDOInterpretation(t_arr, r_arr, nivelCritico, metodo, h, params) {
    const interBox = document.getElementById('interpretationBox');
    
    // Buscar el día en que se cruza la línea crítica
    let diaCritico = -1;
    for(let i=0; i<r_arr.length; i++) {
        if(r_arr[i] < nivelCritico) {
            diaCritico = t_arr[i];
            break;
        }
    }
    
    let diaVaciado = -1;
    if (r_arr[r_arr.length-1] === 0) {
        diaVaciado = t_arr[t_arr.length-1];
    }
    
    let texto = `<h5 class="fw-bold mb-3"><i class="bi bi-clipboard-data"></i> Respuestas de la Simulación</h5>`;
    texto += `<ul class="list-group list-group-flush" style="background: transparent;">`;

    // 1. ¿En cuántos días la reserva llega a un nivel crítico?
    let respuesta1 = diaCritico !== -1 
        ? `La reserva llega a su nivel crítico (${nivelCritico.toFixed(0)} unidades) en el <strong>día ${diaCritico.toFixed(2)}</strong>. ` + (diaVaciado !== -1 ? `El vaciado total se da en el día ${diaVaciado.toFixed(2)}.` : '')
        : `Durante el periodo simulado, la reserva se mantuvo por encima del nivel crítico. El sistema logró estabilizarse.`;
    texto += `<li class="list-group-item bg-transparent"><strong>1. ¿En cuántos días la reserva llega a un nivel crítico?</strong><br>${respuesta1}</li>`;

    // 2. ¿Qué pasa si aumenta el consumo diario?
    let consumoActual = (params.consumoBase * (1 + params.panico)).toFixed(0);
    texto += `<li class="list-group-item bg-transparent"><strong>2. ¿Qué pasa si aumenta el consumo diario?</strong><br>
    Actualmente el consumo total (con pánico) es de ${consumoActual} unid/día. Si aumenta, la pendiente de la curva se vuelve más pronunciada hacia abajo (negativa), acelerando exponencialmente el tiempo en llegar al colapso y vaciado total.</li>`;

    // 3. ¿Qué pasa si se reduce el abastecimiento?
    texto += `<li class="list-group-item bg-transparent"><strong>3. ¿Qué pasa si se reduce el abastecimiento?</strong><br>
    Si la entrada diaria (actualmente ${params.entrada} unid/día) disminuye por debajo del consumo, la derivada <em>R'(t)</em> se hace fuertemente negativa. La planta dependerá enteramente de su reserva inicial <em>R0</em>, la cual se drenará sin capacidad de reposición.</li>`;

    // 4. ¿Qué método da una aproximación más estable?
    texto += `<li class="list-group-item bg-transparent"><strong>4. ¿Qué método da una aproximación más estable?</strong><br>
    El método de <strong>Runge-Kutta de 4to Orden (RK4)</strong> es el más estable y matemáticamente fiel al comportamiento real, ya que amortigua los errores de truncamiento paso a paso, a diferencia de métodos de orden inferior.</li>`;

    // 5. ¿Cuál es la diferencia entre Euler, Heun y RK4?
    texto += `<li class="list-group-item bg-transparent"><strong>5. ¿Cuál es la diferencia entre Euler, Heun y RK4?</strong><br>
    <strong>Euler</strong> proyecta con una sola pendiente inicial (muy impreciso si el paso <em>h</em> es grande). <strong>Heun</strong> mejora promediando la pendiente inicial y final (2do orden). <strong>RK4</strong> promedia cuatro pendientes dentro del intervalo, logrando una altísima precisión para modelar dinámicas de agotamiento.</li>`;

    texto += `</ul>`;

    interBox.className = 'alert alert-info interpretation-box mb-4 flex-grow-1';
    interBox.innerHTML = texto;
}
