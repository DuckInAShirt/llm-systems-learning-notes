# vLLM 源码阅读

## 目标

理解 vLLM 的推理引擎设计，包括请求调度、PagedAttention、KV cache 管理、continuous batching、worker 执行路径和 kernel 调用链路。

## 计划

1. 跑通最小启动流程。
2. 梳理 offline inference 和 online serving 的入口。
3. 阅读请求生命周期：提交、排队、调度、执行、返回。
4. 阅读 KV cache 的 block 管理。
5. 阅读 PagedAttention 的核心实现。
6. 对照代码画出主流程图。

## 笔记模板

```text
问题：
入口：
关键类 / 函数：
主流程：
关键数据结构：
疑问：
验证方式：
```

