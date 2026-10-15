/* The welcome recording of a fresh account: the one file every new account
   opens first. A sales call about Transcribe To Text itself, so a person who
   reads or plays it learns what the app does while trying every tool on it.
   Three voices: Sam (sells the app), Jordan (customer success), Priya (a
   logistics team lead, the customer). Priya came in with her first name
   only, so Name a speaker has a real thing to fix (Priya Nair); line 13
   carries the model's classic slip, "lunch" for "launch", for Edit the
   transcript.

   The timestamps follow the generated audio: tools/voice/sync.py rewrites
   them from public/voice/welcome.json after tools/voice/gen.py. The
   developer takes the same lines as JSON from `node tools/voice/lines.mjs`
   and makes the audio with their own voices. */

export type WelcomeSpeaker = { id: string; name: string; color: string; initial: string };

export const WELCOME_SPEAKERS: WelcomeSpeaker[] = [
  { id: "w1", name: "Sam Rivera", color: "#2563eb", initial: "S" },
  { id: "w2", name: "Priya", color: "#a855f7", initial: "P" },
  { id: "w3", name: "Jordan Lee", color: "#10b981", initial: "J" },
];
const [SAM, PRIYA, JORDAN] = WELCOME_SPEAKERS;

export type WelcomeLine = { id: number; speaker: WelcomeSpeaker; timestamp: string; text: string };

const L = (id: number, speaker: WelcomeSpeaker, timestamp: string, text: string): WelcomeLine => ({ id, speaker, timestamp, text });

export const WELCOME_LINES: WelcomeLine[] = [
  L(1, SAM, "0:00", "Thanks for joining, Priya. I'm Sam, I look after new teams at Transcribe To Text, and Jordan here runs customer success. You said your team drowns in call notes, so let's walk through what the app does with a call like this one."),
  L(2, PRIYA, "0:13", "Great. We're a logistics company. Every dispatcher has about ten carrier calls a day, and nobody writes them up. By Friday half of what was agreed is gone. Where would a recording even go?"),
  L(3, JORDAN, "0:27", "Four ways in, all on the Home page. Drop an audio or video file, paste a link to a recording, press Record and speak into the microphone, or paste a Zoom, Meet or Teams link and our recorder joins the call for you."),
  L(4, PRIYA, "0:41", "So the recorder is a bot that sits in the meeting?"),
  L(5, SAM, "0:44", "Yes. Connect your Google or Outlook calendar once and it joins the calls you choose by itself. Auto-record can take every meeting or only the ones you organise. The host lets it in like any guest, and the transcript writes itself while you talk."),
  L(6, PRIYA, "1:01", "And when the file is in, what do I get back?"),
  L(7, JORDAN, "1:04", "A transcript with every word, split by speaker, with the time next to each paragraph. Click any word and the audio plays from there. Speaker identification is automatic: leave it on Auto-detect, and set a number only if you know exactly how many people were on the call."),
  L(8, SAM, "1:22", "The voices come out as Speaker 1 and Speaker 2 until you name them. That takes a few seconds, and from then on every quote says who said it. A manager reading on the phone sees that Priya said this, not Speaker 2."),
  L(9, PRIYA, "1:37", "And when I need to hear a tricky bit again?"),
  L(10, JORDAN, "1:40", "Click the word and it plays from there. The arrows step five seconds back or forward, and the speed runs from half to double. For clean reading, switch off the names and the timecodes, one switch each."),
  L(11, PRIYA, "1:54", "Good. Our carriers talk fast and the yard is loud. How accurate is it?"),
  L(12, JORDAN, "2:00", "Good enough that fixing is the exception. When the model does slip, Edit transcript lets you change the word right in the text, and the summary follows."),
  L(13, SAM, "2:10", "Quick aside: the lunch of our noise-robust model is on the fourteenth, and every account gets it free for the first two weeks. Loud yards are exactly what it was trained on."),
  L(14, PRIYA, "2:21", "Nice. Now the part my manager actually reads. The summary?"),
  L(15, SAM, "2:26", "Every recording gets a summary on its own tab: key points, decisions, action items. Pick a template once, Meeting notes, Sales call or Interview, and every summary comes out in that shape. You can write your own template and apply it to any recording later."),
  L(16, JORDAN, "2:42", "The outline on the right lists the topics with their times, so you jump straight to the rate talk. And for a long call, mark what matters while you read: highlight a sentence, leave a comment on it, tag a colleague. Everything you mark lands in the panel on the right, so an hour reads in a minute."),
  L(17, PRIYA, "3:01", "Half my team is in Mexico. Can they read it in Spanish?"),
  L(18, SAM, "3:05", "Translate to Spanish, or any of the other languages, and the transcript and the summary appear on a second tab next to the original. Copy either one with one click."),
  L(19, PRIYA, "3:16", "What about getting it out of the app? Our weekly report is a Word document."),
  L(20, JORDAN, "3:22", "Export as PDF, Word, plain text or subtitles. The summary, the translation and the audio are switches: turn on what you need. One file or a whole folder at once. Sharing works the same way: invite people by email or turn on a link, and they see the recording, the transcript and the summary under Shared with me."),
  L(21, PRIYA, "3:43", "Folders. Every carrier should have one."),
  L(22, SAM, "3:47", "A folder per carrier, per week, whatever fits. Drag a recording in, star the important ones, and My Records keeps the whole archive. Quick Find searches what was said across every recording, so a rate increase is found in the exact sentence of the exact call. And a recording deleted by mistake waits in Trash until you empty it."),
  L(23, PRIYA, "4:08", "Alright. On the day to day, what does a dispatcher do differently?"),
  L(24, JORDAN, "4:13", "Nothing. The calendar is connected, the recorder joins the calls, and the transcript and the summary wait in the folder. After each call a recap email can go out by itself, to everyone invited or only to you. On Friday they open the folder, export the summaries and send the report."),
  L(25, PRIYA, "4:32", "What does it cost us?"),
  L(26, SAM, "4:34", "Free covers your first recordings, so the whole team can try everything. Pro removes the limits and adds long files, priority processing and the team features. The plan page says exactly what is in each."),
  L(27, PRIYA, "4:49", "Sounds like a plan. Let's run a two week pilot with the dispatch team and check in on Fridays."),
  L(28, JORDAN, "4:56", "Done. I'll set up the carriers folder today and connect your calendar on tomorrow's call."),
  L(29, SAM, "5:02", "And this recording is your first one. Open the summary, name the speakers, fix the word I misread, and the first three steps are done. Thanks, Priya."),
];

export const WELCOME_END = "5:12";
export const WELCOME_LENGTH = "5 min 12s";

/* the line Edit the transcript points at: "lunch" where the voice says "launch" */
export const WELCOME_SLIP_LINE = 13;

export type WelcomeOutline = { id: string; title: string; timestamp: string; segmentId: number; bullets: { text: string; segmentId: number }[] };

export const WELCOME_OUTLINE: WelcomeOutline[] = [
  { id: "w-o1", title: "Why this call", timestamp: "0:00", segmentId: 1, bullets: [{ text: "Ten carrier calls a day per dispatcher, nobody writes them up", segmentId: 2 }] },
  { id: "w-o2", title: "Getting a call in", timestamp: "0:27", segmentId: 3, bullets: [{ text: "A file, a link, the microphone or the recorder in the meeting", segmentId: 3 }, { text: "Connect a calendar once, Auto-record for the meetings you choose", segmentId: 5 }] },
  { id: "w-o3", title: "The transcript", timestamp: "1:04", segmentId: 7, bullets: [{ text: "Every word by speaker, play from any word", segmentId: 7 }, { text: "Auto-detect the speakers, name them once", segmentId: 8 }, { text: "Speed, five seconds back, names and timecodes off for clean reading", segmentId: 10 }, { text: "Edit a misheard word in place", segmentId: 12 }] },
  { id: "w-o4", title: "Summary, outline, highlights", timestamp: "2:26", segmentId: 15, bullets: [{ text: "A template decides the shape of every summary", segmentId: 15 }, { text: "Highlight, comment, tag a colleague", segmentId: 16 }] },
  { id: "w-o5", title: "Spanish, export, sharing", timestamp: "3:05", segmentId: 18, bullets: [{ text: "Translate the transcript and the summary", segmentId: 18 }, { text: "PDF, Word, text or subtitles; a link or an invite", segmentId: 20 }] },
  { id: "w-o6", title: "Folders, Quick Find, Trash", timestamp: "3:47", segmentId: 22, bullets: [{ text: "A folder per carrier, Quick Find across every call", segmentId: 22 }, { text: "The recap email after each call", segmentId: 24 }] },
  { id: "w-o7", title: "Pilot", timestamp: "4:49", segmentId: 27, bullets: [{ text: "Two weeks with the dispatch team, check-ins on Fridays", segmentId: 27 }, { text: "Jordan sets up the folder and the calendar", segmentId: 28 }] },
];

/* written in the shape of the Meeting Notes template (WELCOME_TEMPLATE_ID), the one the record opens with */
export const WELCOME_TEMPLATE_ID = "demo-meeting";

export const WELCOME_SUMMARY = `## Key points

- Priya's dispatchers have about ten carrier calls a day each and nobody writes them up
- A call gets in four ways: a file, a link, the microphone, or the recorder joining a Zoom, Meet or Teams call from a connected calendar
- Every recording comes back as a transcript by speaker, a summary in the shape of a template, and an outline; play from any word, at any speed
- Highlights and comments collect what matters in the right panel; Quick Find searches across every recording
- Spanish translation of the transcript and the summary; export as PDF, Word, text or subtitles; sharing by invite or link; a recap email after each call

## Decisions

- Two week pilot with the dispatch team, check-ins on Fridays
- One folder per carrier
- Free plan for the pilot, Pro when the limits are reached

## Action items

- Jordan sets up the carriers folder today
- Jordan connects Priya's calendar on tomorrow's call
- Priya names the speakers, fixes the misread word and opens the summary of this recording

## Open questions

- Which two dispatchers join the pilot first
- Whether the weekly report goes out as Word or PDF
`;

/* the blurb under the recording in the records list */
export const WELCOME_BLURB = "Sales call with Sam and Jordan from Transcribe To Text: four ways to get a call in, speaker names, templates, highlights, Spanish translation, export and folders. Two week pilot with the dispatch team, check-ins on Fridays.";

/* Spanish, already on the record: the demo file shows every tool in use,
   translation among them. Names and times stay as they are. */
export const WELCOME_ES: Record<number, string> = {
  1: "Gracias por venir, Priya. Soy Sam, me ocupo de los equipos nuevos en Transcribe To Text, y Jordan lleva la atención al cliente. Dijiste que tu equipo se ahoga en notas de llamadas, así que veamos qué hace la aplicación con una llamada como esta.",
  2: "Genial. Somos una empresa de logística. Cada despachador tiene unas diez llamadas al día con transportistas y nadie las pasa a limpio. Para el viernes se ha perdido la mitad de lo acordado. ¿Adónde iría siquiera una grabación?",
  3: "Hay cuatro formas de entrar, todas en la página de inicio. Suelta un archivo de audio o vídeo, pega un enlace a una grabación, pulsa Grabar y habla al micrófono, o pega un enlace de Zoom, Meet o Teams y nuestro grabador se une a la llamada por ti.",
  4: "¿Entonces el grabador es un bot que se sienta en la reunión?",
  5: "Sí. Conecta tu calendario de Google u Outlook una vez y se une solo a las llamadas que elijas. La grabación automática puede tomar todas las reuniones o solo las que organizas tú. El anfitrión lo deja entrar como a cualquier invitado y la transcripción se escribe sola mientras hablas.",
  6: "¿Y cuando el archivo ya está dentro, qué recibo?",
  7: "Una transcripción con cada palabra, dividida por hablante, con la hora junto a cada párrafo. Haz clic en cualquier palabra y el audio se reproduce desde ahí. La identificación de hablantes es automática: déjala en detección automática y pon un número solo si sabes exactamente cuántas personas había en la llamada.",
  8: "Las voces salen como Hablante 1 y Hablante 2 hasta que les pones nombre. Eso lleva unos segundos, y desde entonces cada cita dice quién lo dijo. Un gerente que lee en el teléfono ve que lo dijo Priya, no el Hablante 2.",
  9: "¿Y cuando necesito volver a escuchar un trozo difícil?",
  10: "Haz clic en la palabra y se reproduce desde ahí. Las flechas saltan cinco segundos atrás o adelante, y la velocidad va de la mitad al doble. Para leer limpio, apaga los nombres y los códigos de tiempo, un interruptor para cada uno.",
  11: "Bien. Nuestros transportistas hablan rápido y el patio es ruidoso. ¿Qué tan precisa es?",
  12: "Lo bastante como para que corregir sea la excepción. Cuando el modelo se equivoca, Editar transcripción te deja cambiar la palabra directamente en el texto, y el resumen sigue el cambio.",
  13: "Un apunte rápido: el lanzamiento de nuestro modelo resistente al ruido es el día catorce, y cada cuenta lo recibe gratis las dos primeras semanas. Los patios ruidosos son exactamente con lo que se entrenó.",
  14: "Bien. Ahora la parte que mi gerente lee de verdad. ¿El resumen?",
  15: "Cada grabación recibe un resumen en su propia pestaña: puntos clave, decisiones, tareas. Elige una plantilla una vez, Notas de reunión, Llamada de ventas o Entrevista, y cada resumen sale con esa forma. Puedes escribir tu propia plantilla y aplicarla a cualquier grabación después.",
  16: "El esquema de la derecha lista los temas con sus tiempos, así saltas directo a la conversación sobre tarifas. Y en una llamada larga, marca lo que importa mientras lees: resalta una frase, deja un comentario, etiqueta a un compañero. Todo lo que marcas aparece en el panel de la derecha, así que una hora se lee en un minuto.",
  17: "La mitad de mi equipo está en México. ¿Pueden leerlo en español?",
  18: "Traduce al español, o a cualquiera de los otros idiomas, y la transcripción y el resumen aparecen en una segunda pestaña junto al original. Copia cualquiera de los dos con un clic.",
  19: "¿Y para sacarlo de la aplicación? Nuestro informe semanal es un documento de Word.",
  20: "Exporta como PDF, Word, texto plano o subtítulos. El resumen, la traducción y el audio son interruptores: activa lo que necesites. Un archivo o una carpeta entera de una vez. Compartir funciona igual: invita a personas por correo o activa un enlace, y ven la grabación, la transcripción y el resumen en Compartido conmigo.",
  21: "Carpetas. Cada transportista debería tener una.",
  22: "Una carpeta por transportista, por semana, lo que encaje. Arrastra una grabación dentro, marca con estrella las importantes, y Mis grabaciones guarda todo el archivo. Búsqueda rápida busca lo que se dijo en todas las grabaciones, así que una subida de tarifa se encuentra en la frase exacta de la llamada exacta. Y una grabación borrada por error espera en la Papelera hasta que la vacíes.",
  23: "De acuerdo. En el día a día, ¿qué hace distinto un despachador?",
  24: "Nada. El calendario está conectado, el grabador se une a las llamadas, y la transcripción y el resumen esperan en la carpeta. Después de cada llamada puede salir solo un correo con el resumen, a todos los invitados o solo a ti. El viernes abren la carpeta, exportan los resúmenes y envían el informe.",
  25: "¿Cuánto nos cuesta?",
  26: "Gratis cubre tus primeras grabaciones, así todo el equipo puede probarlo todo. Pro quita los límites y añade archivos largos, procesamiento prioritario y las funciones de equipo. La página del plan dice exactamente qué incluye cada uno.",
  27: "Suena bien. Hagamos un piloto de dos semanas con el equipo de despacho y revisemos los viernes.",
  28: "Hecho. Hoy creo la carpeta de transportistas y mañana en la llamada conecto tu calendario.",
  29: "Y esta grabación es la primera tuya. Abre el resumen, pon nombre a los hablantes, corrige la palabra que leí mal, y los tres primeros pasos están hechos. Gracias, Priya.",
};

export const WELCOME_SUMMARY_ES = `## Resumen

- Los despachadores de Priya tienen unas diez llamadas al día con transportistas y nadie las pasa a limpio
- Una llamada entra de cuatro formas: un archivo, un enlace, el micrófono, o el grabador uniéndose a una llamada de Zoom, Meet o Teams desde un calendario conectado
- Cada grabación vuelve como una transcripción por hablante, un resumen con la forma de una plantilla y un esquema; se reproduce desde cualquier palabra, a cualquier velocidad
- Los resaltados y comentarios reúnen lo importante en el panel derecho; Búsqueda rápida busca en todas las grabaciones
- Traducción al español de la transcripción y el resumen; exportación a PDF, Word, texto o subtítulos; compartir por invitación o enlace; un correo con el resumen después de cada llamada

## Decisiones

- Piloto de dos semanas con el equipo de despacho, revisiones los viernes
- Una carpeta por transportista
- Plan gratuito para el piloto, Pro cuando se alcancen los límites

## Tareas

- Jordan crea hoy la carpeta de transportistas
- Jordan conecta el calendario de Priya en la llamada de mañana
- Priya pone nombre a los hablantes, corrige la palabra mal leída y abre el resumen de esta grabación

## Preguntas abiertas

- Qué dos despachadores entran primero en el piloto
- Si el informe semanal sale en Word o en PDF
`;
