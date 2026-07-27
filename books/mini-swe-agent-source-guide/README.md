# mini-SWE-agent 源码学习书

> 一份面向 Agent Runtime / Harness 工程学习者的中文、源码驱动、**动手为主**的教材。

## 这本书怎么用

主学习入口是 `notebooks/` 下的 16 个 Jupyter Notebook。每章节奏统一：

**小概念 → 你动手填空（TODO 骨架）→ 运行看结果（参考实现，跑真实源码）→ 观察点 → 连回真实源码 → 闭卷检查 / 面试问答**

每个 notebook 的所有代码格都**不需要 API Key、不需要 docker**，用仓库自带的确定性测试模型和本地环境即可跑通。

启动：

```bash
conda activate mini-swe-agent-study
cd /Users/xinranzhao/Documents/llm-study/books/mini-swe-agent-source-guide
jupyter lab notebooks
```

打开后 kernel 选 `Python (mini-swe-agent-study)`。

## 目录结构

- `mini-swe-agent/` —— 原始源码（只读，学习对象）
- `notebooks/` —— 教学 notebook（00-15，本书主体）
- `labs/` —— 你自己动手写的独立脚本（如 `01_toy_agent.py`）
- `archive/` —— 旧版讲义（`legacy-md/`）与旧构建脚本，归档保留

## 章节路线图

### Part 1 · 先把 Agent 跑通
- `00` 环境与代码地图 —— 五个目录各管什么
- `01` 从一个循环开始 —— 亲手写核心循环，认出 `run()` 骨架
- `02` 三层边界 —— Agent / Model / Environment 与 Protocol 鸭子类型
- `03` 一轮 step 的完整生命线 —— query / execute_actions / 四种 role
- `04` 完成、限制与异常控制流 —— Submitted / LimitsExceeded / FormatError

### Part 2 · 工具与上下文
- `05` Tool Schema 与模型输出解析 —— BASH_TOOL、`parse_toolcall_actions`、三种 FormatError
- `06` Observation 如何回到上下文 —— `tool` vs `user` role、tool_call_id 配对
- `07` Trajectory、序列化与可观测性 —— `serialize` / `save` / recursive_merge

### Part 3 · 把 Runtime 做得可靠
- `08` 真实模型接入：LitellmModel —— query 五动作、成本追踪、离线测 `_parse_actions`
- `09` Prompt、YAML 配置与 Jinja 模板 —— 改配置即改行为
- `10` Bash Environment、超时与进程组 —— cwd / env / 返回码 / killpg
- `11` Human-in-the-loop：InteractiveAgent —— human/confirm/yolo 三模式
- `12` Local、Docker 与 Sandbox —— 环境工厂 + 统一 execute 接口

### Part 4 · 从 mini 到自己的 Harness
- `13` run 入口脚本 —— 三行组装三层、config 层层合并
- `14` SWE-bench 批量评测 —— 单实例流程、preds.json、并发编排
- `15` 从 mini 到你自己的 Harness —— 从零写最小 harness（综合实战 + 面试串讲）

## 版本基线

- 仓库：`mini-swe-agent/`，版本 `2.4.5`
- v2 默认使用原生 tool calling；控制流异常统一继承 `InterruptAgentFlow`
- 如果你在网上看到旧教程，先确认它是不是 v1（工具调用、完成命令、异常类、`run()` 返回值、轨迹格式都不同）

## 学完你应该能

不看源码回答：

1. `run()` / `step()` / `query()` / `execute_actions()` 各负责什么
2. 一次模型调用后的 message 如何进入 `self.messages`
3. 谁发完成信号、谁识别、谁让主循环退出；为什么 `Submitted` 能从 Environment 传回 `run()`
4. 为什么 v2 把 action 解析放在 Model 而不是 Agent
5. 为什么每个 action 用独立子进程执行、超时为什么杀进程组
6. 如何换模型 / 换环境而不改主循环

并且能**从空文件写出一个带“循环 + 完成检测 + 步数上限 + 轨迹”的最小 harness**。
