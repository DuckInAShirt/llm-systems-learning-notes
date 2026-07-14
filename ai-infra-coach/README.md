# AI Infra Coach

面向 4×A30 与 vLLM 推理方向的 30 天中文学习网页。

## 本地运行

```bash
pnpm install
pnpm dev
```

打开 `http://localhost:5173/`。

## 生产构建

```bash
pnpm build
```

静态文件生成在 `dist/`。

## Cloudflare Pages

- Framework preset: `Vite`
- Build command: `pnpm build`
- Build output directory: `dist`
- Root directory: `ai-infra-coach`

当前进度保存在浏览器 `localStorage`。更换浏览器或设备后不会自动同步，可使用页面右上角的导出按钮备份。
