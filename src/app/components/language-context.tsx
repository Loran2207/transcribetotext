import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type LangCode = "en" | "ru" | "es" | "de" | "fr" | "ja";

export const LANGUAGES: { code: LangCode; label: string; short: string }[] = [
  { code: "en", label: "English", short: "US" },
  { code: "ru", label: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439", short: "RU" },
  { code: "es", label: "Espa\u00f1ol", short: "ES" },
  { code: "de", label: "Deutsch", short: "DE" },
  { code: "fr", label: "Fran\u00e7ais", short: "FR" },
  { code: "ja", label: "\u65e5\u672c\u8a9e", short: "JP" },
];

/* ═══════════════════════════════════════════════
   Translation dictionary
   ═══════════════════════════════════════════════ */

const dict: Record<string, Record<LangCode, string>> = {
  // ── Sidebar nav ──
  "nav.home": { en: "Home", ru: "\u0413\u043b\u0430\u0432\u043d\u0430\u044f", es: "Inicio", de: "Startseite", fr: "Accueil", ja: "\u30db\u30fc\u30e0" },
  "nav.calendar": { en: "Calendar", ru: "\u041a\u0430\u043b\u0435\u043d\u0434\u0430\u0440\u044c", es: "Calendario", de: "Kalender", fr: "Calendrier", ja: "\u30ab\u30ec\u30f3\u30c0\u30fc" },
  "nav.templates": { en: "Templates", ru: "\u0428\u0430\u0431\u043b\u043e\u043d\u044b", es: "Plantillas", de: "Vorlagen", fr: "Mod\u00e8les", ja: "\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8" },
  "nav.myRecords": { en: "My Records", ru: "\u041c\u043e\u0438 \u0437\u0430\u043f\u0438\u0441\u0438", es: "Mis grabaciones", de: "Meine Aufnahmen", fr: "Mes enregistrements", ja: "\u30de\u30a4\u30ec\u30b3\u30fc\u30c9" },
  "nav.integrations": { en: "Integrations", ru: "\u0418\u043d\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u0438", es: "Integraciones", de: "Integrationen", fr: "Int\u00e9grations", ja: "\u30a4\u30f3\u30c6\u30b0\u30ec\u30fc\u30b7\u30e7\u30f3" },
  "nav.starred": { en: "Starred", ru: "\u0418\u0437\u0431\u0440\u0430\u043d\u043d\u043e\u0435", es: "Destacados", de: "Markiert", fr: "Favoris", ja: "\u30b9\u30bf\u30fc\u4ed8\u304d" },
  "nav.folders": { en: "Folders", ru: "\u041f\u0430\u043f\u043a\u0438", es: "Carpetas", de: "Ordner", fr: "Dossiers", ja: "\u30d5\u30a9\u30eb\u30c0" },
  "nav.helpSupport": { en: "Help & Support", ru: "\u041f\u043e\u043c\u043e\u0449\u044c", es: "Ayuda y soporte", de: "Hilfe & Support", fr: "Aide & support", ja: "\u30d8\u30eb\u30d7" },
  "nav.noStarred": { en: "No starred files", ru: "\u041d\u0435\u0442 \u0438\u0437\u0431\u0440\u0430\u043d\u043d\u044b\u0445", es: "Sin archivos destacados", de: "Keine markierten", fr: "Aucun favori", ja: "\u30b9\u30bf\u30fc\u306a\u3057" },
  "nav.expandSidebar": { en: "Expand sidebar", ru: "\u0420\u0430\u0437\u0432\u0435\u0440\u043d\u0443\u0442\u044c", es: "Expandir barra", de: "Seitenleiste einblenden", fr: "\u00c9tendre la barre", ja: "\u30b5\u30a4\u30c9\u30d0\u30fc\u3092\u5c55\u958b" },

  // ── Profile menu ──
  "profile.settings": { en: "Settings", ru: "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438", es: "Configuraci\u00f3n", de: "Einstellungen", fr: "Param\u00e8tres", ja: "\u8a2d\u5b9a" },
  "profile.language": { en: "Language", ru: "\u042f\u0437\u044b\u043a", es: "Idioma", de: "Sprache", fr: "Langue", ja: "\u8a00\u8a9e" },
  "profile.darkMode": { en: "Dark Mode", ru: "\u0422\u0451\u043c\u043d\u0430\u044f \u0442\u0435\u043c\u0430", es: "Modo oscuro", de: "Dunkler Modus", fr: "Mode sombre", ja: "\u30c0\u30fc\u30af\u30e2\u30fc\u30c9" },
  "profile.lightMode": { en: "Light Mode", ru: "\u0421\u0432\u0435\u0442\u043b\u0430\u044f \u0442\u0435\u043c\u0430", es: "Modo claro", de: "Heller Modus", fr: "Mode clair", ja: "\u30e9\u30a4\u30c8\u30e2\u30fc\u30c9" },
  "profile.logOut": { en: "Log Out", ru: "\u0412\u044b\u0439\u0442\u0438", es: "Cerrar sesi\u00f3n", de: "Abmelden", fr: "D\u00e9connexion", ja: "\u30ed\u30b0\u30a2\u30a6\u30c8" },
  "profile.proPlan": { en: "Pro Plan", ru: "\u041f\u0440\u043e-\u043f\u043b\u0430\u043d", es: "Plan Pro", de: "Pro Plan", fr: "Plan Pro", ja: "\u30d7\u30ed\u30d7\u30e9\u30f3" },

  // ── Folder dialog ──
  "folder.createNew": { en: "Create New Folder", ru: "\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043f\u0430\u043f\u043a\u0443", es: "Crear nueva carpeta", de: "Neuen Ordner erstellen", fr: "Cr\u00e9er un dossier", ja: "\u65b0\u898f\u30d5\u30a9\u30eb\u30c0\u4f5c\u6210" },
  "folder.name": { en: "Folder name", ru: "\u0418\u043c\u044f \u043f\u0430\u043f\u043a\u0438", es: "Nombre de carpeta", de: "Ordnername", fr: "Nom du dossier", ja: "\u30d5\u30a9\u30eb\u30c0\u540d" },
  "folder.namePlaceholder": { en: "e.g. Client Meetings", ru: "\u043d\u0430\u043f\u0440. \u0412\u0441\u0442\u0440\u0435\u0447\u0438 \u0441 \u043a\u043b\u0438\u0435\u043d\u0442\u0430\u043c\u0438", es: "ej. Reuniones con clientes", de: "z.B. Kundenmeetings", fr: "ex. R\u00e9unions clients", ja: "\u4f8b: \u30af\u30e9\u30a4\u30a2\u30f3\u30c8\u4f1a\u8b70" },
  "folder.color": { en: "Color", ru: "\u0426\u0432\u0435\u0442", es: "Color", de: "Farbe", fr: "Couleur", ja: "\u8272" },
  "folder.create": { en: "Create Folder", ru: "\u0421\u043e\u0437\u0434\u0430\u0442\u044c", es: "Crear carpeta", de: "Ordner erstellen", fr: "Cr\u00e9er", ja: "\u4f5c\u6210" },
  "folder.addFolder": { en: "Add Folder", ru: "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043f\u0430\u043f\u043a\u0443", es: "A\u00f1adir carpeta", de: "Ordner hinzuf\u00fcgen", fr: "Ajouter un dossier", ja: "\u30d5\u30a9\u30eb\u30c0\u8ffd\u52a0" },
  "folder.moveTitle": { en: "Move {0} file{1} to folder", ru: "\u041f\u0435\u0440\u0435\u043c\u0435\u0441\u0442\u0438\u0442\u044c {0} \u0444\u0430\u0439\u043b{1}", es: "Mover {0} archivo{1} a carpeta", de: "{0} Datei{1} verschieben", fr: "D\u00e9placer {0} fichier{1}", ja: "{0}\u4ef6\u3092\u30d5\u30a9\u30eb\u30c0\u306b\u79fb\u52d5" },
  "folder.chooseDestination": { en: "Choose a destination folder", ru: "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u0430\u043f\u043a\u0443", es: "Elige una carpeta de destino", de: "Zielordner ausw\u00e4hlen", fr: "Choisir un dossier", ja: "\u79fb\u52d5\u5148\u3092\u9078\u629e" },
  "folder.createNewFolder": { en: "Create new folder", ru: "\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043d\u043e\u0432\u0443\u044e \u043f\u0430\u043f\u043a\u0443", es: "Crear nueva carpeta", de: "Neuen Ordner erstellen", fr: "Cr\u00e9er un dossier", ja: "\u65b0\u898f\u30d5\u30a9\u30eb\u30c0" },
  "folder.moveHere": { en: "Move here", ru: "\u041f\u0435\u0440\u0435\u043c\u0435\u0441\u0442\u0438\u0442\u044c", es: "Mover aqu\u00ed", de: "Hierher verschieben", fr: "D\u00e9placer ici", ja: "\u3053\u3053\u306b\u79fb\u52d5" },

  // ── Common ──
  "common.cancel": { en: "Cancel", ru: "\u041e\u0442\u043c\u0435\u043d\u0430", es: "Cancelar", de: "Abbrechen", fr: "Annuler", ja: "\u30ad\u30e3\u30f3\u30bb\u30eb" },
  "common.rename": { en: "Rename", ru: "\u041f\u0435\u0440\u0435\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u0442\u044c", es: "Renombrar", de: "Umbenennen", fr: "Renommer", ja: "\u540d\u524d\u5909\u66f4" },
  "common.delete": { en: "Delete", ru: "\u0423\u0434\u0430\u043b\u0438\u0442\u044c", es: "Eliminar", de: "L\u00f6schen", fr: "Supprimer", ja: "\u524a\u9664" },
  "common.restore": { en: "Restore", ru: "\u0412\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u044c", es: "Restaurar", de: "Wiederherstellen", fr: "Restaurer", ja: "\u5fa9\u5143" },
  "common.download": { en: "Download", ru: "\u0421\u043a\u0430\u0447\u0430\u0442\u044c", es: "Descargar", de: "Herunterladen", fr: "T\u00e9l\u00e9charger", ja: "\u30c0\u30a6\u30f3\u30ed\u30fc\u30c9" },
  "common.comingSoon": { en: "coming soon", ru: "\u0441\u043a\u043e\u0440\u043e", es: "pr\u00f3ximamente", de: "demnächst", fr: "bient\u00f4t", ja: "\u8fd1\u65e5\u516c\u958b" },

  // ── Dashboard ──
  "dash.greeting.morning": { en: "Good morning", ru: "\u0414\u043e\u0431\u0440\u043e\u0435 \u0443\u0442\u0440\u043e", es: "Buenos d\u00edas", de: "Guten Morgen", fr: "Bonjour", ja: "\u304a\u306f\u3088\u3046\u3054\u3056\u3044\u307e\u3059" },
  "dash.greeting.afternoon": { en: "Good afternoon", ru: "\u0414\u043e\u0431\u0440\u044b\u0439 \u0434\u0435\u043d\u044c", es: "Buenas tardes", de: "Guten Tag", fr: "Bon apr\u00e8s-midi", ja: "\u3053\u3093\u306b\u3061\u306f" },
  "dash.greeting.evening": { en: "Good evening", ru: "\u0414\u043e\u0431\u0440\u044b\u0439 \u0432\u0435\u0447\u0435\u0440", es: "Buenas noches", de: "Guten Abend", fr: "Bonsoir", ja: "\u3053\u3093\u3070\u3093\u306f" },
  "dash.card.instantSpeech": { en: "Instant speach", ru: "\u041c\u0433\u043d\u043e\u0432\u0435\u043d\u043d\u0430\u044f \u0440\u0435\u0447\u044c", es: "Habla instant\u00e1nea", de: "Sofortige Sprache", fr: "Parole instantan\u00e9e", ja: "\u30a4\u30f3\u30b9\u30bf\u30f3\u30c8\u30b9\u30d4\u30fc\u30c1" },
  "dash.card.meetingRecorder": { en: "Meeting Recorder", ru: "\u0417\u0430\u043f\u0438\u0441\u044c \u0432\u0441\u0442\u0440\u0435\u0447", es: "Grabador de reuniones", de: "Meeting-Recorder", fr: "Enregistreur de r\u00e9unions", ja: "\u4f1a\u8b70\u30ec\u30b3\u30fc\u30c0\u30fc" },
  "dash.card.transcribeFromLink": { en: "Transcribe from Link", ru: "\u0422\u0440\u0430\u043d\u0441\u043a\u0440\u0438\u043f\u0446\u0438\u044f \u043f\u043e \u0441\u0441\u044b\u043b\u043a\u0435", es: "Transcribir desde enlace", de: "Von Link transkribieren", fr: "Transcrire depuis un lien", ja: "\u30ea\u30f3\u30af\u304b\u3089\u6587\u5b57\u8d77\u3053\u3057" },
  "dash.card.audioVideoFiles": { en: "Audio & Video Files", ru: "\u0410\u0443\u0434\u0438\u043e \u0438 \u0432\u0438\u0434\u0435\u043e", es: "Archivos de audio y v\u00eddeo", de: "Audio & Video Dateien", fr: "Fichiers audio & vid\u00e9o", ja: "\u97f3\u58f0\u30fb\u52d5\u753b\u30d5\u30a1\u30a4\u30eb" },

  // ── Records table ──
  "table.myRecords": { en: "My Records", ru: "Мои записи", es: "Mis grabaciones", de: "Meine Aufnahmen", fr: "Mes enregistrements", ja: "マイレコード" },
  "table.allMyRecords": { en: "All records", ru: "Все записи", es: "Todas las grabaciones", de: "Alle Aufnahmen", fr: "Tous les enregistrements", ja: "すべてのレコード" },
  "table.searchPlaceholder": { en: "Search records...", ru: "\u041f\u043e\u0438\u0441\u043a \u0437\u0430\u043f\u0438\u0441\u0435\u0439...", es: "Buscar registros...", de: "Aufnahmen suchen...", fr: "Rechercher...", ja: "\u691c\u7d22..." },
  "table.recent": { en: "Recent", ru: "\u041d\u0435\u0434\u0430\u0432\u043d\u0438\u0435", es: "Recientes", de: "K\u00fcrzlich", fr: "R\u00e9cents", ja: "\u6700\u8fd1" },
  "table.starred": { en: "Starred", ru: "\u0418\u0437\u0431\u0440\u0430\u043d\u043d\u043e\u0435", es: "Destacados", de: "Markiert", fr: "Favoris", ja: "\u30b9\u30bf\u30fc\u4ed8\u304d" },
  "table.shared": { en: "Shared with me", ru: "\u041f\u043e\u0434\u0435\u043b\u0438\u043b\u0438\u0441\u044c \u0441\u043e \u043c\u043d\u043e\u0439", es: "Compartido conmigo", de: "Mit mir geteilt", fr: "Partag\u00e9 avec moi", ja: "\u5171\u6709\u3055\u308c\u305f" },
  "table.trash": { en: "Trash", ru: "\u041a\u043e\u0440\u0437\u0438\u043d\u0430", es: "Papelera", de: "Papierkorb", fr: "Corbeille", ja: "\u30b4\u30df\u7bb1" },
  "table.type": { en: "Type", ru: "\u0422\u0438\u043f", es: "Tipo", de: "Typ", fr: "Type", ja: "\u30bf\u30a4\u30d7" },
  "table.template": { en: "Template", ru: "\u0428\u0430\u0431\u043b\u043e\u043d", es: "Plantilla", de: "Vorlage", fr: "Mod\u00e8le", ja: "\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8" },
  "table.lang": { en: "Lang", ru: "\u042f\u0437\u044b\u043a", es: "Idioma", de: "Sprache", fr: "Langue", ja: "\u8a00\u8a9e" },
  "table.duration": { en: "Duration", ru: "\u0414\u043b\u0438\u0442.", es: "Duraci\u00f3n", de: "Dauer", fr: "Dur\u00e9e", ja: "\u6642\u9593" },
  "table.date": { en: "Date", ru: "\u0414\u0430\u0442\u0430", es: "Fecha", de: "Datum", fr: "Date", ja: "\u65e5\u4ed8" },
  "table.colStats": { en: "Stats", ru: "\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430", es: "Estad\u00edsticas", de: "Statistiken", fr: "Statistiques", ja: "\u7d71\u8a08" },
  "table.colLanguage": { en: "Language", ru: "\u042f\u0437\u044b\u043a", es: "Idioma", de: "Sprache", fr: "Langue", ja: "\u8a00\u8a9e" },
  "table.colDateCreated": { en: "Date created", ru: "\u0414\u0430\u0442\u0430 \u0441\u043e\u0437\u0434\u0430\u043d\u0438\u044f", es: "Fecha de creaci\u00f3n", de: "Erstellungsdatum", fr: "Date de cr\u00e9ation", ja: "\u4f5c\u6210\u65e5" },
  "table.selected": { en: "Selected", ru: "\u0412\u044b\u0431\u0440\u0430\u043d\u043e", es: "Seleccionados", de: "Ausgew\u00e4hlt", fr: "S\u00e9lectionn\u00e9s", ja: "\u9078\u629e\u6e08\u307f" },
  "table.moveToFolder": { en: "Move to Folder", ru: "\u0412 \u043f\u0430\u043f\u043a\u0443", es: "Mover a carpeta", de: "In Ordner verschieben", fr: "D\u00e9placer vers dossier", ja: "\u30d5\u30a9\u30eb\u30c0\u306b\u79fb\u52d5" },
  "table.moveToTrash": { en: "Move to Trash", ru: "\u0412 \u043a\u043e\u0440\u0437\u0438\u043d\u0443", es: "Mover a papelera", de: "In Papierkorb", fr: "Mettre \u00e0 la corbeille", ja: "\u30b4\u30df\u7bb1\u306b\u79fb\u52d5" },
  "table.cardView": { en: "Card view", ru: "\u041a\u0430\u0440\u0442\u043e\u0447\u043a\u0438", es: "Vista de tarjetas", de: "Kartenansicht", fr: "Vue cartes", ja: "\u30ab\u30fc\u30c9\u8868\u793a" },
  "table.groupByDate": { en: "Group by date", ru: "\u0413\u0440\u0443\u043f\u043f\u0438\u0440\u043e\u0432\u043a\u0430 \u043f\u043e \u0434\u0430\u0442\u0435", es: "Agrupar por fecha", de: "Nach Datum gruppieren", fr: "Grouper par date", ja: "\u65e5\u4ed8\u3067\u30b0\u30eb\u30fc\u30d7" },
  "table.columns": { en: "Columns", ru: "\u041a\u043e\u043b\u043e\u043d\u043a\u0438", es: "Columnas", de: "Spalten", fr: "Colonnes", ja: "\u5217" },
  "table.name": { en: "Name", ru: "\u0418\u043c\u044f", es: "Nombre", de: "Name", fr: "Nom", ja: "\u540d\u524d" },
  "table.resetDefault": { en: "Reset to default", ru: "\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c", es: "Restablecer", de: "Zur\u00fccksetzen", fr: "R\u00e9initialiser", ja: "\u30c7\u30d5\u30a9\u30eb\u30c8\u306b\u623b\u3059" },
  "table.newestFirst": { en: "Newest first", ru: "\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u043d\u043e\u0432\u044b\u0435", es: "M\u00e1s recientes", de: "Neueste zuerst", fr: "Plus r\u00e9cents", ja: "\u65b0\u3057\u3044\u9806" },
  "table.oldestFirst": { en: "Oldest first", ru: "\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0441\u0442\u0430\u0440\u044b\u0435", es: "M\u00e1s antiguos", de: "\u00c4lteste zuerst", fr: "Plus anciens", ja: "\u53e4\u3044\u9806" },
  "table.clearFilter": { en: "Clear filter", ru: "\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u0444\u0438\u043b\u044c\u0442\u0440", es: "Borrar filtro", de: "Filter l\u00f6schen", fr: "Effacer le filtre", ja: "\u30d5\u30a3\u30eb\u30bf\u30fc\u89e3\u9664" },
  "table.clearAllFilters": { en: "Clear all filters", ru: "\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u0432\u0441\u0435 \u0444\u0438\u043b\u044c\u0442\u0440\u044b", es: "Borrar todos los filtros", de: "Alle Filter l\u00f6schen", fr: "Effacer tous les filtres", ja: "\u5168\u30d5\u30a3\u30eb\u30bf\u30fc\u89e3\u9664" },
  "table.filters": { en: "filters", ru: "\u0444\u0438\u043b\u044c\u0442\u0440\u043e\u0432", es: "filtros", de: "Filter", fr: "filtres", ja: "\u30d5\u30a3\u30eb\u30bf\u30fc" },
  "table.saveView": { en: "Save View", ru: "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0432\u0438\u0434", es: "Guardar vista", de: "Ansicht speichern", fr: "Enregistrer la vue", ja: "\u30d3\u30e5\u30fc\u4fdd\u5b58" },
  "table.noResults": { en: "No results found", ru: "\u041d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e", es: "Sin resultados", de: "Keine Ergebnisse", fr: "Aucun r\u00e9sultat", ja: "\u7d50\u679c\u306a\u3057" },
  "table.noResultsDesc": { en: "No records match your current filters. Try adjusting or clearing them.", ru: "\u041d\u0435\u0442 \u0437\u0430\u043f\u0438\u0441\u0435\u0439, \u0441\u043e\u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u044e\u0449\u0438\u0445 \u0444\u0438\u043b\u044c\u0442\u0440\u0430\u043c. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0438\u043b\u0438 \u0441\u0431\u0440\u043e\u0441\u0438\u0442\u044c \u0438\u0445.", es: "No hay registros que coincidan con sus filtros.", de: "Keine Aufnahmen entsprechen Ihren aktuellen Filtern.", fr: "Aucun enregistrement ne correspond \u00e0 vos filtres actuels.", ja: "\u73fe\u5728\u306e\u30d5\u30a3\u30eb\u30bf\u30fc\u306b\u4e00\u81f4\u3059\u308b\u8a18\u9332\u306f\u3042\u308a\u307e\u305b\u3093\u3002" },
  "table.trashEmpty": { en: "Trash is empty", ru: "\u041a\u043e\u0440\u0437\u0438\u043d\u0430 \u043f\u0443\u0441\u0442\u0430", es: "Papelera vac\u00eda", de: "Papierkorb ist leer", fr: "Corbeille vide", ja: "\u30b4\u30df\u7bb1\u306f\u7a7a\u3067\u3059" },
  "table.noStarred": { en: "No starred records yet", ru: "\u041d\u0435\u0442 \u0438\u0437\u0431\u0440\u0430\u043d\u043d\u044b\u0445 \u0437\u0430\u043f\u0438\u0441\u0435\u0439", es: "Sin registros destacados", de: "Keine markierten Aufnahmen", fr: "Aucun favori", ja: "\u30b9\u30bf\u30fc\u4ed8\u304d\u306a\u3057" },
  "table.noRecords": { en: "No records found", ru: "\u0417\u0430\u043f\u0438\u0441\u0435\u0439 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e", es: "Sin registros", de: "Keine Aufnahmen gefunden", fr: "Aucun enregistrement", ja: "\u8a18\u9332\u306a\u3057" },
  "table.showMore": { en: "Show more", ru: "\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u0435\u0449\u0451", es: "Mostrar m\u00e1s", de: "Mehr anzeigen", fr: "Voir plus", ja: "\u3082\u3063\u3068\u898b\u308b" },
  "table.showLess": { en: "Show less", ru: "\u0421\u0432\u0435\u0440\u043d\u0443\u0442\u044c", es: "Mostrar menos", de: "Weniger anzeigen", fr: "Voir moins", ja: "\u6298\u308a\u305f\u305f\u3080" },

  // ── Right panel ──
  "panel.overview": { en: "Overview", ru: "\u041e\u0431\u0437\u043e\u0440", es: "Resumen", de: "\u00dcbersicht", fr: "Aper\u00e7u", ja: "\u6982\u8981" },
  "panel.meetings": { en: "Meetings", ru: "\u0412\u0441\u0442\u0440\u0435\u0447\u0438", es: "Reuniones", de: "Meetings", fr: "R\u00e9unions", ja: "\u4f1a\u8b70" },
  "panel.actionItems": { en: "Action Items", ru: "\u0417\u0430\u0434\u0430\u0447\u0438", es: "Tareas", de: "Aufgaben", fr: "T\u00e2ches", ja: "\u30bf\u30b9\u30af" },
  "panel.meetingsToday": { en: "Meetings today", ru: "\u0412\u0441\u0442\u0440\u0435\u0447 \u0441\u0435\u0433\u043e\u0434\u043d\u044f", es: "Reuniones hoy", de: "Meetings heute", fr: "R\u00e9unions aujourd'hui", ja: "\u4eca\u65e5\u306e\u4f1a\u8b70" },
  "panel.urgentTasks": { en: "Urgent tasks", ru: "\u0421\u0440\u043e\u0447\u043d\u044b\u0435 \u0437\u0430\u0434\u0430\u0447\u0438", es: "Tareas urgentes", de: "Dringende Aufgaben", fr: "T\u00e2ches urgentes", ja: "\u7dca\u6025\u30bf\u30b9\u30af" },
  "panel.upcomingMeetings": { en: "Upcoming Meetings", ru: "\u0411\u043b\u0438\u0436\u0430\u0439\u0448\u0438\u0435 \u0432\u0441\u0442\u0440\u0435\u0447\u0438", es: "Pr\u00f3ximas reuniones", de: "Kommende Meetings", fr: "Prochaines r\u00e9unions", ja: "\u4eca\u5f8c\u306e\u4f1a\u8b70" },
  "panel.myTasks": { en: "My Tasks", ru: "\u041c\u043e\u0438 \u0437\u0430\u0434\u0430\u0447\u0438", es: "Mis tareas", de: "Meine Aufgaben", fr: "Mes t\u00e2ches", ja: "\u30de\u30a4\u30bf\u30b9\u30af" },
  "panel.allTasks": { en: "All Tasks", ru: "\u0412\u0441\u0435 \u0437\u0430\u0434\u0430\u0447\u0438", es: "Todas las tareas", de: "Alle Aufgaben", fr: "Toutes les t\u00e2ches", ja: "\u5168\u30bf\u30b9\u30af" },
  "panel.addNote": { en: "Add note", ru: "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c", es: "A\u00f1adir nota", de: "Notiz hinzuf\u00fcgen", fr: "Ajouter une note", ja: "\u30ce\u30fc\u30c8\u8ffd\u52a0" },
  "panel.allMeetings": { en: "All meetings", ru: "\u0412\u0441\u0435 \u0432\u0441\u0442\u0440\u0435\u0447\u0438", es: "Todas las reuniones", de: "Alle Meetings", fr: "Toutes les r\u00e9unions", ja: "\u5168\u4f1a\u8b70" },
  "panel.aiGenerated": { en: "AI generated", ru: "AI \u0441\u0433\u0435\u043d\u0435\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043e", es: "Generado por IA", de: "KI-generiert", fr: "G\u00e9n\u00e9r\u00e9 par IA", ja: "AI\u751f\u6210" },
  "panel.filter": { en: "Filter", ru: "\u0424\u0438\u043b\u044c\u0442\u0440", es: "Filtro", de: "Filter", fr: "Filtre", ja: "\u30d5\u30a3\u30eb\u30bf\u30fc" },
  "panel.priority": { en: "Priority", ru: "\u041f\u0440\u0438\u043e\u0440\u0438\u0442\u0435\u0442", es: "Prioridad", de: "Priorit\u00e4t", fr: "Priorit\u00e9", ja: "\u512a\u5148\u5ea6" },
  "panel.sort": { en: "Sort", ru: "\u0421\u043e\u0440\u0442\u0438\u0440\u043e\u0432\u043a\u0430", es: "Ordenar", de: "Sortieren", fr: "Trier", ja: "\u4e26\u3079\u66ff\u3048" },
  "panel.byPriority": { en: "By priority", ru: "\u041f\u043e \u043f\u0440\u0438\u043e\u0440\u0438\u0442\u0435\u0442\u0443", es: "Por prioridad", de: "Nach Priorit\u00e4t", fr: "Par priorit\u00e9", ja: "\u512a\u5148\u5ea6\u9806" },
  "panel.clearAll": { en: "Clear all", ru: "\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u0432\u0441\u0451", es: "Borrar todo", de: "Alle l\u00f6schen", fr: "Tout effacer", ja: "\u3059\u3079\u3066\u30af\u30ea\u30a2" },
  "panel.add": { en: "Add", ru: "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c", es: "A\u00f1adir", de: "Hinzuf\u00fcgen", fr: "Ajouter", ja: "\u8ffd\u52a0" },
  "panel.writeNote": { en: "Write a note or task...", ru: "\u041d\u0430\u043f\u0438\u0448\u0438\u0442\u0435 \u0437\u0430\u043c\u0435\u0442\u043a\u0443...", es: "Escribe una nota o tarea...", de: "Notiz oder Aufgabe schreiben...", fr: "\u00c9crire une note ou t\u00e2che...", ja: "\u30e1\u30e2\u307e\u305f\u306f\u30bf\u30b9\u30af\u3092\u5165\u529b..." },
  "panel.noTasks": { en: "No tasks for this meeting", ru: "\u041d\u0435\u0442 \u0437\u0430\u0434\u0430\u0447", es: "Sin tareas", de: "Keine Aufgaben", fr: "Aucune t\u00e2che", ja: "\u30bf\u30b9\u30af\u306a\u3057" },
  "panel.recordLive": { en: "Record a live meeting", ru: "\u0417\u0430\u043f\u0438\u0441\u044c \u043e\u043d\u043b\u0430\u0439\u043d-\u0432\u0441\u0442\u0440\u0435\u0447\u0438", es: "Grabar una reuni\u00f3n en vivo", de: "Live-Meeting aufnehmen", fr: "Enregistrer une r\u00e9union", ja: "\u30e9\u30a4\u30d6\u4f1a\u8b70\u3092\u9332\u97f3" },
  "panel.recordLiveDesc": { en: "Works with Zoom, Google Meet, or Microsoft Teams", ru: "\u0420\u0430\u0431\u043e\u0442\u0430\u0435\u0442 \u0441 Zoom, Google Meet, Microsoft Teams", es: "Funciona con Zoom, Google Meet o Microsoft Teams", de: "Funktioniert mit Zoom, Google Meet oder Microsoft Teams", fr: "Compatible avec Zoom, Google Meet ou Microsoft Teams", ja: "Zoom\u3001Google Meet\u3001Microsoft Teams\u5bfe\u5fdc" },
  "panel.pasteMeetingUrl": { en: "Paste meeting URL to add...", ru: "\u0412\u0441\u0442\u0430\u0432\u044c\u0442\u0435 \u0441\u0441\u044b\u043b\u043a\u0443 \u043d\u0430 \u0432\u0441\u0442\u0440\u0435\u0447\u0443...", es: "Pega la URL de la reuni\u00f3n...", de: "Meeting-URL einf\u00fcgen...", fr: "Collez l'URL de la r\u00e9union...", ja: "\u4f1a\u8b70URL\u3092\u8cbc\u308a\u4ed8\u3051..." },
  "panel.upcoming": { en: "Upcoming", ru: "\u0411\u043b\u0438\u0436\u0430\u0439\u0448\u0438\u0435", es: "Pr\u00f3ximas", de: "Kommende", fr: "A venir", ja: "\u4eca\u5f8c" },
  "panel.noMeetings": { en: "No meetings scheduled", ru: "\u041d\u0435\u0442 \u0437\u0430\u043f\u043b\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0445 \u0432\u0441\u0442\u0440\u0435\u0447", es: "Sin reuniones programadas", de: "Keine Meetings geplant", fr: "Aucune r\u00e9union programm\u00e9e", ja: "\u4f1a\u8b70\u306a\u3057" },
  "panel.today": { en: "Today", ru: "\u0421\u0435\u0433\u043e\u0434\u043d\u044f", es: "Hoy", de: "Heute", fr: "Aujourd'hui", ja: "\u4eca\u65e5" },
  "panel.autoJoin": { en: "Auto-join", ru: "\u0410\u0432\u0442\u043e-\u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u0435", es: "Uni\u00f3n autom\u00e1tica", de: "Auto-Beitritt", fr: "Rejoindre auto.", ja: "\u81ea\u52d5\u53c2\u52a0" },
  "panel.attendees": { en: "Attendees", ru: "\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u0438", es: "Asistentes", de: "Teilnehmer", fr: "Participants", ja: "\u53c2\u52a0\u8005" },
  
  // ── Priority ──
  "priority.urgent": { en: "Urgent", ru: "\u0421\u0440\u043e\u0447\u043d\u043e", es: "Urgente", de: "Dringend", fr: "Urgent", ja: "\u7dca\u6025" },
  "priority.high": { en: "High", ru: "\u0412\u044b\u0441\u043e\u043a\u0438\u0439", es: "Alto", de: "Hoch", fr: "Haute", ja: "\u9ad8" },
  "priority.medium": { en: "Medium", ru: "\u0421\u0440\u0435\u0434\u043d\u0438\u0439", es: "Medio", de: "Mittel", fr: "Moyen", ja: "\u4e2d" },
  "priority.low": { en: "Low", ru: "\u041d\u0438\u0437\u043a\u0438\u0439", es: "Bajo", de: "Niedrig", fr: "Basse", ja: "\u4f4e" },

  // ── Collapsed sidebar tabs ──
  "collapsed.overview": { en: "Overview", ru: "\u041e\u0431\u0437\u043e\u0440", es: "Resumen", de: "\u00dcbersicht", fr: "Aper\u00e7u", ja: "\u6982\u8981" },
  "collapsed.calendar": { en: "Calendar", ru: "\u041a\u0430\u043b\u0435\u043d\u0434\u0430\u0440\u044c", es: "Calendario", de: "Kalender", fr: "Calendrier", ja: "\u30ab\u30ec\u30f3\u30c0\u30fc" },
  "collapsed.tasks": { en: "Tasks", ru: "\u0417\u0430\u0434\u0430\u0447\u0438", es: "Tareas", de: "Aufgaben", fr: "T\u00e2ches", ja: "\u30bf\u30b9\u30af" },

  // ── Common extras ──
  "common.add": { en: "Add", ru: "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c", es: "A\u00f1adir", de: "Hinzuf\u00fcgen", fr: "Ajouter", ja: "\u8ffd\u52a0" },
  "common.export": { en: "Export", ru: "\u042d\u043a\u0441\u043f\u043e\u0440\u0442", es: "Exportar", de: "Exportieren", fr: "Exporter", ja: "\u30a8\u30af\u30b9\u30dd\u30fc\u30c8" },
  "common.copied": { en: "Copied!", ru: "\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u043e!", es: "\u00a1Copiado!", de: "Kopiert!", fr: "Copi\u00e9 !", ja: "\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f" },
  "table.copySummary": { en: "Copy Summary", ru: "\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c Summary", es: "Copiar resumen", de: "Zusammenfassung kopieren", fr: "Copier le r\u00e9sum\u00e9", ja: "\u8981\u7d04\u3092\u30b3\u30d4\u30fc" },
  "table.copyTasks": { en: "Copy All Tasks", ru: "\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0437\u0430\u0434\u0430\u0447\u0438", es: "Copiar tareas", de: "Aufgaben kopieren", fr: "Copier les t\u00e2ches", ja: "\u30bf\u30b9\u30af\u3092\u30b3\u30d4\u30fc" },
  "table.summary": { en: "Summary", ru: "Summary", es: "Resumen", de: "Zusammenfassung", fr: "R\u00e9sum\u00e9", ja: "\u8981\u7d04" },
  "sidebar.expandSidebar": { en: "Expand sidebar", ru: "\u0420\u0430\u0437\u0432\u0435\u0440\u043d\u0443\u0442\u044c", es: "Expandir barra", de: "Seitenleiste einblenden", fr: "\u00c9tendre la barre", ja: "\u30b5\u30a4\u30c9\u30d0\u30fc\u3092\u5c55\u958b" },
  "sidebar.noStarredFiles": { en: "No starred files", ru: "\u041d\u0435\u0442 \u0438\u0437\u0431\u0440\u0430\u043d\u043d\u044b\u0445", es: "Sin archivos destacados", de: "Keine markierten Dateien", fr: "Aucun favori", ja: "\u30b9\u30bf\u30fc\u4ed8\u304d\u306a\u3057" },
  "panel.writeNoteOrTask": { en: "Write a note or task...", ru: "\u041d\u0430\u043f\u0438\u0448\u0438\u0442\u0435 \u0437\u0430\u043c\u0435\u0442\u043a\u0443\u2026", es: "Escribe una nota\u2026", de: "Notiz oder Aufgabe\u2026", fr: "\u00c9crire une note\u2026", ja: "\u30ce\u30fc\u30c8\u2026" },
  "panel.noMeetingsScheduled": { en: "No meetings scheduled", ru: "\u041d\u0435\u0442 \u0432\u0441\u0442\u0440\u0435\u0447", es: "Sin reuniones", de: "Keine Meetings", fr: "Aucune r\u00e9union", ja: "\u4e88\u5b9a\u306a\u3057" },
  "panel.noTasksForMeeting": { en: "No tasks for this meeting", ru: "\u041d\u0435\u0442 \u0437\u0430\u0434\u0430\u0447", es: "Sin tareas", de: "Keine Aufgaben", fr: "Aucune t\u00e2che", ja: "\u30bf\u30b9\u30af\u306a\u3057" },
  "panel.worksWithPlatforms": { en: "Works with Zoom, Google Meet, or Microsoft Teams", ru: "\u0420\u0430\u0431\u043e\u0442\u0430\u0435\u0442 \u0441 Zoom, Google Meet, Teams", es: "Compatible con Zoom, Meet, Teams", de: "Funktioniert mit Zoom, Meet, Teams", fr: "Compatible avec Zoom, Meet, Teams", ja: "Zoom\u3001Meet\u3001Teams\u5bfe\u5fdc" },

  // ── Share dialog ──
  "share.title": { en: "Share \u2018{name}\u2019", ru: "\u041f\u043e\u0434\u0435\u043b\u0438\u0442\u044c\u0441\u044f \u00ab{name}\u00bb", es: "Compartir \u2018{name}\u2019", de: "\u201e{name}\u201c teilen", fr: "Partager \u00ab{name}\u00bb", ja: "\u300c{name}\u300d\u3092\u5171\u6709" },
  "share.addPeople": { en: "Add people", ru: "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043b\u044e\u0434\u0435\u0439", es: "Agregar personas", de: "Personen hinzuf\u00fcgen", fr: "Ajouter des personnes", ja: "\u30e6\u30fc\u30b6\u30fc\u3092\u8ffd\u52a0" },
  "share.emailPlaceholder": { en: "Enter email address", ru: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 email", es: "Ingresa correo electr\u00f3nico", de: "E-Mail-Adresse eingeben", fr: "Saisir l\u2019adresse e-mail", ja: "\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u3092\u5165\u529b" },
  "share.send": { en: "Send", ru: "\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c", es: "Enviar", de: "Senden", fr: "Envoyer", ja: "\u9001\u4fe1" },
  "share.peopleWithAccess": { en: "People with access", ru: "\u0414\u043e\u0441\u0442\u0443\u043f \u0435\u0441\u0442\u044c \u0443", es: "Personas con acceso", de: "Personen mit Zugriff", fr: "Personnes ayant acc\u00e8s", ja: "\u30a2\u30af\u30bb\u30b9\u6a29\u306e\u3042\u308b\u30e6\u30fc\u30b6\u30fc" },
  "share.owner": { en: "Owner", ru: "\u0412\u043b\u0430\u0434\u0435\u043b\u0435\u0446", es: "Propietario", de: "Eigent\u00fcmer", fr: "Propri\u00e9taire", ja: "\u30aa\u30fc\u30ca\u30fc" },
  "share.viewer": { en: "Viewer", ru: "\u0427\u0438\u0442\u0430\u0442\u0435\u043b\u044c", es: "Lector", de: "Betrachter", fr: "Lecteur", ja: "\u95b2\u89a7\u8005" },
  "share.editor": { en: "Editor", ru: "\u0420\u0435\u0434\u0430\u043a\u0442\u043e\u0440", es: "Editor", de: "Bearbeiter", fr: "\u00c9diteur", ja: "\u7de8\u96c6\u8005" },
  "share.generalAccess": { en: "General access", ru: "\u041e\u0431\u0449\u0438\u0439 \u0434\u043e\u0441\u0442\u0443\u043f", es: "Acceso general", de: "Allgemeiner Zugriff", fr: "Acc\u00e8s g\u00e9n\u00e9ral", ja: "\u4e00\u822c\u30a2\u30af\u30bb\u30b9" },
  "share.restricted": { en: "Restricted", ru: "\u041e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u043d\u044b\u0439", es: "Restringido", de: "Eingeschr\u00e4nkt", fr: "Restreint", ja: "\u5236\u9650\u4ed8\u304d" },
  "share.restrictedDesc": { en: "Only people added can access", ru: "\u0414\u043e\u0441\u0442\u0443\u043f \u0442\u043e\u043b\u044c\u043a\u043e \u0443 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u043d\u044b\u0445 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0435\u0439", es: "Solo las personas agregadas pueden acceder", de: "Nur hinzugef\u00fcgte Personen haben Zugriff", fr: "Seules les personnes ajout\u00e9es peuvent acc\u00e9der", ja: "\u8ffd\u52a0\u3055\u308c\u305f\u30e6\u30fc\u30b6\u30fc\u306e\u307f\u30a2\u30af\u30bb\u30b9\u53ef\u80fd" },
  "share.anyoneWithLink": { en: "Anyone with the link", ru: "\u0412\u0441\u0435, \u0443 \u043a\u043e\u0433\u043e \u0435\u0441\u0442\u044c \u0441\u0441\u044b\u043b\u043a\u0430", es: "Cualquier persona con el enlace", de: "Jeder mit dem Link", fr: "Toute personne disposant du lien", ja: "\u30ea\u30f3\u30af\u3092\u77e5\u3063\u3066\u3044\u308b\u5168\u54e1" },
  "share.anyoneWithLinkDesc": { en: "Anyone with the link can {access}", ru: "\u041b\u044e\u0431\u043e\u0439 \u0441\u043e \u0441\u0441\u044b\u043b\u043a\u043e\u0439 \u043c\u043e\u0436\u0435\u0442 {access}", es: "Cualquier persona con el enlace puede {access}", de: "Jeder mit dem Link kann {access}", fr: "Toute personne disposant du lien peut {access}", ja: "\u30ea\u30f3\u30af\u3092\u77e5\u3063\u3066\u3044\u308b\u5168\u54e1\u304c{access}\u53ef\u80fd" },
  "share.copyLink": { en: "Copy link", ru: "\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0441\u0441\u044b\u043b\u043a\u0443", es: "Copiar enlace", de: "Link kopieren", fr: "Copier le lien", ja: "\u30ea\u30f3\u30af\u3092\u30b3\u30d4\u30fc" },
  "share.linkCopied": { en: "Link copied", ru: "\u0421\u0441\u044b\u043b\u043a\u0430 \u0441\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u0430", es: "Enlace copiado", de: "Link kopiert", fr: "Lien copi\u00e9", ja: "\u30ea\u30f3\u30af\u3092\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f" },
  "share.invitationSent": { en: "Invitation sent to {email}", ru: "\u041f\u0440\u0438\u0433\u043b\u0430\u0448\u0435\u043d\u0438\u0435 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u043e \u043d\u0430 {email}", es: "Invitaci\u00f3n enviada a {email}", de: "Einladung gesendet an {email}", fr: "Invitation envoy\u00e9e \u00e0 {email}", ja: "{email}\u306b\u62db\u5f85\u3092\u9001\u4fe1\u3057\u307e\u3057\u305f" },
  "share.removed": { en: "Access removed", ru: "\u0414\u043e\u0441\u0442\u0443\u043f \u0443\u0434\u0430\u043b\u0451\u043d", es: "Acceso eliminado", de: "Zugriff entfernt", fr: "Acc\u00e8s supprim\u00e9", ja: "\u30a2\u30af\u30bb\u30b9\u3092\u524a\u9664\u3057\u307e\u3057\u305f" },
  "share.accessUpdated": { en: "Access updated", ru: "\u0414\u043e\u0441\u0442\u0443\u043f \u043e\u0431\u043d\u043e\u0432\u043b\u0451\u043d", es: "Acceso actualizado", de: "Zugriff aktualisiert", fr: "Acc\u00e8s mis \u00e0 jour", ja: "\u30a2\u30af\u30bb\u30b9\u3092\u66f4\u65b0\u3057\u307e\u3057\u305f" },
  "share.invalidEmail": { en: "Enter a valid email address", ru: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0439 email", es: "Ingresa un correo v\u00e1lido", de: "G\u00fcltige E-Mail eingeben", fr: "Saisissez un e-mail valide", ja: "\u6709\u52b9\u306a\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u3092\u5165\u529b" },
  "share.cantShareWithSelf": { en: "You can't share with yourself", ru: "\u041d\u0435\u043b\u044c\u0437\u044f \u043f\u043e\u0434\u0435\u043b\u0438\u0442\u044c\u0441\u044f \u0441 \u0441\u043e\u0431\u043e\u0439", es: "No puedes compartir contigo mismo", de: "Sie k\u00f6nnen nicht mit sich selbst teilen", fr: "Vous ne pouvez pas partager avec vous-m\u00eame", ja: "\u81ea\u5206\u81ea\u8eab\u3068\u306f\u5171\u6709\u3067\u304d\u307e\u305b\u3093" },
  "share.alreadyShared": { en: "Already shared with this person", ru: "\u0423\u0436\u0435 \u043f\u043e\u0434\u0435\u043b\u0438\u043b\u0438\u0441\u044c \u0441 \u044d\u0442\u0438\u043c \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0435\u043c", es: "Ya compartido con esta persona", de: "Bereits mit dieser Person geteilt", fr: "D\u00e9j\u00e0 partag\u00e9 avec cette personne", ja: "\u3053\u306e\u30e6\u30fc\u30b6\u30fc\u3068\u306f\u65e2\u306b\u5171\u6709\u6e08\u307f" },
  "share.sharedWithMe": { en: "Shared with me", ru: "\u041f\u043e\u0434\u0435\u043b\u0438\u043b\u0438\u0441\u044c \u0441\u043e \u043c\u043d\u043e\u0439", es: "Compartido conmigo", de: "Mit mir geteilt", fr: "Partag\u00e9 avec moi", ja: "\u5171\u6709\u3055\u308c\u305f\u30a2\u30a4\u30c6\u30e0" },

  // ── Shared with me page ──
  "nav.sharedWithMe": { en: "Shared with me", ru: "\u041f\u043e\u0434\u0435\u043b\u0438\u043b\u0438\u0441\u044c \u0441\u043e \u043c\u043d\u043e\u0439", es: "Compartido conmigo", de: "Mit mir geteilt", fr: "Partag\u00e9 avec moi", ja: "\u5171\u6709\u3055\u308c\u305f" },
  "shared.subtitle": { en: "Transcriptions and folders shared by others", ru: "\u0422\u0440\u0430\u043d\u0441\u043a\u0440\u0438\u043f\u0446\u0438\u0438 \u0438 \u043f\u0430\u043f\u043a\u0438, \u043a\u043e\u0442\u043e\u0440\u044b\u043c\u0438 \u043f\u043e\u0434\u0435\u043b\u0438\u043b\u0438\u0441\u044c", es: "Transcripciones y carpetas compartidas por otros", de: "Von anderen geteilte Transkriptionen und Ordner", fr: "Transcriptions et dossiers partag\u00e9s par d'autres", ja: "\u4ed6\u306e\u30e6\u30fc\u30b6\u30fc\u304c\u5171\u6709\u3057\u305f\u30c8\u30e9\u30f3\u30b9\u30af\u30ea\u30d7\u30c8\u3068\u30d5\u30a9\u30eb\u30c0" },
  "shared.sharedBy": { en: "Shared by", ru: "\u041f\u043e\u0434\u0435\u043b\u0438\u043b\u0441\u044f", es: "Compartido por", de: "Geteilt von", fr: "Partag\u00e9 par", ja: "\u5171\u6709\u5143" },
  "shared.access": { en: "Access", ru: "\u0414\u043e\u0441\u0442\u0443\u043f", es: "Acceso", de: "Zugriff", fr: "Acc\u00e8s", ja: "\u30a2\u30af\u30bb\u30b9" },
  "shared.dateShared": { en: "Date shared", ru: "\u0414\u0430\u0442\u0430", es: "Fecha", de: "Datum", fr: "Date", ja: "\u5171\u6709\u65e5" },
  "shared.emptyTitle": { en: "Nothing shared with you yet", ru: "\u041f\u043e\u043a\u0430 \u043d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043f\u043e\u0434\u0435\u043b\u0438\u043b\u0438\u0441\u044c", es: "Nada compartido contigo a\u00fan", de: "Noch nichts mit Ihnen geteilt", fr: "Rien partag\u00e9 avec vous", ja: "\u307e\u3060\u5171\u6709\u3055\u308c\u305f\u3082\u306e\u306f\u3042\u308a\u307e\u305b\u3093" },
  "shared.emptyDesc": { en: "When someone shares a transcription or folder with you, it will appear here.", ru: "\u041a\u043e\u0433\u0434\u0430 \u043a\u0442\u043e-\u0442\u043e \u043f\u043e\u0434\u0435\u043b\u0438\u0442\u0441\u044f \u0441 \u0432\u0430\u043c\u0438, \u044d\u0442\u043e \u043f\u043e\u044f\u0432\u0438\u0442\u0441\u044f \u0437\u0434\u0435\u0441\u044c.", es: "Cuando alguien comparta contigo, aparecer\u00e1 aqu\u00ed.", de: "Wenn jemand etwas mit Ihnen teilt, erscheint es hier.", fr: "Lorsque quelqu'un partage avec vous, cela appara\u00eetra ici.", ja: "\u8ab0\u304b\u304c\u5171\u6709\u3059\u308b\u3068\u3001\u3053\u3053\u306b\u8868\u793a\u3055\u308c\u307e\u3059\u3002" },
  "share.view": { en: "view", ru: "\u043f\u0440\u043e\u0441\u043c\u043e\u0442\u0440", es: "ver", de: "ansehen", fr: "consulter", ja: "\u95b2\u89a7" },
  "share.edit": { en: "edit", ru: "\u0440\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435", es: "editar", de: "bearbeiten", fr: "\u00e9diter", ja: "\u7de8\u96c6" },
  "common.done": { en: "Done", ru: "\u0413\u043e\u0442\u043e\u0432\u043e", es: "Listo", de: "Fertig", fr: "Termin\u00e9", ja: "\u5b8c\u4e86" },

  // ── Share view page (public) ──
  "shareView.title": { en: "Shared transcription", ru: "\u041e\u0431\u0449\u0430\u044f \u0442\u0440\u0430\u043d\u0441\u043a\u0440\u0438\u043f\u0446\u0438\u044f", es: "Transcripci\u00f3n compartida", de: "Geteilte Transkription", fr: "Transcription partag\u00e9e", ja: "\u5171\u6709\u30c8\u30e9\u30f3\u30b9\u30af\u30ea\u30d7\u30c8" },
  "shareView.signIn": { en: "Sign in", ru: "\u0412\u043e\u0439\u0442\u0438", es: "Iniciar sesi\u00f3n", de: "Anmelden", fr: "Se connecter", ja: "\u30ed\u30b0\u30a4\u30f3" },
  "shareView.summary": { en: "Summary", ru: "\u041a\u0440\u0430\u0442\u043a\u043e\u0435 \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u043d\u0438\u0435", es: "Resumen", de: "Zusammenfassung", fr: "R\u00e9sum\u00e9", ja: "\u8981\u7d04" },
  "shareView.transcript": { en: "Transcript", ru: "\u0422\u0440\u0430\u043d\u0441\u043a\u0440\u0438\u043f\u0442", es: "Transcripci\u00f3n", de: "Transkript", fr: "Transcription", ja: "\u30c8\u30e9\u30f3\u30b9\u30af\u30ea\u30d7\u30c8" },
  "shareView.poweredBy": { en: "Powered by Transcribe2Text", ru: "\u0420\u0430\u0431\u043e\u0442\u0430\u0435\u0442 \u043d\u0430 Transcribe2Text", es: "Desarrollado por Transcribe2Text", de: "Bereitgestellt von Transcribe2Text", fr: "Propuls\u00e9 par Transcribe2Text", ja: "Transcribe2Text\u3067\u52d5\u4f5c" },
  "shareView.signUpFree": { en: "Sign up for free", ru: "\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u0442\u044c\u0441\u044f \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e", es: "Reg\u00edstrate gratis", de: "Kostenlos registrieren", fr: "S'inscrire gratuitement", ja: "\u7121\u6599\u3067\u767b\u9332" },
  "shareView.linkExpired": { en: "This link is no longer available", ru: "\u042d\u0442\u0430 \u0441\u0441\u044b\u043b\u043a\u0430 \u0431\u043e\u043b\u044c\u0448\u0435 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430", es: "Este enlace ya no est\u00e1 disponible", de: "Dieser Link ist nicht mehr verf\u00fcgbar", fr: "Ce lien n'est plus disponible", ja: "\u3053\u306e\u30ea\u30f3\u30af\u306f\u5229\u7528\u3067\u304d\u307e\u305b\u3093" },
  "shareView.linkExpiredDesc": { en: "The link may have expired or been revoked by the owner.", ru: "\u0421\u0441\u044b\u043b\u043a\u0430 \u043c\u043e\u0433\u043b\u0430 \u0438\u0441\u0442\u0435\u0447\u044c \u0438\u043b\u0438 \u0431\u044b\u0442\u044c \u043e\u0442\u043e\u0437\u0432\u0430\u043d\u0430 \u0432\u043b\u0430\u0434\u0435\u043b\u044c\u0446\u0435\u043c.", es: "El enlace puede haber expirado o sido revocado por el propietario.", de: "Der Link ist m\u00f6glicherweise abgelaufen oder wurde vom Eigent\u00fcmer widerrufen.", fr: "Le lien a peut-\u00eatre expir\u00e9 ou a \u00e9t\u00e9 r\u00e9voqu\u00e9 par le propri\u00e9taire.", ja: "\u30ea\u30f3\u30af\u306e\u6709\u52b9\u671f\u9650\u304c\u5207\u308c\u305f\u304b\u3001\u30aa\u30fc\u30ca\u30fc\u306b\u3088\u308a\u53d6\u308a\u6d88\u3055\u308c\u305f\u53ef\u80fd\u6027\u304c\u3042\u308a\u307e\u3059\u3002" },
  "shareView.goToApp": { en: "Go to Transcribe2Text", ru: "\u041f\u0435\u0440\u0435\u0439\u0442\u0438 \u0432 Transcribe2Text", es: "Ir a Transcribe2Text", de: "Zu Transcribe2Text", fr: "Aller sur Transcribe2Text", ja: "Transcribe2Text\u3078" },
  "shareView.sharedTranscription": { en: "Shared Transcription", ru: "\u041e\u0431\u0449\u0430\u044f \u0442\u0440\u0430\u043d\u0441\u043a\u0440\u0438\u043f\u0446\u0438\u044f", es: "Transcripci\u00f3n compartida", de: "Geteilte Transkription", fr: "Transcription partag\u00e9e", ja: "\u5171\u6709\u30c8\u30e9\u30f3\u30b9\u30af\u30ea\u30d7\u30c8" },

  // ── Shared with me — owner display ──
  "shared.unknownOwner": { en: "Someone", ru: "\u041a\u0442\u043e-\u0442\u043e", es: "Alguien", de: "Jemand", fr: "Quelqu'un", ja: "\u4e0d\u660e\u306a\u30e6\u30fc\u30b6\u30fc" },
};

/* ═══════════════════════════════════════════════
   Context
   ═══════════════════════════════════════════════ */

interface LanguageContextType {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: string, ...args: (string | number)[]) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => {
    try { const saved = localStorage.getItem("app-lang"); if (saved && ["en","ru","es","de","fr","ja"].includes(saved)) return saved as LangCode; } catch {}
    return "en";
  });

  const setLang = useCallback((l: LangCode) => {
    setLangState(l);
    try { localStorage.setItem("app-lang", l); } catch {}
  }, []);

  const t = useCallback((key: string, ...args: (string | number)[]): string => {
    const entry = dict[key];
    if (!entry) return key;
    let str = entry[lang] ?? entry.en ?? key;
    args.forEach((arg, i) => { str = str.replace(`{${i}}`, String(arg)); });
    return str;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() { return useContext(LanguageContext); }
