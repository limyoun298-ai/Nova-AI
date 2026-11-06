/* NOVA AI — UPDATE TABLEAUX.JS — VERSION DESSINE COMME META AI */
(function () {
  'use strict';

  if (window.__NOVA_UPDATE_TABLEAUX__) return;
  window.__NOVA_UPDATE_TABLEAUX__ = true;

  // 1. NOUVELLE INSTRUCTION - Autorise les tableaux comme Meta AI
  var INSTRUCTION = "Tu es Nova AI. Tu dessines les tableaux en Markdown quand c'est utile pour expliquer, comparer, ou quand l'utilisateur demande un tableau. Tu utilises toujours la forme : | Colonne | Colonne | puis |---|---| puis les lignes. Sinon, réponds en texte simple.";
  window.NOVA_INSTRUCTION_TABLEAUX = INSTRUCTION;

  // 2. CSS INJECTÉ PAR JS - Pas besoin de toucher à index.html
  function injectCSS() {
    if (document.getElementById('nova-table-css')) return;
    var style = document.createElement('style');
    style.id = 'nova-table-css';
    style.textContent = `
      .nova-table { width:100%; border-collapse:collapse; margin:10px 0; font-size:14px; background:#1e1e1e; color:#fff; border-radius:8px; overflow:hidden; }
      .nova-table th { background:#2a2a2a; padding:10px 8px; text-align:left; border:1px solid #444; font-weight:bold; }
      .nova-table td { padding:9px 8px; border:1px solid #444; }
      .nova-table tr:nth-child(even) td { background:#242424; }
    `;
    document.head.appendChild(style);
  }

  // 3. TRADUCTEUR MARKDOWN -> VRAI TABLEAU
  function markdownToTable(text) {
    var lines = text.split('\n');
    var out = '';
    var i = 0;
    while (i < lines.length) {
      var line = lines[i].trim();
      // Détecte un tableau : ligne avec | et ligne suivante avec |---|
      if (line.indexOf('|') !== -1 && i + 1 < lines.length && lines[i+1].indexOf('---') !== -1) {
        var headers = line.split('|').map(function(s){return s.trim();}).filter(function(s){return s !== '';});
        var html = '<table class="nova-table"><thead><tr>';
        headers.forEach(function(h){ html += '<th>' + h + '</th>'; });
        html += '</tr></thead><tbody>';
        i += 2; // saute header + séparateur
        while (i < lines.length && lines[i].trim().indexOf('|') !== -1) {
          var cells = lines[i].split('|').map(function(s){return s.trim();}).filter(function(s){return s !== '';});
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
  }

  // 4. APPLIQUE AUX MESSAGES DÉJÀ AFFICHÉS + NOUVEAUX
  function formatBubble(bubble) {
    if (!bubble || bubble.dataset.novaTableDone) return;
    var html = bubble.innerHTML;
    // Seulement si ça ressemble à un tableau Markdown
    if (html.indexOf('|') !== -1 && html.indexOf('---') !== -1) {
      // On récupère le texte brut, on convertit, on ré-affiche
      var raw = bubble.textContent;
      var converted = markdownToTable(raw);
      // On garde les sauts de ligne pour le reste du texte
      converted = converted.replace(/\n/g, '<br>');
      // On enlève les <br> autour des tableaux pour un rendu propre
      converted = converted.replace(/<br><table/g, '<table').replace(/<\/table><br>/g, '</table>');
      bubble.innerHTML = converted;
      bubble.dataset.novaTableDone = '1';
    }
  }

  function startObserver() {
    injectCSS();
    // Cherche le conteneur de chat - essaie plusieurs noms possibles
    var container = document.querySelector('#chat, .chat, #messages, .messages, main, body');
    if (!container) return;
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        m.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            // Si le noeud lui-même est une bulle ou contient des bulles
            formatBubble(node);
            node.querySelectorAll('*').forEach(formatBubble);
          }
        });
      });
    });
    observer.observe(container, { childList: true, subtree: true });
    // Formate aussi ceux déjà là
    document.querySelectorAll('*').forEach(formatBubble);
  }

  // 5. VITESSE D'IMPRESSION - Tu gardes tes réglages
  var PRINT_IDLE = 350;
  var PRINT_TICK = 35;
  window.NOVA_PRINT_IDLE = PRINT_IDLE;
  window.NOVA_PRINT_TICK = PRINT_TICK;

  // Lance quand la page est prête
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }
  // Re-lance après 1s au cas où le chat se charge après
  setTimeout(startObserver, 1000);
  setTimeout(startObserver, 3000);
})();
