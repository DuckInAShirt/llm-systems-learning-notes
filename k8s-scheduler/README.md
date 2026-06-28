# K8S Scheduler 源码阅读

## 目标

理解 Kubernetes Scheduler 如何从待调度 Pod 中选择合适 Node，包括调度队列、Filter、Score、Bind、插件机制和扩展点。

## 路线

1. 调度器启动入口。
2. scheduling queue。
3. scheduling cycle 和 binding cycle。
4. Filter 插件。
5. Score 插件。
6. Preemption。
7. Framework 插件机制。
8. 自定义调度插件实验。

## 关键问题

```text
Pod 如何进入调度队列？
一次调度循环做了什么？
Filter 和 Score 的输入输出是什么？
插件如何注册和执行？
调度失败后如何重试？
```

