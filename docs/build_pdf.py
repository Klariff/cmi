"""Generate CMI desktop-app user documentation as a PDF."""

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
    XPreformatted,
)

INDIGO = colors.HexColor("#283593")
INDIGO_DARK = colors.HexColor("#1a237e")
GREY_LIGHT = colors.HexColor("#f5f5f5")
GREY_MED = colors.HexColor("#cccccc")
AMBER_BG = colors.HexColor("#fff8e1")
AMBER_BORDER = colors.HexColor("#f9a825")
RED = colors.HexColor("#c62828")

styles = getSampleStyleSheet()

H1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName="Helvetica-Bold",
                    fontSize=24, leading=28, textColor=INDIGO_DARK,
                    spaceBefore=0, spaceAfter=14)
H2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Helvetica-Bold",
                    fontSize=16, leading=20, textColor=INDIGO,
                    spaceBefore=18, spaceAfter=8)
H3 = ParagraphStyle("H3", parent=styles["Heading3"], fontName="Helvetica-Bold",
                    fontSize=12, leading=16, textColor=colors.black,
                    spaceBefore=12, spaceAfter=4)
BODY = ParagraphStyle("Body", parent=styles["BodyText"], fontName="Helvetica",
                      fontSize=10.5, leading=15, alignment=TA_LEFT,
                      spaceAfter=8, textColor=colors.HexColor("#1f1f1f"))
BULLET = ParagraphStyle("Bullet", parent=BODY, leftIndent=18,
                        bulletIndent=6, spaceAfter=3)
CODE = ParagraphStyle("Code", parent=styles["Code"], fontName="Courier",
                      fontSize=9, leading=12, leftIndent=0,
                      textColor=colors.HexColor("#1f1f1f"))
SMALL = ParagraphStyle("Small", parent=BODY, fontSize=8.5, leading=11,
                       textColor=colors.HexColor("#666666"))
TITLE = ParagraphStyle("Title", parent=H1, fontSize=34, leading=38,
                       alignment=1, spaceAfter=4)
SUBTITLE = ParagraphStyle("Subtitle", parent=BODY, fontSize=14, leading=18,
                          alignment=1, textColor=colors.HexColor("#444444"),
                          spaceAfter=24)


def code_block(text):
    p = XPreformatted(text, CODE)
    t = Table([[p]], colWidths=[6.4 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GREY_LIGHT),
        ("BOX", (0, 0), (-1, -1), 0.5, GREY_MED),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def callout(text, kind="info"):
    bg, border = {
        "info":   (colors.HexColor("#e3f2fd"), colors.HexColor("#1976d2")),
        "warn":   (AMBER_BG, AMBER_BORDER),
        "danger": (colors.HexColor("#fdecea"), RED),
    }[kind]
    p = Paragraph(text, BODY)
    t = Table([[p]], colWidths=[6.4 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 3, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t


def bullets(items):
    return [Paragraph(f"&bull; {x}", BULLET) for x in items]


def build():
    doc = SimpleDocTemplate(
        "CMI-manual.pdf", pagesize=letter,
        leftMargin=1.05 * inch, rightMargin=1.05 * inch,
        topMargin=0.95 * inch, bottomMargin=0.95 * inch,
        title="CMI · Manual de usuario", author="Klariff",
    )
    story = []

    # --- Cover -------------------------------------------------------------
    story.append(Spacer(1, 1.4 * inch))
    story.append(Paragraph("CMI", TITLE))
    story.append(Paragraph("Manual de usuario — aplicación de escritorio", SUBTITLE))
    story.append(Spacer(1, 0.5 * inch))
    story.append(Paragraph(
        "Esta guía cubre la instalación, uso, distribución de enlaces a participantes, "
        "resolución de problemas y desinstalación de la aplicación CMI para macOS y Windows.",
        BODY))
    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph(
        "<b>Versión del documento:</b> v0.1.x &nbsp;·&nbsp; <b>Última revisión:</b> 2026",
        SMALL))
    story.append(PageBreak())

    # --- ¿Qué es? ----------------------------------------------------------
    story.append(Paragraph("1. ¿Qué es CMI?", H1))
    story.append(Paragraph(
        "CMI es una aplicación de escritorio para diseñar y ejecutar estudios de "
        "clasificación de tarjetas (card sorting). Permite al investigador crear "
        "proyectos, subir tarjetas con imágenes, configurar un video tutorial, recoger "
        "respuestas de participantes y descargar los resultados.", BODY))
    story.append(Paragraph(
        "La aplicación es un binario único que incluye todo lo necesario: base de "
        "datos local (SQLite), servidor HTTP interno (Node + Express) y un túnel "
        "opcional a internet (cloudflared) para que los participantes se conecten "
        "remotamente. No requiere instalación de dependencias adicionales.", BODY))

    story.append(Paragraph("Arquitectura en una frase", H3))
    story.append(Paragraph(
        "Cuando abres la app se levanta un servidor HTTP en "
        "<font face='Courier'>127.0.0.1:4000</font>, una ventana nativa muestra el "
        "panel de administración, y opcionalmente un túnel cloudflared expone ese "
        "servidor a internet con una URL aleatoria del tipo "
        "<font face='Courier'>random-words.trycloudflare.com</font>.", BODY))

    story.append(Paragraph("Dónde se guardan los datos", H3))
    story.append(Paragraph(
        "Todo lo que produces se queda en tu equipo. No hay cuenta en la nube y "
        "nada se sube a servidores nuestros.", BODY))
    story.append(Paragraph("<b>macOS</b>", BODY))
    story.append(code_block(
        "~/Library/Application Support/com.klariff.cmi/\n"
        "  cmi.db           ← base de datos SQLite\n"
        "  jwt.secret       ← secreto generado al primer arranque\n"
        "  uploads/\n"
        "    card/          ← imágenes de tarjetas\n"
        "    project/       ← videos tutoriales"))
    story.append(Paragraph("<b>Windows</b>", BODY))
    story.append(code_block("%APPDATA%\\com.klariff.cmi\\\n(misma estructura)"))

    story.append(PageBreak())

    # --- Instalación -------------------------------------------------------
    story.append(Paragraph("2. Instalación", H1))

    story.append(Paragraph("Requisitos", H2))
    story.append(Paragraph(
        "&bull; macOS 11 (Big Sur) o superior, en Apple Silicon (M1, M2, M3, M4) o Intel.<br/>"
        "&bull; Windows 10 (64-bit) o superior.<br/>"
        "&bull; 200 MB de espacio libre.<br/>"
        "&bull; Conexión a internet sólo cuando se use la función «Enlace público».", BODY))

    story.append(Paragraph("Descargar el instalador", H2))
    story.append(Paragraph(
        "Los instaladores están publicados en la página de releases del repositorio. "
        "Cada versión incluye tres archivos:", BODY))

    data = [
        ["Archivo", "Plataforma"],
        ["CMI_<v>_aarch64.dmg", "macOS Apple Silicon (M1/M2/M3/M4)"],
        ["CMI_<v>_x64.dmg",     "macOS Intel"],
        ["CMI_<v>_x64-setup.exe","Windows 64-bit"],
    ]
    t = Table(data, colWidths=[2.6 * inch, 3.8 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INDIGO),
        ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
        ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME",   (0, 1), (0, -1), "Courier"),
        ("FONTSIZE",   (0, 0), (-1, -1), 9.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, GREY_MED),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, GREY_LIGHT]),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "Si no estás seguro de tu Mac: menú Apple → «Acerca de este Mac». "
        "Si dice «Apple M1/M2/M3/M4» usa el archivo <i>aarch64</i>; si dice «Intel» "
        "usa el <i>x64</i>.", BODY))

    story.append(Paragraph("Instalar en macOS", H2))
    story.append(Paragraph("Pasos", H3))
    story.append(Paragraph(
        "1. Doble click en el <font face='Courier'>.dmg</font> descargado.<br/>"
        "2. Arrastra <b>CMI.app</b> al icono <b>Applications</b>.<br/>"
        "3. La primera vez que la abras, macOS mostrará un aviso porque la app no está "
        "firmada por Apple Developer ID (ver siguiente paso).", BODY))
    story.append(Paragraph("Quitar el aviso de seguridad", H3))
    story.append(Paragraph("Existen dos opciones (basta con una):", BODY))
    story.append(Paragraph("<b>Opción A — Click derecho → Abrir (recomendada)</b>", BODY))
    story.append(Paragraph(
        "Click derecho sobre <b>CMI.app</b> en /Applications → <b>Abrir</b>. "
        "macOS mostrará un cuadro pidiendo confirmación. Click en <b>Abrir</b>. "
        "Solo es necesario hacer esto la primera vez.", BODY))
    story.append(Paragraph("<b>Opción B — Quitar la cuarentena por Terminal</b>", BODY))
    story.append(code_block("xattr -cr /Applications/CMI.app"))
    story.append(Paragraph(
        "Después de eso, doble click sobre CMI.app abre la aplicación directamente "
        "sin warnings.", BODY))

    story.append(callout(
        "<b>¿Por qué aparece el aviso?</b> Distribuimos la app sin certificado de Apple "
        "Developer ID ($99/año). macOS marca todo binario descargado de internet con un "
        "atributo de «cuarentena»; sin la firma de Apple, Gatekeeper exige confirmación "
        "manual la primera vez. Tras la primera apertura la app queda permitida.", "info"))

    story.append(PageBreak())

    story.append(Paragraph("Instalar en Windows", H2))
    story.append(Paragraph(
        "1. Doble click en <font face='Courier'>CMI_&lt;v&gt;_x64-setup.exe</font>.<br/>"
        "2. Si Windows SmartScreen muestra un aviso de «Windows protegió tu PC»: click en "
        "<b>Más información</b> → <b>Ejecutar de todas formas</b>.<br/>"
        "3. Sigue el asistente y completa la instalación.<br/>"
        "4. La app queda accesible desde el menú Inicio.", BODY))

    story.append(PageBreak())

    # --- Uso ---------------------------------------------------------------
    story.append(Paragraph("3. Uso de la aplicación", H1))

    story.append(Paragraph("Primer arranque y registro", H2))
    story.append(Paragraph(
        "La primera vez que abres CMI la base de datos local está vacía y no hay "
        "usuarios. Sigue estos pasos:", BODY))
    story.append(Paragraph(
        "1. Aparece la pantalla de inicio de sesión. Click en <b>Registrarse</b>.<br/>"
        "2. Ingresa nombre completo, nombre de usuario y contraseña.<br/>"
        "3. La contraseña debe cumplir: 8-20 caracteres, al menos una mayúscula, "
        "una minúscula, un número y un caracter especial "
        "(<font face='Courier'>!@#$%^&amp;*.</font>).<br/>"
        "4. Al completar quedas autenticado y ves el panel de administración.", BODY))

    story.append(Paragraph("Crear un proyecto", H2))
    story.append(Paragraph(
        "Desde el sidebar, click en <b>Crear proyecto</b>. Aparece un formulario con:", BODY))
    story.extend(bullets([
        "<b>Nombre del proyecto</b> — visible solo para ti.",
        "<b>Mínimo de clasificaciones libres obligatorias</b> — cuántas veces el "
        "participante deberá agrupar las tarjetas con criterios propios antes de "
        "pasar a las clasificaciones cerradas predefinidas.",
        "<b>Texto introducción</b> — el participante lo ve al entrar al enlace.",
        "<b>Texto final</b> — el participante lo ve al terminar.",
    ]))
    story.append(callout(
        "<b>Tip:</b> marca la casilla «Crear un proyecto de ejemplo (Medio ambiente)» "
        "para generar automáticamente un proyecto pre-poblado con 15 tarjetas y 3 "
        "clasificaciones cerradas. Útil para familiarizarte con el flujo o hacer demos.",
        "info"))

    story.append(Paragraph("Configurar tarjetas, clasificaciones y video", H2))
    story.append(Paragraph(
        "Con un proyecto seleccionado en el desplegable del sidebar, accedes a:", BODY))
    story.extend(bullets([
        "<b>Clasificaciones</b> — define los criterios cerrados que verá el "
        "participante (por ejemplo: Frecuencia, Importancia), con sus categorías "
        "(Nunca, A veces, etc.).",
        "<b>Tarjetas</b> — crea las tarjetas que el participante clasificará. "
        "Puedes adjuntar una imagen y elegir si se muestra solo la imagen o "
        "imagen+texto.",
        "<b>Configuración</b> — edita los textos del proyecto, sube un video "
        "tutorial personalizado (si no, se usa el de ejemplo embebido), gestiona "
        "usuarios vinculados y zona de acciones irreversibles.",
        "<b>Participantes</b> — descarga los resultados (CSV, CSV etiquetado, XLSX).",
    ]))

    story.append(PageBreak())

    # --- Enlace público ---------------------------------------------------
    story.append(Paragraph("4. Enlace público para participantes", H1))
    story.append(Paragraph(
        "Para que personas externas puedan participar en tu estudio sin estar "
        "conectadas a tu red local, CMI incluye un sistema de túneles gestionado por "
        "Cloudflare. No requiere cuenta, configuración de red ni IP pública.", BODY))

    story.append(Paragraph("Iniciar un enlace", H2))
    story.append(Paragraph(
        "1. Selecciona un proyecto y entra a cualquier vista del sidebar.<br/>"
        "2. Click en <b>«Enlace público»</b>.<br/>"
        "3. La app levanta el túnel y muestra dos URLs: una para participantes (con "
        "<font face='Courier'>?projectId=…</font>) y otra para administrador.<br/>"
        "4. Copia la URL de participantes y compártela.", BODY))

    story.append(callout(
        "<b>El equipo no entrará en suspensión</b> mientras el enlace esté activo. "
        "Internamente la app evita el sleep automático para mantener la conexión. "
        "Esto se revierte al detener el enlace o cerrar la app.", "info"))

    story.append(Paragraph("Limitaciones a tener en cuenta", H2))
    story.extend(bullets([
        "<b>La URL cambia cada sesión.</b> Si cierras la app o detienes el enlace, "
        "al reabrir obtienes un dominio distinto. Compártelo justo antes del estudio.",
        "<b>Necesita conexión a internet</b> en el equipo del investigador.",
        "<b>Cierra la tapa del laptop con cuidado.</b> El bloqueo de sleep que "
        "activamos previene la suspensión por inactividad, pero no el cierre de "
        "tapa. Para sesiones largas conecta el equipo a corriente con monitor "
        "externo, o mantén la tapa abierta.",
        "<b>Cloudflare puede limitar tráfico</b> en uso muy intenso, pero para "
        "estudios normales no es un problema.",
    ]))

    story.append(Paragraph("Indicador en el sidebar", H2))
    story.append(Paragraph(
        "Debajo del botón <b>«Enlace público»</b> aparece un indicador con un punto "
        "de color: <b>verde «Activo»</b> mientras hay un túnel corriendo, "
        "<b>gris «Inactivo»</b> cuando no. El estado se refresca automáticamente.", BODY))

    story.append(PageBreak())

    # --- Troubleshooting --------------------------------------------------
    story.append(Paragraph("5. Resolución de problemas", H1))

    story.append(Paragraph("«La aplicación está dañada y no se puede abrir» (macOS)", H2))
    story.append(Paragraph(
        "Sucede cuando macOS marca el bundle como cuarentenado y la firma ad-hoc se "
        "considera no fiable. Solución:", BODY))
    story.append(code_block("xattr -cr /Applications/CMI.app"))
    story.append(Paragraph(
        "Después, doble click normal. Si vuelve a salir el mismo error tras una "
        "actualización, repite el comando.", BODY))

    story.append(Paragraph("«EADDRINUSE: address already in use :::4000»", H2))
    story.append(Paragraph(
        "Significa que un proceso de CMI quedó corriendo en background y bloquea el "
        "puerto. Normalmente sucede tras un cierre forzado. En Terminal (macOS):", BODY))
    story.append(code_block(
        "lsof -ti:4000 | xargs kill -9 2>/dev/null; \\\n"
        "killall cmi-app node caffeinate cloudflared 2>/dev/null"))
    story.append(Paragraph(
        "Después abre la app normalmente. En Windows: cierra la app por completo "
        "(icono del menú o Administrador de Tareas → finalizar tareas «CMI», «node.exe», "
        "«cloudflared.exe») y vuelve a abrirla.", BODY))

    story.append(Paragraph("La ventana se queda en blanco", H2))
    story.append(Paragraph(
        "Generalmente significa que el servidor interno no arrancó. En macOS, abre "
        "la app desde Terminal para ver los logs:", BODY))
    story.append(code_block("/Applications/CMI.app/Contents/MacOS/cmi-app"))
    story.append(Paragraph(
        "Los mensajes que empiezan con <font face='Courier'>[backend!]</font> indican "
        "errores del servidor. Compártelos al reportar el problema.", BODY))

    story.append(Paragraph("«Error 1033» al abrir el enlace público", H2))
    story.append(Paragraph(
        "Es un error de Cloudflare que significa que el túnel está registrado pero el "
        "servidor del investigador no responde. Pasos para resolver:", BODY))
    story.extend(bullets([
        "Verifica que CMI siga abierta en el equipo del investigador.",
        "Detén el enlace y vuelve a iniciarlo (la URL cambiará).",
        "Si el equipo entró en suspensión, despiértalo, detén y reinicia el enlace.",
    ]))

    story.append(Paragraph("La pantalla del Mac no se apaga después de cerrar la app", H2))
    story.append(Paragraph(
        "Si fuerzas el cierre de la app de forma inusual, un proceso "
        "<font face='Courier'>caffeinate</font> puede quedar huérfano. Soluciona con:",
        BODY))
    story.append(code_block("killall caffeinate"))
    story.append(Paragraph(
        "El comportamiento normal de suspensión se restaura inmediatamente.", BODY))

    story.append(PageBreak())

    # --- Desinstalación ---------------------------------------------------
    story.append(Paragraph("6. Desinstalación completa", H1))

    story.append(callout(
        "<b>Esto borra todos tus datos.</b> Tu base de datos local, tus proyectos, "
        "todos los videos e imágenes subidos y todos los resultados de participantes. "
        "Si quieres conservar los datos para una reinstalación posterior, NO ejecutes "
        "estos comandos completos: omite la parte que borra "
        "<font face='Courier'>com.klariff.cmi</font>.", "danger"))

    story.append(Paragraph("macOS — una sola línea", H2))
    story.append(code_block(
        "killall cmi-app node caffeinate cloudflared 2>/dev/null; \\\n"
        "rm -rf /Applications/CMI.app \\\n"
        "       ~/Library/Application\\ Support/com.klariff.cmi \\\n"
        "       ~/Library/Caches/com.klariff.cmi \\\n"
        "       ~/Library/WebKit/com.klariff.cmi"))

    story.append(Paragraph("macOS — paso a paso", H2))
    story.append(Paragraph("1. Cerrar procesos:", BODY))
    story.append(code_block("killall cmi-app node caffeinate cloudflared 2>/dev/null"))
    story.append(Paragraph("2. Borrar la aplicación:", BODY))
    story.append(code_block("rm -rf /Applications/CMI.app"))
    story.append(Paragraph("3. Borrar todos los datos:", BODY))
    story.append(code_block("rm -rf ~/Library/Application\\ Support/com.klariff.cmi"))
    story.append(Paragraph("4. (Opcional) Caché del WebView:", BODY))
    story.append(code_block(
        "rm -rf ~/Library/Caches/com.klariff.cmi\n"
        "rm -rf ~/Library/WebKit/com.klariff.cmi"))
    story.append(Paragraph("5. (Opcional) Vaciar Papelera:", BODY))
    story.append(code_block("osascript -e 'tell application \"Finder\" to empty trash'"))

    story.append(Paragraph("Windows", H2))
    story.append(Paragraph(
        "1. <b>Configuración → Aplicaciones → Aplicaciones instaladas</b> → busca "
        "«CMI» → <b>Desinstalar</b>.<br/>"
        "2. En PowerShell, borra los datos residuales:", BODY))
    story.append(code_block(
        "Remove-Item -Recurse -Force \"$env:APPDATA\\com.klariff.cmi\"\n"
        "Remove-Item -Recurse -Force \"$env:LOCALAPPDATA\\com.klariff.cmi\""))

    story.append(PageBreak())

    # --- Apéndice ---------------------------------------------------------
    story.append(Paragraph("7. Apéndice — referencia rápida de comandos", H1))

    rows = [
        ["Comando", "Qué hace"],
        ["xattr -cr /Applications/CMI.app",
         "Quita la cuarentena de macOS (resuelve el aviso de «dañada»)"],
        ["lsof -ti:4000 | xargs kill -9",
         "Mata cualquier proceso que ocupe el puerto 4000"],
        ["killall cmi-app node caffeinate cloudflared",
         "Mata todos los procesos hijos de CMI que pudieran quedar"],
        ["killall caffeinate",
         "Restaura el comportamiento de suspensión del Mac"],
        ["/Applications/CMI.app/Contents/MacOS/cmi-app",
         "Lanza la app desde Terminal mostrando logs"],
        ["ls ~/Library/Application\\ Support/com.klariff.cmi",
         "Lista los archivos de datos guardados localmente"],
    ]
    t = Table(rows, colWidths=[3.0 * inch, 3.4 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INDIGO),
        ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
        ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME",   (0, 1), (0, -1), "Courier"),
        ("FONTSIZE",   (0, 0), (-1, -1), 9),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("GRID", (0, 0), (-1, -1), 0.5, GREY_MED),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, GREY_LIGHT]),
    ]))
    story.append(t)

    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph("Versiones de la aplicación", H2))
    story.append(Paragraph(
        "Las versiones publicadas se listan en la página de releases del repositorio "
        "GitHub. Cada release adjunta los instaladores para las plataformas soportadas. "
        "El nombre del archivo no incluye la versión actual: se llama "
        "<font face='Courier'>CMI_0.1.0_*</font> independientemente de la release. "
        "Verifica que estás bajando la última usando el tag de la página de releases.", BODY))

    doc.build(story)
    print("CMI-manual.pdf written.")


if __name__ == "__main__":
    build()
