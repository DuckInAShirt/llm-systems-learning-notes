# LLM 算法高频面试题总表

这不是“看过即会”的题海，而是一张面试防守地图。

使用规则：

1. `P0 必答`：一面要能讲出约 60 秒的完整答案，并接住至少两条追问。
2. `P1 高频`：基础一轮结束前，至少能说清定义、核心机制和使用场景。
3. `P2 长板`：按训练/后训练、推理优化、RAG 评测、多模态四个方向选择深入。
4. 每个题先按“是什么 → 为什么 → 怎么做 → 代价/边界”组织，再补真实项目或代码例子。

当前学习顺序见：[基础一轮进度](PROGRESS.md)。每天的详细复述和卡点写进 `days/`。

## 题目来源与可信度

下面的优先级不是严谨统计结论，而是根据公开的 LLM 算法岗题库、手撕题库和题库覆盖交集做的筛选：

- [wdndev/llm_interview_note](https://github.com/wdndev/llm_interview_note)：覆盖分词、注意力、位置编码、MoE、分布式训练、微调和推理等主题的长期整理。
- [km1994/LLMs_interview_notes](https://github.com/km1994/LLMs_interview_notes)：LLM 算法工程师面试题整理。
- [aceliuchanghong/FAQ_Of_LLM_Interview](https://github.com/aceliuchanghong/FAQ_Of_LLM_Interview)：模型架构、PEFT、RAG、强化学习、Agent 与评测等算法岗题目。
- [AIR-hl/llm-interview-code](https://github.com/AIR-hl/llm-interview-code)：作者基于数十场面试的经验，明确提到遇到过 MHA、RoPE、RMSNorm、BPE、InfoNCE、DPO 和工具调用解析；这些题在下表中标为重点。

来源可以帮助校准优先级，但不替代理解。不同公司、团队和面试官的题目分布会不同。

## P0：一面必答

| 模块 | 高频问法 | 必须说出的点 | 对应基础日 |
| --- | --- | --- | --- |
| Tokenizer | 为什么需要 tokenizer？BPE 如何训练？词表大小如何权衡？ | 文本到 id；高频相邻片段合并；词表、序列长度、未见词与 softmax 参数的取舍。 | 1 |
| Tokenizer | token id、embedding、词向量有什么区别？ | id 是索引；embedding 是可学习查表；输出是连续向量。 | 1 |
| 位置编码 | 为什么 attention 需要位置信息？RoPE 与绝对位置编码区别？ | 注意力本身不带顺序；RoPE 在 Q/K 上旋转并编码相对位置信息。 | 1 |
| Attention | Q、K、V 分别做什么？完整 attention 计算链路？ | 线性投影；`QK^T / sqrt(d_k)`；mask；softmax；加权 V。 | 2 |
| Attention | 为什么除以 `sqrt(d_k)`？为什么需要 causal mask？ | 防 softmax 饱和；保证训练、推理都不能偷看未来。 | 2 |
| Attention | MHA、MQA、GQA 有何区别？ | Q head 与 KV head 的共享关系；KV Cache、decode 带宽、质量折中。 | 3 |
| LLM 组件 | LayerNorm、RMSNorm、残差连接分别解决什么？ | 训练稳定；RMSNorm 的简化；残差的梯度和信息通路。 | 2-3 |
| LLM 组件 | SwiGLU 为什么常替代普通 MLP 激活？ | 门控非线性；表达能力；参数量和中间维度的折中。 | 3 |
| 架构选择 | 为什么主流通用 LLM 多是 decoder-only？ | causal next-token 目标；统一文本/代码/对话训练；自回归生成。 | 4、17 |
| 预训练 | next-token prediction 的目标和标签如何构造？ | 输入右移一位的 target；交叉熵；自监督；训练可并行、推理必须串行。 | 4 |
| 优化 | 交叉熵如何计算？为什么 logits 不先手写 softmax？ | 真实 token 的负对数概率；数值稳定的 fused 实现；mask/ignore index。 | 5 |
| 优化 | AdamW 与 Adam 的区别？为什么 warmup？ | 一二阶矩；解耦 weight decay；初期稳定；学习率曲线。 | 5 |
| 训练 | 混合精度、梯度累积、activation checkpointing 分别解决什么？ | 显存、吞吐、数值稳定；用计算换显存。 | 5-6 |
| 分布式 | DDP 的 rank、world size、all-reduce 是什么？ | 一卡一进程；数据分片；梯度同步；参数保持一致。 | 6 |
| 分布式 | ZeRO/FSDP 和 DDP 的差异？DP/TP/PP 分别切什么？ | 参数、梯度、优化器状态分片；模型放不下时的并行维度。 | 6 |
| SFT | SFT 与预训练差别？chat template 和 label mask 为什么重要？ | 目标同为 next-token；数据分布/监督区域不同；只监督 assistant；训练推理模板一致。 | 7 |
| PEFT | LoRA 如何工作？为什么省显存？QLoRA 多做了什么？ | `ΔW = BA`；冻结基座；训练状态减少；低比特基座 + adapter。 | 8 |
| 对齐 | RLHF 的流程是什么？PPO 为什么有 KL 约束？ | SFT、reward model、RL；避免偏离 reference 与 reward hacking。 | 9 |
| 对齐 | DPO 的核心思路，和 SFT/PPO 的区别？ | chosen/rejected；相对 reference 的偏好损失；无需显式 RM/在线 PPO。 | 9 |
| 解码 | temperature、top-k、top-p 有什么区别？ | logits 缩放；固定候选数与累计概率候选集；一致性和随机性的权衡。 | 10 |
| 推理 | prefill 和 decode 的区别？ | prompt 并行建 KV；逐 token 生成复用 KV；TTFT 与 ITL 的不同瓶颈。 | 11 |
| 推理 | KV Cache 为什么缓存 K/V，不缓存 Q？显存受什么影响？ | 历史 KV 被反复使用；长度、并发、层数、KV head、精度近似线性影响显存。 | 11 |
| 推理 | PagedAttention 和 continuous batching 为什么提高 vLLM 吞吐？ | 分块 KV 管理、减碎片；动态进出 batch、减少空等。 | 11 |
| 推理 | FlashAttention、量化、speculative decoding 各优化什么？ | attention I/O；存储/带宽；减少目标模型串行 decode 步数。 | 11 |
| 评测 | 什么是 ablation？为什么只报总分不够？ | 控制变量；建立因果；同时看质量、延迟、成本与方差。 | 12 |
| RAG | embedding、BM25、reranker、RRF、top-k 各解决什么？ | 宽召回与精排；语义/关键词互补；排名融合；噪声和上下文预算。 | 13 |
| RAG | RAG 失败如何分层排查？ | 语料、召回、排序、context、生成、引用；保存全链路中间结果。 | 14 |
| Agent | 工具调用的安全执行链路是什么？ | schema 输出、校验、权限、受控执行、observation 回写、审计与幂等。 | 15 |
| 长上下文 | 长上下文、RAG、摘要压缩怎么选？ | 是否需全量信息；成本、延迟、可追溯性；lost in the middle。 | 16 |
| 排障 | 训练 loss 不下降如何排查？ | 小数据过拟合；label/mask；tokenizer；学习率、梯度、step、溢出、分布式同步。 | 20 |

## P1：基础一轮必须覆盖

### 模型与数据

- 预训练语料为什么要清洗、去重、做质量过滤？
- train、validation、test 为什么必须分开？什么是数据泄漏和 benchmark contamination？
- Pre-Norm 与 Post-Norm 的区别，为什么深层 Transformer 常用 Pre-Norm？
- MoE 的 router、top-k expert、负载均衡和通信瓶颈是什么？
- base model 与 instruct/chat model 的差别是什么？
- encoder-only、decoder-only、encoder-decoder 分别适合什么任务？
- continued pretraining、SFT、RAG 分别解决什么问题，如何组合？

### 训练与后训练

- 为什么通常不对 bias 和 Norm 参数做 weight decay？
- global batch size、micro-batch、gradient accumulation、学习率如何关联？
- DDP 为什么仍可能 OOM？何时要 FSDP/ZeRO、TP、PP？
- LoRA 的 rank、alpha、target modules 如何调？adapter 何时合并？
- GRPO 与 PPO 的差异；组内相对优势解决什么问题？
- reward hacking 是什么，如何缓解？
- InfoNCE 是什么？它为何适用于 embedding/图文对比学习？

### 推理与系统

- beam search、贪心、随机采样分别适合什么任务？为什么开放生成常不用 beam search？
- stop token、max_new_tokens、repetition penalty 分别控制什么？
- TTFT、ITL/TPOT、tokens/s、QPS、P99 如何区分和权衡？
- GQA 为什么主要改善 decode？
- 量化为什么不一定加速？INT8/INT4 的主要风险是什么？
- speculative decoding 的接受率如何影响收益？
- 长上下文为什么常受 KV Cache 限制？

### 评测、RAG 与 Agent

- 离线 benchmark、人工评测、线上指标各有什么偏差？
- 准确率、F1、ROUGE、BLEU、pass@k、Recall@K、MRR、nDCG 分别适用什么？
- 如何构造 RAG 评测集？为什么既要答案标注，也要证据标注？
- groundedness/faithfulness 是什么，如何评测？
- chunk size 与 overlap 如何影响召回、噪声和成本？
- ReAct、tool calling、MCP 分别是什么，边界在哪里？
- 结构化输出为什么必须做 schema 校验和重试？
- Agent 的短期上下文、工作记忆、长期记忆如何区分？

### 多模态

- 图像如何变成视觉 token 并接入 LLM？
- CLIP 的图文对比目标是什么？
- 视觉 token 数为何影响 VLM 成本？
- 什么是视觉幻觉，如何评测和缓解？

## P2：选长板后深入

### 训练 / 后训练

- SFT 数据配比、数据去重和能力遗忘如何验证？
- DPO、IPO、ORPO、GRPO、DAPO 的目标和适用条件如何比较？
- reward model 如何训练、校准和防止被钻漏洞？
- 如何设计一个最小可复现的偏好优化实验？

### 推理优化

- FlashAttention 的 online softmax 和分块 I/O 思想是什么？
- PagedAttention 的 block table 如何管理序列增长和共享前缀？
- prefix caching、chunked prefill、disaggregated prefill/decode 解决什么？
- 连续批处理的调度策略如何影响公平性、TTFT 和吞吐？
- 如何用 profiling 区分计算瓶颈、显存带宽瓶颈和通信瓶颈？

### RAG / 评测

- 混合检索、query rewrite、multi-query 和 HyDE 分别什么时候有用？
- 如何定位“召回了但没用上”的 context utilization 问题？
- 如何把离线评测和线上失败样本闭环成数据迭代？
- 如何比较不同 embedding、reranker、chunk 策略的质量、延迟和成本？

### 多模态 / Agent

- projector、cross-attention、early fusion 在 VLM 中的区别？
- 多模态 SFT 数据如何构造和做负例？
- tool calling 的并行调用、幂等、重试和权限如何设计？
- Agent 轨迹数据怎样用于 SFT、偏好优化或强化学习？

## 建议的面试练法

1. 先清掉全部 P0 空白点，再进入 P1。
2. 每道 P0 都准备一个 60 秒版本和一个 2 分钟版本。
3. 对训练、推理、RAG 各挑一个问题，画出数据流或 tensor shape。
4. 面试前随机抽 10 道 P0/P1，闭卷口述并录音回听。
