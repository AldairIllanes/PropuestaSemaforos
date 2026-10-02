# GOW-GO-26-005 — Semáforos (Arequipa)

## Concepto

El semáforo es un **objeto de vía** (punto), no una alerta ni un paradero.

**Realismo:** poste/cabezal con 3 focos; **solo uno activo** (rojo | ámbar | verde).  
Los otros quedan apagados. También hay estado **apagado** (fuera de servicio).

Sin API: el estado se cambia a mano para validar diseño.

## Propuestas de forma

| | Lectura |
|---|---|
| **A · Poste** | Columna clásica en poste |
| **B · Compacto** | Cabezal más grueso (legible de lejos) |
| **C · Brazo** | Voladizo tipo avenida |

## Estados

Rojo · Ámbar · Verde · Apagado

## Cómo correr

```bash
npx --yes serve .
```

## Nota

La demo `draft-yo-destino-ruta/` (yo + destino + tramo) queda guardada para una tarea posterior.
