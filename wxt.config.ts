import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  manifestVersion: 3,
  modules: ['@wxt-dev/module-react'],
  vite: () => ({ plugins: [tailwindcss()] }),
  manifest: ({ browser }) => ({
    name: 'Parallax — News Bias Analyzer',
    short_name: 'Parallax',
    description: 'See one story through more than one lens.',
    permissions: ['activeTab', 'storage', 'scripting', ...(browser === 'chrome' ? ['sidePanel', 'offscreen'] : [])],
    host_permissions: [
      'https://api.gdeltproject.org/*',
      'https://news.google.com/rss/*',
      'https://generativelanguage.googleapis.com/*',
      'https://huggingface.co/*',
      'https://cdn-lfs.huggingface.co/*'
    ],
    action: { default_title: 'Analyse with Parallax' },
    commands: {
      'analyse-page': {
        suggested_key: { default: 'Alt+Shift+P' },
        description: 'Analyse the current article'
      }
    },
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
    },
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png'
    },
    browser_specific_settings: {
      gecko: {
        id: 'parallax@local.extension',
        strict_min_version: '140.0',
        data_collection_permissions: { required: ['browsingActivity'] }
      }
    },
    ...(browser === 'chrome'
      ? { side_panel: { default_path: 'sidepanel.html' } }
      : { sidebar_action: { default_title: 'Parallax Broadsheet', default_panel: 'sidepanel.html' } })
  })
});
