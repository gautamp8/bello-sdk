export function ensureContainer(
  id = 'bello-widget-root'
): HTMLElement {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.style.position = 'relative';
    el.style.zIndex = '2147483646';
    document.body.appendChild(el);
  }
  return el;
}

export function createShadowHost(container: HTMLElement): ShadowRoot {
  let root = (container as any)._shadowRoot as ShadowRoot | undefined;
  if (!root) {
    root = container.attachShadow({ mode: 'open' });
    (container as any)._shadowRoot = root;
  }
  return root;
}
