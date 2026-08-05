# 🚀 GUÍA RÁPIDA - DEPLOY EN VERCEL

## ✨ Método Más Fácil (Recomendado)

### 1️⃣ Sube a GitHub

1. Ve a [github.com](https://github.com) y crea una cuenta (si no tienes)
2. Click en "New repository" (botón verde)
3. Ponle un nombre: `msh-pipe-optimizer`
4. Click "Create repository"

5. En tu computadora, abre la terminal/CMD en la carpeta del proyecto y ejecuta:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/msh-pipe-optimizer.git
git push -u origin main
```

(Reemplaza `TU-USUARIO` con tu usuario de GitHub)

### 2️⃣ Deploy en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Click "Sign Up" y usa tu cuenta de GitHub
3. Click "Add New Project"
4. Selecciona tu repositorio `msh-pipe-optimizer`
5. Vercel detectará automáticamente Next.js
6. Click "Deploy"
7. ¡Espera 1-2 minutos! ✅

### 3️⃣ Tu App está Lista

Vercel te dará una URL como:
```
https://msh-pipe-optimizer.vercel.app
```

¡Comparte esta URL y ya está en internet! 🌐

---

## 🔄 Actualizar la App

Cada vez que hagas cambios:

```bash
git add .
git commit -m "Descripción del cambio"
git push
```

Vercel automáticamente desplegará la nueva versión.

---

## 🎯 Método Alternativo (Sin GitHub)

### Usando Vercel CLI:

1. **Instala Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```
   (Te pedirá verificar por email)

3. **Deploy:**
   ```bash
   cd msh-pipe-vercel
   vercel
   ```

4. **Sigue las instrucciones:**
   - Set up and deploy? → Yes
   - Which scope? → Tu cuenta
   - Link to existing project? → No
   - Project name? → msh-pipe-optimizer
   - Directory? → ./
   - Override settings? → No

5. ¡Listo! Te dará la URL.

---

## 📱 Configuración de Dominio Personalizado

Si quieres usar tu propio dominio (ejemplo: `optimizer.miempresa.com`):

1. En Vercel, ve a tu proyecto
2. Click "Settings" → "Domains"
3. Agrega tu dominio
4. Sigue las instrucciones de DNS

---

## ⚡ Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Build de producción (prueba antes de deploy)
npm run build

# Deploy a producción
vercel --prod

# Ver logs
vercel logs
```

---

## 🐛 Solución de Problemas

**Error: "Command not found: git"**
- Instala Git desde: https://git-scm.com/

**Error: "Permission denied"**
- En Windows: Ejecuta CMD como Administrador
- En Mac/Linux: Usa `sudo` antes del comando

**Error en el build:**
1. Elimina `node_modules` y `.next`
2. Ejecuta `npm install`
3. Ejecuta `npm run build`
4. Si funciona localmente, intenta deploy de nuevo

**La app no carga en Vercel:**
- Revisa los logs en el dashboard de Vercel
- Verifica que todos los archivos se hayan subido
- Asegúrate de que el build terminó con éxito

---

## 💡 Tips Pro

- **Analytics:** Vercel te da analytics gratis
- **Preview URLs:** Cada commit tiene su propia URL de preview
- **Rollback:** Puedes volver a versiones anteriores en un click
- **Environment Variables:** Añade variables en Settings si las necesitas

---

## 📞 Ayuda

- **Documentación Vercel:** https://vercel.com/docs
- **Comunidad:** https://github.com/vercel/vercel/discussions
- **Status:** https://vercel-status.com

---

**¡Tu app estará online en menos de 5 minutos! 🎉**
