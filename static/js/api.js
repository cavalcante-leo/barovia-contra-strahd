export const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
export const $$ = (seletor, raiz = document) =>
  Array.prototype.slice.call(raiz.querySelectorAll(seletor));

async function request(path, options = {}) {
  const resposta = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  let dados = null;
  try { dados = await resposta.json(); } catch (e) { dados = null; }

  if (!resposta.ok) {
    const erro = new Error((dados && dados.error) || `${resposta.status} ${resposta.statusText}`);
    erro.status = resposta.status;
    throw erro;
  }
  return dados;
}

export const API = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  del: (path) => request(path, { method: 'DELETE' }),
};

export function escapeHtml(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function debounce(fn, ms = 500) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
