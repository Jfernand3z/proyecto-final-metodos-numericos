// app.js

// Variables globales para Chart
let resultChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    const btnSimular = document.getElementById('btnSimular');
    const btnBloqueo = document.getElementById('btnBloqueo');
    const methodSelect = document.getElementById('methodSelect');
    const omegaContainer = document.getElementById('omegaContainer');
    
    // Toggle omega input based on selected method
    methodSelect.addEventListener('change', (e) => {
        if (e.target.value === 'sor') {
            omegaContainer.classList.remove('d-none');
            omegaContainer.classList.add('d-block');
        } else {
            omegaContainer.classList.add('d-none');
            omegaContainer.classList.remove('d-block');
        }
    });

    btnSimular.addEventListener('click', runSimulation);
    btnBloqueo.addEventListener('click', triggerBlockade);
});

// --- LECTURA DE DATOS DEL DOM ---
function getMatrixFromDOM() {
    let A = [
        [parseFloat(document.getElementById('a00').value) || 0, parseFloat(document.getElementById('a01').value) || 0, parseFloat(document.getElementById('a02').value) || 0],
        [parseFloat(document.getElementById('a10').value) || 0, parseFloat(document.getElementById('a11').value) || 0, parseFloat(document.getElementById('a12').value) || 0],
        [parseFloat(document.getElementById('a20').value) || 0, parseFloat(document.getElementById('a21').value) || 0, parseFloat(document.getElementById('a22').value) || 0]
    ];
    return A;
}

function getVectorFromDOM() {
    return [
        parseFloat(document.getElementById('b0').value) || 0,
        parseFloat(document.getElementById('b1').value) || 0,
        parseFloat(document.getElementById('b2').value) || 0
    ];
}

// --- ORQUESTADOR PRINCIPAL ---
function runSimulation() {
    const A = getMatrixFromDOM();
    const b = getVectorFromDOM();
    const method = document.getElementById('methodSelect').value;
    
    document.getElementById('resultsSection').classList.remove('d-none');
    
    let result;
    if (method === 'gauss-seidel') {
        result = solveGaussSeidel(A, b, 1e-5, 100);
        renderIterations(result.iterations);
    } else if (method === 'jacobi') {
        result = solveJacobi(A, b, 1e-5, 100);
        renderIterations(result.iterations);
    } else if (method === 'sor') {
        const omega = parseFloat(document.getElementById('omegaInput').value) || 1.25;
        result = solveSOR(A, b, omega, 1e-5, 100);
        renderIterations(result.iterations);
    } else if (method === 'cg') {
        result = solveConjugateGradient(A, b, 1e-5, 100);
        renderIterations(result.iterations);
    } else if (method === 'lu') {
        result = solveLU(A, b);
        document.getElementById('iterationsContainer').classList.add('d-none');
    }

    if (result.errorFlag) {
        displayError(result.message);
        return;
    }

    const x = result.solution;
    renderResults(x);
    updateChart(x);
    generateInterpretation(x, method, result.iterations, A);
}

// --- MÉTODOS NUMÉRICOS (Lógica Pura JS) ---

// Método de Gauss-Seidel
function solveGaussSeidel(A, b, tol, maxIter) {
    const n = b.length;
    let x = new Array(n).fill(0);
    let iterations = [];
    
    for (let iter = 1; iter <= maxIter; iter++) {
        let x_old = [...x];
        let maxError = 0;
        
        for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let j = 0; j < n; j++) {
                if (j !== i) {
                    sum += A[i][j] * x[j];
                }
            }
            if (A[i][i] === 0) {
                return { errorFlag: true, message: "Error: Un elemento de la diagonal es 0. El método divergirá." };
            }
            x[i] = (b[i] - sum) / A[i][i];
            
            // Calcular error relativo
            let error = Math.abs((x[i] - x_old[i]) / x[i]) * 100 || 0;
            if (error > maxError) maxError = error;
        }
        
        iterations.push({
            iter: iter,
            x: [...x],
            error: maxError
        });
        
        if (maxError < tol * 100) break;
    }
    
    return { solution: x, iterations: iterations, errorFlag: false };
}

// Método de Jacobi
function solveJacobi(A, b, tol, maxIter) {
    const n = b.length;
    let x = new Array(n).fill(0);
    let iterations = [];
    
    for (let iter = 1; iter <= maxIter; iter++) {
        let x_new = new Array(n).fill(0);
        let maxError = 0;
        
        for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let j = 0; j < n; j++) {
                if (j !== i) {
                    sum += A[i][j] * x[j];
                }
            }
            if (A[i][i] === 0) {
                return { errorFlag: true, message: "Error: Un elemento de la diagonal es 0. El método divergirá." };
            }
            x_new[i] = (b[i] - sum) / A[i][i];
            
            let error = Math.abs((x_new[i] - x[i]) / x_new[i]) * 100 || 0;
            if (error > maxError) maxError = error;
        }
        
        x = [...x_new];
        iterations.push({ iter: iter, x: [...x], error: maxError });
        
        if (maxError < tol * 100) break;
    }
    
    return { solution: x, iterations: iterations, errorFlag: false };
}

// Descomposición LU (Método de Doolittle)
function solveLU(A, b) {
    const n = b.length;
    let L = Array.from({ length: n }, () => new Array(n).fill(0));
    let U = Array.from({ length: n }, () => new Array(n).fill(0));
    
    // Decomposición
    for (let i = 0; i < n; i++) {
        // Upper Triangular
        for (let k = i; k < n; k++) {
            let sum = 0;
            for (let j = 0; j < i; j++) sum += (L[i][j] * U[j][k]);
            U[i][k] = A[i][k] - sum;
        }
        // Lower Triangular
        for (let k = i; k < n; k++) {
            if (i === k) L[i][i] = 1; 
            else {
                let sum = 0;
                for (let j = 0; j < i; j++) sum += (L[k][j] * U[j][i]);
                if(U[i][i] === 0) return { errorFlag: true, message: "Error: Pivote cero en la descomposición LU." };
                L[k][i] = (A[k][i] - sum) / U[i][i];
            }
        }
    }
    
    // Resolver Ly = b (Forward substitution)
    let y = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < i; j++) sum += L[i][j] * y[j];
        y[i] = b[i] - sum;
    }
    
    // Resolver Ux = y (Backward substitution)
    let x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let j = i + 1; j < n; j++) sum += U[i][j] * x[j];
        x[i] = (y[i] - sum) / U[i][i];
    }
    
    return { solution: x, iterations: null, errorFlag: false };
}

// --- ACTUALIZACIÓN DE INTERFAZ ---

function renderResults(x) {
    document.getElementById('resX1').innerText = x[0].toFixed(2) + " unid.";
    document.getElementById('resX2').innerText = x[1].toFixed(2) + " unid.";
    document.getElementById('resX3').innerText = x[2].toFixed(2) + " unid.";
}

function renderIterations(iterations) {
    const container = document.getElementById('iterationsContainer');
    const tbody = document.getElementById('iterationsBody');
    tbody.innerHTML = '';
    
    if (!iterations) {
        container.classList.add('d-none');
        return;
    }
    
    container.classList.remove('d-none');
    iterations.forEach(it => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${it.iter}</td>
            <td>${it.x[0].toFixed(5)}</td>
            <td>${it.x[1].toFixed(5)}</td>
            <td>${it.x[2].toFixed(5)}</td>
            <td>${it.error.toFixed(4)} %</td>
        `;
        tbody.appendChild(tr);
    });
}

function displayError(msg) {
    const interBox = document.getElementById('interpretationBox');
    interBox.className = 'alert alert-danger interpretation-box mb-4';
    interBox.innerHTML = `<strong>¡Error de Sistema!</strong> ${msg} Verifica los coeficientes (por ejemplo, asegurar dominancia diagonal).`;
    
    document.getElementById('resX1').innerText = "---";
    document.getElementById('resX2').innerText = "---";
    document.getElementById('resX3').innerText = "---";
    
    if(resultChartInstance) resultChartInstance.destroy();
}

// --- GRAFICO CON CHART.JS ---
function updateChart(x) {
    const ctx = document.getElementById('resultsChart').getContext('2d');
    
    if (resultChartInstance) {
        resultChartInstance.destroy();
    }
    
    resultChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Planta 1 (-> Norte)', 'Planta 2 (-> Centro)', 'Planta 3 (-> Sur)'],
            datasets: [{
                label: 'Volumen a Despachar',
                data: [x[0], x[1], x[2]],
                backgroundColor: [
                    'rgba(67, 97, 238, 0.7)',
                    'rgba(25, 135, 84, 0.7)',
                    'rgba(13, 202, 240, 0.7)'
                ],
                borderColor: [
                    'rgba(67, 97, 238, 1)',
                    'rgba(25, 135, 84, 1)',
                    'rgba(13, 202, 240, 1)'
                ],
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.raw.toFixed(2) + ' unidades';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { borderDash: [5, 5] }
                }
            }
        }
    });
}

// --- INTERPRETACIÓN DINÁMICA ---
function generateInterpretation(x, method, iterations, A) {
    const interBox = document.getElementById('interpretationBox');
    
    // Determinar planta más exigida (vulnerabilidad)
    let maxVal = Math.max(...x);
    let plantaCritica = x.indexOf(maxVal) + 1;
    
    // Chequeo de estabilidad / Dominancia Diagonal Aproximada
    let isDominant = true;
    for(let i=0; i<3; i++) {
        let diag = Math.abs(A[i][i]);
        let sum = 0;
        for(let j=0; j<3; j++) { if(i!==j) sum += Math.abs(A[i][j]); }
        if(diag < sum) isDominant = false;
    }

    let b = getVectorFromDOM();
    let maxDemanda = Math.max(...b);
    let zonaCritica = b.indexOf(maxDemanda) === 0 ? "Norte" : (b.indexOf(maxDemanda) === 1 ? "Centro" : "Sur");

    let texto = `<h5 class="fw-bold mb-3"><i class="bi bi-clipboard-data"></i> Respuestas de la Simulación</h5>`;
    texto += `<ul class="list-group list-group-flush" style="background: transparent;">`;
    
    // 1. ¿Cuánto debe enviarse a cada zona/planta?
    texto += `<li class="list-group-item bg-transparent"><strong>1. ¿Cuánto debe despachar cada origen?</strong><br>
    Planta 1: ${x[0].toFixed(2)} u. | Planta 2: ${x[1].toFixed(2)} u. | Planta 3: ${x[2].toFixed(2)} u.</li>`;
    
    // 2. ¿Qué pasa si una ruta se bloquea?
    texto += `<li class="list-group-item bg-transparent"><strong>2. ¿Qué pasa si una ruta se bloquea?</strong><br>
    Al forzar un bloqueo (coeficiente tiende a 0), el sistema redistribuye abruptamente la carga a otras rutas, pudiendo generar sobrecarga o valores negativos (déficit). Puedes probar esto con el botón "Simular Bloqueo".</li>`;
    
    // 3. ¿Qué zona queda más afectada?
    texto += `<li class="list-group-item bg-transparent"><strong>3. ¿Qué zona queda más afectada?</strong><br>
    La <strong>Zona ${zonaCritica}</strong> (mayor demanda con ${maxDemanda} u.) y la <strong>Planta ${plantaCritica}</strong> (mayor despacho con ${maxVal.toFixed(2)} u.) son los puntos más críticos y vulnerables ante fallas.</li>`;

    // 4. ¿El sistema es estable o sensible a pequeños cambios?
    texto += `<li class="list-group-item bg-transparent"><strong>4. ¿El sistema es estable o sensible a pequeños cambios?</strong><br>
    ${isDominant ? 'El sistema es <strong>estable</strong> (presenta dominancia diagonal). Pequeños cambios en las rutas no alterarán drásticamente los despachos.' : 'El sistema es <strong>altamente sensible</strong> (no presenta dominancia diagonal estricta). Pequeños bloqueos pueden desestabilizar por completo la red.'}</li>`;

    // 5. ¿La solución cambia mucho si la demanda aumenta?
    texto += `<li class="list-group-item bg-transparent"><strong>5. ¿La solución cambia mucho si la demanda aumenta?</strong><br>
    ${isDominant ? 'No, al ser una matriz bien condicionada, un aumento en la demanda generará un incremento proporcional y predecible en los envíos.' : 'Sí, el sistema está mal condicionado; un aumento mínimo en la demanda podría requerir variaciones extremas y desproporcionadas en la capacidad de las plantas.'}</li>`;

    texto += `</ul>`;

    if (method !== 'lu') {
        texto += `<div class="mt-3 small text-muted"><i class="bi bi-info-circle"></i> Convergencia del Método (${method.toUpperCase()}): ${iterations.length} iteraciones.</div>`;
    } else {
        texto += `<div class="mt-3 small text-muted"><i class="bi bi-info-circle"></i> Convergencia del Método (LU): Solución directa exacta.</div>`;
    }
    
    interBox.className = 'alert alert-success interpretation-box mb-4';
    interBox.innerHTML = texto;
}

// --- SIMULACIÓN DE BLOQUEO (Conflicto Social) ---
function triggerBlockade() {
    // Escoger una ruta no principal al azar (i != j) para hacerla 0.001
    let indices = [
        [0, 1], [0, 2],
        [1, 0], [1, 2],
        [2, 0], [2, 1]
    ];
    let randomIndex = indices[Math.floor(Math.random() * indices.length)];
    
    let r = randomIndex[0];
    let c = randomIndex[1];
    
    let el = document.getElementById(`a${r}${c}`);
    
    // Animación visual para destacar el bloqueo
    el.style.backgroundColor = '#ffcccc';
    el.style.color = '#cc0000';
    el.style.fontWeight = 'bold';
    el.value = 0.001;
    
    setTimeout(() => {
        el.style.backgroundColor = '';
        el.style.color = '';
        el.style.fontWeight = '';
    }, 2000);
    
    // Notificar y re-ejecutar
    alert(`¡Alerta de Bloqueo! Se ha bloqueado la ruta de la Planta ${c+1} hacia la Zona ${r+1} (Coeficiente ~0). Recalculando...`);
    runSimulation();
}
