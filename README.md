# projectx-mcp

Cargá horas en [ProjectX](https://projectx.dualbootpartners.com) hablándole a Claude.

> "Cargá 8 horas de Ontrac para hoy"
> "Completá los días que me faltan esta semana con Ontrac"
> "¿Qué días no tengo horas cargadas este mes?"

---

## Instalación (Mac)

### 1. Descargá el installer

Descargá el archivo `projectx-mcp.pkg` desde [Releases](https://github.com/agustindiezdb/projectx-mcp/releases).

### 2. Instalá

Hacé doble click en el archivo descargado y seguí los pasos del instalador.

### 3. Abrí Claude Desktop

Al abrir Claude Desktop por primera vez, se va a abrir automáticamente una ventana del browser. Iniciá sesión con tu cuenta de Google de Dualboot. El browser se cierra solo cuando termina.

**Listo.** Ya podés pedirle a Claude que cargue tus horas.

---

## Cómo usarlo

Hablale a Claude de forma natural:

```
Cargá 8 horas de Ontrac para hoy con descripción "Sprint planning"
```
```
Revisá mis entradas de esta semana y completá los días que faltan con 8h de Ontrac
```
```
Borrá la entrada de ayer y cargá 4h de Internal — Administrative
```

---

## Si el login falla o la sesión expiró

Reiniciá Claude Desktop. El browser se va a abrir de nuevo para que vuelvas a iniciar sesión.

---

## Tools disponibles

| Tool | Descripción |
|------|-------------|
| `get_time_entries` | Ver entradas en un rango de fechas |
| `get_projects` | Listar proyectos disponibles |
| `create_time_entry` | Crear una entrada |
| `delete_time_entry` | Borrar una entrada por ID |

---

## Para desarrolladores

### Arquitectura

```
Claude Desktop → MCP Server (stdio) → fetch() + _interslice_session cookie → ProjectX API
```

### Setup desde cero

```bash
npm install
npm run build
```

La sesión se guarda en `~/Library/Application Support/projectx-mcp/auth.json` (gitignored).

Al iniciar el servidor, si no hay sesión válida se abre Chrome automáticamente para el login.

### Generar el installer

```bash
npm run build:installer   # genera projectx-mcp.pkg
```

El `.pkg` instala la app en `/usr/local/lib/projectx-mcp/` y escribe automáticamente el config de Claude Desktop.

### Testear la API directamente

```bash
npm run test:entry
```

### Claude Desktop config (manual)

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "projectx": {
      "command": "/usr/local/bin/projectx-mcp"
    }
  }
}
```

### Troubleshooting

- **Session expired** → reiniciá Claude Desktop, el browser se abre solo
- **Chrome not found** → instalá Google Chrome
- **Project not found** → pedile a Claude `get_projects` para ver los nombres exactos
- **post-install no escribió el config** → editá manualmente el JSON de arriba
