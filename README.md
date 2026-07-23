# 🏍️ RideControl

**Control financiero inteligente para motociclistas y domiciliarios.**

RideControl es una aplicación web progresiva (PWA) que permite gestionar ingresos, gastos, vehículos, metas de ahorro y presupuestos. Diseñada para motociclistas que necesitan llevar cuentas claras de su día a día, con sincronización en tiempo real y dashboard analítico.

---

## ✨ Funcionalidades

### 🚗 Gestión de Vehículos
- Registro de múltiples vehículos con kilometraje, marca, modelo y placa.
- Seguimiento de entrada diaria (km inicio, km fin, ingresos, gastos operativos).
- Historial de combustible (galones, precio, kilometraje).
- Mantenimiento preventivo y correctivo con alertas por kilometraje.

### 💰 Finanzas personales
- **Dashboard financiero**: resumen de ingresos, gastos, distribución de cartera.
- **Transacciones**: registro de ingresos y gastos por categoría con búsqueda y filtros.
- **Presupuestos mensuales**: fija límites por categoría de gasto y monitorea progreso.
- **Distribución de cartera**: asigna porcentajes a wallets (moto, ahorro, inversiones, gastos personales).
- **Metas de ahorro**: crea objetivos financieros con seguimiento visual de progreso.
- **Motor financiero**: calcula automáticamente la distribución de ingresos según porcentajes predefinidos, descontando costos operativos (gasolina, mantenimiento).

### 🤖 Asistente IA
- Chat integrado con Google Gemini para consultar:
  - Resumen general de finanzas.
  - Últimas transacciones.
  - Estado de metas y carteras.
  - Historial de distribución.
  - Modificar porcentajes de cartera.
  - Crear y actualizar metas de ahorro.
- Sin necesidad de configuración — funciona con una API key integrada.

### 📊 Reportes y Estadísticas
- Reportes diarios con cierre detallado.
- Estadísticas visuales con gráficos.
- Exportación de datos.

### 🔄 Sincronización
- Sincronización en tiempo real con Firebase Realtime Database.
- Modo offline con IndexedDB (Dexie.js).
- Los datos se almacenan localmente y se sincronizan cuando hay conexión.

---

## 🛠️ Stack Tecnológico

| Capa         | Tecnología                                                       |
|-------------|------------------------------------------------------------------|
| Framework   | React 19 + TypeScript                                            |
| Build tool  | Vite 8                                                           |
| Routing     | React Router v7                                                  |
| State       | Zustand + persist (localStorage)                                 |
| DB local    | Dexie.js (IndexedDB)                                             |
| Sync        | Firebase Realtime Database                                       |
| Auth        | Firebase Authentication                                          |
| Hosting     | Firebase Hosting                                                 |
| UI          | Tailwind CSS v4, Framer Motion, Radix UI, Lucide icons           |
| AI          | Google Gemini API (function calling)                             |
| PWA         | vite-plugin-pwa (service worker, manifest)                       |
| Forms       | React Hook Form + Zod                                            |

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+
- npm 9+
- Cuenta de Firebase con proyecto activo

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/NkAlejandro/Project-RideControl.git
cd Project-RideControl

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales de Firebase:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Desarrollo

```bash
npm run dev
```

Abre `http://localhost:5173` en el navegador.

### Producción

```bash
npm run build
npm run deploy
```

---

## 🏗️ Arquitectura

```
src/
├── components/         # Componentes UI compartidos
│   └── ui/            # Modal, Input, Button, Card, BottomSheet, DatePicker, etc.
├── database/           # Capa de datos
│   ├── db.ts          # Configuración Dexie.js (IndexedDB)
│   └── repositories/  # Repositorios por entidad
├── features/           # Módulos funcionales
│   ├── ai/            # Chat IA
│   ├── dashboard/     # Panel principal
│   ├── daily-close/   # Cierre diario
│   ├── finance/       # Gestión financiera
│   ├── fuel/          # Combustible
│   ├── goals/         # Metas de ahorro
│   ├── maintenance/   # Mantenimiento
│   ├── onboarding/    # Configuración inicial
│   ├── reports/       # Reportes
│   ├── settings/      # Configuración
│   ├── statistics/    # Estadísticas
│   ├── vehicles/      # Vehículos
│   └── wallets/       # Carteras
├── hooks/             # Hooks personalizados
├── layout/            # Layout principal (sidebar, header, bottom-nav)
├── lib/               # Utilidades y servicios
│   ├── ai-service.ts  # Cliente Gemini API
│   ├── finance-engine.ts  # Motor de distribución financiera
│   ├── firebase.ts    # Config Firebase
│   ├── firebase-sync.ts   # Sincronización RTDB
│   ├── schemas.ts     # Esquemas Zod
│   └── utils.ts       # Utilidades generales
├── store/             # Estado global (Zustand)
└── types/             # Tipos TypeScript
```

### Flujo de datos

```
Firebase RTDB ←→ Firebase Sync Service ←→ Dexie (IndexedDB)
                                              ↑
                                         Zustand Store
                                              ↑
                                        React Components
                                              ↑
                                        User Interface
```

Los datos se escriben primero en IndexedDB (para respuesta instantánea) y luego se sincronizan con Firebase. Al iniciar, los datos se cargan desde IndexedDB sin esperar la sincronización remota.

---

## 🗄️ Modelo de Datos

- **Profile**: perfil del usuario (nombre, email).
- **Vehicle**: vehículos registrados (marca, modelo, km, etc.).
- **DailyEntry**: entrada diaria por vehículo (km, ingresos, gastos).
- **FuelRecord**: registro de combustible (galones, precio, km).
- **MaintenanceItem**: mantenimientos (tipo, costo, km, próximo).
- **Wallet**: carteras financieras (moto, ahorro, inversiones, personales).
- **Goal**: metas de ahorro (monto objetivo, progreso, fecha límite).
- **Transaction**: ingresos y gastos (tipo, categoría, monto).
- **Budget**: presupuestos mensuales por categoría.
- **DistributionHistory**: historial de distribuciones de cartera.
- **AppSettings**: configuración global de la app.

---

## 📜 Scripts Disponibles

| Script               | Descripción                                      |
|----------------------|--------------------------------------------------|
| `npm run dev`        | Inicia servidor de desarrollo                    |
| `npm run build`      | Compila TypeScript y construye assets            |
| `npm run deploy`     | Despliega a Firebase Hosting                     |
| `npm run deploy:watch` | Vigila cambios en src/ y despliega automáticamente |
| `npm run lint`       | Ejecuta ESLint                                   |
| `npm run preview`    | Vista previa de la build de producción           |

---

## 🌐 Despliegue

La app está desplegada en Firebase Hosting:

```
https://ridecontrol-1caa4.web.app
```

### Despliegue automático

```bash
npm run deploy:watch
```

Este script vigila cambios en la carpeta `src/` y ejecuta automáticamente `build + deploy` al detectar modificaciones.

---

## 🤝 Contribuir

1. Fork el proyecto.
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`).
3. Commit tus cambios (`git commit -m "feat: agregar nueva funcionalidad"`).
4. Push a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

---

## 📄 Licencia

MIT
