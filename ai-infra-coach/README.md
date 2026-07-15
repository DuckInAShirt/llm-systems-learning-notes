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

## GitHub Pages

部署工作流位于：

```text
.github/workflows/deploy-ai-infra-coach.yml
```

推送 `ai-infra-coach/` 到 `main` 后会自动构建并发布：

```text
https://duckinashirt.github.io/llm-systems-learning-notes/
```

当前进度保存在浏览器 `localStorage`。更换浏览器或设备后不会自动同步，可使用页面右上角的导出按钮备份。

## 云端同步

登录网页右上角的同步入口后，学习状态会保存到 Supabase 的
`learning_progress` 表。数据库结构和 RLS 策略位于：

```text
supabase/schema.sql
```

GitHub Pages 构建通过以下 Actions Secrets 注入浏览器端配置：

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

未登录时仍可离线使用；登录后会优先读取云端记录，并在本地修改后自动保存。
