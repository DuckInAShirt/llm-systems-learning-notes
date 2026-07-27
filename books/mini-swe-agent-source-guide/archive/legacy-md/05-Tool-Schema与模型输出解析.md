# 第五章：Tool Schema 与模型输出解析

> 本章是下一次互动学习的入口，目前先放学习地图和预习问题。

## 你将要解决的问题

前四章里，我们反复看到：

```python
message.get("extra", {}).get("actions", [])
```

但 action 到底是怎么来的？

模型不会天然返回这个统一结构。它可能返回：

- OpenAI 风格的 `tool_calls`；
- Responses API 风格的 `function_call`；
- 文本代码块；
- 不完整的 JSON；
- 未知工具名；
- 没有任何工具调用。

第五章会沿着这条链学习：

```text
BASH_TOOL
  -> Model.query()
  -> _parse_actions()
  -> parse_toolcall_actions()
  -> actions
  -> Environment.execute()
```

## 预习源码

```text
src/minisweagent/models/utils/actions_toolcall.py
src/minisweagent/models/litellm_model.py
src/minisweagent/models/utils/actions_text.py
tests/models/test_actions_toolcall.py
```

## 预习问题

1. `BASH_TOOL` 的 schema 规定了什么？
2. 如果模型没有 tool call，为什么不能直接当作空 action？
3. `tool_call_id` 为什么要保留？
4. JSON 参数解析失败时，为什么抛 `FormatError` 而不是让 Environment 执行？
5. v2 默认 tool calling，为什么仓库还保留 text-based model？

下一次学习会从 `BASH_TOOL` 开始，手动构造一个合法和三个非法的 tool call，然后逐个追踪 `FormatError` 的 message。

