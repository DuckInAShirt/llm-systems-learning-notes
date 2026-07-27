# 第三章：一轮 `step` 的完整生命线

## 本章问题

上一章知道了三个对象的边界，本章把它们串成一次真实迭代：

> 从 `run(task)` 开始，到下一轮模型能看到 Observation，中间到底发生了什么？

## 先看总链路

```text
DefaultAgent.run(task)
  -> 初始化 system/user messages
  -> DefaultAgent.step()
      -> DefaultAgent.query()
          -> 检查 step/cost/time limit
          -> Model.query(messages)
          -> 把 assistant message 追加到 messages
      -> DefaultAgent.execute_actions(message)
          -> 对每个 action 调 Environment.execute(action)
          -> Model.format_observation_messages(...)
          -> 把 observation 追加到 messages
  -> 检查最后一条消息是否 role=exit
  -> 未退出则进入下一轮
```

源码中最短的两个函数是：

```python
def step(self) -> list[dict]:
    return self.execute_actions(self.query())
```

```python
def execute_actions(self, message: dict) -> list[dict]:
    outputs = [self.env.execute(action) for action in message.get("extra", {}).get("actions", [])]
    return self.add_messages(*self.model.format_observation_messages(message, outputs, self.get_template_vars()))
```

短不代表简单。真正的复杂度在于每个函数维护的状态和消息契约。

## 第 0 步：初始化消息

`run()` 首先清空旧消息，并根据配置渲染两条消息：

```python
self.messages = []
self.add_messages(
    self.model.format_message(role="system", content=self._render_template(self.config.system_template)),
    self.model.format_message(role="user", content=self._render_template(self.config.instance_template)),
)
```

这里有两个重要点：

1. `system_template` 和 `instance_template` 不是普通字符串，它们会读取任务、环境变量、平台信息、模型统计等模板变量；
2. `format_message()` 由 Model 提供，所以不同 API 的消息格式可以不同。

`mini.yaml` 的任务提示明确告诉模型：

- 可以执行 Bash；
- 每次响应至少要有 tool call；
- 完成时必须单独执行 `echo COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT`；
- 命令执行是子 shell，目录和环境变量不持久。

因此 Prompt 不是“装饰”，它实际上定义了模型和 Runtime 之间的协议。

## 第 1 步：`query()`

`query()` 先检查限制：

```python
if 0 < self.config.step_limit <= self.n_calls:
    raise LimitsExceeded(...)

if 0 < self.config.cost_limit <= self.cost:
    raise LimitsExceeded(...)

if 0 < self.config.wall_time_limit_seconds <= elapsed:
    raise TimeExceeded(...)
```

通过检查后：

```python
self.n_calls += 1
message = self.model.query(self.messages)
self.cost += message.get("extra", {}).get("cost", 0.0)
self.add_messages(message)
return message
```

注意顺序：

```text
先增加调用次数
再调用模型
再把模型响应加入 history
最后返回这条 message
```

这解释了为什么 `n_calls` 统计的是已经发起的模型调用，而不是已经成功完成的任务数。

## 第 2 步：模型响应中的 action

Agent 不从 `message["content"]` 里猜命令。它读取统一位置：

```python
message.get("extra", {}).get("actions", [])
```

在原生 tool calling 模式下，这个 `actions` 是 Model 解析 tool call 后写入的。一个模型消息可能包含多个 action，所以 `execute_actions()` 使用列表推导式逐个执行。

简化后的消息可以想象成：

```python
{
    "role": "assistant",
    "content": "...",
    "extra": {
        "actions": [
            {"command": "pwd", "tool_call_id": "call_1"},
            {"command": "ls", "tool_call_id": "call_2"},
        ],
        "cost": 0.02,
    },
}
```

## 第 3 步：Environment 执行动作

`LocalEnvironment.execute()` 做四件事：

1. 取出 `action["command"]`；
2. 选择工作目录和环境变量；
3. 调用 `_run()` 启动子进程；
4. 把结果整理成结构化 dict。

普通成功结果类似：

```python
{
    "output": "src\n",
    "returncode": 0,
    "exception_info": "",
}
```

命令失败也通常不会直接把 Agent 弄崩，而是返回非零 `returncode`，让模型自己看到失败并决定下一步。

这是 Coding Agent 非常重要的设计：

```text
命令失败 != Runtime 崩溃
命令失败 = 一条可以被模型消费的 Observation
```

## 第 4 步：格式化 Observation

Environment 返回的是面向 Runtime 的结构化结果，模型 API 需要的是消息。因此由 Model 负责：

```python
self.model.format_observation_messages(
    message,
    outputs,
    self.get_template_vars(),
)
```

tool calling 模式下，Observation 通常带有：

```python
{
    "role": "tool",
    "tool_call_id": "call_1",
    "content": "...",
    "extra": {
        "raw_output": "src\n",
        "returncode": 0,
        "timestamp":  ...,
    },
}
```

`tool_call_id` 很重要：它把结果和具体的工具调用配对，避免模型在多个并行或连续 action 中失去对应关系。

## 第 5 步：Observation 回到 `messages`

`add_messages()` 做的事情非常简单：

```python
def add_messages(self, *messages: dict) -> list[dict]:
    self.messages.extend(messages)
    return list(messages)
```

但这个简单操作形成了 mini 的核心特征：

> `self.messages` 同时是下一轮模型上下文，也是完整 trajectory。

没有单独的隐藏状态树，没有一个模型上下文和一个调试轨迹。你看到的 history，就是下一次 `Model.query()` 收到的 history。

## 一个两轮轨迹

假设模型第一次返回 `pwd`，第二次返回完成命令，消息序列可以画成：

```text
run()
|
|-- system: 你可以使用 bash
|-- user:   完成任务 T
|
|-- step 1
|   |-- query
|   |   |-- model.query(messages)
|   |   `-- assistant: action=pwd
|   `-- execute_actions
|       |-- env.execute({"command": "pwd"})
|       |-- output={"returncode": 0, "output": "..."}
|       `-- tool: output of pwd
|
`-- step 2
    |-- query
    |   `-- assistant: action=echo COMPLETE...
    `-- execute_actions
        `-- env detects completion and raises Submitted
```

这里有一个容易漏掉的事实：如果 Environment 在执行动作时直接抛出完成异常，那么这一轮不会继续走普通的 Observation 格式化路径，而是跳到 `run()` 的异常处理。

## 可运行实验：用测试模型观察消息数量

执行：

```bash
cd /Users/xinranzhao/Documents/llm-study/books/mini-swe-agent-source-guide/mini-swe-agent
pytest -q tests/agents/test_default.py -k message_history_tracking
```

然后阅读：

```text
tests/agents/test_default.py:333
```

这个测试明确断言：

```text
system
user
assistant
observation
assistant
exit
```

总共 6 条消息。

请自己画出这 6 条消息的来源。尤其要标记：

- 哪些来自 Model；
- 哪些来自 Environment；
- 哪一条由异常控制流补入；
- 哪些消息会被传给下一次 Model.query。

## 设计取舍：为什么不拆一个 MessageStore

mini 选择直接维护 `self.messages`，而不是先引入复杂的 MessageStore、HistoryProcessor 或 EventBus。优点是：

- 轨迹和上下文天然一致；
- 调试时可以直接打印；
- 训练和回放更容易；
- 代码很少。

代价是：

- history 越长，Context Window 压力越大；
- 不能自然地做复杂的分支历史；
- Observation 格式会直接影响下一轮输入；
- 更高级的压缩、总结和分支，需要额外扩展。

这不是“简单所以一定正确”，而是一个明确的基线选择。

## 面试问答

### Q1：为什么 `query()` 后马上 `add_messages(message)`？

因为模型刚刚产生的 assistant message 是下一轮上下文和轨迹的一部分。若不追加，下一次模型看不到自己刚才做了什么，调试轨迹也会缺少决策。

### Q2：Environment 返回字符串不行吗？

可以做原型，但结构化结果更可靠。`returncode`、超时、异常类型、原始输出和时间戳都能保留，Model 再把它格式化成合适的消息。

### Q3：Observation 是谁生成的？

原始执行结果由 Environment 生成；发送给下一轮模型的消息由 Model 的 `format_observation_messages()` 生成；Agent 负责把它们追加到 history。

### Q4：为什么 action 是列表？

一个模型响应可能包含多个 tool call。统一用列表可以支持多动作响应，Environment 按顺序执行并返回对应 outputs。

## 闭卷检查

请不看源码，完成下面的填空：

```text
run 初始化 ______ 和 ______ 消息。
query 先检查 ______，再调用 ______。
模型返回的统一动作位于 message 的 ______。
Environment 返回 ______。
Model 把 output 格式化为 ______。
Agent 把它们追加到 ______。
```

### 完成标准

你能够从 `run()` 开始，按顺序讲出：

```text
初始化消息
-> 检查限制
-> Model.query
-> assistant message 入 history
-> Environment.execute
-> Model.format_observation_messages
-> observation 入 history
-> 检查是否退出
```
