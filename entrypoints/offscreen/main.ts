import { pipeline } from '@huggingface/transformers';
import { browser } from 'wxt/browser';
let extractor: Awaited<ReturnType<typeof pipeline>> | null = null;
browser.runtime.onMessage.addListener(async (message: { type?: string; texts?: string[] }) => {
  if (message.type !== 'LOCAL_EMBED' || !message.texts) return undefined;
  extractor ??= await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'q8' });
  const output: number[][] = [];
  for (const text of message.texts.slice(0, 30)) {
    const tensor = await (extractor as any)(text, { pooling: 'mean', normalize: true });
    output.push(Array.from(tensor.data as Float32Array));
  }
  return output;
});
