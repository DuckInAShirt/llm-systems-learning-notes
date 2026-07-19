# Agent Harness Coach

面向 Agent Harness 算法/工程实习面试的 30 天中文八股学习网页。

每天的学习单元现在由四部分组成：

1. 本课讲义：当天需要掌握的 Harness 核心边界与回答方式。
2. 配套口述：闭卷回答、对照纠错、两轮追问和验收标准。
3. 课后巩固：把概念整理成执行链路、错误分类和系统设计表达。
4. 今日八股与资料：每天 5 道题，先口述再看答案；资料以官方文档、论文和基准为主。

顶部的 `口述` 页面是 30 天面试验收工作台，按天展示回答步骤、验收标准和复盘记录。
实践项目不在课程里重复设计：学习者独立推进 `mini-swe-agent`，本应用专注八股覆盖、解释和追问。

课后巩固的每一项都可以展开“参考完成标准”；碎片任务可以展开“快速回顾”。
30 天共 150 道高频题，覆盖 Agent Loop、Function Calling、MCP、上下文与记忆、可靠性、安全、评测、Coding Agent 和生产系统设计。

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
