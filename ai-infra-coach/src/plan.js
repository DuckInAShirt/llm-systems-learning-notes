const deep = (label, minutes, kind) => ({ label, minutes, kind });
const fragment = (label, minutes) => ({ label, minutes });

export const phases = [
  {
    id: 1,
    title: "推理基础",
    range: "Day 1-7",
    outcome: "解释一次请求的完整生命周期，并完成单卡基线。",
  },
  {
    id: 2,
    title: "vLLM 源码",
    range: "Day 8-14",
    outcome: "画出 API、Scheduler、KV Cache 与 Worker 主链路。",
  },
  {
    id: 3,
    title: "4×A30 实验",
    range: "Day 15-21",
    outcome: "形成可复现的性能对比数据和实验结论。",
  },
  {
    id: 4,
    title: "服务与面试",
    range: "Day 22-30",
    outcome: "完成服务化、对比实验、项目报告与面试讲解。",
  },
];

const rawPlan = [
  {
    day: 1,
    phase: 1,
    title: "一次推理请求如何完成",
    objective: "把请求入口、prefill、decode、采样和流式返回串成完整因果链。",
    deep: [
      deep("画出文本进入 vLLM 到 token 流式返回的主链路", 45, "理解"),
      deep("用自己的话区分 prefill 与 decode，并写出各自瓶颈", 50, "口述"),
      deep("整理 TTFT、ITL、TPS、QPS、P99 的定义与关系", 55, "指标"),
    ],
    fragments: [
      fragment("闪卡：prefill / decode / KV Cache", 20),
      fragment("口述：为什么 decode 通常是 memory-bound", 20),
      fragment("复习今天的 5 个性能指标", 20),
    ],
    deliverable: "一张请求生命周期图 + 一页性能指标笔记",
    question: "Prefill 和 decode 的计算特点为什么不同？",
    answer:
      "Prefill 并行处理全部输入 token，矩阵规模大，通常更偏计算密集；decode 每轮只生成一个 token，需要反复读取模型权重和 KV Cache，通常更受显存带宽与调度影响。",
  },
  {
    day: 2,
    phase: 1,
    title: "KV Cache 与显存",
    objective: "知道 KV Cache 保存了什么，并能估算它随请求增长的显存成本。",
    deep: [
      deep("从 Attention 公式解释为什么历史 K/V 可以缓存", 45, "理解"),
      deep("读取一个模型 config，计算单 token KV Cache 大小", 55, "代码"),
      deep("写一个 Python KV Cache 显存计算器", 50, "代码"),
    ],
    fragments: [
      fragment("复述 KV Cache 解决的问题", 20),
      fragment("手算 batch 与 sequence length 翻倍的影响", 20),
      fragment("记录 MHA、GQA、MQA 对 KV 大小的区别", 20),
    ],
    deliverable: "可输入模型参数的 KV Cache 计算脚本",
    question: "为什么 GQA 能减少 KV Cache？",
    answer:
      "GQA 让多组 Query Head 共享较少的 Key/Value Head，因此缓存的 K/V head 数量下降，在保持多个 Query Head 的同时降低显存占用和读取量。",
  },
  {
    day: 3,
    phase: 1,
    title: "Batching 与请求调度",
    objective: "理解静态 batching、动态 batching 和 continuous batching 的差别。",
    deep: [
      deep("用时间线画出三个长短不同请求的执行过程", 45, "理解"),
      deep("实现一个简化的请求队列和每轮 decode 调度模拟器", 60, "代码"),
      deep("分析吞吐、等待时间和公平性之间的取舍", 45, "复盘"),
    ],
    fragments: [
      fragment("口述 continuous batching 的价值", 20),
      fragment("复习 head-of-line blocking", 20),
      fragment("写出调度器至少需要维护的 4 个字段", 20),
    ],
    deliverable: "一个可打印调度时间线的 Python 模拟器",
    question: "Continuous batching 为什么能提高吞吐？",
    answer:
      "它不必等待整个 batch 的所有请求结束。已完成请求可以立即退出，新请求可以在后续迭代加入，从而减少 GPU 空洞并提高并发请求下的利用率。",
  },
  {
    day: 4,
    phase: 1,
    title: "PagedAttention",
    objective: "用操作系统分页类比理解 KV Cache 的块式管理和共享。",
    deep: [
      deep("对比连续 KV Cache 分配与分页分配的碎片问题", 50, "理解"),
      deep("实现一个最小 block table 分配与释放模拟器", 60, "代码"),
      deep("解释 copy-on-write 与并行采样中的共享价值", 40, "口述"),
    ],
    fragments: [
      fragment("画逻辑块到物理块映射", 20),
      fragment("复习内部碎片与外部碎片", 20),
      fragment("口述 PagedAttention 不会改变模型数学结果", 20),
    ],
    deliverable: "最小 KV block allocator + 一张块表图",
    question: "PagedAttention 优化的是 Attention 算法本身吗？",
    answer:
      "不是。它主要优化 KV Cache 的显存组织和管理方式，让逻辑序列映射到非连续物理块，减少碎片并支持共享，模型的 Attention 数学语义不变。",
  },
  {
    day: 5,
    phase: 1,
    title: "建立可靠的 Benchmark",
    objective: "把测试条件固定下来，避免只报一个没有上下文的 TPS。",
    deep: [
      deep("确定模型、精度、TP、输入输出长度和并发矩阵", 50, "设计"),
      deep("整理 warm-up、重复次数、P50/P99 与随机种子", 45, "设计"),
      deep("写 benchmark 结果 JSON Schema 和运行清单", 55, "代码"),
    ],
    fragments: [
      fragment("复习 online 与 offline benchmark 区别", 20),
      fragment("口述为什么必须报告输入输出长度", 20),
      fragment("检查实验变量是否一次只改一个", 20),
    ],
    deliverable: "实验配置模板 + 结果记录 Schema",
    question: "为什么只说 TPS 没有意义？",
    answer:
      "TPS 会受模型、精度、硬件、输入输出长度、并发、batch 和统计口径影响。缺少这些条件时无法复现，也不能与其他结果公平比较。",
  },
  {
    day: 6,
    phase: 1,
    title: "4×A30 基线实验",
    objective: "得到后续所有优化可以对比的单卡与多卡基线。",
    deep: [
      deep("记录 GPU、驱动、CUDA、框架、模型与启动参数", 40, "实验"),
      deep("运行低并发与高并发两组基线并保存原始结果", 70, "实验"),
      deep("检查 GPU 利用率、显存和异常日志", 40, "分析"),
    ],
    fragments: [
      fragment("整理一条完整可复现启动命令", 20),
      fragment("记录一个意外现象和可能原因", 20),
      fragment("口述基线存在的意义", 20),
    ],
    deliverable: "首份 A30 baseline 结果，包含完整环境信息",
    question: "为什么性能实验必须先有 baseline？",
    answer:
      "Baseline 提供固定参照，才能判断后续变化来自优化、配置还是环境波动；没有 baseline，性能提升无法归因，也难以发现回归。",
  },
  {
    day: 7,
    phase: 1,
    title: "第一周复盘",
    objective: "把推理基础从零散术语整理成一次完整口述。",
    deep: [
      deep("不看资料画出请求、Scheduler、Worker、KV Cache 主链路", 45, "复盘"),
      deep("修正前六天代码和笔记中的理解错误", 55, "整理"),
      deep("录制一次 5 分钟推理系统讲解并自查", 50, "口述"),
    ],
    fragments: [
      fragment("随机抽取 10 张本周闪卡", 20),
      fragment("复述最薄弱的两个概念", 20),
      fragment("整理下周源码阅读问题清单", 20),
    ],
    deliverable: "5 分钟口述录音 + 第一周知识地图",
    question: "一次请求的延迟可以拆成哪些主要部分？",
    answer:
      "可以拆成排队等待、prefill、首 token 采样、后续 decode 间隔、网络和序列化等部分。TTFT 重点覆盖首 token 前的等待与 prefill，ITL 反映后续 token 的生成间隔。",
  },
  {
    day: 8,
    phase: 2,
    title: "vLLM 源码地图",
    objective: "先找到入口和模块边界，不从第一行开始读。",
    deep: [
      deep("固定一个 vLLM 版本并保存 commit SHA", 35, "准备"),
      deep("定位 API Server、Engine Core、Scheduler、Worker 目录", 65, "源码"),
      deep("画模块调用关系并记录每个模块一句话职责", 50, "源码"),
    ],
    fragments: [
      fragment("复习 rg、git blame、git log 的用法", 20),
      fragment("记住 5 个核心类或模块名", 20),
      fragment("写下三个源码问题", 20),
    ],
    deliverable: "vLLM 源码导航图",
    question: "读大型框架源码为什么不能从第一行开始？",
    answer:
      "大型框架包含兼容层、配置和边缘路径。应该先从可运行请求定位入口、主数据结构和关键调用链，再按问题深入，否则容易陷入局部细节。",
  },
  {
    day: 9,
    phase: 2,
    title: "请求入口与异步引擎",
    objective: "追踪一次 OpenAI 兼容请求如何进入 Engine。",
    deep: [
      deep("从 chat/completions 或 completions 路由开始跟踪", 50, "源码"),
      deep("记录请求参数如何转换为内部 request", 55, "源码"),
      deep("定位流式输出生成器和取消请求路径", 45, "源码"),
    ],
    fragments: [
      fragment("复习 SSE 流式返回", 20),
      fragment("口述 API 层为何不应执行模型计算", 20),
      fragment("画请求对象的字段流转", 20),
    ],
    deliverable: "从 HTTP 请求到 Engine 的调用链笔记",
    question: "API Server 和推理 Engine 为什么要分层？",
    answer:
      "API 层负责协议、鉴权、序列化和流式响应，Engine 负责调度与模型执行。分层便于扩展不同协议、隔离高并发网络处理，并保持核心推理逻辑独立。",
  },
  {
    day: 10,
    phase: 2,
    title: "Scheduler 主循环",
    objective: "知道请求何时进入 running、waiting、finished 等状态。",
    deep: [
      deep("定位 Scheduler 的核心数据结构和一次 schedule 调用", 60, "源码"),
      deep("追踪 prefill 与 decode 请求如何被选择", 50, "源码"),
      deep("用伪代码重写 Scheduler 主循环", 40, "代码"),
    ],
    fragments: [
      fragment("复习 waiting/running 状态转换", 20),
      fragment("口述调度约束来自哪里", 20),
      fragment("记录一个公平性与吞吐的冲突", 20),
    ],
    deliverable: "Scheduler 主循环伪代码",
    question: "推理 Scheduler 的核心约束有哪些？",
    answer:
      "主要受可用 KV blocks、最大 batch token、请求优先级、prefill/decode 资源竞争、模型并行配置和延迟目标约束。",
  },
  {
    day: 11,
    phase: 2,
    title: "KV Cache Manager",
    objective: "把 Day 4 的分页概念映射到真实源码。",
    deep: [
      deep("定位 block 分配、释放与引用计数相关代码", 60, "源码"),
      deep("追踪请求新增 token 时 block table 如何变化", 50, "源码"),
      deep("给关键数据结构画内存关系图", 40, "分析"),
    ],
    fragments: [
      fragment("复习 block、page、slot 的区别", 20),
      fragment("口述显存不足时可能发生什么", 20),
      fragment("对照自己的 allocator 模拟器", 20),
    ],
    deliverable: "KV Cache Manager 数据结构图",
    question: "Scheduler 和 KV Cache Manager 的关系是什么？",
    answer:
      "Scheduler 决定本轮运行哪些请求，但必须先确认 KV Cache 资源是否足够；KV Cache Manager 负责块的分配、映射和释放，并向调度决策提供资源约束。",
  },
  {
    day: 12,
    phase: 2,
    title: "Worker 与 Model Runner",
    objective: "理解调度结果如何变成 GPU 上的一次模型前向。",
    deep: [
      deep("追踪 Scheduler 输出到 Worker 执行的调用链", 55, "源码"),
      deep("定位输入张量准备、模型 forward 和采样位置", 60, "源码"),
      deep("记录 CPU 调度与 GPU 执行的边界", 35, "分析"),
    ],
    fragments: [
      fragment("复习 logits 与采样过程", 20),
      fragment("口述 Worker 为什么需要持有模型", 20),
      fragment("整理一次 forward 的输入输出 shape", 20),
    ],
    deliverable: "Scheduler output 到 token output 的调用链",
    question: "Model Runner 的职责是什么？",
    answer:
      "它把调度结果整理成模型需要的张量和元数据，调用 GPU 上的模型 forward，执行采样，并将生成结果返回给上层 Engine。",
  },
  {
    day: 13,
    phase: 2,
    title: "Tensor Parallel 与 NCCL",
    objective: "知道模型为什么要切卡，以及每层需要什么通信。",
    deep: [
      deep("用矩阵 shape 解释列并行与行并行 Linear", 55, "理解"),
      deep("梳理 AllReduce、AllGather、ReduceScatter", 50, "理解"),
      deep("在 2 卡或 4 卡上运行 TP 并观察显存和吞吐", 45, "实验"),
    ],
    fragments: [
      fragment("手画两张卡上的矩阵切分", 20),
      fragment("复习通信量为什么影响扩展效率", 20),
      fragment("口述 TP 与 PP 的差别", 20),
    ],
    deliverable: "一张 TP 通信图 + 一组多卡观察记录",
    question: "Tensor Parallel 为什么不会随 GPU 数量线性加速？",
    answer:
      "每层计算被切分后需要集合通信来组合结果，GPU 数量增加会带来通信、同步和小矩阵效率损失，因此实际加速受互联带宽和计算通信比限制。",
  },
  {
    day: 14,
    phase: 2,
    title: "源码主链路复盘",
    objective: "能从入口一路讲到 GPU forward 和流式返回。",
    deep: [
      deep("闭卷画完整 vLLM 主链路", 45, "复盘"),
      deep("选 Scheduler 或 KV Manager 做 10 分钟源码讲解", 60, "口述"),
      deep("整理两周内仍未解决的问题与验证方法", 45, "整理"),
    ],
    fragments: [
      fragment("随机复习 10 个源码名词", 20),
      fragment("口述 API Server 与 Engine Core 分层", 20),
      fragment("准备第三周实验假设", 20),
    ],
    deliverable: "vLLM 主链路讲解稿 + 源码索引",
    question: "如何证明自己不是只会运行 vLLM？",
    answer:
      "需要能解释请求如何经过 API、Scheduler、KV Cache Manager 和 Worker，并用实验现象对应源码中的调度和内存机制，而不是只展示启动命令。",
  },
  {
    day: 15,
    phase: 3,
    title: "实验设计与自动化",
    objective: "将实验变量、命令、结果和环境固化成可重复流程。",
    deep: [
      deep("确定并发、长度、TP、缓存和量化实验矩阵", 45, "设计"),
      deep("写统一 benchmark runner 和结果落盘逻辑", 65, "代码"),
      deep("实现环境信息自动采集", 40, "代码"),
    ],
    fragments: [
      fragment("检查实验是否一次只改一个变量", 20),
      fragment("复习置信区间与重复实验", 20),
      fragment("整理结果文件命名规范", 20),
    ],
    deliverable: "一键运行并落盘的 benchmark runner",
    question: "性能实验中如何控制变量？",
    answer:
      "固定硬件、软件版本、模型、精度、输入输出分布和随机种子，每组只改变一个目标变量，并进行 warm-up 和多次重复。",
  },
  {
    day: 16,
    phase: 3,
    title: "并发度扫描",
    objective: "找出延迟与吞吐的拐点，而不是追求单一最大值。",
    deep: [
      deep("运行 concurrency 1/2/4/8/16/32 的对比", 75, "实验"),
      deep("绘制 TTFT、P99、TPS 随并发变化的曲线", 45, "分析"),
      deep("结合 GPU 利用率解释拐点", 30, "分析"),
    ],
    fragments: [
      fragment("复习吞吐与延迟的取舍", 20),
      fragment("记录最佳吞吐点与可接受延迟点", 20),
      fragment("口述排队如何影响 TTFT", 20),
    ],
    deliverable: "并发扫描曲线和一段因果解释",
    question: "为什么并发升高后 P99 会迅速恶化？",
    answer:
      "请求超过系统可及时服务的能力后会排队，并争用 batch token、KV Cache 与计算资源；尾部请求累积等待，使 P99 比平均值更快恶化。",
  },
  {
    day: 17,
    phase: 3,
    title: "输入输出长度扫描",
    objective: "区分长 prompt 和长输出分别压在哪个阶段。",
    deep: [
      deep("固定输出，扫描不同 prompt 长度", 55, "实验"),
      deep("固定 prompt，扫描不同输出长度", 55, "实验"),
      deep("对比 TTFT、ITL、总时延和 KV 显存", 40, "分析"),
    ],
    fragments: [
      fragment("复述长 prompt 为什么影响 TTFT", 20),
      fragment("复述长输出为什么持续占用 KV", 20),
      fragment("整理两个异常样本", 20),
    ],
    deliverable: "长度扫描结果与阶段归因",
    question: "输入长度和输出长度分别主要影响什么？",
    answer:
      "输入长度主要增加 prefill 计算并影响 TTFT；输出长度增加 decode 轮数、请求驻留时间和 KV Cache 占用，影响总时延、并发容量与吞吐。",
  },
  {
    day: 18,
    phase: 3,
    title: "TP 1/2/4 对比",
    objective: "量化多卡并行的显存收益、通信成本和适用条件。",
    deep: [
      deep("在可运行模型上测试 TP=1/2/4", 75, "实验"),
      deep("对比显存、TTFT、TPS 和 GPU 利用率", 45, "分析"),
      deep("结合 NCCL 通信解释非线性扩展", 30, "复盘"),
    ],
    fragments: [
      fragment("复习模型是否单卡可装下对 TP 的影响", 20),
      fragment("记录每个 TP 配置的启动命令", 20),
      fragment("口述何时 TP 增卡反而变慢", 20),
    ],
    deliverable: "TP 扩展效率表和结论",
    question: "模型单卡能放下时，为什么 TP=2 可能更慢？",
    answer:
      "切分计算后引入了每层通信和同步开销；如果单卡计算已足够快、互联较慢或 batch 较小，减少的计算不足以抵消通信成本。",
  },
  {
    day: 19,
    phase: 3,
    title: "Prefix Cache 与 Chunked Prefill",
    objective: "验证共享前缀和长 prompt 调度优化何时有效。",
    deep: [
      deep("构造共享 system prompt 的请求集并测试缓存", 55, "实验"),
      deep("对比开启前后的 TTFT、吞吐和命中条件", 50, "分析"),
      deep("测试长 prompt 下 chunked prefill 的延迟变化", 45, "实验"),
    ],
    fragments: [
      fragment("口述 prefix cache 与 KV block 共享", 20),
      fragment("复习缓存不命中的常见原因", 20),
      fragment("记录优化的适用场景与代价", 20),
    ],
    deliverable: "两项调度优化的 A/B 实验",
    question: "Prefix caching 对所有请求都有效吗？",
    answer:
      "不是。只有请求存在完全匹配的可复用前缀，并且缓存未被淘汰时才有收益；高度随机或很短的 prompt 可能无法获得明显效果。",
  },
  {
    day: 20,
    phase: 3,
    title: "量化与精度",
    objective: "理解量化节省什么，以及为什么未必总能提升吞吐。",
    deep: [
      deep("选择一个量化模型与原精度模型做对比", 70, "实验"),
      deep("记录显存、加载时间、TTFT、TPS 和输出差异", 50, "分析"),
      deep("整理权重量化与 KV Cache 量化的区别", 30, "理解"),
    ],
    fragments: [
      fragment("复习 weight-only quantization", 20),
      fragment("口述量化 kernel 支持的重要性", 20),
      fragment("记录质量评测的局限", 20),
    ],
    deliverable: "量化前后性能与质量观察表",
    question: "为什么量化后不一定更快？",
    answer:
      "量化减少权重体积和带宽压力，但还取决于硬件和 kernel 是否高效支持、反量化开销、batch 大小以及瓶颈是否真的在权重读取。",
  },
  {
    day: 21,
    phase: 3,
    title: "实验报告",
    objective: "把结果转化成有条件、有证据、可复现的工程结论。",
    deep: [
      deep("清洗三周实验数据并标记无效样本", 45, "整理"),
      deep("完成四张核心图表和实验条件表", 60, "分析"),
      deep("为每项结论写限制条件和可能反例", 45, "写作"),
    ],
    fragments: [
      fragment("口述最重要的三个实验结论", 20),
      fragment("检查图表是否标注单位和条件", 20),
      fragment("准备别人复现实验所需清单", 20),
    ],
    deliverable: "vLLM on 4×A30 性能实验报告初稿",
    question: "怎样把相关性实验写成因果解释？",
    answer:
      "需要控制其他变量、重复实验，并用框架机制或源码路径解释变化；同时明确限制条件，避免把特定环境中的结果泛化到所有模型和硬件。",
  },
  {
    day: 22,
    phase: 4,
    title: "OpenAI API 与流式服务",
    objective: "把引擎包装成可压测、可取消、可观测的服务。",
    deep: [
      deep("梳理 chat/completions 请求与响应字段", 45, "理解"),
      deep("实现一个带取消和超时的 SSE 客户端", 60, "代码"),
      deep("记录断连、超时和服务端错误的处理策略", 45, "设计"),
    ],
    fragments: [
      fragment("复习 SSE data 帧与结束标记", 20),
      fragment("口述客户端断开后为何要取消推理", 20),
      fragment("整理错误码分类", 20),
    ],
    deliverable: "可靠的流式测试客户端",
    question: "客户端断开后为什么要及时取消请求？",
    answer:
      "如果推理继续，GPU、KV Cache 和队列容量仍被无效请求占用，既浪费资源也会拖慢其他用户，因此需要把断连信号传递到 Engine。",
  },
  {
    day: 23,
    phase: 4,
    title: "限流与 Admission Control",
    objective: "在请求压垮 GPU 前进行容量保护。",
    deep: [
      deep("区分并发限制、速率限制与队列长度限制", 45, "理解"),
      deep("实现一个简化 token budget admission controller", 65, "代码"),
      deep("设计过载时的拒绝、降级和重试响应", 40, "设计"),
    ],
    fragments: [
      fragment("复习令牌桶与信号量", 20),
      fragment("口述为什么不能只看请求数量", 20),
      fragment("记录长短请求公平性问题", 20),
    ],
    deliverable: "基于 token 预算的接入控制模拟器",
    question: "为什么按请求数限流不够？",
    answer:
      "请求的输入输出长度差异很大，对 prefill、decode 和 KV Cache 的消耗不同；仅按数量限制可能让少量超长请求耗尽容量。",
  },
  {
    day: 24,
    phase: 4,
    title: "可观测性",
    objective: "通过指标区分排队、prefill、decode、显存和通信问题。",
    deep: [
      deep("设计请求、Scheduler、GPU 三层指标", 50, "设计"),
      deep("建立 TTFT、队列长度、KV 使用率的关联面板", 55, "实现"),
      deep("为三类故障写排查路径", 45, "排障"),
    ],
    fragments: [
      fragment("复习 RED 与 USE 指标思路", 20),
      fragment("口述 P50 正常但 P99 高的可能原因", 20),
      fragment("整理日志中的 request id 链路", 20),
    ],
    deliverable: "指标字典 + 三条排障 Runbook",
    question: "TTFT 变高时首先看什么？",
    answer:
      "先拆排队时间和 prefill 时间，再结合队列长度、batch token、GPU 利用率、KV 使用率和输入长度判断是过载、计算变慢还是缓存资源不足。",
  },
  {
    day: 25,
    phase: 4,
    title: "故障恢复与容量边界",
    objective: "知道 OOM、Worker 崩溃和请求超时应如何止损。",
    deep: [
      deep("整理 OOM、NCCL 错误、模型加载失败的故障树", 50, "排障"),
      deep("为启动、健康检查和优雅退出设计状态机", 55, "设计"),
      deep("进行一次故障注入并记录恢复过程", 45, "实验"),
    ],
    fragments: [
      fragment("复习 readiness 与 liveness", 20),
      fragment("口述重试为何可能放大故障", 20),
      fragment("记录需要持久化与无需持久化的状态", 20),
    ],
    deliverable: "故障树 + 一次故障注入记录",
    question: "推理服务失败后能否直接无限重试？",
    answer:
      "不能。过载和确定性错误下重试会放大流量与资源争用。需要错误分类、退避、次数上限、熔断和容量恢复判断。",
  },
  {
    day: 26,
    phase: 4,
    title: "Kubernetes 与 Ray Serve 全景",
    objective: "理解模型实例、GPU 资源和流量调度在集群中的位置。",
    deep: [
      deep("画 Deployment、Service、Pod、GPU 的关系", 45, "理解"),
      deep("比较原生 K8s 与 Ray Serve 的职责边界", 50, "理解"),
      deep("设计一个两模型、多副本的部署草图", 55, "设计"),
    ],
    fragments: [
      fragment("复习 request/limit 与 GPU resource", 20),
      fragment("口述为什么模型冷启动昂贵", 20),
      fragment("整理扩缩容可用的三个信号", 20),
    ],
    deliverable: "多模型推理集群架构图",
    question: "模型服务为什么不能只按 CPU 利用率扩容？",
    answer:
      "瓶颈通常在 GPU、请求队列、KV Cache 和 token 处理速度。CPU 可能很空但 GPU 已饱和，因此应结合队列、延迟、GPU 和模型级容量信号。",
  },
  {
    day: 27,
    phase: 4,
    title: "SGLang 对比",
    objective: "用同一任务理解另一种推理框架的设计取舍。",
    deep: [
      deep("跑通 SGLang 同模型的最小服务", 50, "实验"),
      deep("对比 RadixAttention、缓存与调度概念", 55, "理解"),
      deep("在一组共享前缀任务上做小型 A/B", 45, "实验"),
    ],
    fragments: [
      fragment("复习 Radix Tree 的前缀共享", 20),
      fragment("整理两框架各自的源码入口", 20),
      fragment("口述为什么需要同条件比较", 20),
    ],
    deliverable: "vLLM 与 SGLang 小型对比表",
    question: "比较推理框架时最容易犯什么错误？",
    answer:
      "使用不同模型、精度、请求分布、并发或默认参数，最终比较的不是框架本身。必须固定环境并说明各自版本与配置。",
  },
  {
    day: 28,
    phase: 4,
    title: "项目工程化",
    objective: "让别人能运行、复现并理解你的项目。",
    deep: [
      deep("整理目录、配置、脚本和依赖锁定", 50, "工程"),
      deep("编写从环境检查到生成报告的 README", 60, "写作"),
      deep("在干净环境执行一次完整流程", 40, "验证"),
    ],
    fragments: [
      fragment("检查命令是否包含隐含路径", 20),
      fragment("整理常见错误和排查方式", 20),
      fragment("删掉无法解释的结论与数字", 20),
    ],
    deliverable: "可复现项目仓库候选版本",
    question: "一个性能项目怎样才算可复现？",
    answer:
      "需要固定版本和环境，提供数据与配置、完整命令、原始结果和处理脚本，并说明硬件、指标口径、随机性和已知限制。",
  },
  {
    day: 29,
    phase: 4,
    title: "面试表达与系统设计",
    objective: "把一个月的代码和数据转化成稳定的项目叙事。",
    deep: [
      deep("准备项目 1 分钟、3 分钟、10 分钟三个版本", 55, "口述"),
      deep("回答 15 道推理系统高频追问", 55, "面试"),
      deep("完成一次白板系统设计模拟", 40, "面试"),
    ],
    fragments: [
      fragment("复习指标定义和实验条件", 20),
      fragment("口述一个失败实验", 20),
      fragment("准备三个反问", 20),
    ],
    deliverable: "项目讲稿 + 模拟面试问题清单",
    question: "如何证明实验结论是你自己做的？",
    answer:
      "能够说明为什么这样设计、失败过什么、如何定位、原始数据在哪里、代码对应哪一步，以及改变条件后预期会发生什么。",
  },
  {
    day: 30,
    phase: 4,
    title: "最终 Demo 与下一阶段",
    objective: "完成一个可展示闭环，并根据数据选择后续长板。",
    deep: [
      deep("从启动服务到生成图表完成一次完整 Demo", 60, "演示"),
      deep("录制 5 分钟项目讲解并检查技术准确性", 45, "口述"),
      deep("根据薄弱点选择源码、调度或 CUDA 下一主线", 45, "规划"),
    ],
    fragments: [
      fragment("回看 Day 1 的知识图", 20),
      fragment("总结一个月最重要的五条因果链", 20),
      fragment("更新简历项目描述但不夸大", 20),
    ],
    deliverable: "最终 Demo、实验报告和下一阶段计划",
    question: "一个月后你应该如何介绍自己的水平？",
    answer:
      "我完成了 vLLM 在 4×A30 上的可复现评测，理解请求调度、KV Cache 和 Worker 主链路，能通过指标与源码分析性能变化，但仍在继续补 GPU kernel 与更大规模集群经验。",
  },
];

export const plan = rawPlan.map((day) => {
  const originalTotal = day.deep.reduce((sum, task) => sum + task.minutes, 0);
  let assigned = 0;
  const deepTasks = day.deep.map((task, index) => {
    const isLast = index === day.deep.length - 1;
    const minutes = isLast
      ? 100 - assigned
      : Math.round(((task.minutes / originalTotal) * 100) / 5) * 5;
    assigned += minutes;
    return { ...task, minutes };
  });
  return { ...day, deep: deepTasks };
});

export const taskId = (day, bucket, index) => `${day}-${bucket}-${index}`;
