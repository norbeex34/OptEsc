# Exportador RCP16 (CSV)

Interfaz web estática para generar un archivo RCP16 desde cero, editar la placa y las piezas, y exportar el CSV final.

## Uso

1. Abrí `index.html` en el navegador.
2. (Opcional) Importá un RCP16 existente si querés partir de uno.
3. Editá **Cantidad / Largo / Ancho**.
4. Tocá **Exportar CSV**.

El botón **Cargar ejemplo** usa una plantilla incluida en la carpeta (`ejemplo_proveedor_completo.csv`). Si abrís el HTML directo (sin servidor), puede no cargar; en ese caso cargá la plantilla desde tu archivo.

## Escala de medidas

La máquina interpreta las medidas multiplicadas por 10. En la interfaz se ingresan las medidas “reales” (por ejemplo 1830) y al exportar se escribe 18300 en el CSV.

## Cantidad

En el formato del proveedor, el primer número de cada línea es el tipo de operación. La **cantidad** se representa repitiendo líneas de pieza iguales. En la interfaz, el campo **Cantidad** agrega o elimina repeticiones de esa pieza sin cambiar el tipo de operación.

## Medida de placa

La medida de placa está definida por una línea como:

```
0,18300,0,26000,1,
```

En la interfaz se ingresan los valores sin el x10 (ej. 1830 y 2600) y al exportar se escriben multiplicados por 10 en esa misma línea.

## Importar lista de piezas (opcional)

Podés cargar otro CSV con filas en formato:

```
qty,largo,ancho
1,1000,1830
2,4500,4500
```

Eso reemplaza las piezas detectadas dentro de la plantilla y mantiene el resto de líneas.
