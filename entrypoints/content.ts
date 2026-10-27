import { extractArticle } from '../src/lib/extract/article';
import type { Evidence, ExtensionMessage } from '../src/types';

export default defineContentScript({
  registration: 'runtime',
  globalName: true,
  main() {
    let marks: HTMLElement[] = [];
    const host = document.createElement('div');
    host.id = 'parallax-shadow-host';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>
      :host{all:initial} .pill{position:fixed;right:18px;bottom:18px;z-index:2147483647;border:1px solid #D9D2C3;border-radius:999px;background:#F6F2EA;color:#1B1A17;padding:9px 13px;font:600 12px Inter,system-ui;box-shadow:0 5px 20px #1b1a1720;cursor:pointer}.tip{display:none;position:fixed;z-index:2147483647;max-width:280px;background:#FBF8F2;color:#1B1A17;border:1px solid #D9D2C3;border-top:3px solid #C2410C;padding:12px;box-shadow:0 8px 30px #1b1a1726;font:14px/1.45 Georgia,serif}.tip b{display:block;font:600 10px Inter,sans-serif;letter-spacing:.08em;margin-bottom:6px;text-transform:uppercase}</style>
      <button class="pill" type="button" aria-pressed="true">Parallax evidence · on</button><aside class="tip" role="tooltip"></aside>`;
    document.documentElement.append(host);
    const pill = root.querySelector<HTMLButtonElement>('.pill')!;
    const tip = root.querySelector<HTMLElement>('.tip')!;
    let visible = true;

    const setVisible = (next: boolean) => {
      visible = next; marks.forEach((mark) => { mark.style.backgroundImage = next ? mark.dataset.bg ?? '' : 'none'; });
      pill.textContent = `Parallax evidence · ${next ? 'on' : 'off'}`; pill.setAttribute('aria-pressed', String(next));
    };
    pill.addEventListener('click', () => setVisible(!visible));

    const clear = () => { for (const mark of marks) mark.replaceWith(...mark.childNodes); marks = []; };
    const markEvidence = (evidence: Evidence[]) => {
      clear();
      for (const item of evidence) {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode(node) { return node.parentElement?.closest('#parallax-shadow-host,script,style,noscript') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
        let node: Text | null;
        while ((node = walker.nextNode() as Text | null)) {
          const start = node.data.indexOf(item.span); if (start < 0) continue;
          const range = document.createRange(); range.setStart(node, start); range.setEnd(node, start + item.span.length);
          const mark = document.createElement('span');
          const bg = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='8' viewBox='0 0 120 8'%3E%3Cpath d='M1 5 Q30 2 60 5 T119 4' fill='none' stroke='%23C2410C' stroke-opacity='.72' stroke-width='2'/%3E%3C/svg%3E\")";
          mark.dataset.bg = bg; mark.style.cssText = `all:unset;background-image:${bg};background-repeat:repeat-x;background-position:0 100%;padding-bottom:2px;cursor:help`;
          mark.dataset.span = item.span; mark.tabIndex = 0; mark.setAttribute('role', 'mark'); mark.setAttribute('aria-label', `${item.dimension}: ${item.explanation}`);
          range.surroundContents(mark); marks.push(mark);
          const showTip = (event: MouseEvent | FocusEvent) => { const rect = mark.getBoundingClientRect(); tip.innerHTML = `<b>${item.dimension.replace('_', ' ')}</b>${item.explanation}`; tip.style.left = `${Math.min(innerWidth - 300, Math.max(10, 'clientX' in event ? event.clientX : rect.left))}px`; tip.style.top = `${Math.min(innerHeight - 130, rect.bottom + 8)}px`; tip.style.display = 'block'; };
          mark.addEventListener('mouseenter', showTip); mark.addEventListener('focus', showTip); mark.addEventListener('mouseleave', () => { tip.style.display = 'none'; }); mark.addEventListener('blur', () => { tip.style.display = 'none'; });
          break;
        }
      }
      pill.style.display = marks.length ? 'block' : 'none'; setVisible(true);
    };

    browser.runtime.onMessage.addListener((message: ExtensionMessage) => {
      if (message.type === 'EXTRACT_ARTICLE') return Promise.resolve(extractArticle(document, location.href));
      if (message.type === 'APPLY_HIGHLIGHTS') { markEvidence(message.evidence); return Promise.resolve(true); }
      if (message.type === 'TOGGLE_HIGHLIGHTS') { setVisible(message.visible); return Promise.resolve(true); }
      if (message.type === 'SHOW_EVIDENCE') {
        const mark = marks.find((candidate) => candidate.dataset.span === message.span);
        mark?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (mark) { mark.animate([{ backgroundColor: '#FFF1B8' }, { backgroundColor: 'transparent' }], { duration: 1200 }); mark.focus(); }
        return Promise.resolve(Boolean(mark));
      }
      return undefined;
    });
    return extractArticle(document, location.href);
  }
});
