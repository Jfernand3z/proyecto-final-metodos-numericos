# Proyecto: Plataforma Interactiva de Simulación Matemática

Una aplicación web interactiva desarrollada para simular, analizar y visualizar distintos escenarios reales mediante modelos matemáticos y computacionales. Este proyecto aplica métodos numéricos para comprender y buscar soluciones a problemas complejos de la realidad social y económica actual.

## 🚀 Tecnologías Usadas

- **Frontend Core:** HTML5, CSS3, JavaScript (Vanilla ES6+).
- **Diseño y UI:** Bootstrap 5 (Layout, Offcanvas y Grid) y Bootstrap Icons.
- **Visualización de Datos:** Chart.js (para gráficos interactivos en tiempo real).
- **Estética:** Diseño moderno estilo *Glassmorphism* con gradientes y animaciones CSS (Vanilla CSS).

## 📂 Estructura del Proyecto

El código está organizado de manera modular, separando la lógica, el diseño y las vistas:

```text
proy/
├── index.html              # Página principal y punto de entrada (Hero, Menú).
├── README.md               # Documentación del proyecto.
├── css/
│   └── style.css           # Estilos globales, diseño Glassmorphism y animaciones.
├── js/
│   ├── modulo1.js          # Lógica para Módulo 1 (Sistemas de Ecuaciones: Gauss-Seidel, Jacobi, SOR, CG, LU).
│   ├── modulo2.js          # Lógica para Módulo 2 (Ecuaciones Diferenciales: Euler, Heun, RK4).
│   ├── modulo3.js          # Lógica para Módulo 3 (Interpolación: Lagrange, Newton, Splines Cúbicos).
│   ├── modulo4.js          # Lógica para Módulo 4 (Integración Numérica: Trapecio, Simpson 1/3, Simpson 3/8).
│   ├── modulo5.js          # Lógica para Módulo 5 (Raíces de Ecuaciones: Bisección, Newton-Raphson, Secante).
│   ├── modulo6.js          # Lógica para Módulo 6 (SEL y Sensibilidad: Eliminación Gaussiana, Número de Condición).
│   └── modulo7.js          # Lógica para Módulo 7 (Sistemas de EDOs: Heun, Runge-Kutta 4to Orden).
└── pages/
    ├── modulo1.html        # Vista: Optimización del abastecimiento y red de transporte.
    ├── modulo2.html        # Vista: Vaciado crítico de reservas en plantas de carburantes.
    ├── modulo3.html        # Vista: Desabastecimiento de alimentos y curva de precios.
    ├── modulo4.html        # Vista: Costo acumulado y pérdida del poder adquisitivo.
    ├── modulo5.html        # Vista: Umbrales críticos de abastecimiento y descontento.
    ├── modulo6.html        # Vista: Rumores de desabastecimiento y pánico en la red.
    └── modulo7.html        # Vista: Modelo de difusión de opinión y descontento social.
```

## 📊 Módulos Incluidos

1. **Módulo 1: Optimización de Abastecimiento (Sistemas de Ecuaciones Lineales)**
   - **Propósito:** Optimiza el abastecimiento de plantas de origen a mercados de destino ante restricciones y demandas en equilibrio.
   - **Métodos:** Jacobi, Gauss-Seidel, SOR (Sobrerrelajación), Descomposición LU, Gradiente Conjugado. Simulación interactiva de bloqueo de rutas estratégicas.
   
2. **Módulo 2: Vaciado de Reservas en Plantas (Ecuaciones Diferenciales Ordinarias)**
   - **Propósito:** Predice la evolución temporal de los niveles de almacenamiento en plantas ante pánico de consumo.
   - **Métodos:** Euler, Heun y Runge-Kutta de 4to Orden (RK4).

3. **Módulo 3: Curva Continua de Precios (Interpolación Polinómica)**
   - **Propósito:** Reconstruye la curva continua de precios diarios de la canasta básica a partir de datos dispersos.
   - **Métodos:** Interpolación de Lagrange, Diferencias Divididas de Newton y Splines Cúbicos Naturales (que mitigan el Fenómeno de Runge).

4. **Módulo 4: Costo Acumulado y Pérdida del Poder Adquisitivo (Integración Numérica)**
   - **Propósito:** Calcula el gasto familiar mensual acumulado y la pérdida económica real frente a un escenario de precios estables mediante el área bajo la curva de inflación de precios.
   - **Métodos:** Trapecio Compuesto, Simpson 1/3 Compuesto y Simpson 3/8 Compuesto.

5. **Módulo 5: Umbrales Críticos de Abastecimiento y Descontento (Raíces de Ecuaciones)**
   - **Propósito:** Halla los puntos de intersección o equilibrio, tales como el día exacto en que el gasto acumulado supera el ingreso familiar, la tasa de reposición necesaria para balancear el consumo de carburantes, o los umbrales de descontento que disparan protestas.
   - **Métodos:** Bisección, Newton-Raphson y Secante.

6. **Módulo 6: Rumores de Desabastecimiento y Pánico en la Red (SEL y Número de Condición)**
   - **Propósito:** Evalúa el impacto de la desinformación y las compras de pánico en la estabilidad matemática de la red de distribución de stock mediante análisis de sensibilidad y condicionamiento matricial.
   - **Métodos:** Eliminación Gaussiana con pivoteo parcial y cálculo del Número de Condición del sistema (norma 1 e inversa).

7. **Módulo 7: Modelo de Difusión de Opinión y Descontento Social (Sistemas de EDOs)**
   - **Propósito:** Simula la propagación de opiniones en la población (neutrales, manifestantes y mediadores de diálogo) a través de un modelo dinámico de EDOs interconectadas en el tiempo.
   - **Métodos:** Heun y Runge-Kutta de 4to Orden (RK4) aplicados a sistemas multicompartimentales.
