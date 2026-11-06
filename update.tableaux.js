/* NOVA AI — UPDATE TABLEAUX.JS — VERSION VERROUILLEE — CORRIGEE A B C D */
(function () {
  'use strict';

  /* ============================================================
     0. GARDE + ETAT - TON FICHIER D'ORIGINE
     ============================================================ */
  try {
    if (window.__NOVA_UPDATE_TABLEAUX__) return;
    window.__NOVA_UPDATE_TABLEAUX__ = true;
  } catch (e) {}

  /* A. NOUVELLE INSTRUCTION - TRACE COMME META AI */
  var INSTRUCTION = "Tu es Nova AI. Utilise un tableau Markdown quand l'utilisateur le demande explicitement, OU quand tu dois expliquer quelque chose de tres difficile ou de tres important qui serait incomprehensible sans tableau. Sinon, reponds en texte simple, sans tableau.";
  var MARK = 'Utilise un tableau Markdown UNIQUEMENT';

  /* C. VITESSE D'IMPRESSION : rapide, pas tres rapide, lisible */
  var PRINT_IDLE = 350;
  var PRINT_TICK = 35;

  var state = {
    lastActivity: 0,
    lastTarget: null,
    cursorEl: null,
    away: false,
    chase: false,
    lastTop: 0,
    scroller: null
  };

  // Expose pour index.html - sans casser si deja defini
  try {
    window.NOVA_INSTRUCTION_TABLEAUX = INSTRUCTION;
    window.NOVA_PRINT_IDLE = PRINT_IDLE;
    window.NOVA_PRINT_TICK = PRINT_TICK;
    window.NOVA_TABLEAUX_STATE = state;
  } catch (e) {}

  /* ============================================================
     B. PROTECTION ANTI-CASSE - INDEX.HTML DOIT TOUJOURS MARCHER
     Regle : chaque fonction est dans son propre try/catch.
     Si une fonction plante, elle s'arrete seule, elle ne bloque
     jamais le reste de l'application.
     ============================================================ */

  // CSS tableaux - injecte en securite, ne touche jamais au CSS existant
  function injectTableCSS() {
    try {
      if (document.getElementById('nova-table-css')) return;
      var style = document.createElement('style');
      style.id = 'nova-table-css';
      style.textContent = '.nova-table{width:100%;border-collapse:collapse;margin:10px 0;font-size:14px;background:#1e1e1e;color:#fff;border-radius:8px;overflow:hidden} .nova-table th{background:#2a2a2a;padding:10px 8px;text-align:left;border:1px solid #444} .nova-table td{padding:9px 8px;border:1px solid #444}';
      if (document.head) document.head.appendChild(style);
    } catch (e) {
      // B: si ca plante, on ignore, index.html continue
    }
  }

  // Traduit Markdown -> Tableau, sans toucher au reste
  function markdownToTable(text) {
    try {
      var lines = text.split('\n');
      var out = '';
      var i = 0;
      while (i < lines.length) {
        var line = lines[i].trim();
        if (line.indexOf('|') !== -1 && i + 1 < lines.length && lines[i + 1].indexOf('---') !== -1) {
          var headers = line.split('|').map(function(s){ return s.trim(); }).filter(function(s){ return s !== ''; });
          var html = '<table class="nova-table"><thead><tr>';
          headers.forEach(function(h){ html += '<th>' + h + '</th>'; });
          html += '</tr></thead><tbody>';
          i += 2;
          while (i < lines.length && lines[i].trim().indexOf('|') !== -1) {
            var cells = lines[i].split('|').map(function(s){ return s.trim(); }).filter(function(s){ return s !== ''; });
            html += '<tr>';
            cells.forEach(function(c){ html += '<td>' + c + '</td>'; });
            html += '</tr>';
            i++;
          }
          html += '</tbody></table>';
          out += html + '\n';
        } else {
          out += lines[i] + '\n';
          i++;
        }
      }
      return out;
    } catch (e) {
      return text; // B: en cas d'erreur, on renvoie le texte tel quel
    }
  }

  // B: On ne touche QUE aux bulles de message, JAMAIS au style / head / body
  function isBubble(el) {
    try {
      if (!el || !el.className || typeof el.className !== 'string') return false;
      if (['STYLE','SCRIPT','HEAD','BODY','HTML','LINK','META'].indexOf(el.tagName) !== -1) return false;
      var c = ' ' + el.className + ' ';
      return c.indexOf('message') !== -1 || c.indexOf('bubble') !== -1 || c.indexOf('msg') !== -1 || c.indexOf('assistant') !== -1 || c.indexOf('ai-') !== -1;
    } catch (e) { return false; }
  }

  function formatBubble(bubble) {
    try {
      if (!bubble || !isBubble(bubble) || bubble.dataset.novaTableDone) return;
      var html = bubble.innerHTML || '';
      if (html.indexOf('|') === -1 || html.indexOf('---') === -1) return;
      var raw = bubble.textContent || '';
      // B: Securite - si ca contient du CSS, on ne touche PAS
      if (raw.indexOf('--bg') !== -1 || raw.indexOf(':root') !== -1) return;
      var converted = markdownToTable(raw);
      converted = converted.replace(/\n/g, '<br>');
      converted = converted.replace(/<br><table/g, '<table').replace(/<\/table><br>/g, '</table>');
      bubble.innerHTML = converted;
      bubble.dataset.novaTableDone = '1';
    } catch (e) {
      // B: si ca plante sur une bulle, on laisse la bulle telle quelle
    }
  }

  function startObserver() {
    try {
      injectTableCSS();
      // B: On observe UNIQUEMENT le conteneur de messages, pas tout le body
      var container = document.querySelector('#chat-messages, #messages, .messages, .chat-messages, #chat-container');
      if (!container) return; // Si pas trouve, on ne fait rien, on ne casse rien
      var observer = new MutationObserver(function(mutations) {
        try {
          mutations.forEach(function(m) {
            try {
              m.addedNodes.forEach(function(node) {
                try {
                  if (node.nodeType === 1) {
                    formatBubble(node);
                    var kids = node.querySelectorAll('.message, .bubble, .msg, .assistant');
                    kids.forEach(formatBubble);
                  }
                } catch (e) {}
              });
            } catch (e) {}
          });
        } catch (e) {}
      });
      observer.observe(container, { childList: true, subtree: true });
    } catch (e) {
      // B: si l'observer plante, index.html continue
    }
  }

  // Lancement securise
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startObserver);
    } else {
      startObserver();
    }
    setTimeout(startObserver, 1000);
    setTimeout(startObserver, 3000);
  } catch (e) {}

})();
