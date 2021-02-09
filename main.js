const $ = (...args) => document.querySelector(...args);
const $$ = (...args) => document.querySelectorAll(...args);


/**
 * @param {Element} el
 */
function show(el) {
  el.classList.remove('hidden');
}

/**
 * @param {Element} el
 */
function hide(el) {
  el.classList.add('hidden');
}


/**
 * @param {HTMLInputElement} el
 * @param {string} key
 */
function persistInput(el, key) {
  el.value = localStorage.getItem(key) || '';

  el.addEventListener('input', () => {
    localStorage.setItem(key, el.value.trim());
  });
}


/**
 * @param {string} domain
 * @param {string} short
 * @param {string} url
 * @param {string} key
 * @return {Promise<string>}
 */
async function createShortLink(domain, short, url, key) {
  const data = {
    domain,
    path: short,
    originalURL: url,
  };

  const resp = await fetch('https://api.short.cm/links/public', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'authorization': key
    },
    body: JSON.stringify(data)
  });

  if (!resp.ok) {
    throw `HTTP Error ${resp.status}:\n` + await resp.text();
  }

  const json = await resp.json();
  return json['secureShortURL'];
}


// input-related elements
const domainInput = $('#domain');
const shortInput = $('#short');
const urlInput = $('#url');
const keyInput = $('#key');
const button = $('#button');

// success elements
const newUrlLink = $('#newUrl');
const copyButton = $('#copy');
const successResult = $('#success');

// failure elements
const errorMessage = $('#error');
const failureResult = $('#failure');

// result container element
const resultContainer = $('#result');


// attach submit listener to create link
$('#form').addEventListener('submit', (ev) => {
  const [domain, short, url, key] = [
    domainInput,
    shortInput,
    urlInput,
    keyInput,
  ].map(el => el.value.trim());

  createShortLink(domain, short, url, key)
  .then(newUrl => {
    newUrlLink.textContent = newUrl;
    newUrlLink.href = newUrl;

    show(successResult);
    hide(failureResult);
  })
  .catch(error => {
    errorMessage.textContent = error;
    show(failureResult);
    hide(successResult);
  })
  .finally(() => {
    show(resultContainer);
  });

  ev.preventDefault();
});

// copy handler
copyButton.addEventListener('click', () => {
  navigator.clipboard.writeText(newUrlLink.href).then(() => {
    copyButton.textContent = 'Copied!';
  });
})

// extract default domain and short code from URL
const params = new URLSearchParams(window.location.search);
const d = params.get('d') || '';
domainInput.value = d;
shortInput.value = params.get('s') || '';

// show domain missing text and disable fields
if (!d) {
  show($('#domainMissing'));
  shortInput.disabled = true;
  urlInput.disabled = true;
  keyInput.disabled = true;
}

// display domain above key input and persist api key
if (d) {
  $('#domainText').textContent = d;
  persistInput(keyInput, 'api-key-' + d);
}

if (!shortInput.value) {
  shortInput.focus();
} else {
  urlInput.focus();
}
