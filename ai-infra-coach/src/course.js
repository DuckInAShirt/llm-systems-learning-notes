const point = (title, body) => ({ title, body });

const lab = (
  title,
  goal,
  environment,
  steps,
  acceptance,
  deliverable,
  code = "",
) => ({
  title,
  goal,
  environment,
  steps,
  acceptance,
  deliverable,
  code,
});

export const course = {
  1: {
    module: "推理基础",
    lessonTitle: "先把一次请求讲完整",
    lesson:
      "今天不背 vLLM 术语。你要先建立一条因果链：请求进入服务后，系统什么时候处理输入，什么时候逐 token 生成，什么时候把结果推给客户端。后面所有优化，本质上都是在这条链路上减少等待、提高并行或节省显存。",
    keyPoints: [
      point("Prefill", "一次并行处理 prompt 的全部 token，主要决定首 token 前的计算时间。"),
      point("Decode", "每一轮根据已有上下文生成一个新 token，必须自回归进行，通常持续读取权重和 KV Cache。"),
      point("指标", "TTFT 看首 token，ITL 看后续 token 间隔，TPS 看单位时间生成量；它们回答的是不同问题。"),
    ],
    lab: lab(
      "Lab 01 · 请求生命周期模拟器",
      "不用 GPU，先用时间线把排队、prefill、decode 和流式返回模拟出来。",
      "Python 3.10+，只使用标准库。",
      [
        { title: "建立请求对象", detail: "为每个请求记录 id、prompt_tokens、output_tokens、arrival_time 和状态。先用 3 个长度明显不同的请求。", code: "requests = [\n    {\"id\": \"A\", \"prompt\": 128, \"output\": 8, \"arrival\": 0},\n    {\"id\": \"B\", \"prompt\": 16, \"output\": 32, \"arrival\": 1},\n    {\"id\": \"C\", \"prompt\": 64, \"output\": 12, \"arrival\": 2},\n]" },
        { title: "写出两阶段耗时", detail: "先定义一个极简模型：prefill_ms = prompt_tokens * 0.4，decode_ms = output_tokens * 1.2。不要追求真实，先让变量关系可见。", code: "prefill_ms = request[\"prompt\"] * 0.4\ndecode_ms = request[\"output\"] * 1.2\n" },
        { title: "打印事件时间线", detail: "打印 arrival、prefill_start、first_token、每个 decode token 和 finished。观察短请求是否会被前面的长请求影响。", code: "print(f\"{request['id']} first_token={first_token_ms:.1f}ms\")\nprint(f\"{request['id']} finished={finish_ms:.1f}ms\")" },
        { title: "改变一个变量", detail: "分别把 prompt 长度和 output 长度翻倍，记录 TTFT、总延迟和 token 间隔的变化。", code: "" },
      ],
      [
        "能画出 3 个请求的事件时间线。",
        "能解释 prompt 变长主要影响 TTFT，output 变长主要影响总延迟。",
        "输出一张结果表，而不是只在终端看数字。",
      ],
      "一份 `lab01_results.json` + 一张请求生命周期图",
      "mkdir -p labs/day-01 && python labs/day-01/request_lifecycle.py",
    ),
    resources: ["inferenceVideo", "vllmDocs"],
  },
  2: {
    module: "推理基础",
    lessonTitle: "KV Cache：把已经算过的历史保存下来",
    lesson:
      "Decode 时，新 token 只需要和历史 token 做 Attention，不需要每一轮重新计算历史 token 的 Key 和 Value。KV Cache 就是把这些中间结果保存下来。它换来的计算减少，会转化成显存占用；因此推理系统的并发能力经常先被 KV Cache 卡住。",
    keyPoints: [
      point("缓存什么", "每层的 K 和 V，不缓存 logits，也不是把整段文本直接存起来。"),
      point("大小从哪来", "层数 × KV head 数 × head_dim × 序列长度 × batch × 两份 K/V × dtype 字节数。"),
      point("GQA/MQA", "减少 KV head 数，仍然保留较多 Query head，因此可以降低缓存大小和读取压力。"),
    ],
    lab: lab(
      "Lab 02 · KV Cache 显存计算器",
      "写一个输入模型配置就能估算 KV Cache 大小的脚本，并验证 batch/长度翻倍的影响。",
      "Python 3.10+，不需要 GPU。",
      [
        { title: "写计算公式", detail: "把公式拆成 token 数、单 token 单层大小和总层数三部分，避免把所有数字塞在一行。", code: "bytes_per_token = 2 * num_kv_heads * head_dim * bytes_per_element\ncache_bytes = layers * batch * seq_len * bytes_per_token" },
        { title: "支持常见 dtype", detail: "至少支持 fp32、fp16/bf16 和 int8。注意 dtype 的字节数，不要把 bit 数直接当 byte 数。", code: "BYTES = {\"fp32\": 4, \"fp16\": 2, \"bf16\": 2, \"int8\": 1}" },
        { title: "做敏感性实验", detail: "固定其它参数，分别把 batch、seq_len、num_kv_heads 翻倍，输出占用变化倍数。", code: "" },
        { title: "解释结果", detail: "补一段文字说明：为什么长输出会让活跃请求长期占用更多 KV Cache。", code: "" },
      ],
      [
        "公式在 batch=1、seq_len=1 时能给出单 token 大小。",
        "batch 或 seq_len 翻倍时，结果也翻倍。",
        "能用自己的话解释 MHA、GQA、MQA 的差异。",
      ],
      "一个可复用的 `kv_cache_size.py` 和 3 组敏感性结果",
      "python labs/day-02/kv_cache_size.py --layers 32 --kv-heads 8 --head-dim 128 --seq-len 4096 --dtype fp16",
    ),
    resources: ["pagedPaper", "kvQuantization"],
  },
  3: {
    module: "推理基础",
    lessonTitle: "Batching 不是把请求简单堆在一起",
    lesson:
      "静态 batch 往往要等最长请求结束，短请求结束后留下空位。Continuous batching 的关键是把调度粒度从“整个请求”缩小到“每轮迭代”：完成的请求退出，新请求可以补入。这样做提高了 GPU 利用率，但调度器必须同时管理请求状态、token 预算和 KV Cache。",
    keyPoints: [
      point("静态 batching", "请求一起开始、一起等待，简单但容易被长请求拖住。"),
      point("迭代级调度", "每轮 decode 重新选择 active requests，允许请求动态加入和退出。"),
      point("取舍", "更高吞吐通常伴随排队和尾延迟压力，不能只看一个 TPS 数字。"),
    ],
    lab: lab(
      "Lab 03 · Continuous Batching 调度模拟器",
      "用 CPU 模拟每轮最多处理 N 个 token 的调度器，观察静态 batch 和迭代级调度的差异。",
      "Python 3.10+，不需要 GPU。",
      [
        { title: "定义调度约束", detail: "设置 max_running_requests 和 max_tokens_per_iteration，队列中的请求有 waiting、running、finished 三种状态。", code: "MAX_REQUESTS = 2\nMAX_TOKENS_PER_ITER = 32" },
        { title: "先实现静态 batch", detail: "让一批请求同时开始，并等待其中最长的请求结束，记录每个请求的完成时间。", code: "" },
        { title: "再实现迭代级调度", detail: "每轮给 running 请求生成一个 token；完成后释放位置，再从 waiting 队列补入请求。", code: "while waiting or running:\n    admit_new_requests()\n    decode_one_iteration()\n    release_finished_requests()" },
        { title: "比较结果", detail: "固定请求集合，比较平均完成时间、最后完成时间和总 token 吞吐。", code: "" },
      ],
      [
        "同一批请求能输出两种调度策略的结果。",
        "能指出哪个请求受 head-of-line blocking 影响。",
        "能解释为什么 continuous batching 不是无限提高吞吐。",
      ],
      "调度时间线 + 静态 batch/迭代调度对比表",
      "python labs/day-03/scheduler_sim.py --max-requests 2 --max-tokens 32",
    ),
    resources: ["inferenceVideo", "vllmArchitecture"],
  },
  4: {
    module: "推理基础",
    lessonTitle: "PagedAttention 解决的是显存管理问题",
    lesson:
      "把 KV Cache 按请求申请一整段连续显存，会产生碎片和预留浪费。PagedAttention 借鉴虚拟内存，把逻辑上的连续 token 切成固定大小的 block，再映射到任意空闲物理 block。它改变的是 KV Cache 的组织和访问方式，不是 Attention 的数学定义。",
    keyPoints: [
      point("逻辑块/物理块", "序列看到的是逻辑块，GPU 实际分配的是物理块，中间靠 block table 映射。"),
      point("内部碎片", "最后一个 block 可能没有填满；block 越小浪费越少，但管理开销越大。"),
      point("前缀共享", "多个请求可以指向同一组只读物理块，引用计数归零后才释放。"),
    ],
    lab: lab(
      "Lab 04 · KV Block Allocator",
      "实现一个最小 block allocator，亲眼看到连续分配和分页分配的差别。",
      "Python 3.10+，不需要 GPU。",
      [
        { title: "实现空闲块池", detail: "用列表或集合表示物理块，提供 allocate、append、free 三个操作。", code: "free_blocks = list(range(8))\nblock_table = {}" },
        { title: "模拟两个请求", detail: "给请求 A 分配 5 个 token，给请求 B 分配 3 个 token，再让 A 追加 token。每次打印 block table。", code: "block_table[\"A\"] = allocate(num_tokens=5, block_size=2)" },
        { title: "模拟共享前缀", detail: "让请求 C 复用 A 的前两个物理块，增加 ref_count；释放 A 后确认 C 仍然可用。", code: "" },
        { title: "改变 block size", detail: "分别测试 block size=1、2、4，记录内部浪费块数和元数据数量。", code: "" },
      ],
      [
        "释放请求后物理块能回到空闲池。",
        "共享 block 的引用计数正确，不能过早回收。",
        "能解释 block size 太大或太小的代价。",
      ],
      "block table 打印结果 + allocator 单元测试",
      "python labs/day-04/block_allocator.py --blocks 128 --block-size 16",
    ),
    resources: ["pagedPaper", "vllmArchitecture"],
  },
  5: {
    module: "推理基础",
    lessonTitle: "Benchmark 是实验设计，不是跑一条命令",
    lesson:
      "一个 TPS 数字离开实验条件几乎没有意义。模型、精度、GPU、输入输出长度、并发、warm-up、统计口径都可能改变结果。今天要建立一个最小实验协议，让别人能看懂你测了什么，也让未来的你能复现。",
    keyPoints: [
      point("控制变量", "一次只改变一个目标变量，其余条件固定。"),
      point("暖机和重复", "首次运行可能包含加载、缓存和编译开销；稳定结果需要 warm-up 和多次采样。"),
      point("尾延迟", "P50 是典型体验，P99 是系统最慢的一小部分，线上通常不能只看平均值。"),
    ],
    lab: lab(
      "Lab 05 · Benchmark 配置与结果 Schema",
      "建立一份机器可读的实验配置和结果格式，为后面的 A30 实验打底。",
      "Python 3.10+，不需要 GPU。",
      [
        { title: "定义配置文件", detail: "把模型、dtype、TP、并发、输入输出长度、warmup、重复次数和版本写入 JSON。", code: "{\n  \"model\": \"your-model\",\n  \"dtype\": \"float16\",\n  \"tp\": 1,\n  \"concurrency\": 4,\n  \"prompt_tokens\": 512,\n  \"output_tokens\": 128,\n  \"warmup\": 2,\n  \"repeats\": 5\n}" },
        { title: "定义结果 Schema", detail: "至少保存 started_at、config、ttft_ms、itl_ms、throughput_tps、p50_ms、p99_ms、error_count。", code: "" },
        { title: "做字段校验", detail: "配置缺字段时直接报错，不要让实验跑完才发现数据无法比较。", code: "required = [\"model\", \"dtype\", \"tp\", \"concurrency\"]\nmissing = [key for key in required if key not in config]" },
        { title: "生成实验清单", detail: "打印一条未来可以直接执行的命令和结果保存路径。", code: "" },
      ],
      [
        "同一份配置能生成稳定的结果文件名。",
        "缺失关键字段时程序会失败并指出字段名。",
        "结果 JSON 同时包含条件和指标。",
      ],
      "benchmark-config.json + result-schema.json + 一份示例结果",
      "python labs/day-05/validate_config.py labs/day-05/benchmark-config.json",
    ),
    resources: ["servingBenchmark", "vllmDocs"],
  },
  6: {
    module: "推理基础",
    lessonTitle: "先跑出你的第一份 Baseline",
    lesson:
      "Baseline 不是为了证明系统很快，而是建立后续优化的参照点。你要记录完整环境，确认模型能稳定服务，再测低并发和高并发。以后看到一个数字变好时，第一问应该是：和哪一个条件下的 baseline 比？",
    keyPoints: [
      point("环境记录", "GPU、驱动、CUDA、框架版本、模型 commit、精度、TP 和启动参数必须一起保存。"),
      point("低/高并发", "低并发更接近单请求延迟，高并发更容易暴露排队、KV Cache 和调度瓶颈。"),
      point("异常检查", "错误、重试、OOM 或后台任务会让结果失去解释力，不能只看最终平均值。"),
    ],
    lab: lab(
      "Lab 06 · vLLM 最小 Baseline",
      "在你的 GPU 环境跑通一个模型服务，并把启动信息、请求负载和指标落盘。",
      "有 vLLM 和可用 GPU；模型路径用你实际能访问的模型替换。",
      [
        { title: "先做环境检查", detail: "记录 GPU、驱动、CUDA、Python、PyTorch 和 vLLM 版本。确认四张 A30 是否都能被看到。", code: "nvidia-smi\npython - <<'PY'\nimport torch, vllm\nprint(torch.cuda.device_count())\nprint(vllm.__version__)\nPY" },
        { title: "启动单卡服务", detail: "先不要上 TP=4，确保单卡 baseline 能稳定完成请求。", code: "MODEL=/path/to/model\npython -m vllm.entrypoints.openai.api_server \\\n  --model \"$MODEL\" \\\n  --tensor-parallel-size 1 \\\n  --port 8000" },
        { title: "固定请求负载", detail: "准备固定的 prompt、输入长度、输出长度和并发，至少 warm-up 两次，再重复测量。", code: "python -m vllm.entrypoints.openai.api_server --help" },
        { title: "保存原始证据", detail: "把命令、日志、nvidia-smi 快照和 benchmark JSON 放进同一个带时间戳的目录。", code: "" },
      ],
      [
        "服务能被客户端访问，并完成至少 5 次成功请求。",
        "结果目录包含环境信息、启动命令和原始指标。",
        "能解释一次失败请求，而不是只保留成功数字。",
      ],
      "baseline/ 目录 + 一条可复现启动命令 + 第一张结果表",
      "nvidia-smi && python -m vllm.entrypoints.openai.api_server --model \"$MODEL\" --tensor-parallel-size 1",
    ),
    resources: ["vllmQuickstart", "servingBenchmark", "nsightSystems"],
  },
  7: {
    module: "第一周复盘",
    lessonTitle: "把术语串成因果链",
    lesson:
      "今天不引入新名词。你要从一张空白纸开始，讲清请求如何经过排队、prefill、decode、KV Cache、采样和流式返回，再把每个环节对应到可观察指标。能讲出因果链，比记住更多定义更重要。",
    keyPoints: [
      point("系统图", "模块框和箭头要标出数据、状态和资源，不要只写组件名。"),
      point("指标归因", "TTFT 高不一定是模型慢，也可能是排队长；必须拆阶段看。"),
      point("复盘方式", "先闭卷画图，再对照资料修正，最后用 5 分钟口述录音。"),
    ],
    lab: lab(
      "Lab 07 · 推理系统知识地图",
      "把前六天的代码、公式和实验结果整理成一张可面试讲解的知识地图。",
      "纸笔或 Mermaid，已有 Day 1-6 产物。",
      [
        { title: "闭卷画主链路", detail: "至少包含 Client、API、Scheduler、KV Cache、Worker、Model Forward、Sampler 和 Stream Output。", code: "Client -> API -> Scheduler -> Worker -> Model Forward -> Sampler -> Stream Output" },
        { title: "为每条边标注数据", detail: "例如 request、token ids、KV block table、logits、generated token。", code: "" },
        { title: "为每个环节标注指标", detail: "把 TTFT、ITL、TPS、P99、KV 使用率放到最可能解释它们的位置。", code: "" },
        { title: "录制口述", detail: "用 5 分钟讲完，并记下卡住的三个点；这三个点就是下周源码阅读入口。", code: "" },
      ],
      [
        "不看资料能画出一条完整主链路。",
        "每个核心指标都能说出定义和归属阶段。",
        "能指出自己的两个薄弱点并写出验证方法。",
      ],
      "一张知识地图 + 5 分钟讲解稿 + 薄弱点清单",
      "",
    ),
    resources: ["vllmDocs", "pagedPaper"],
  },
  8: {
    module: "vLLM 源码",
    lessonTitle: "先建立源码导航，不要从第一行读",
    lesson:
      "阅读大型推理框架源码时，最重要的是先找到入口、核心对象和主循环。今天只做地图：固定版本，从一个可运行的请求出发，定位 API Server、Engine Core、Scheduler、KV Cache 和 Worker 的位置。",
    keyPoints: [
      point("固定版本", "记录 vLLM commit SHA，避免上游变化让笔记和行号失效。"),
      point("入口优先", "从命令入口、HTTP 路由或日志栈向下追，而不是随机打开文件。"),
      point("数据结构优先", "先弄清 request、sequence、block table 等状态对象，再看函数细节。"),
    ],
    lab: lab(
      "Lab 08 · vLLM 源码索引",
      "用搜索和 Git 建立一份属于自己的源码导航图。",
      "vLLM 源码、rg、Git；固定一个 commit。",
      [
        { title: "记录版本", detail: "把仓库 commit、Python、PyTorch、CUDA 和 GPU 写到 README 顶部。", code: "git rev-parse HEAD\nrg \"class.*Engine|def.*generate\" -n vllm" },
        { title: "找到四个入口", detail: "定位 API Server、Engine、Scheduler、Worker 的文件和类名，每个只写一句职责。", code: "" },
        { title: "画调用关系", detail: "从请求进入到 token 返回画 8-12 个节点，不追求覆盖所有异常路径。", code: "" },
        { title: "验证一个入口", detail: "用日志或断点确认你的主链路确实会经过这些模块。", code: "" },
      ],
      [
        "每个模块都有文件路径、类名和一句职责。",
        "源码图能和一次真实请求对应起来。",
        "所有笔记都记录 commit SHA。",
      ],
      "源码导航 README + 调用关系图",
      "git rev-parse HEAD && rg \"class|def\" -n vllm | head -80",
    ),
    resources: ["vllmArchitecture", "vllmRepo"],
  },
  9: {
    module: "vLLM 源码",
    lessonTitle: "HTTP 请求如何进入推理引擎",
    lesson:
      "API 层不是模型计算层。它负责协议、参数校验、tokenizer、流式输出和取消请求；Engine 负责把请求放入调度系统。理解这条边界后，才能判断一个问题应该在 API、调度还是 GPU 执行侧解决。",
    keyPoints: [
      point("请求转换", "外部 chat/completions 字段要变成内部 request、sampling params 和 token 序列。"),
      point("流式返回", "服务端把生成结果转换成 SSE 事件，客户端按事件消费，而不是等待完整字符串。"),
      point("取消传播", "客户端断开后，取消信号应该一路传到 Engine，及时释放 KV Cache。"),
    ],
    lab: lab(
      "Lab 09 · 从 API 到 Engine 的调用链",
      "追踪一次请求，写出外部字段如何变成内部对象，再如何流回客户端。",
      "vLLM 源码；可用 `rg`、编辑器调用层次或调试日志。",
      [
        { title: "选择一个路由", detail: "从 completions 或 chat/completions 开始，只选一个，不要同时读所有协议适配。", code: "rg \"chat/completions|completions\" -n vllm/entrypoints" },
        { title: "跟踪内部对象", detail: "记录 request id、prompt token、sampling params 和 stream generator 在哪里产生。", code: "" },
        { title: "定位输出转换", detail: "找到一个 token 从 Engine 结果变成 SSE data 的位置。", code: "" },
        { title: "写取消路径", detail: "画出客户端断开后至少经过的两个函数，并说明资源在哪里释放。", code: "" },
      ],
      [
        "能画出 HTTP -> 内部 request -> Engine -> SSE 的链路。",
        "能指出 API 层没有执行模型 forward。",
        "能说明取消请求为什么影响资源回收。",
      ],
      "一页 API/Engine 边界笔记 + 一条取消路径",
      "rg \"request_id|abort|stream\" -n vllm/entrypoints vllm/engine",
    ),
    resources: ["vllmArchitecture", "vllmQuickstart"],
  },
  10: {
    module: "vLLM 源码",
    lessonTitle: "Scheduler：每一轮到底跑谁",
    lesson:
      "Scheduler 是推理系统的交通指挥员。它每轮决定哪些请求参与执行、每个请求处理多少 token、是否需要分配 KV block，并在 prefill 和 decode 之间做取舍。读它时要抓住状态变化，而不是背函数名。",
    keyPoints: [
      point("状态", "waiting、running、finished 只是表面，关键是请求何时移动以及移动时消耗什么资源。"),
      point("约束", "可用 KV blocks、batch token 预算、最大并发和优先级共同限制调度。"),
      point("公平与吞吐", "优先短请求可以提高周转，但可能让长请求等待；所有策略都有代价。"),
    ],
    lab: lab(
      "Lab 10 · 把 Scheduler 改写成伪代码",
      "读真实源码后，用 30 行左右的伪代码重写它的主循环。",
      "vLLM 源码；已有 Day 3 调度模拟器。",
      [
        { title: "找主函数", detail: "定位 schedule 或同等职责的方法，记录输入、输出和修改的状态。", code: "rg \"def schedule|schedule\\(\" -n vllm | head -40" },
        { title: "只画主分支", detail: "先保留 waiting、running、KV 资源不足、finished 四类分支，忽略兼容细节。", code: "" },
        { title: "和模拟器对照", detail: "指出真实源码多出的三个约束，例如 token budget、抢占或 chunked prefill。", code: "" },
        { title: "用一个请求验证", detail: "跟踪一个新请求从 waiting 到 running 再到 finished 的状态变化。", code: "" },
      ],
      [
        "伪代码能解释每轮调度输入和输出。",
        "能指出一个真实实现与自己模拟器的差异。",
        "能讲清资源不足时请求会发生什么。",
      ],
      "Scheduler 主循环伪代码 + 一个请求状态图",
      "rg \"def schedule|waiting|running|finished\" -n vllm",
    ),
    resources: ["vllmArchitecture", "vllmRepo"],
  },
  11: {
    module: "vLLM 源码",
    lessonTitle: "把 block allocator 映射到真实 KV Cache",
    lesson:
      "Day 4 的 allocator 只是玩具，今天要找到真实系统如何管理物理块、block table、引用计数和释放。阅读时始终问四个问题：谁申请、谁使用、谁共享、谁释放。",
    keyPoints: [
      point("分配", "Scheduler 需要知道新 token 是否有足够物理块，KV Manager 负责把资源状态变成可执行映射。"),
      point("映射", "模型执行需要 attention metadata 和 slot mapping，不能只看一个 block table 名字。"),
      point("释放", "请求结束、取消、抢占和缓存淘汰都必须释放或转移引用。"),
    ],
    lab: lab(
      "Lab 11 · KV Cache 状态追踪",
      "从源码和日志中追踪一个请求的 block 数量变化，画出生命周期。",
      "vLLM 源码；如果无法直接打开 GPU 代码，先用源码静态追踪。",
      [
        { title: "定位管理类", detail: "搜索 block manager、free block、allocate、ref_count 等关键词，确认实际版本中的命名。", code: "rg \"block.*manager|free.*block|ref_count|allocate\" -n vllm" },
        { title: "列出状态字段", detail: "做一个表：字段名、写入位置、读取位置、它代表的资源。", code: "" },
        { title: "追踪三个时刻", detail: "分别记录请求进入、追加 token、请求结束时 block table 和 free pool 的变化。", code: "" },
        { title: "对照 Day 4", detail: "把真实实现比玩具多出来的机制写出来，例如 prefix cache、抢占或 hash。", code: "" },
      ],
      [
        "能回答谁申请、谁使用、谁释放。",
        "能画出至少一个请求的 block 生命周期。",
        "能说出静态阅读无法确认的地方，以及如何用日志验证。",
      ],
      "KV Cache Manager 数据结构图 + 源码定位表",
      "rg \"block|cache|slot\" -n vllm | head -120",
    ),
    resources: ["vllmRepo", "vllmArchitecture"],
  },
  12: {
    module: "vLLM 源码",
    lessonTitle: "Worker 如何把调度结果变成 forward",
    lesson:
      "Scheduler 输出的不是一句“运行这个请求”，而是一组 token、位置、KV slot、attention metadata 和采样信息。Worker/Model Runner 把这些内容整理成 GPU 张量，执行 forward，再将 logits 交给采样器。",
    keyPoints: [
      point("输入准备", "token ids、position ids 和 attention metadata 决定模型这一次到底计算什么。"),
      point("模型边界", "forward 产生 logits；temperature、top-k、top-p 等策略通常在后续采样模块完成。"),
      point("CPU/GPU 边界", "CPU 负责组织请求和元数据，GPU 负责高密度张量计算；频繁同步会拖慢系统。"),
    ],
    lab: lab(
      "Lab 12 · 追踪一次模型 forward",
      "把 Scheduler 输出、Model Runner 输入和最终 token 输出连起来。",
      "vLLM 源码；可选用 PyTorch hook 或日志。",
      [
        { title: "找到执行入口", detail: "搜索 execute_model、model_runner、forward 等关键词，确认当前版本的真实调用路径。", code: "rg \"execute_model|model_runner|def forward\" -n vllm | head -100" },
        { title: "记录输入 shape", detail: "写下 token、positions、slot mapping、batch 相关张量的 shape 和 dtype。", code: "" },
        { title: "标出采样位置", detail: "确认 logits 从哪里产生、在哪里选出下一个 token，以及结果如何回到 Engine。", code: "" },
        { title: "画一条数据流", detail: "不要画类继承关系，只画一次 forward 中真正流动的数据。", code: "" },
      ],
      [
        "能说清 forward 前最重要的三类元数据。",
        "能区分 logits 和 sampled token。",
        "能指出一次 CPU/GPU 同步或数据拷贝的位置。",
      ],
      "forward 数据流图 + 一份张量 shape 记录",
      "rg \"execute_model|sample|logits\" -n vllm",
    ),
    resources: ["vllmRepo", "vllmArchitecture"],
  },
  13: {
    module: "vLLM 源码",
    lessonTitle: "Tensor Parallel：模型为什么要跨卡通信",
    lesson:
      "Tensor Parallel 不是把模型文件复制四份，而是把层里的矩阵切分到不同 GPU。列并行先在不同卡算不同输出分片，行并行再通过集合通信合并。模型能装下不代表 TP 一定更快，通信成本必须纳入分析。",
    keyPoints: [
      point("列并行", "把权重按输出维切分，每张卡计算一部分输出列。"),
      point("行并行", "每张卡得到部分结果，通常需要 AllReduce 或相关集合操作合并。"),
      point("扩展效率", "实际加速比除以 GPU 数量；PCIe 带宽、batch 和矩阵大小都会影响它。"),
    ],
    lab: lab(
      "Lab 13 · 两卡矩阵切分模拟器",
      "不用真实 GPU，先用 NumPy 验证列并行、行并行和 AllReduce 的数学结果。",
      "Python 3.10+、NumPy。",
      [
        { title: "实现单卡 Linear", detail: "先验证 y = xW 的 shape 和结果。", code: "y = x @ W" },
        { title: "实现列切分", detail: "把 W 按输出维切成 W0、W1，两张“卡”分别计算 y0、y1，再 concatenate。", code: "W0, W1 = np.split(W, 2, axis=1)\ny = np.concatenate([x @ W0, x @ W1], axis=1)" },
        { title: "实现行切分", detail: "把输入和权重按中间维切分，分别计算部分结果，再相加模拟 AllReduce。", code: "y = x0 @ W0 + x1 @ W1" },
        { title: "比较通信", detail: "打印每种方式需要 gather 或 reduce 的数据量，说明为什么小 batch 可能不划算。", code: "" },
      ],
      [
        "切分后的结果和单卡结果一致。",
        "能画出列并行与行并行的通信位置。",
        "能解释 TP=2/4 为什么不一定线性加速。",
      ],
      "TP 数学验证脚本 + 通信量估算表",
      "python labs/day-13/tp_linear.py",
    ),
    resources: ["ncclOverview", "ncclCollectives"],
  },
  14: {
    module: "第二周复盘",
    lessonTitle: "从入口讲到 GPU，再回到指标",
    lesson:
      "第二周的目标不是记住 vLLM 的所有类，而是形成一条可验证的源码主链路：API 接收请求，Engine 管理状态，Scheduler 做决定，KV Manager 提供资源，Worker 执行模型，结果再流回客户端。今天用实验现象反查源码。",
    keyPoints: [
      point("模块职责", "每个模块都要能用一句话说清，不要用“负责处理”这种空话。"),
      point("状态变化", "把 request 和 KV block 的状态写出来，源码才不容易变成函数名列表。"),
      point("实验联结", "TTFT、P99、KV 使用率的变化应该能指向调度、缓存或执行路径。"),
    ],
    lab: lab(
      "Lab 14 · 10 分钟源码讲解",
      "完成一段面试式讲解，并用录音检查是否真的理解。",
      "已有 Day 8-13 源码笔记。",
      [
        { title: "选一条主线", detail: "推荐选择 Scheduler 或 KV Cache Manager，不要同时讲所有模块。", code: "" },
        { title: "准备四段结构", detail: "入口、核心对象、一次状态变化、一个设计取舍。每段只放 2-3 个关键点。", code: "入口 -> 核心对象 -> 状态变化 -> 设计取舍" },
        { title: "连接一个实验", detail: "例如并发升高后 P99 变差，解释它如何与队列、KV Cache 或 token budget 联系起来。", code: "" },
        { title: "记录追问", detail: "录音后写下别人最可能追问的 3 个问题，下一周用实验回答。", code: "" },
      ],
      [
        "能在 10 分钟内讲出完整闭环。",
        "每个结论都有源码位置或实验现象支撑。",
        "能主动说出当前不知道的边界。",
      ],
      "10 分钟讲解稿 + 录音 + 追问清单",
      "",
    ),
    resources: ["vllmArchitecture", "vllmRepo", "vllmTalk"],
  },
  15: {
    module: "4×A30 实验",
    lessonTitle: "把 benchmark 变成自动化实验",
    lesson:
      "从今天开始，重点从“理解机制”转向“证明机制”。自动化的价值不是少打几次命令，而是把变量、环境、结果和失败都记录下来，让实验可以重复、比较和审计。",
    keyPoints: [
      point("实验矩阵", "先选少量敏感变量，再扩大关键区域，不要一开始穷举所有组合。"),
      point("统一 runner", "同一个入口负责生成命令、采集环境、执行压测、保存 stdout/stderr 和结果。"),
      point("失败也落盘", "失败原因是实验边界的一部分，不能只保存成功的结果。"),
    ],
    lab: lab(
      "Lab 15 · Benchmark Runner",
      "写一个可以按配置批量执行实验并保存原始证据的 runner。",
      "Python 3.10+；先用 `echo` 或假命令测试，再接真实 vLLM。",
      [
        { title: "定义实验列表", detail: "用 JSON/YAML 描述 tp、concurrency、prompt_tokens 和 output_tokens 的组合。", code: "experiments = [{\"tp\": 1, \"concurrency\": 1}, {\"tp\": 1, \"concurrency\": 4}]" },
        { title: "生成唯一目录", detail: "目录名包含时间、模型、TP、并发等关键信息，避免覆盖旧结果。", code: "" },
        { title: "执行并采集", detail: "使用 subprocess 运行命令，分别保存 command.txt、stdout.log、stderr.log、result.json。", code: "subprocess.run(command, capture_output=True, text=True, check=False)" },
        { title: "写 manifest", detail: "每次实验结束后写一份总清单，记录成功、失败和退出码。", code: "" },
      ],
      [
        "可以一次生成至少 4 组实验目录。",
        "失败命令也会保留日志和退出码。",
        "重新运行不会覆盖旧结果。",
      ],
      "一个可重复运行的 `run_benchmark.py` + results/ 目录",
      "python labs/day-15/run_benchmark.py --config experiments.json --dry-run",
    ),
    resources: ["servingBenchmark", "nsightSystems"],
  },
  16: {
    module: "4×A30 实验",
    lessonTitle: "扫描并发，找到系统拐点",
    lesson:
      "并发提升的前半段通常能提高吞吐，后半段会让排队和尾延迟急剧恶化。你要找的不是一个“最大并发”，而是吞吐增长开始变慢、P99 开始不可接受的拐点。",
    keyPoints: [
      point("吞吐曲线", "并发低时 GPU 可能吃不饱，增加并发可以提高利用率。"),
      point("饱和点", "资源接近满载后，继续加请求主要增加等待，不再带来等比例吞吐。"),
      point("线上选择", "生产并发上限通常低于最大吞吐点，要留稳定余量。"),
    ],
    lab: lab(
      "Lab 16 · 并发度扫描",
      "在固定模型、长度和 TP 下扫描并发，绘制 TTFT、P99、TPS 曲线。",
      "已有 baseline 和 benchmark runner。",
      [
        { title: "固定其它变量", detail: "只改变 concurrency，输入输出长度、采样参数、模型和 TP 全部固定。", code: "CONCURRENCY=(1 2 4 8 16 32)" },
        { title: "执行扫描", detail: "每个点至少 warm-up 两次、正式运行三次，保存原始数据。", code: "" },
        { title: "画三张曲线", detail: "分别画并发-TTFT、并发-P99、并发-TPS；不要把不同单位画在同一坐标轴。", code: "" },
        { title: "找两个点", detail: "标出最佳吞吐点和你认为可接受的延迟点，写下选择理由。", code: "" },
      ],
      [
        "曲线的横轴和单位清楚。",
        "能指出系统开始排队的证据。",
        "结论包含实验条件，而不是泛化成“并发越高越好/越差”。",
      ],
      "并发扫描图 + 饱和点结论",
      "python labs/day-16/plot_concurrency.py results/ --out concurrency.png",
    ),
    resources: ["servingBenchmark", "nsightSystems"],
  },
  17: {
    module: "4×A30 实验",
    lessonTitle: "分开看长 Prompt 和长输出",
    lesson:
      "输入 token 和输出 token 都会增加成本，但作用阶段不同。长 Prompt 主要压 prefill 和 TTFT，长输出会让请求驻留更久、decode 轮数变多、KV Cache 持续增长。长度实验必须分两组做。",
    keyPoints: [
      point("输入长度", "影响 prefill 工作量和首 token 等待。"),
      point("输出长度", "影响 decode 轮数、总时延和并发容量。"),
      point("公平比较", "固定一边、扫描另一边，才能知道变化来自哪个阶段。"),
    ],
    lab: lab(
      "Lab 17 · 输入/输出长度扫描",
      "用两组实验分别验证 prompt 长度和 output 长度的影响。",
      "已有 benchmark runner；建议先用 128/512/2048 三个长度。",
      [
        { title: "实验 A：固定输出", detail: "固定 output=128，只改变 prompt=128/512/2048，重点看 TTFT。", code: "prompt_tokens = [128, 512, 2048]\noutput_tokens = 128" },
        { title: "实验 B：固定输入", detail: "固定 prompt=512，只改变 output=64/128/512，重点看 ITL、总时延和 KV。", code: "prompt_tokens = 512\noutput_tokens = [64, 128, 512]" },
        { title: "统一统计", detail: "两组都记录 TTFT、ITL、total latency、TPS、显存和错误数。", code: "" },
        { title: "做阶段归因", detail: "用一段话说明每张图最可能对应 prefill、decode 还是资源驻留。", code: "" },
      ],
      [
        "两组实验没有混淆输入和输出变量。",
        "至少有一张图能显示 TTFT 随输入长度变化。",
        "能解释长输出为什么降低可服务并发。",
      ],
      "长度扫描结果 + prefill/decode 归因笔记",
      "python labs/day-17/run_length_sweep.py --mode prompt",
    ),
    resources: ["servingBenchmark", "pagedPaper"],
  },
  18: {
    module: "4×A30 实验",
    lessonTitle: "TP=1/2/4 的真实收益",
    lesson:
      "多卡并行有两个直接收益：单卡参数和部分中间状态减少，模型可以容纳更大规模；代价是层间通信和同步。你的 A30 环境尤其要关注 PCIe 通信，不能因为卡数增加就默认更快。",
    keyPoints: [
      point("可容纳性", "如果模型单卡放不下，TP 是容量方案；这和“为了加速”是两种不同动机。"),
      point("通信成本", "每层集合通信会消耗互联带宽和同步时间，batch 小时更容易显出代价。"),
      point("扩展效率", "用实际加速比/GPU 数量衡量，不要只比较单卡和四卡的绝对 TPS。"),
    ],
    lab: lab(
      "Lab 18 · Tensor Parallel 对比",
      "在同一负载下比较 TP=1、2、4 的显存、TTFT、TPS 和 GPU 利用率。",
      "至少 4 张可用 GPU、同一模型和固定 benchmark。",
      [
        { title: "固定实验协议", detail: "锁定模型、dtype、输入输出长度、并发、采样和 vLLM commit。", code: "for TP in 1 2 4; do echo \"TP=$TP\"; done" },
        { title: "分别启动服务", detail: "每个 TP 都保存启动日志、nvidia-smi 和 benchmark 原始结果。", code: "CUDA_VISIBLE_DEVICES=0,1,2,3 \\\npython -m vllm.entrypoints.openai.api_server --model \"$MODEL\" --tensor-parallel-size \"$TP\"" },
        { title: "计算扩展效率", detail: "speedup = tps_tp / tps_tp1，efficiency = speedup / tp。", code: "speedup = tps_tp / tps_tp1\nefficiency = speedup / tp" },
        { title: "解释非线性", detail: "结合通信、batch、模型是否单卡可容纳来解释结果。", code: "" },
      ],
      [
        "三种 TP 配置的条件一致。",
        "结果同时包含容量收益和性能收益。",
        "能解释一次 TP 增加但 TPS 没有提升的现象。",
      ],
      "TP 对比表 + 扩展效率图 + 结论边界",
      "python labs/day-18/summarize_tp.py results/",
    ),
    resources: ["ncclOverview", "ncclCollectives", "nvidiaMultiGpuVideo"],
  },
  19: {
    module: "4×A30 实验",
    lessonTitle: "Prefix Cache 和 Chunked Prefill 何时有用",
    lesson:
      "Prefix Cache 通过复用完全一致的 token 前缀减少重复 prefill；Chunked Prefill 则把很长的 prefill 拆开，让 decode 请求有机会穿插执行。前者依赖命中率，后者是调度取舍，不能混成一个“缓存优化”。",
    keyPoints: [
      point("命中条件", "前缀必须 token 级一致，模型配置兼容，并且缓存没有被淘汰。"),
      point("收益位置", "Prefix Cache 主要降低共享前缀的 prefill 时间，不会让后续 decode 消失。"),
      point("Chunked Prefill", "降低长 prompt 对已有 decode 请求的阻塞，但可能增加调度和执行开销。"),
    ],
    lab: lab(
      "Lab 19 · 共享前缀 A/B 实验",
      "构造可控命中和不命中的请求，观察 prefix caching 与 chunked prefill 的不同效果。",
      "支持相关特性的 vLLM 版本；先确认启动参数和版本文档。",
      [
        { title: "构造请求集", detail: "准备相同 system prompt + 不同 user suffix，以及完全不同前缀的对照组。", code: "shared = \"You are a helpful assistant...\" \nrequests = [shared + suffix for suffix in suffixes]" },
        { title: "记录命中条件", detail: "逐 token 检查前缀是否一致；不要只看字符串看起来相似。", code: "" },
        { title: "开启/关闭缓存", detail: "其它变量不变，分别测 TTFT、吞吐和显存。", code: "" },
        { title: "测试长 prompt", detail: "在有活跃 decode 请求时比较 chunked prefill 开关，观察 P99 和 ITL。", code: "" },
      ],
      [
        "命中和不命中请求是明确分组的。",
        "能分开解释 prefix cache 和 chunked prefill。",
        "结论包含命中率和工作负载边界。",
      ],
      "缓存命中 A/B 表 + 长 Prompt 调度观察",
      "python labs/day-19/build_prefix_workload.py --shared-prefix 1024",
    ),
    resources: ["prefixCaching", "servingBenchmark", "pagedPaper"],
  },
  20: {
    module: "4×A30 实验",
    lessonTitle: "量化：显存省下来了，速度一定更快吗",
    lesson:
      "量化把权重或 KV Cache 用更低精度表示，可以减少显存和读取带宽，但是否更快取决于硬件和 kernel。今天要把性能指标和质量指标放在一起看，避免只因为显存下降就宣布优化成功。",
    keyPoints: [
      point("权重量化", "主要减少模型权重大小和读取压力，常见是 W4A16、W8A16 等组合。"),
      point("KV 量化", "减少缓存占用，但会影响 Attention 中的 K/V 精度，需要单独评估。"),
      point("kernel 支持", "如果硬件没有高效实现，反量化开销可能抵消节省的带宽。"),
    ],
    lab: lab(
      "Lab 20 · 原精度/量化模型对比",
      "在同一硬件和负载下比较显存、加载、TTFT、TPS 与输出质量。",
      "一个原精度模型和一个兼容的量化模型；同一 vLLM 版本。",
      [
        { title: "先确认可用格式", detail: "检查模型量化方式、硬件支持和 vLLM 参数，不要凭模型名称猜。", code: "python -m vllm.entrypoints.openai.api_server --help | rg \"quantization|dtype\"" },
        { title: "固定推理条件", detail: "同一 prompt 集、最大输出长度、并发、TP 和采样参数。", code: "" },
        { title: "收集系统指标", detail: "记录显存、启动时间、TTFT、ITL、TPS、P99 和错误数。", code: "" },
        { title: "做最小质量检查", detail: "用固定 prompt 集保存输出，至少人工检查截断、乱码、重复和明显语义退化。", code: "" },
      ],
      [
        "性能和质量使用同一组请求条件。",
        "能指出量化收益来自容量、带宽还是 kernel。",
        "没有把“显存更小”直接等同于“服务更快”。",
      ],
      "量化对比表 + 固定 prompt 输出样例",
      "python labs/day-20/compare_outputs.py --baseline outputs/fp16.json --candidate outputs/quant.json",
    ),
    resources: ["quantization", "kvQuantization", "servingBenchmark"],
  },
  21: {
    module: "第三周复盘",
    lessonTitle: "把实验数字写成工程结论",
    lesson:
      "实验报告不是把表格贴上去。一个合格结论要包含条件、变化、证据、机制解释和限制。今天把最有价值的三组实验整理成可复现的报告，让别人能知道你的结论在哪些场景成立。",
    keyPoints: [
      point("结论模板", "在条件 X 下，改变变量 Y，使指标 Z 发生变化；可能机制是 M，限制是 L。"),
      point("图表规范", "标明单位、输入输出长度、并发、TP、模型、样本量和统计口径。"),
      point("失败实验", "失败能暴露容量边界和假设错误，是项目证据而不是垃圾数据。"),
    ],
    lab: lab(
      "Lab 21 · vLLM 性能报告",
      "完成一份别人可以复现、也可以质疑的实验报告。",
      "已有 Day 15-20 结果；Markdown + Python 绘图即可。",
      [
        { title: "清理结果", detail: "标记 warm-up、错误、重试、环境变化和不应比较的样本，不要静默删除。", code: "" },
        { title: "制作核心图表", detail: "至少完成并发曲线、长度曲线、TP 对比和量化对比中的三张。", code: "python labs/day-21/plot_report.py results/ --out report/figures" },
        { title: "写机制解释", detail: "每张图下写“现象-机制-限制”三句话。", code: "" },
        { title: "做复现演练", detail: "在一个新目录按 README 重跑最小实验，记录缺失信息。", code: "" },
      ],
      [
        "读者能从报告找到完整启动命令。",
        "每张图都有条件、单位和统计口径。",
        "至少写出一个失败或不确定结论。",
      ],
      "一份 `REPORT.md` + figures/ + 可复现命令",
      "",
    ),
    resources: ["servingBenchmark", "nsightSystems"],
  },
  22: {
    module: "服务与面试",
    lessonTitle: "把推理引擎包装成可靠的流式服务",
    lesson:
      "能启动 vLLM 只是模型服务的起点。服务层还要处理协议、超时、取消、断连和错误映射。今天重点练习 SSE 客户端，因为它能把 TTFT、ITL 和断连行为直接暴露出来。",
    keyPoints: [
      point("SSE", "基于 HTTP 的单向事件流，适合服务端持续推送 token。"),
      point("超时拆分", "连接、排队、首 token、token 间隔和总请求超时应该分别观察。"),
      point("取消", "客户端断开后要释放推理资源，否则无效请求会继续占用 KV Cache。"),
    ],
    lab: lab(
      "Lab 22 · 可取消的 SSE 客户端",
      "写一个能测 TTFT/ITL、处理半包和主动取消的流式客户端。",
      "Python 3.10+、requests 或 httpx；连接本地 OpenAI 兼容服务。",
      [
        { title: "读取事件流", detail: "按 SSE 的空行分隔事件，不要假设一次网络读取就是一个完整事件。", code: "for line in response.iter_lines(decode_unicode=True):\n    if line.startswith(\"data:\"):\n        handle_event(line[5:].strip())" },
        { title: "记录阶段时间", detail: "记录请求发出、首个有效 token、每个后续 token 和结束时间。", code: "" },
        { title: "测试主动取消", detail: "收到第 5 个 token 后关闭连接，观察服务端是否停止继续生成。", code: "" },
        { title: "分类错误", detail: "分别模拟连接失败、HTTP 错误、SSE 解析错误和 token 间隔超时。", code: "" },
      ],
      [
        "能正确解析多段 SSE 事件。",
        "TTFT 和 ITL 计算口径写清楚。",
        "主动断开不会让客户端无限等待。",
      ],
      "一个 `stream_client.py` + 一份延迟日志",
      "python labs/day-22/stream_client.py --url http://localhost:8000/v1/chat/completions",
    ),
    resources: ["vllmQuickstart", "rayServeLlm"],
  },
  23: {
    module: "服务与面试",
    lessonTitle: "在 GPU 被压垮前做接入控制",
    lesson:
      "推理服务不能只靠模型引擎自我保护。限流控制进入速率，队列吸收短时突发，admission control 根据预计 token 和 KV 成本决定接受、等待或拒绝。按请求数限流通常不够，因为请求长度差异很大。",
    keyPoints: [
      point("并发限制", "限制同时活跃的请求数，保护驻留资源。"),
      point("速率限制", "限制单位时间进入的请求或 token 数，控制突发。"),
      point("Token budget", "按输入输出 token 估算成本，比只按请求数量更接近真实资源消耗。"),
    ],
    lab: lab(
      "Lab 23 · Token Budget Admission Controller",
      "实现一个简化接入控制器，按 token 预算决定 accept、queue 或 reject。",
      "Python 3.10+，不需要 GPU。",
      [
        { title: "定义请求成本", detail: "估算 cost = prompt_tokens + max_output_tokens，并设置总预算和并发上限。", code: "cost = prompt_tokens + max_output_tokens\nif inflight_tokens + cost <= BUDGET:\n    accept()\nelse:\n    queue_or_reject()" },
        { title: "实现三种结果", detail: "预算足够就 accept，队列未满就 queue，否则 reject，并记录原因。", code: "" },
        { title: "加入优先级", detail: "让短请求和高优先级请求有不同处理顺序，观察公平性变化。", code: "" },
        { title: "压测边界", detail: "逐步提高请求到达率，记录接受率、等待时间和拒绝原因。", code: "" },
      ],
      [
        "同一请求在相同状态下得到可解释结果。",
        "拒绝响应包含原因和重试建议。",
        "能说明按 token 预算比按请求数更合理的地方。",
      ],
      "admission controller + 过载曲线",
      "python labs/day-23/admission.py --budget 4096 --max-queue 8",
    ),
    resources: ["rayServeLlm", "vllmArchitecture"],
  },
  24: {
    module: "服务与面试",
    lessonTitle: "可观测性：用指标定位问题",
    lesson:
      "看到 P99 变高只是现象。你需要把请求、Scheduler 和 GPU 三层指标关联起来，区分排队变长、prefill 变慢、decode 变慢、KV 快满和通信等待。可观测性不是装饰，它决定你能不能解释线上故障。",
    keyPoints: [
      point("请求层", "请求率、错误率、TTFT、ITL、P99、输入输出长度。"),
      point("调度层", "队列长度、running 数、batch token、抢占次数、KV 使用率。"),
      point("设备层", "GPU 利用率、显存、温度、通信和 kernel 时间线。"),
    ],
    lab: lab(
      "Lab 24 · 三层指标字典",
      "为推理服务建立一份指标字典，并用日志计算最小面板数据。",
      "已有 benchmark 日志；Python 或 Prometheus 文本格式均可。",
      [
        { title: "定义指标字段", detail: "为每个指标写 name、type、unit、labels、owner 和用途，避免只写名字。", code: "{\n  \"name\": \"request_ttft_ms\",\n  \"type\": \"histogram\",\n  \"unit\": \"ms\",\n  \"labels\": [\"model\", \"tp\"]\n}" },
        { title: "统一 request_id", detail: "让请求日志、调度日志和 GPU 采样能按 request_id 或时间窗口关联。", code: "" },
        { title: "制造一个尖峰", detail: "增加长 prompt 或并发，让 TTFT/P99 变高，再用指标判断是排队还是 prefill。", code: "" },
        { title: "写排障 Runbook", detail: "为 P99 变高、OOM、GPU 利用率低各写 3 个排查步骤。", code: "" },
      ],
      [
        "每个指标都有定义、单位和采集位置。",
        "能从一次尖峰定位至少一个可能阶段。",
        "Runbook 的步骤可以实际执行。",
      ],
      "指标字典 + 三条排障 Runbook",
      "python labs/day-24/parse_metrics.py results/ --out metrics.json",
    ),
    resources: ["nsightSystems", "rayProduction"],
  },
  25: {
    module: "服务与面试",
    lessonTitle: "OOM、崩溃和重试：先止损再恢复",
    lesson:
      "生产故障处理的第一原则是停止扩大损失。OOM、NCCL 错误、模型加载失败和请求超时的恢复方式不同；无限重试会把一个故障变成重试风暴。今天把启动、健康检查、优雅退出和恢复写成状态机。",
    keyPoints: [
      point("Readiness", "判断实例是否可以接收流量；模型加载或 warm-up 未完成时不能 ready。"),
      point("Liveness", "判断进程是否还活着，失败后才考虑重启。"),
      point("重试", "按错误类型设置次数上限、指数退避、熔断和降级。"),
    ],
    lab: lab(
      "Lab 25 · 推理服务故障注入",
      "模拟三类故障，记录服务如何发现、止损、恢复和暴露状态。",
      "本地 Python 服务或 vLLM；不需要真的让生产服务 OOM。",
      [
        { title: "写状态机", detail: "至少包含 starting、ready、degraded、draining、failed 五种状态。", code: "STARTING -> READY -> DRAINING -> STOPPED\nREADY -> DEGRADED -> FAILED" },
        { title: "注入故障", detail: "分别模拟模型加载失败、请求超时和 worker 退出，不要一开始尝试真实 GPU 崩溃。", code: "" },
        { title: "设计恢复动作", detail: "明确哪些错误重试、哪些直接拒绝、哪些需要人工介入。", code: "" },
        { title: "验证优雅退出", detail: "停止接收新请求，等待/取消存量请求，最后释放资源。", code: "" },
      ],
      [
        "每类故障都有状态变化和恢复策略。",
        "重试有上限和退避，不会无限循环。",
        "readiness 和 liveness 的含义没有混淆。",
      ],
      "故障树 + 状态机 + 一次故障注入记录",
      "",
    ),
    resources: ["rayProduction", "kubernetesGpu"],
  },
  26: {
    module: "服务与面试",
    lessonTitle: "Kubernetes、Ray Serve 与 vLLM 如何分工",
    lesson:
      "vLLM 主要解决模型执行和请求调度，Ray Serve 解决副本、路由和部署，Kubernetes 解决容器、资源和集群调度。理解职责边界比背产品名更重要：一个请求从外部进入，最终要落到哪一个 GPU 副本。",
    keyPoints: [
      point("Kubernetes", "管理 Pod、Service、GPU 资源声明、滚动更新和节点调度。"),
      point("Ray Serve", "管理模型副本、路由、部署和扩缩容逻辑。"),
      point("vLLM", "在副本内部做 tokenizer、Scheduler、KV Cache 和模型执行。"),
    ],
    lab: lab(
      "Lab 26 · 多副本 GPU 部署草图",
      "设计一个两模型、多副本的部署方案，并把一次请求的路由路径画清楚。",
      "纸笔/ Mermaid；有 Kubernetes 基础即可，不要求真的部署集群。",
      [
        { title: "写容量假设", detail: "明确模型大小、每副本 GPU 数、预计 QPS、输入输出长度和延迟目标。", code: "model_a: 1 GPU/replica\nmodel_b: 2 GPU/replica\nslo: p99 < 2s" },
        { title: "画资源关系", detail: "至少包含 Node、GPU、Pod、Service、Ray deployment 和 vLLM worker。", code: "" },
        { title: "画请求路径", detail: "Gateway -> Router -> Model Replica -> vLLM Scheduler -> GPU。", code: "" },
        { title: "写扩容信号", detail: "说明为什么不能只根据 CPU，至少结合队列、P99、GPU 利用率和 KV 使用率。", code: "" },
      ],
      [
        "每个组件都有明确职责。",
        "容量估算和 GPU 副本数不矛盾。",
        "能说明冷启动为什么慢以及如何留余量。",
      ],
      "多模型部署架构图 + 容量假设表",
      "",
    ),
    resources: ["kubernetesGpu", "rayServeLlm", "rayArchitecture"],
  },
  27: {
    module: "服务与面试",
    lessonTitle: "用同一套实验比较 SGLang",
    lesson:
      "框架对比最容易犯的错误是条件不一致。今天不是为了证明谁更好，而是用同一模型、硬件、请求分布、并发和指标，理解 RadixAttention、前缀缓存和调度策略的差异。",
    keyPoints: [
      point("RadixAttention", "用 Radix Tree 管理不同请求之间的共享前缀 KV Cache。"),
      point("公平对比", "固定模型、精度、版本、长度分布、并发、采样和 warm-up。"),
      point("结论边界", "一个工作负载上的胜负不能泛化成框架绝对优劣。"),
    ],
    lab: lab(
      "Lab 27 · vLLM/SGLang 小型 A/B",
      "在一组共享前缀请求上，用同一 benchmark 协议对比两个框架。",
      "可用的 vLLM/SGLang 环境；没有第二个框架时先完成 workload 和协议。",
      [
        { title: "固定协议", detail: "复用 Day 5 的配置 Schema，把框架名作为唯一新增变量。", code: "frameworks = [\"vllm\", \"sglang\"]" },
        { title: "跑最小服务", detail: "先确认同一模型和 tokenizer 可用，再接入同一客户端。", code: "" },
        { title: "测试共享前缀", detail: "比较 TTFT、命中率、TPS 和 P99，并保存两边原始输出。", code: "" },
        { title: "写公平性检查", detail: "逐项检查 dtype、最大长度、缓存大小、并发和版本是否一致。", code: "" },
      ],
      [
        "实验条件表能证明比较公平。",
        "能说出一个框架特性如何对应指标变化。",
        "结论明确限定在当前模型和 workload。",
      ],
      "vLLM/SGLang 对比表 + 公平性检查清单",
      "python labs/day-27/compare_frameworks.py --config ab.json",
    ),
    resources: ["sglangDocs", "sglangBenchmark", "sglangRepo"],
  },
  28: {
    module: "服务与面试",
    lessonTitle: "把实验仓库做成别人能复现的项目",
    lesson:
      "工程能力不只是跑出一张图，还包括让别人知道怎么安装、怎么运行、输入是什么、输出在哪里、哪些结论不能泛化。今天整理目录、依赖、配置、脚本、原始结果和 README。",
    keyPoints: [
      point("最小路径", "README 第一屏应该能让别人完成环境检查和最小实验。"),
      point("原始与派生", "原始日志不能被图表覆盖；分析脚本应从原始结果生成派生数据。"),
      point("诚实边界", "无法公开的模型、数据和数字要说明限制，不要为了好看编造复现结果。"),
    ],
    lab: lab(
      "Lab 28 · 一键复现冒烟测试",
      "在一个干净目录执行最小流程，找出项目里所有隐含前提。",
      "Git 仓库；可以先用 dry-run，不要求另一台机器。",
      [
        { title: "整理目录", detail: "分开 configs、scripts、results/raw、results/figures、docs 和 README。", code: "configs/  scripts/  results/raw/  results/figures/  docs/" },
        { title: "写环境检查", detail: "检查 Python、CUDA、GPU、框架和模型路径，失败时给出可操作提示。", code: "python scripts/check_env.py" },
        { title: "写最小运行命令", detail: "从环境检查到 dry-run 再到分析图表，确保每一步都有输出。", code: "python scripts/check_env.py\npython scripts/run.py --dry-run\npython scripts/report.py results/raw" },
        { title: "干净目录验证", detail: "复制 README 到新目录，只按文档执行，记录任何需要口头补充的步骤。", code: "" },
      ],
      [
        "新用户能找到依赖和最小命令。",
        "原始结果、日志和图表目录职责清楚。",
        "README 不依赖作者口头解释。",
      ],
      "可复现项目候选版本 + README + 环境检查脚本",
      "",
    ),
    resources: ["vllmRepo", "servingBenchmark", "rayProduction"],
  },
  29: {
    module: "服务与面试",
    lessonTitle: "把实验讲成项目，而不是背术语",
    lesson:
      "面试官想知道的是你解决了什么问题、为什么这样设计、遇到什么失败、如何用数据验证。今天把项目整理成 1 分钟、3 分钟和 10 分钟三个版本，并准备系统设计追问。",
    keyPoints: [
      point("项目主线", "问题 -> 假设 -> 实验/实现 -> 结果 -> 取舍 -> 限制。"),
      point("数字证据", "任何性能数字都必须能回答模型、硬件、长度、并发和统计口径。"),
      point("不会的问题", "明确实践边界，再说相近理解和验证方案，不要装作做过。"),
    ],
    lab: lab(
      "Lab 29 · 三种时长项目讲解",
      "把你的 vLLM/A30 项目讲成面试官能追问、你也能守住边界的故事。",
      "已有实验报告和源码笔记。",
      [
        { title: "写 1 分钟版本", detail: "只回答做了什么、最重要结果、你负责什么。", code: "背景 -> 我的工作 -> 结果 -> 一句话结论" },
        { title: "写 3 分钟版本", detail: "加入实验设计、关键机制和一个失败样本。", code: "问题 -> 方案 -> 关键实现 -> 数据 -> 失败与修正" },
        { title: "写 10 分钟版本", detail: "加入容量假设、源码链路、指标归因和取舍。", code: "" },
        { title: "模拟追问", detail: "随机挑 15 道八股，强制把每题连接到自己的实验或代码。", code: "" },
      ],
      [
        "三个版本主线一致，没有互相矛盾的数字。",
        "能说明自己真正负责的边界。",
        "至少准备一个失败实验和一个尚未解决的问题。",
      ],
      "1/3/10 分钟讲稿 + 追问记录",
      "",
    ),
    resources: ["vllmArchitecture", "pagedPaper", "ncclOverview"],
  },
  30: {
    module: "最终交付",
    lessonTitle: "完成闭环，再选择下一条长板",
    lesson:
      "最后一天不追求再学一个新框架。你要把服务、实验、图表和讲解串成一个可以展示的闭环，然后根据真正卡住你的问题选择下一阶段：调度与源码、集群平台，还是 CUDA/kernel。",
    keyPoints: [
      point("可展示证据", "可运行代码、原始数据、复现命令、图表和失败记录比口号更有说服力。"),
      point("最终演示", "从启动服务、发请求、观察指标到解释结果，完整走一遍。"),
      point("下一阶段", "选择与你最常遇到的瓶颈一致的方向，不要同时铺开所有主题。"),
    ],
    lab: lab(
      "Lab 30 · 最终 Demo",
      "完成一次从服务启动到实验报告的完整演示，并生成下一阶段学习决策。",
      "已有前 29 天产物。",
      [
        { title: "执行最小闭环", detail: "环境检查 -> 启动服务 -> 发起流式请求 -> 保存指标 -> 生成图表。", code: "python scripts/check_env.py\npython scripts/run_demo.py\npython scripts/report.py results/raw" },
        { title: "录制讲解", detail: "用 5 分钟展示一条请求如何经过系统，并解释一张最重要的图。", code: "" },
        { title: "列出证据", detail: "整理代码、配置、原始结果、报告、录音和已知限制的路径。", code: "" },
        { title: "做方向选择", detail: "根据薄弱点给源码/调度、平台/服务、CUDA/kernel 三条路线分别打分。", code: "" },
      ],
      [
        "Demo 能从头跑通，失败时有可解释日志。",
        "讲解不依赖八股答案，能连接自己的代码和数据。",
        "下一阶段选择有明确理由和一个月目标。",
      ],
      "最终 Demo + 性能报告 + 下一阶段计划",
      "",
    ),
    resources: ["vllmDocs", "rayProduction", "sglangDocs"],
  },
};

export function courseForDay(day) {
  return course[day] || course[1];
}
