'use strict';

// ---------------------------------------------------------------------------
//  CE QU'IL Y A À MODIFIER SUR CE SITE
//
//  Le plus simple : GitHub. Crée une Release de ton dépôt en y déposant les
//  deux .exe, puis écris ici le nom du dépôt — les deux liens se construisent
//  tout seuls (le tag doit être v<version>, par exemple v1.3.0) :
//
//      const GITHUB_REPO = 'url-ai/url-ai';
//
//  Sinon, colle l'URL complète de chaque fichier dans INSTALLER_URL /
//  PORTABLE_URL. Les espaces doivent y être remplacés par %20.
//
//  Laisse les deux vides : le site cherche les fichiers localement dans
//  site/telechargements/ — pratique pour tester hors ligne.
// ---------------------------------------------------------------------------
const GITHUB_REPO = 'url-ai/url-ai';
const INSTALLER_URL = '';
const PORTABLE_URL = '';

// Doit correspondre à la version de package.json.
const VERSION = '1.3.0';

// Nom des fichiers produits par « npm run dist » (voir build.artifactName dans package.json).
// Des tirets, jamais d'espace : un nom avec espaces doit être encodé en %20 dans une URL,
// et la moindre différence entre deux fichiers (index.html / script.js) casse le lien.
const FILES = {
  installer: `Url-AI-Setup-${VERSION}.exe`,
  portable: `Url-AI-${VERSION}.exe`,
};

// Lien d'une Release GitHub, si le dépôt est renseigné : « Releases » → les .exe.
const RELEASE_BASE = GITHUB_REPO
  ? `https://github.com/${GITHUB_REPO}/releases/download/v${VERSION}`
  : '';

const DOWNLOADS = {
  installer: INSTALLER_URL || (RELEASE_BASE ? `${RELEASE_BASE}/${FILES.installer}` : ''),
  portable: PORTABLE_URL || (RELEASE_BASE ? `${RELEASE_BASE}/${FILES.portable}` : ''),
};

for (const [key, name] of Object.entries(FILES)) {
  const url = DOWNLOADS[key] || `telechargements/${name}`;

  for (const link of document.querySelectorAll(`[data-download="${key}"]`)) {
    link.href = url;
    // L'attribut « download » n'a de sens que pour un fichier servi par ce site.
    if (DOWNLOADS[key]) link.removeAttribute('download');
  }

  for (const label of document.querySelectorAll(`[data-filename="${key}"]`)) {
    label.textContent = name;
  }
}

for (const label of document.querySelectorAll('[data-version]')) {
  label.textContent = VERSION;
}

// ---------------------------------------------------------------------------
//  CONTRÔLE DES TÉLÉCHARGEMENTS
//
//  Un lien mort ne produit aucune erreur visible : le navigateur enregistre la
//  page « introuvable » du serveur sous le nom du fichier demandé, et la
//  personne repart avec un « Url-AI-Setup-1.3.0.exe » de quelques kilo-octets.
//  Windows refuse de le lancer sans le moindre message : on croit que
//  l'application est cassée, alors que c'est le fichier qui n'a jamais été mis
//  en ligne. Autant le dire sur la page.
//
//  Cause la plus fréquente : les .exe de site/telechargements/ ne sont pas
//  versionnés (voir .gitignore), donc un site publié depuis le dépôt Git ne les
//  contient pas. La solution est dans le README : dépose les .exe dans une
//  Release GitHub, puis renseigne GITHUB_REPO (ou INSTALLER_URL /
//  PORTABLE_URL) en haut de ce fichier.
// ---------------------------------------------------------------------------

/** Un vrai .exe pèse une bonne centaine de Mo : en dessous, ce n'est pas lui. */
const TAILLE_MINI = 20 * 1024 * 1024;

function alerterLienMort(cle, taille) {
  for (const lien of document.querySelectorAll(`[data-download="${cle}"]`)) {
    lien.classList.add('dl-casse');
    lien.setAttribute('aria-disabled', 'true');

    const alerte = document.createElement('p');
    alerte.className = 'dl-alerte';
    alerte.textContent = taille
      ? `Le fichier proposé ne pèse que ${Math.max(1, Math.round(taille / 1024))} ko : c'est la page d'erreur du serveur enregistrée sous le nom de l'installateur, pas l'installateur. Il ne s'installera pas, et Windows ne dira rien au double-clic.`
      : "Ce fichier n'est pas en ligne : le lien renvoie une erreur. Préviens l'auteur du site.";
    lien.insertAdjacentElement('afterend', alerte);
  }
}

async function verifierLien(cle, url) {
  // Aperçu ouvert depuis le disque (double-clic sur index.html) : le navigateur
  // interdit de lire le fichier, on ne vérifie donc rien.
  if (location.protocol === 'file:') return;

  let reponse;
  try {
    reponse = await fetch(url, { method: 'HEAD' });
  } catch {
    // Autre domaine (GitHub Releases, par exemple) : la requête est bloquée par
    // le navigateur. Impossible de conclure, donc on ne dit rien.
    return;
  }

  if (!reponse.ok) {
    alerterLienMort(cle, 0);
    return;
  }

  // Certains serveurs répondent 200 avec une page d'erreur : la taille trahit.
  const taille = Number(reponse.headers.get('content-length') || 0);
  if (taille && taille < TAILLE_MINI) alerterLienMort(cle, taille);
}

for (const [cle, name] of Object.entries(FILES)) {
  verifierLien(cle, DOWNLOADS[cle] || `telechargements/${name}`);
}

// Apparition en douceur des sections pendant le défilement.
const targets = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -60px 0px', threshold: 0.08 },
  );
  targets.forEach((target) => observer.observe(target));
} else {
  targets.forEach((target) => target.classList.add('is-visible'));
}
