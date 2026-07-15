export const taskAnswers = {
  1: {
    deep: [
      "参考主链路：Client 请求 → API/Tokenizer → 请求队列 → Scheduler → Prefill → 写入 KV Cache → Decode 循环 → Logits 与采样 → SSE 流式返回。图中至少标出 token ids、KV Cache 和生成 token 三类数据。",
      "Prefill 一次并行处理全部输入 token，矩阵规模较大，通常更偏计算密集；Decode 每轮只生成一个 token，却要反复读取模型权重和历史 KV，通常更受显存带宽与调度影响。",
      "TTFT 是首 token 延迟；ITL 是相邻输出 token 的间隔；TPS 是单位时间生成 token 数；QPS 是单位时间完成或接收请求数；P99 是 99% 请求不超过的尾延迟。吞吐提高时，排队可能让 TTFT/P99 变差。",
    ],
    fragments: [
      "Prefill：处理完整输入并建立 KV Cache。Decode：利用已有上下文逐 token 生成。KV Cache：保存各层历史 token 的 K/V，避免重复计算前缀。",
      "Decode 每轮计算量不大，却要读取整套模型权重和不断增长的 KV Cache；数据搬运相对计算更多，因此常表现为 memory-bound。",
      "TTFT 看首 token；ITL 看后续流畅度；TPS 看 token 吞吐；QPS 看请求吞吐；P99 看最慢的一小部分请求。",
    ],
  },
  2: {
    deep: [
      "自回归生成第 t 个 token 时，历史 token 的隐藏状态不会改变，因此它们在每层产生的 K/V 也不变。缓存历史 K/V 后，本轮只需计算新 token 的 Q/K/V，再让新 Q 与历史 K 做注意力。",
      "单 token KV 字节数约为：2 × 层数 × KV heads × head_dim × dtype_bytes。若要算完整缓存，再乘 batch 和 sequence length；其中 2 代表 K 与 V。",
      "计算器至少接收 layers、kv_heads、head_dim、batch、seq_len、dtype，输出 bytes/MiB/GiB，并验证 batch、seq_len 或 kv_heads 翻倍时缓存近似翻倍。",
    ],
    fragments: [
      "KV Cache 用显存换计算：保存历史 K/V，让 Decode 不必每轮重新计算整个前缀。",
      "其它参数固定时，batch 翻倍，KV Cache 翻倍；sequence length 翻倍，KV Cache 也翻倍；二者同时翻倍则约为 4 倍。",
      "MHA 每个 Query head 都有独立 KV head；GQA 让多组 Query head 共享较少 KV heads；MQA 让所有 Query heads 共享一组 K/V，因此缓存依次减小。",
    ],
  },
  3: {
    deep: [
      "时间线要标出 arrival、waiting、prefill、first token、每轮 decode 和 finish。对比静态 batch 时等待最长请求，与 continuous batching 中完成请求退出、新请求补位。",
      "模拟器至少维护 waiting、running、finished 三个集合；每轮先接纳请求，再按 token/request 预算执行一次 decode，最后释放已完成请求并记录时间线。",
      "更大 batch 常提高吞吐，却可能增加等待和 P99；优先短请求提高周转率，却可能让长请求饥饿；严格公平又可能降低 GPU 利用率。调度策略必须围绕 SLO 取舍。",
    ],
    fragments: [
      "Continuous batching 在每轮迭代重新组 batch：完成请求立即退出，新请求及时补入，减少静态 batch 中的空位，提高 GPU 利用率。",
      "Head-of-line blocking 是队首长请求阻塞后面的短请求，使本来能快速完成的请求也必须等待。",
      "至少维护：request id、状态、到达时间、prompt/output token 进度、KV block 占用、优先级或截止时间。",
    ],
  },
  4: {
    deep: [
      "连续分配要求每个请求获得一大段连续显存，容易产生外部碎片并因预留最大长度而浪费；分页分配把序列拆成固定 block，可使用任意空闲物理块，但最后一块仍可能有内部碎片。",
      "最小模拟器需要 free block pool、request→block table、allocate/append/free，并在请求结束后回收块。加入引用计数后，还能模拟共享前缀。",
      "并行采样的多个候选通常共享同一前缀。Copy-on-write 允许它们先指向相同只读 KV blocks，只有某个候选需要修改时才复制，减少重复显存。",
    ],
    fragments: [
      "逻辑序列可表示为 L0、L1、L2；block table 把它们映射到任意物理块，例如 L0→P7、L1→P2、L2→P9。逻辑连续不要求物理连续。",
      "内部碎片：已分配块内部未用满。外部碎片：空闲总量足够，但找不到一整段连续空间。",
      "PagedAttention 改变的是 KV Cache 的分配、映射与访问方式；QKᵀ、Softmax 和加权 V 的数学语义没有改变。",
    ],
  },
  5: {
    deep: [
      "实验表至少固定：模型与版本、dtype/量化、TP、GPU、输入长度、输出长度、并发或请求率。建议先用小矩阵筛选，例如并发 1/4/16、长度 128/512/2048。",
      "Warm-up 排除模型加载、CUDA context、图捕获和缓存建立；正式实验需重复多次。P50 表示典型请求，P99 表示尾延迟；随机种子和固定请求集用于减少负载差异。",
      "结果 Schema 应同时保存环境、配置、时间戳、退出码、TTFT/ITL/TPS/P99、错误数和原始日志路径。运行清单要包含环境检查、warm-up、正式运行、落盘和校验。",
    ],
    fragments: [
      "Online benchmark 关注并发请求下的 TTFT、ITL、P99 和过载；Offline benchmark 通常让 GPU 尽量吃满，更关注总吞吐和完成全部任务的时间。",
      "Prefill、Decode 和 KV Cache 成本都强依赖输入输出长度。没有长度分布的 TPS/延迟无法复现，也不能公平比较。",
      "控制变量检查：本组只改目标变量；模型、版本、精度、硬件、长度分布、采样参数、warm-up 和统计方法保持一致。",
    ],
  },
  6: {
    deep: [
      "环境记录至少包含 GPU 型号/数量、驱动、CUDA、Python、PyTorch、vLLM commit、模型 commit、dtype、TP、显存利用率参数和完整启动命令。",
      "低并发用于观察单请求 TTFT/ITL，高并发用于观察吞吐、排队和 P99。两组都应保存请求配置、stdout/stderr、原始 JSON 和 GPU 快照。",
      "GPU 利用率要与吞吐和延迟一起看；显存重点观察模型权重、KV Cache 和是否接近 OOM；日志检查错误、重试、抢占、NCCL 与请求取消。",
    ],
    fragments: [
      "可复现命令必须包含 CUDA_VISIBLE_DEVICES、模型路径、dtype、TP、端口、缓存/长度参数和版本信息，不能依赖当前 shell 中的隐含变量。",
      "记录格式：现象是什么 → 哪个指标异常 → 可能机制 → 下一步如何只改一个变量验证。不要直接把猜测写成结论。",
      "Baseline 是固定参照。后续配置变化只有和同条件基线比较，才能判断提升、回归及其来源。",
    ],
  },
  7: {
    deep: [
      "闭卷图应包含 API、Engine/Scheduler、KV Cache Manager、Worker/Model Runner、Sampler 和 Stream Output，并画出 request、token、block table 和 logits 的流向。",
      "逐项检查：公式是否漏乘 K/V 两份；TTFT 是否包含排队；TPS 口径是 output 还是 total token；PagedAttention 是否被误认为改变 Attention 数学；实验是否缺少条件。",
      "5 分钟结构：请求主链路 1 分钟 → Prefill/Decode 1 分钟 → KV Cache/PagedAttention 1 分钟 → Batching/Scheduler 1 分钟 → 指标与实验 1 分钟。",
    ],
    fragments: [
      "建议抽：Prefill、Decode、KV Cache、GQA、Continuous Batching、HOL blocking、PagedAttention、TTFT、ITL、P99。每张卡先用一句话回答，再补一个因果。",
      "薄弱概念不能只写名词，要写：我目前的解释、卡住的具体一步、一个可以验证它的小实验或源码入口。",
      "问题清单示例：请求在哪里进入 Engine？每轮 Scheduler 输出什么？KV block 谁分配和释放？Worker 如何准备张量？取消请求如何传播？",
    ],
  },
  8: {
    deep: [
      "记录 `git rev-parse HEAD`、vLLM 版本、Python/PyTorch/CUDA。所有源码笔记都以该 commit 为准，否则上游变动后路径和类名会失效。",
      "导航目标不是背路径，而是能从仓库中重新找到 API Server、Engine Core、Scheduler、KV Cache Manager、Worker/Model Runner，并各写一句明确职责。",
      "调用图建议：HTTP route → request conversion → Engine add request → Scheduler → KV allocation → Worker execute → Model Runner → Sampler → output processor → SSE。",
    ],
    fragments: [
      "`rg` 搜关键词/类名；`git blame` 找某行由哪个提交引入；`git log -S/-G` 找设计变化。先找到主链路，再查历史原因。",
      "建议记住职责而非死名字：API Server、Engine、Scheduler、KV Cache Manager、Worker/Model Runner。具体类名随版本可能变化。",
      "三个好问题应可验证，例如：本轮 token budget 在哪里决定？KV 不足如何抢占？客户端取消后哪个对象负责释放资源？",
    ],
  },
  9: {
    deep: [
      "从一个具体路由开始，记录请求 Schema、参数校验、chat template/tokenizer、sampling params、内部 request id，以及调用 Engine 的位置。",
      "外部字段会转换为 prompt token ids、sampling params、最大 token、优先级等内部对象。画出字段名变化，并注明默认值在哪一层补齐。",
      "流式路径应找到 Engine 输出的异步迭代器如何转成 SSE；取消路径应从客户端断连传播到 Engine，并最终释放 Scheduler/KV 资源。",
    ],
    fragments: [
      "SSE 是服务器到客户端的单向 HTTP 事件流。事件通常以 `data:` 开头、空行结束，最后用结束标记表示完成。",
      "API 层负责协议、校验、模板、序列化和连接；模型计算交给 Engine/Worker，才能隔离网络并发与 GPU 执行，也方便支持多种 API。",
      "字段流：HTTP JSON → validated request → prompt/messages → token ids → sampling params → internal request id → Engine request → streamed output。",
    ],
  },
  10: {
    deep: [
      "核心数据通常包括 waiting/running 请求、token budget、可用 KV blocks、每请求进度和调度输出。一次 schedule 要回答：谁运行、处理多少 token、需要哪些缓存映射。",
      "Prefill 与 Decode 共享 token budget 和 GPU。调度器会根据最大 batch token、KV 可用量、chunked prefill、优先级和延迟策略选择本轮请求。",
      "伪代码结构：接收新请求 → 计算资源预算 → 选择 running/decode → 选择 waiting/prefill → 分配或确认 KV → 生成 scheduler output → 更新/抢占状态。",
    ],
    fragments: [
      "新请求通常 waiting；被选中且资源足够后 running；生成完成、取消或失败后 finished，并释放相关资源。",
      "主要约束来自 KV block、batch token 上限、最大请求数、请求长度、优先级、Prefill/Decode 竞争和并行配置。",
      "优先短请求可提高吞吐和平均延迟，但长请求可能饥饿；严格 FIFO 更公平，却可能让大请求阻塞许多小请求。",
    ],
  },
  11: {
    deep: [
      "源码定位表应包含 allocate、append/extend、free、ref count/hash、free pool 和 request block table。每个函数写清调用者、修改状态和失败条件。",
      "新增 token 可能填入最后一个未满 block；满后申请新物理 block，并把它追加到请求的 block table。共享或缓存命中时还要更新引用。",
      "内存图至少画 request/sequence、逻辑 block、block table、物理 KV blocks、free pool 和 ref count，标出一对多或多对一关系。",
    ],
    fragments: [
      "Block 是固定数量 token 的缓存分配单位；Page 通常强调分页式物理存储概念；Slot 是某个 token 在物理 KV Cache 中的具体写入位置。",
      "KV 不足时可能拒绝新请求、让请求等待、抢占/换出已有请求、重算缓存，最终仍不足则 OOM 或报错。",
      "对照项：你的模拟器是否有引用计数、共享前缀、hash、抢占、缓存命中、并发安全和设备元数据？真实实现通常比 free list 多这些约束。",
    ],
  },
  12: {
    deep: [
      "主链路：Scheduler output → Worker 执行入口 → Model Runner 准备输入 → 模型 forward → logits → sampler → token/result → Engine/output processor。",
      "输入准备要定位 token ids、positions、slot mapping/attention metadata；forward 产生 logits；采样模块再应用 temperature、top-k/top-p 等选择 token。",
      "CPU 负责请求、调度和元数据组织；GPU 负责张量计算和 KV 读写。记录 host-to-device 拷贝、kernel launch、同步点和结果回传位置。",
    ],
    fragments: [
      "Logits 是词表中每个 token 的未归一化分数；经过温度、过滤和 Softmax 得到概率，再用 argmax 或 multinomial 选下一个 token。",
      "Worker 通常绑定具体设备并长期持有模型权重、KV Cache 和执行环境，避免每次请求重新加载模型，同时隔离不同 GPU/rank。",
      "典型输入：token ids `[num_tokens]` 或批次形式、positions、attention metadata；模型输出 logits 通常对应本轮需要采样的位置，最后得到 `[num_requests, vocab_size]` 或等价结构。",
    ],
  },
  13: {
    deep: [
      "列并行把 W 的输出维切分：各卡计算不同输出列，最后可能 AllGather；行并行把输入/权重的中间维切分：各卡得到部分和，最后通常 AllReduce 合并。",
      "AllReduce：各 rank 规约并都得到结果；AllGather：收集各 rank 分片并都得到完整结果；ReduceScatter：先规约再把结果分片给各 rank。",
      "记录 TP=1/2/4 的单卡显存、总 TPS、TTFT/P99、GPU 利用率和通信时间。计算 speedup 与 efficiency，并保留相同模型和负载条件。",
    ],
    fragments: [
      "列切分示意：W=[W0|W1]，GPU0 算 XW0，GPU1 算 XW1；行切分示意：X=[X0|X1]，结果为 X0W0 + X1W1。",
      "GPU 增多后，每层通信和同步会增加；当矩阵小、batch 小或互联慢时，通信占比上升，扩展效率下降。",
      "TP 切分同一层的张量，需要层内频繁通信；PP 把不同层分到不同阶段，需要流水线 micro-batch，并可能产生 pipeline bubble。",
    ],
  },
  14: {
    deep: [
      "完整图应从 HTTP/SSE 贯穿 API、Engine、Scheduler、KV Manager、Worker、Model Runner、Sampler，再回到输出；同时画 request 状态与 KV block 生命周期。",
      "10 分钟讲解结构：入口与职责 → 核心数据结构 → 一次正常状态变化 → 一个异常路径 → 一个设计取舍 → 对应实验指标。",
      "每个未解问题都写成：已知事实、具体不确定点、源码搜索词/日志点、预期现象和判定标准，避免只列名词。",
    ],
    fragments: [
      "建议抽查：request id、sampling params、waiting、running、token budget、block table、slot mapping、Worker、Model Runner、Sampler。",
      "API Server 处理协议、模板、鉴权/校验和流式连接；Engine Core 管请求生命周期、调度、缓存资源和模型执行协调。",
      "实验假设模板：在固定模型/硬件/长度下，提高并发会先提高 TPS，超过饱和点后 TTFT/P99 急升；用并发扫描和队列/GPU 指标验证。",
    ],
  },
  15: {
    deep: [
      "实验矩阵先围绕五类变量各选少量点：并发、输入/输出长度、TP、Prefix/Chunked Prefill、量化。先做筛选实验，再对敏感区域细扫。",
      "Runner 应读取配置、生成命令、创建唯一目录、采集环境、执行 warm-up/正式实验、保存 stdout/stderr/result JSON，并在失败时记录退出码。",
      "自动采集至少包括 nvidia-smi、驱动/CUDA、Python、PyTorch/vLLM 版本、Git SHA、模型配置、启动参数、时间和主机信息。",
    ],
    fragments: [
      "检查本组唯一变化：目标变量是否只有一个；模型、commit、精度、硬件、长度分布、采样、warm-up 和请求集是否固定。",
      "重复实验用于估计随机波动；置信区间表达均值估计的不确定性。样本太少时不要过度解读几个百分点差异。",
      "文件名建议包含日期、模型、TP、并发、输入输出长度和唯一 run id，例如 `20260715-model-tp1-c8-in512-out128-run03`。",
    ],
  },
  16: {
    deep: [
      "每个并发点使用同一请求集和长度，完成 warm-up 后重复测量。保存 TTFT、ITL、TPS、P99、错误率、队列和 GPU/KV 指标。",
      "三张图分开画：并发-TPS、并发-TTFT/P99、并发-GPU/KV。标出样本量、误差范围、模型与长度条件。",
      "拐点常表现为 GPU 利用率接近平台期、TPS 增长放缓，但队列、TTFT 和 P99 快速上升。若 GPU 利用率仍低，应检查 CPU、通信或请求供给。",
    ],
    fragments: [
      "增加并发能提高 GPU 利用率和吞吐，但超过服务能力后主要增加排队，单请求延迟和尾延迟会恶化。",
      "最佳吞吐点是 TPS 最大附近；可接受延迟点是在 P99/TTFT 满足 SLO 时的最高负载。生产通常选后者并留余量。",
      "请求到达速度超过处理速度后进入队列；TTFT 从请求发出开始计时，因此排队时间会直接叠加在首 token 前。",
    ],
  },
  17: {
    deep: [
      "固定 output 和并发，扫描 prompt 长度；重点比较 Prefill 时间、TTFT、总时延和显存，确认请求内容与 tokenizer 后长度符合设计。",
      "固定 prompt 和并发，扫描 output 长度；重点比较 Decode 轮数、ITL、总时延、请求驻留时间和 KV Cache 峰值。",
      "长输入主要增加 Prefill/TTFT；长输出主要增加 Decode 轮数、总时延和 KV 驻留。ITL 不一定随输出长度线性变化，还受调度与并发影响。",
    ],
    fragments: [
      "Prompt 越长，Prefill 需要处理的 token 越多，Attention 和线性层工作量增加，因此首 token 更晚到达。",
      "每生成一个 token 都要保留其 K/V；输出越长，请求在系统中存活越久，KV Cache 持续增长并占用并发容量。",
      "异常样本要记录请求内容/长度、时间、错误、GPU/队列状态和是否重试；先判断环境或负载是否偏离，再决定是否排除。",
    ],
  },
  18: {
    deep: [
      "三种 TP 使用同一模型、dtype、长度、并发、采样和版本。若 TP=1 无法运行，要明确它是容量限制，不能假装有单卡性能基线。",
      "参数分片通常降低单卡模型显存；性能需同时看 TTFT、TPS、P99、GPU 利用率和 NCCL 时间，不能只看总显存。",
      "非线性来源包括 AllReduce 等集合通信、同步、PCIe/NVLink 带宽、小矩阵效率和 CPU 调度。用 speedup/TP 计算扩展效率。",
    ],
    fragments: [
      "模型单卡放不下时，TP 首先解决容量；单卡放得下时，是否加速取决于计算节省能否覆盖通信和同步。",
      "每条命令记录 CUDA_VISIBLE_DEVICES、模型、dtype、`--tensor-parallel-size`、端口、缓存/长度和其它非默认参数。",
      "当 batch/矩阵太小、PCIe 较慢、通信占比高或单卡本已足够快时，增加 TP 可能让每层同步成本超过计算收益。",
    ],
  },
  19: {
    deep: [
      "请求集应包含相同 token 级 system prefix + 不同 suffix 的命中组，以及不同前缀的对照组；保存 tokenizer 后的前缀长度与哈希。",
      "开启/关闭缓存时固定其它条件，比较 TTFT、TPS、显存和命中率。收益主要来自跳过共享前缀 Prefill，随机短 Prompt 未必有收益。",
      "在已有 Decode 请求时加入长 Prompt，比较 chunked prefill 开关下的 ITL、P99 和 TTFT，观察长 Prefill 是否仍长时间阻塞 Decode。",
    ],
    fragments: [
      "Prefix Cache 让完全一致的 token 前缀复用已计算的 KV blocks；多个逻辑请求可以引用同一物理块，靠引用计数/缓存策略管理。",
      "常见不命中：文本或 token 不完全一致、chat template 不同、模型/LoRA 配置不同、缓存被淘汰、前缀太短或未启用缓存。",
      "Prefix Cache 适合共享长前缀，代价是缓存管理和显存占用；Chunked Prefill 适合长 Prompt 与 Decode 混跑，代价是更多调度和分块执行开销。",
    ],
  },
  20: {
    deep: [
      "选择同一基座模型的原精度与量化版本，固定 tokenizer、采样、长度、TP、并发和请求集，并确认 A30 对量化格式有高效 kernel 支持。",
      "记录权重/运行显存、加载时间、TTFT、ITL、TPS、P99、错误和固定 Prompt 输出。速度和质量必须一起比较。",
      "权重量化减少模型权重体积和读取带宽；KV Cache 量化减少随序列/并发增长的缓存体积。两者作用对象、kernel 和质量风险不同。",
    ],
    fragments: [
      "Weight-only quantization 只把权重降到较低 bit，激活仍保持 fp16/bf16 等较高精度，例如 W4A16。",
      "没有高效 kernel 时，需要额外反量化或使用低效算子，节省的内存带宽可能被计算/转换开销抵消，因此量化不一定更快。",
      "小规模人工输出检查无法代表完整质量；数据集、任务覆盖、随机采样和评价指标都会影响结论，应明确只验证了哪些场景。",
    ],
  },
  21: {
    deep: [
      "保留原始数据，对 warm-up、错误、重试、环境变化和缺字段样本做显式标记。无合理原因不要删除异常值。",
      "建议四图：并发-TPS/P99、Prompt 长度-TTFT、TP 扩展效率、量化性能/显存；实验条件表列模型、版本、硬件、dtype、长度和统计口径。",
      "每项结论写：适用条件、观察变化、机制解释、限制和可能反例。例如 Prefix Cache 在共享长前缀时有效，但随机短请求可能无收益。",
    ],
    fragments: [
      "口述格式：在什么条件下 → 改了什么 → 指标变化多少 → 为什么 → 哪些场景不能外推。选最有证据的三条，不追求数量。",
      "图表至少标指标名、单位、模型/硬件、输入输出长度、并发/TP、样本量和误差；不同单位不要混在一个轴上。",
      "复现清单：依赖锁、Git SHA、模型/数据、环境检查、启动命令、benchmark 配置、随机种子、原始结果和生成图表脚本。",
    ],
  },
  22: {
    deep: [
      "请求重点字段：model、messages/prompt、temperature、top_p、max_tokens、stream、stop；响应包含 id/model/choices、delta 或 message、finish_reason 和 usage。",
      "SSE 客户端要按事件边界解析 `data:`，记录请求、首 token、后续 token 和结束时间；支持连接/首 token/间隔/总超时，并在指定 token 后主动关闭。",
      "断连要传播取消；超时按连接、排队、首 token、token 间隔和总请求分类；服务端错误区分 4xx 参数/容量与 5xx 内部/下游故障。",
    ],
    fragments: [
      "SSE 事件通常以 `data: ...` 表示载荷，以空行分隔事件；流结束会出现协议约定的结束标记。网络读取边界不保证等于事件边界。",
      "客户端已不再消费结果时，继续推理只会浪费 GPU、KV Cache 和队列容量，并拖慢其他请求，所以要及时取消。",
      "可分为：参数/鉴权 4xx、限流/过载 429、服务不可用 503、内部错误 500、超时 504，以及客户端主动取消。",
    ],
  },
  23: {
    deep: [
      "并发限制控制同时活跃请求；速率限制控制单位时间进入量；队列长度限制控制可等待请求。三者分别保护驻留资源、突发流量和等待上界。",
      "Controller 根据 prompt_tokens + max_output_tokens 或更细成本估算，在总 token/KV 预算与并发上限内 accept，否则 queue 或 reject，并在完成时归还预算。",
      "过载响应应明确原因和 retry-after；可降级最大输出长度、路由小模型或降低优先级；重试必须有退避、抖动和次数上限。",
    ],
    fragments: [
      "令牌桶限制平均速率并允许一定突发；信号量限制同时进入临界资源的并发数。前者管速率，后者管在途数量。",
      "请求成本差异巨大：一个超长 Prompt/输出可能比几十个短请求更占 Prefill、Decode 和 KV Cache，只按请求数会严重低估负载。",
      "优先短请求提高完成数但长请求可能饥饿；严格 FIFO 更公平但可能 HOL blocking。可用 aging、分级队列或 token 配额折中。",
    ],
  },
  24: {
    deep: [
      "请求层：QPS、错误、TTFT、ITL、P99、长度；Scheduler 层：waiting/running、batch tokens、抢占、KV 使用率；GPU 层：利用率、显存、带宽、kernel/NCCL 时间。",
      "面板至少同时展示 TTFT/P99、队列长度和 KV 使用率，并按 model/instance/TP 分组。用同一时间轴判断是排队、缓存压力还是执行变慢。",
      "三条路径示例：TTFT 高→拆排队/Prefill；GPU 利用率低→查请求供给/CPU/通信/kernel；OOM→查模型、KV、长度、并发和泄漏。",
    ],
    fragments: [
      "RED：Rate、Errors、Duration，面向服务请求；USE：Utilization、Saturation、Errors，面向 CPU/GPU/内存/网络等资源。",
      "平均和 P50 正常但 P99 高，可能来自少量超长请求、队列抖动、抢占、缓存分配、通信尖峰、重试或设备/CPU 暂停。",
      "所有层都带 request id：入口生成 → Engine/Scheduler 继承 → Worker 日志关联 → SSE/错误返回。这样才能还原单请求跨层时间线。",
    ],
  },
  25: {
    deep: [
      "OOM 分支检查模型/激活/KV/碎片与请求长度；NCCL 分支检查 rank、拓扑、超时和进程失败；加载失败检查权重、格式、权限、磁盘和依赖。",
      "状态机可为 starting→warming→ready→draining→stopped，异常进入 degraded/failed。Readiness 控制接流量，Liveness 决定是否重启，退出先停止新请求。",
      "故障注入记录要包含注入方式、时间、指标/日志、检测时间、止损动作、恢复时间、遗留资源和改进项。",
    ],
    fragments: [
      "Readiness：实例当前能否接流量；Liveness：进程是否仍健康、是否需要重启。未加载完成可以 alive 但 not ready。",
      "故障期间立即重试会增加流量和资源竞争，多个客户端同步重试还会形成重试风暴。应指数退避、抖动、限次和熔断。",
      "应持久化配置、实验结果、审计/关键日志；请求队列、KV Cache、CUDA context 等运行时状态通常无需跨重启持久化。",
    ],
  },
  26: {
    deep: [
      "Deployment 管 Pod 副本与更新；Pod 申请 GPU 并运行 Ray/vLLM 容器；Service 提供稳定访问与负载入口；设备插件把节点 GPU 暴露为可调度资源。",
      "K8s 管容器、节点、GPU 资源和生命周期；Ray Serve 管应用部署、模型副本、路由和扩缩容；vLLM 在副本内管模型执行、调度和 KV Cache。",
      "草图至少包含 Gateway、两个模型 deployment、不同 GPU/TP 配置、多副本路由、健康检查、指标和失败转移，并写出 QPS/SLO 假设。",
    ],
    fragments: [
      "CPU/内存可设置 requests 与 limits；GPU 通常作为扩展资源在 limits 中申请，由设备插件分配，不能像 CPU 那样任意小数超卖。",
      "模型冷启动包括 Pod 调度、镜像/权重下载、模型加载到 GPU、通信初始化、kernel/图准备和 warm-up，可能远慢于普通服务。",
      "扩缩容信号至少看：请求队列/等待、P99/TTFT、GPU 或 KV 饱和度。只看 CPU 可能在 GPU 已满时仍误判为空闲。",
    ],
  },
  27: {
    deep: [
      "最小服务验收：固定 SGLang commit，启动同一模型，使用同一 OpenAI 客户端完成非流式/流式请求，并记录启动命令和环境。",
      "RadixAttention 用 Radix Tree 管共享前缀；对比时关注缓存索引、命中与淘汰、Scheduler 的 Prefill/Decode 选择，以及对应源码入口。",
      "A/B 固定模型、dtype、硬件、TP、长度分布、并发、采样和 warm-up；共享前缀组比较 TTFT/TPS/P99/显存，并保存原始输出。",
    ],
    fragments: [
      "Radix Tree 按 token 前缀组织节点，共享前缀的请求走相同路径并复用 KV；分叉发生在第一个不同 token。",
      "两边都要找到 API/server、Scheduler、cache/KV manager、Worker/model runner 的入口，并记录 commit，避免只比较命令行。",
      "不同默认缓存比例、batch token、dtype 或请求分布会让结果失真。只有控制条件一致，差异才可能归因到框架设计。",
    ],
  },
  28: {
    deep: [
      "推荐目录：configs、scripts、src、results/raw、results/figures、docs、tests；锁定 Python/框架版本，并把模型路径等环境差异放入配置而非写死。",
      "README 顺序：项目目标/结论边界 → 环境检查 → 最小运行 → 完整实验 → 结果目录 → 图表生成 → 常见故障 → 架构与原理。",
      "干净环境验证要从 clone、依赖安装、环境检查、dry-run、最小实验到报告生成完整执行，记录任何依赖作者机器或口头说明的步骤。",
    ],
    fragments: [
      "检查绝对路径、未导出的环境变量、默认当前目录、私有模型名、固定端口和本机 GPU 编号。命令应可通过参数或配置覆盖。",
      "错误记录格式：症状、日志关键行、原因、修复命令、如何预防。优先覆盖 CUDA/vLLM 版本、OOM、端口、模型路径和 NCCL。",
      "无法说明条件、采样量、原始数据或机制的数字不要写进结论和简历；宁可写定性观察，也不要保留无法守住的提升百分比。",
    ],
  },
  29: {
    deep: [
      "1 分钟：背景/我的工作/结果；3 分钟：加入设计、关键机制、实验和失败；10 分钟：加入源码链路、容量、数据、取舍和限制。三个版本主线与数字必须一致。",
      "回答顺序：先一句结论，再给机制，再连接自己的实验，最后说边界。高频范围覆盖 Prefill/Decode、KV、Batching、PagedAttention、TP、指标和过载。",
      "白板题先澄清模型、流量、长度、SLO、GPU 和成本；再做容量估算、画请求路径，最后讲接入控制、缓存、扩容、监控和故障。",
    ],
    fragments: [
      "快速检查：TTFT/ITL/TPS/P99 的口径；模型、硬件、dtype、TP、输入输出长度、并发、warm-up 和重复次数。",
      "失败实验讲法：目标与假设 → 实际异常 → 如何定位 → 根因或当前推断 → 修正与结果 → 以后如何避免。失败本身不是扣分点。",
      "可问：团队当前最关键的推理瓶颈是什么？实习生三个月可独立负责什么？性能结论如何评审和上线验证？",
    ],
  },
  30: {
    deep: [
      "完整 Demo：环境检查 → 启动服务 → 健康检查 → 流式请求 → benchmark → 保存原始结果 → 生成图表 → 解释一个现象与限制。任何一步失败都应有日志。",
      "5 分钟讲解要准确区分事实与推断：项目目标、请求主链路、两个核心机制、一张实验图、一次失败、结论边界和下一步。",
      "若最常卡在请求状态与框架实现，选源码/调度；若卡在多机部署与稳定性，选平台；若卡在算子、带宽和 kernel 时间线，选 CUDA/kernel。",
    ],
    fragments: [
      "回看 Day 1：API → Scheduler → Prefill/KV → Decode → Sampler → Stream。现在应能为每个节点补上源码模块、指标和实验。",
      "五条主链可选：长度→Prefill/TTFT；输出/并发→KV；Continuous batching→利用率/排队；PagedAttention→碎片/并发；TP→显存/通信/扩展效率。",
      "简历只写能展示代码和数据的内容；明确硬件、任务和贡献，不写无法复现的提升，不把框架功能包装成自己的创新。",
    ],
  },
};

export function answerForTask(day, bucket, index) {
  const key = bucket === "fragment" ? "fragments" : bucket;
  return taskAnswers[day]?.[key]?.[index] || "完成后用一句结论、一个因果和一个验证方法总结这项任务。";
}
