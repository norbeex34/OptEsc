# Generador de Órdenes de Fabricación

Aplicación web para generar archivos Excel de órdenes de fabricación para piezas y conjuntos.

## 🚀 Deploy en Vercel

### Opción 1: Deploy Directo desde GitHub

1. **Sube el proyecto a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Excel Generator"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
   git push -u origin main
   ```

2. **Conecta con Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Haz click en "Add New Project"
   - Importa tu repositorio de GitHub
   - Vercel detectará automáticamente que es un proyecto Vite
   - Haz click en "Deploy"

### Opción 2: Deploy con Vercel CLI

```bash
npm install -g vercel
cd excel-generator-project
vercel
```

## 🛠️ Desarrollo Local

```bash
npm install
npm run dev
```

## 📦 Build de Producción

```bash
npm run build
npm run preview
```

## 🎯 Características

- ✅ Creación de piezas y conjuntos
- ✅ Múltiples componentes por conjunto
- ✅ Auto-colapso de items agregados
- ✅ Validación de campos requeridos
- ✅ Preview de datos antes de exportar
- ✅ Generación de Excel compatible con sistema de importación

---

Creado por Norberto Echevarría
