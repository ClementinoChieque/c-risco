import { getSignedImageUrl } from '@/hooks/useSignedImageUrl';

const SIZE = 1080;
const FPS = 30;

const MARKET_LABELS: Record<string, string> = {
  forex: 'Forex',
  crypto: 'Cripto',
  propfirm: 'PropFirm',
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar imagem'));
    img.src = src;
  });
}

function pickMime(): { mime: string; ext: string } | null {
  const candidates: Array<{ mime: string; ext: string }> = [
    { mime: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4' },
    { mime: 'video/mp4;codecs=h264', ext: 'mp4' },
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp9', ext: 'webm' },
    { mime: 'video/webm;codecs=vp8', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' },
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c.mime)) return c;
  }
  return null;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  return lines;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export interface BeforeAfterVideoOptions {
  type: 'win' | 'loss';
  market: string;
  imageUrl: string;
  imageUrlAfter: string;
  caption?: string | null;
  date: string;
  durationMs?: number;
}

export async function generateBeforeAfterVideo(
  opts: BeforeAfterVideoOptions
): Promise<{ blob: Blob; ext: string }> {
  const target = pickMime();
  if (!target) throw new Error('O seu navegador não suporta gravação de vídeo');

  const [beforeSrc, afterSrc] = await Promise.all([
    getSignedImageUrl(opts.imageUrl),
    getSignedImageUrl(opts.imageUrlAfter),
  ]);
  if (!beforeSrc || !afterSrc) throw new Error('Não foi possível obter as imagens');

  const [beforeImg, afterImg] = await Promise.all([loadImage(beforeSrc), loadImage(afterSrc)]);

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  const isWin = opts.type === 'win';
  const accent = isWin ? '#22c55e' : '#ef4444';
  const duration = opts.durationMs ?? 7000;

  // Layout
  const pad = 56;
  const imgX = pad;
  const imgY = 220;
  const imgW = SIZE - pad * 2;
  const imgH = 620;

  const draw = (t: number) => {
    const p = t / duration;

    // Background
    const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    bg.addColorStop(0, '#0b1020');
    bg.addColorStop(0.5, '#1a1f3a');
    bg.addColorStop(1, '#0b1020');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Header
    const headIn = easeOutCubic(Math.min(1, t / 500));
    ctx.save();
    ctx.globalAlpha = headIn;
    ctx.translate(0, (1 - headIn) * -24);

    ctx.fillStyle = isWin ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
    roundRect(ctx, pad, 72, 72, 72, 18);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.font = 'bold 40px Inter, system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(isWin ? '▲' : '▼', pad + 22, 110);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px Inter, system-ui, sans-serif';
    ctx.fillText(isWin ? 'Acerto' : 'Erro', pad + 96, 96);

    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = '24px Inter, system-ui, sans-serif';
    ctx.fillText(`${MARKET_LABELS[opts.market] || opts.market} · ${opts.date}`, pad + 96, 134);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '22px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('C-RISCO', SIZE - pad, 112);
    ctx.textAlign = 'left';
    ctx.restore();

    // Image frame with wipe reveal
    ctx.save();
    roundRect(ctx, imgX, imgY, imgW, imgH, 28);
    ctx.clip();

    // subtle zoom (Ken Burns)
    const zoom = 1 + p * 0.06;
    const zw = imgW * zoom;
    const zh = imgH * zoom;
    const zx = imgX - (zw - imgW) / 2;
    const zy = imgY - (zh - imgH) / 2;

    drawCover(ctx, beforeImg, zx, zy, zw, zh);

    // reveal window: 35% -> 75% of the clip
    const revealRaw = (p - 0.35) / 0.4;
    const reveal = easeOutCubic(Math.max(0, Math.min(1, revealRaw)));
    if (reveal > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(imgX, imgY, imgW * reveal, imgH);
      ctx.clip();
      drawCover(ctx, afterImg, zx, zy, zw, zh);
      ctx.restore();

      if (reveal < 1) {
        const lx = imgX + imgW * reveal;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(lx - 3, imgY, 6, imgH);
        ctx.shadowColor = accent;
        ctx.shadowBlur = 30;
        ctx.fillRect(lx - 3, imgY, 6, imgH);
        ctx.shadowBlur = 0;
      }
    }
    ctx.restore();

    // Frame border
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    roundRect(ctx, imgX, imgY, imgW, imgH, 28);
    ctx.stroke();

    // Labels ANTES / DEPOIS
    const label = (text: string, x: number, alpha: number) => {
      if (alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 24px Inter, system-ui, sans-serif';
      const w = ctx.measureText(text).width + 36;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      roundRect(ctx, x, imgY + 24, w, 50, 12);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x + 18, imgY + 50);
      ctx.restore();
    };
    label('ANTES', imgX + 24, Math.min(1, 1 - reveal + 0.15));
    label('DEPOIS', imgX + imgW - 150, reveal);

    // Caption
    if (opts.caption) {
      const capIn = easeOutCubic(Math.max(0, Math.min(1, (p - 0.7) / 0.2)));
      if (capIn > 0) {
        ctx.save();
        ctx.globalAlpha = capIn;
        ctx.translate(0, (1 - capIn) * 20);
        const boxY = imgY + imgH + 40;
        const boxH = SIZE - boxY - pad;
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        roundRect(ctx, pad, boxY, SIZE - pad * 2, boxH, 20);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '30px Inter, system-ui, sans-serif';
        ctx.textBaseline = 'top';
        const lines = wrapText(ctx, `"${opts.caption}"`, SIZE - pad * 2 - 56, 3);
        lines.forEach((l, i) => ctx.fillText(l, pad + 28, boxY + 28 + i * 42));
        ctx.restore();
      }
    }

    // Progress bar
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(0, SIZE - 8, SIZE, 8);
    ctx.fillStyle = accent;
    ctx.fillRect(0, SIZE - 8, SIZE * Math.min(1, p), 8);
  };

  draw(0);

  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, {
    mimeType: target.mime,
    videoBitsPerSecond: 6_000_000,
  });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: target.mime.split(';')[0] }));
  });

  recorder.start(100);
  const start = performance.now();

  await new Promise<void>((resolve) => {
    const tick = () => {
      const t = performance.now() - start;
      draw(Math.min(t, duration));
      if (t >= duration) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  recorder.stop();
  stream.getTracks().forEach((tr) => tr.stop());

  return { blob: await done, ext: target.ext };
}
