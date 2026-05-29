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
│   └── modulo3.js          # Lógica para Módulo 3 (Interpolación: Lagrange, Newton, Splines Cúbicos).
└── pages/
    ├── modulo1.html        # Vista: Optimización del abastecimiento y red de transporte.
    ├── modulo2.html        # Vista: Vaciado crítico de reservas en plantas de carburantes.
    └── modulo3.html        # Vista: Desabastecimiento de alimentos y curva de precios.
```

## 📊 Módulos Incluidos

1. **Módulo 1:** Optimización del abastecimiento (Sistemas de Ecuaciones Lineales).
2. **Módulo 2:** Vaciado de reservas en plantas (Ecuaciones Diferenciales Ordinarias).
3. **Módulo 3:** Curva continua de precios ante desabastecimiento (Interpolación Polinómica).
