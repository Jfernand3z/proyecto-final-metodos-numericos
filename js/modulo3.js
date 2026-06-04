// js/modulo3.js

// Variables Globales
let interpChartInstance = null;
let dataPoints = [
    { x: 1, y: 8 },
    { x: 5, y: 10 },
    { x: 10, y: 13 },
    { x: 15, y: 16 },
    { x: 20, y: 19 },
    { x: 30, y: 22 }
];

document.addEventListener('DOMContentLoaded', () => {
    renderTable();
    
    document.getElementById('btnAddPoint').addEventListener('click', addPoint);
    document.getElementById('btnCalcular').addEventListener('click', runInterpolation);
});

// --- GESTIÓN DE DATOS EN LA INTERFAZ ---

function renderTable() {
    // Ordenar los puntos por x (esencial para los métodos)
    dataPoints.sort((a, b) => a.x - b.x);
    
    const tbody = document.getElementById('dataBody');
    tbody.innerHTML = '';
    
    dataPoints.forEach((point, index) => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-bold">${point.x}</td>
            <td>
                <input type="number" step="any" class="form-control form-control-sm text-center td-input" 
                       value="${point.y}" onchange="updatePoint(${index}, this.value)">
            </td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deletePoint(${index})">
                    X
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updatePoint(index, newY) {
    dataPoints[index].y = parseFloat(newY) || 0;
}

function deletePoint(index) {
    if (dataPoints.length <= 3) {
        alert("Se necesitan al menos 3 puntos para generar una curva de interpolación razonable.");
        return;
    }
    dataPoints.splice(index, 1);
    renderTable();
}

function addPoint() {
    let nx = parseFloat(document.getElementById('newX').value);
    let ny = parseFloat(document.getElementById('newY').value);
    
    if (isNaN(nx) || isNaN(ny)) {
        alert("Ingrese valores numéricos válidos para el día y el precio.");
        return;
    }
    
    // Verificar si el día ya existe
    if (dataPoints.some(p => p.x === nx)) {
        alert("El día especificado ya existe en la tabla. Modifique el valor en la fila correspondiente.");
        return;
    }
    
    dataPoints.push({ x: nx, y: ny });
    document.getElementById('newX').value = '';
    document.getElementById('newY').value = '';
    renderTable();
}

// --- MÉTODOS NUMÉRICOS (INTERPOLACIÓN DESDE CERO) ---

// 1. Método de Lagrange
function lagrangeInterpolation(x_vals, y_vals, x) {
    let result = 0;
    let n = x_vals.length;
    
    for (let i = 0; i < n; i++) {
        let term = y_vals[i];
        for (let j = 0; j < n; j++) {
            if (i !== j) {
                term = term * (x - x_vals[j]) / (x_vals[i] - x_vals[j]);
            }
        }
        result += term;
    }
    return result;
}

// 2. Método de Newton (Diferencias Divididas)
function newtonInterpolation(x_vals, y_vals, x) {
    let n = x_vals.length;
    let coef = [...y_vals];
    
    // Calcular diferencias divididas iterativamente
    for (let j = 1; j < n; j++) {
        for (let i = n - 1; i >= j; i--) {
            coef[i] = (coef[i] - coef[i - 1]) / (x_vals[i] - x_vals[i - j]);
        }
    }
    
    // Evaluar el polinomio resultante
    let result = coef[n - 1];
    for (let i = n - 2; i >= 0; i--) {
        result = result * (x - x_vals[i]) + coef[i];
    }
    return result;
}

// 3. Método de Trazadores Cúbicos (Splines Naturales)
// Devuelve una función precomputada para evaluar cualquier x rápidamente
function buildCubicSplines(x_vals, y_vals) {
    let n = x_vals.length - 1;
    let a = [...y_vals];
    let h = [];
    for (let i = 0; i < n; i++) {
        h.push(x_vals[i+1] - x_vals[i]);
    }
    
    let alpha = [0];
    for (let i = 1; i < n; i++) {
        alpha[i] = (3 / h[i]) * (a[i+1] - a[i]) - (3 / h[i-1]) * (a[i] - a[i-1]);
    }
    
    let l = [1], mu = [0], z = [0];
    for (let i = 1; i < n; i++) {
        l[i] = 2 * (x_vals[i+1] - x_vals[i-1]) - h[i-1] * mu[i-1];
        mu[i] = h[i] / l[i];
        z[i] = (alpha[i] - h[i-1] * z[i-1]) / l[i];
    }
    
    l[n] = 1;
    z[n] = 0;
    
    let c = new Array(n+1).fill(0);
    let b = new Array(n).fill(0);
    let d = new Array(n).fill(0);
    
    for (let j = n - 1; j >= 0; j--) {
        c[j] = z[j] - mu[j] * c[j+1];
        b[j] = (a[j+1] - a[j]) / h[j] - h[j] * (c[j+1] + 2 * c[j]) / 3;
        d[j] = (c[j+1] - c[j]) / (3 * h[j]);
    }
    
    return function evaluateSpline(x) {
        // Extrapolación (Lineal / fallback) si está fuera de los bordes
        if (x <= x_vals[0]) {
            let dx = x - x_vals[0];
            return a[0] + b[0]*dx + c[0]*dx*dx + d[0]*dx*dx*dx;
        }
        if (x >= x_vals[n]) {
            let dx = x - x_vals[n-1];
            return a[n-1] + b[n-1]*dx + c[n-1]*dx*dx + d[n-1]*dx*dx*dx;
        }
        
        // Interpolación
        for (let i = 0; i < n; i++) {
            if (x >= x_vals[i] && x <= x_vals[i+1]) {
                let dx = x - x_vals[i];
                return a[i] + b[i]*dx + c[i]*dx*dx + d[i]*dx*dx*dx;
            }
        }
        return 0;
    };
}

// --- ORQUESTADOR ---
function runInterpolation() {
    let xTarget = parseFloat(document.getElementById('xToEstimate').value);
    if (isNaN(xTarget)) {
        alert("Ingrese un valor válido para el día a estimar.");
        return;
    }
    
    // Preparar vectores x e y
    let x_vals = dataPoints.map(p => p.x);
    let y_vals = dataPoints.map(p => p.y);
    
    let metodo = document.getElementById('metodoInterpolacion').value;
    let yEstimado = 0;
    let evalFunction = null;
    
    if (metodo === 'lagrange') {
        yEstimado = lagrangeInterpolation(x_vals, y_vals, xTarget);
        evalFunction = (x) => lagrangeInterpolation(x_vals, y_vals, x);
    } else if (metodo === 'newton') {
        yEstimado = newtonInterpolation(x_vals, y_vals, xTarget);
        evalFunction = (x) => newtonInterpolation(x_vals, y_vals, x);
    } else if (metodo === 'splines') {
        evalFunction = buildCubicSplines(x_vals, y_vals);
        yEstimado = evalFunction(xTarget);
    }
    
    // Actualizar UI
    document.getElementById('resultadoEstimado').classList.remove('d-none');
    document.getElementById('valorEstimado').innerText = yEstimado.toFixed(2) + " Bs";
    document.getElementById('resultsSection').classList.remove('d-none');
    
    // Generar Puntos para la curva (Paso de 0.2 días para que sea suave)
    let curveData = [];
    let minX = Math.min(...x_vals, xTarget) - 2;
    if(minX < 1) minX = 1;
    let maxX = Math.max(...x_vals, xTarget) + 2;
    
    for (let x = minX; x <= maxX; x += 0.2) {
        curveData.push({ x: x, y: evalFunction(x) });
    }
    
    let nombreProducto = document.getElementById('nombreProducto').value || 'Producto';
    renderInterpolationChart(dataPoints, curveData, {x: xTarget, y: yEstimado}, metodo, nombreProducto);
    generateInterpretation(metodo, x_vals, y_vals, xTarget, yEstimado, curveData, nombreProducto);
}

// --- GRÁFICO (CHART.JS) ---
function renderInterpolationChart(originalPts, curvePts, targetPt, metodo, nombreProducto) {
    const ctx = document.getElementById('interpChart').getContext('2d');
    
    if (interpChartInstance) {
        interpChartInstance.destroy();
    }
    
    // Formatear datos para scatter/line
    let scatterData = originalPts.map(p => ({x: p.x, y: p.y}));
    
    let methodNameMap = {
        'lagrange': 'Polinomio de Lagrange',
        'newton': 'Diferencias Divididas (Newton)',
        'splines': 'Splines Cúbicos'
    };

    interpChartInstance = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    type: 'line',
                    label: methodNameMap[metodo],
                    data: curvePts,
                    borderColor: '#2e7d32',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    tension: 0 // La curva ya viene generada suavemente
                },
                {
                    type: 'scatter',
                    label: 'Datos Discretos Base',
                    data: scatterData,
                    backgroundColor: '#4361ee',
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    type: 'scatter',
                    label: 'Punto Estimado',
                    data: [targetPt],
                    backgroundColor: '#ffb300',
                    borderColor: '#ff6f00',
                    borderWidth: 2,
                    pointRadius: 8,
                    pointStyle: 'rectRot' // Diamante
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: { display: true, text: 'Día del Mes' }
                },
                y: {
                    title: { display: true, text: `Precio de ${nombreProducto} (Bs)` }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Día ${context.parsed.x.toFixed(1)}: ${context.parsed.y.toFixed(2)} Bs`;
                        }
                    }
                }
            }
        }
    });
}

// --- INTERPRETACIÓN DINÁMICA ---
function generateInterpretation(metodo, x_vals, y_vals, targetX, targetY, curveData, nombreProducto) {
    const interBox = document.getElementById('interpretationBox');
    
    let isExtrapolating = targetX < x_vals[0] || targetX > x_vals[x_vals.length - 1];
    let n = x_vals.length;
    
    // Buscar comportamientos anómalos en la curva generada (Fenómeno de Runge)
    let maxY = Math.max(...curveData.map(p => p.y));
    let minY = Math.min(...curveData.map(p => p.y));
    let maxBaseY = Math.max(...y_vals);
    let minBaseY = Math.min(...y_vals);
    
    let rungeAlert = false;
    if ((maxY > maxBaseY * 1.5 || minY < minBaseY * 0.5) && (metodo === 'lagrange' || metodo === 'newton')) {
        rungeAlert = true;
    }

    let incremento = y_vals[y_vals.length - 1] - y_vals[0];
    let porcentaje = ((incremento / y_vals[0]) * 100).toFixed(1);

    let texto = `<h5 class="fw-bold mb-3"><i class="bi bi-clipboard-data"></i> Respuestas de la Simulación</h5>`;
    texto += `<ul class="list-group list-group-flush" style="background: transparent;">`;

    // 1. ¿Cuál sería el precio aproximado en un día sin dato?
    texto += `<li class="list-group-item bg-transparent"><strong>1. ¿Cuál sería el precio aproximado en un día sin dato?</strong><br>
    Para el día ${targetX}, el precio aproximado calculado mediante ${metodo.toUpperCase()} es de <strong>${targetY.toFixed(2)} Bs</strong>.</li>`;

    // 2. ¿Cómo se comporta la curva de precios durante el mes?
    let respuesta2 = rungeAlert 
        ? `La curva muestra oscilaciones extremas e irreales entre los puntos debido al Fenómeno de Runge, propio de usar polinomios globales de alto grado en puntos dispersos.`
        : `La curva proyecta una tendencia de encarecimiento constante durante el mes, conectando los registros base de manera suave para predecir los días no registrados.`;
    texto += `<li class="list-group-item bg-transparent"><strong>2. ¿Cómo se comporta la curva de precios durante el mes?</strong><br>${respuesta2}</li>`;

    // 3. ¿Qué producto tuvo mayor incremento?
    texto += `<li class="list-group-item bg-transparent"><strong>3. ¿Cómo fue el incremento de este producto?</strong><br>
    Analizando los datos de <strong>${nombreProducto}</strong> a lo largo de la simulación base (día ${x_vals[0]} al ${x_vals[x_vals.length-1]}), este producto sufrió un encarecimiento bruto de ${incremento.toFixed(2)} Bs, lo que representa un aumento del <strong>${porcentaje}%</strong> respecto a su precio inicial.</li>`;

    // 4. ¿Qué tan confiable es la interpolación?
    let respuesta4 = isExtrapolating 
        ? `<strong>Poco confiable</strong>. El día solicitado (${targetX}) se encuentra fuera del rango medido [${x_vals[0]} a ${x_vals[n-1]}]. Esto se llama extrapolación, y los polinomios tienden a dispararse hacia el infinito.`
        : `<strong>Altamente confiable</strong>, ya que estás realizando una interpolación dentro del rango medido. ${metodo === 'splines' ? 'Además, el uso de Splines garantiza suavidad y evita anomalías matemáticas.' : 'Sin embargo, vigila que no existan picos o caídas en la curva (Fenómeno de Runge).'}`;
    texto += `<li class="list-group-item bg-transparent"><strong>4. ¿Qué tan confiable es la interpolación?</strong><br>${respuesta4}</li>`;

    // 5. ¿Qué pasa si los datos son muy dispersos?
    texto += `<li class="list-group-item bg-transparent"><strong>5. ¿Qué pasa si los datos son muy dispersos?</strong><br>
    Al tener datos muy distanciados, los métodos como Lagrange y Newton pueden generar una función que pase por todos los puntos, pero que ondule agresivamente (creando picos de precios irreales entre días). Por ello, los <strong>Splines Cúbicos</strong> son ideales aquí, pues construyen tramos locales que evitan dicho descontrol.</li>`;

    texto += `</ul>`;

    if (rungeAlert || isExtrapolating) {
        interBox.className = 'alert alert-warning interpretation-box mb-4 flex-grow-1';
    } else {
        interBox.className = 'alert alert-info interpretation-box mb-4 flex-grow-1';
    }
    
    interBox.innerHTML = texto;
}
