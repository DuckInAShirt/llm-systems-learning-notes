# AI Infra Coach

面向 4×A30 与 vLLM 推理方向的 30 天中文学习网页。

每天的学习单元现在由四部分组成：

1. 本课讲义：当天要理解的核心因果链。
2. 配套 Lab：环境、步骤、可复制代码、验收标准和产出物。
3. 课后巩固：把讲义转成画图、源码阅读和实验任务。
4. 今日八股与资料：先口述，再看答案；资料按主修/补充排序并按 URL 去重。

顶部的 `Lab` 页面是 30 天实验工作台，不再要求手工录入孤立的 TTFT/TPS；
它会按天展示 Lab 步骤、运行入口、验收标准和实验记录。

课后巩固的每一项都可以展开“参考完成标准”；碎片任务可以展开
“快速回顾”。30 天共 180 条任务均有对应答案。

第一周的 CPU Lab 参考实现位于 `labs/`，可以不依赖 GPU 先开始。

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

当前进度保存在浏览器 `localStorage`。课程 Lab 的完成状态也会保存，并计入总进度。
更换浏览器或设备后不会自动同步，可使用页面右上角的导出按钮备份。

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
