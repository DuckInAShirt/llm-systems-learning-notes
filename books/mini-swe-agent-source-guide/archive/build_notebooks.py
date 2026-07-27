"""Build the Jupyter edition of the mini-SWE-agent source guide."""

from __future__ import annotations

from pathlib import Path
from textwrap import dedent

import nbformat


BOOK_DIR = Path(__file__).resolve().parent
NOTEBOOK_DIR = BOOK_DIR / "notebooks"

CHAPTERS = [
    ("00-目录与环境.ipynb", "README.md"),
    ("01-从一个循环开始.ipynb", "01-从一个循环开始.md"),
    ("02-三层边界.ipynb", "02-三层边界.md"),
    ("03-一轮step的完整生命线.ipynb", "03-一轮step的完整生命线.md"),
    ("04-完成限制与异常控制流.ipynb", "04-完成限制与异常控制流.md"),
    ("05-Tool-Schema与模型输出解析.ipynb", "05-Tool-Schema与模型输出解析.md"),
]

KERNEL_METADATA = {
    "kernelspec": {
        "display_name": "Python (mini-swe-agent-study)",
        "language": "python",
        "name": "mini-swe-agent-study",
    },
    "language_info": {
        "name": "python",
        "version": "3.13",
        "mimetype": "text/x-python",
        "codemirror_mode": {"name": "ipython", "version": 3},
        "pygments_lexer": "ipython3",
        "nbconvert_exporter": "python",
        "file_extension": ".py",
    },
}

SETUP_CODE = dedent(
    """
    import os
    import sys
    from pathlib import Path

    os.environ["MSWEA_SILENT_STARTUP"] = "1"

    candidates = [Path.cwd(), *Path.cwd().parents]
    repo_candidates = [path / "mini-swe-agent" for path in candidates]
    repo_candidates += [path for path in candidates if path.name == "mini-swe-agent"]
    repo_candidates.append(Path("/Users/xinranzhao/Documents/llm-study/books/mini-swe-agent-source-guide/mini-swe-agent"))
    REPO = next(path for path in repo_candidates if (path / "src/minisweagent").is_dir())
    SRC = REPO / "src"
    if str(SRC) not in sys.path:
        sys.path.insert(0, str(SRC))
    os.chdir(REPO)

    print(f"Python: {sys.version.split()[0]}")
    print(f"源码仓库: {REPO}")
    """
).strip()

SOURCE_HELPER = dedent(
    """
    def show_source(relative_path: str, start: int, end: int) -> None:
        lines = (REPO / relative_path).read_text().splitlines()
        width = len(str(end))
        for number in range(start, end + 1):
            print(f"{number:>{width}}  {lines[number - 1]}")
    """
).strip()


def markdown_cells(path: Path) -> list:
    """Split Markdown at level-two headings while preserving fenced blocks."""
    sections: list[str] = []
    current: list[str] = []
    in_fence = False
    for line in path.read_text().splitlines():
        if line.startswith("```"):
            in_fence = not in_fence
        if line.startswith("## ") and not in_fence and current:
            sections.append("\n".join(current).strip())
            current = []
        current.append(line)
    if current:
        sections.append("\n".join(current).strip())
    return [nbformat.v4.new_markdown_cell(section) for section in sections if section]


def code(source: str) -> object:
    return nbformat.v4.new_code_cell(dedent(source).strip())


def lab_cells(index: int) -> list:
    if index == 0:
        return [
            nbformat.v4.new_markdown_cell(
                "## Notebook 环境自检\n\n运行下面的单元格，确认当前 kernel 和源码版本。"
            ),
            code(SETUP_CODE),
            code(
                """
                import minisweagent
                import pytest

                print(f"mini-SWE-agent: {minisweagent.__version__}")
                print(f"pytest: {pytest.__version__}")
                """
            ),
        ]

    common = [
        nbformat.v4.new_markdown_cell(
            "## Notebook 实验\n\n下面的单元格直接读取或运行本地源码，不需要真实模型和 API Key。"
        ),
        code(SETUP_CODE),
    ]

    if index == 1:
        return common + [
            code(SOURCE_HELPER),
            nbformat.v4.new_markdown_cell(
                "### 实验 1：直接查看 `run()` 到 `step()`\n\n这相当于在终端执行带行号的 `nl | sed`。"
            ),
            code('show_source("src/minisweagent/agents/default.py", 88, 126)'),
            nbformat.v4.new_markdown_cell(
                "### 实验 2：运行一个确定性的两步 Agent\n\n第一次执行 `pwd`，第二次提交。重点观察六条消息的角色。"
            ),
            code(
                """
                from minisweagent.agents.default import DefaultAgent
                from minisweagent.environments.local import LocalEnvironment
                from minisweagent.models.test_models import DeterministicToolcallModel, make_toolcall_output

                first_action = {"command": "pwd", "tool_call_id": "call_1"}
                submit_action = {
                    "command": "echo COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT\\necho notebook-done",
                    "tool_call_id": "call_2",
                }
                outputs = [
                    make_toolcall_output("先查看工作目录", [], [first_action]),
                    make_toolcall_output("任务完成，提交结果", [], [submit_action]),
                ]
                agent = DefaultAgent(
                    DeterministicToolcallModel(outputs=outputs),
                    LocalEnvironment(cwd=str(REPO)),
                    system_template="你是一个可以使用 Bash 的编码助手。",
                    instance_template="任务：{{task}}",
                    cost_limit=5,
                )
                result = agent.run("查看工作目录，然后结束")
                print("result =", result)
                print("roles  =", [message.get("role") for message in agent.messages])
                """
            ),
            code(
                """
                for index, message in enumerate(agent.messages):
                    print(index, message.get("role"), repr(message.get("content")))
                """
            ),
            nbformat.v4.new_markdown_cell(
                "### 现在回答\n\n第一次 `step()` 正常完成后，`self.messages` 中四条消息的 `role` 依次是什么？先写答案，再展开上一个单元格的输出核对。"
            ),
        ]

    if index == 2:
        return common + [
            code(SOURCE_HELPER),
            nbformat.v4.new_markdown_cell("### 实验 1：查看三个 Protocol"),
            code('show_source("src/minisweagent/__init__.py", 43, 80)'),
            nbformat.v4.new_markdown_cell(
                "### 实验 2：替换 Environment\n\n这个环境只记录动作，不真正执行命令。Agent 主循环不需要知道它的具体类名。"
            ),
            code(
                """
                from minisweagent.agents.default import DefaultAgent
                from minisweagent.models.test_models import DeterministicToolcallModel, make_toolcall_output

                class RecordingEnvironment:
                    def __init__(self):
                        self.commands = []

                    def execute(self, action, cwd=""):
                        self.commands.append(action["command"])
                        return {"output": "recorded", "returncode": 0, "exception_info": ""}

                    def get_template_vars(self, **kwargs):
                        return {}

                    def serialize(self):
                        return {"info": {"environment_type": "recording"}}

                action = {"command": "rm -rf /不会真的执行", "tool_call_id": "call_record"}
                model = DeterministicToolcallModel(
                    outputs=[make_toolcall_output("记录这个动作", [], [action])]
                )
                environment = RecordingEnvironment()
                agent = DefaultAgent(
                    model,
                    environment,
                    system_template="system",
                    instance_template="{{task}}",
                    cost_limit=5,
                )
                agent.add_messages(
                    model.format_message(role="system", content="system"),
                    model.format_message(role="user", content="只执行一步"),
                )
                agent.step()

                print("记录的命令:", environment.commands)
                print("消息角色:", [message.get("role") for message in agent.messages])
                """
            ),
            nbformat.v4.new_markdown_cell(
                "### 现在回答\n\n把 `RecordingEnvironment` 换成 `LocalEnvironment` 时，`DefaultAgent.step()` 是否需要修改？为什么？"
            ),
        ]

    if index == 3:
        return common + [
            code(SOURCE_HELPER),
            nbformat.v4.new_markdown_cell("### 实验 1：查看一轮 step 的三个关键方法"),
            code(
                """
                show_source("src/minisweagent/agents/default.py", 124, 155)
                """
            ),
            nbformat.v4.new_markdown_cell(
                "### 实验 2：给两步 Agent 加事件追踪\n\n事件列表显示 Model、Environment 和 Observation formatter 的实际调用顺序。"
            ),
            code(
                """
                from minisweagent.agents.default import DefaultAgent
                from minisweagent.environments.local import LocalEnvironment
                from minisweagent.models.test_models import DeterministicToolcallModel, make_toolcall_output

                events = []

                class TraceModel:
                    def __init__(self, inner):
                        self.inner = inner

                    def query(self, messages, **kwargs):
                        events.append(f"Model.query(messages={len(messages)})")
                        return self.inner.query(messages, **kwargs)

                    def format_message(self, **kwargs):
                        return self.inner.format_message(**kwargs)

                    def format_observation_messages(self, message, outputs, template_vars=None):
                        events.append(f"Model.format_observation_messages(outputs={len(outputs)})")
                        return self.inner.format_observation_messages(message, outputs, template_vars)

                    def get_template_vars(self, **kwargs):
                        return self.inner.get_template_vars(**kwargs)

                    def serialize(self):
                        return self.inner.serialize()

                class TraceEnvironment:
                    def __init__(self, inner):
                        self.inner = inner

                    def execute(self, action, cwd=""):
                        events.append(f"Environment.execute({action['command']!r})")
                        return self.inner.execute(action, cwd)

                    def get_template_vars(self, **kwargs):
                        return self.inner.get_template_vars(**kwargs)

                    def serialize(self):
                        return self.inner.serialize()

                inspect_action = {"command": "printf observation", "tool_call_id": "call_1"}
                submit_action = {
                    "command": "echo COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT\\necho traced",
                    "tool_call_id": "call_2",
                }
                inner_model = DeterministicToolcallModel(outputs=[
                    make_toolcall_output("执行动作", [], [inspect_action]),
                    make_toolcall_output("提交", [], [submit_action]),
                ])
                agent = DefaultAgent(
                    TraceModel(inner_model),
                    TraceEnvironment(LocalEnvironment(cwd=str(REPO))),
                    system_template="system",
                    instance_template="{{task}}",
                    cost_limit=5,
                )
                result = agent.run("追踪一次完整生命线")
                print(*events, sep="\\n")
                print("result =", result)
                """
            ),
            code(
                """
                print("\\n消息轨迹：")
                for index, message in enumerate(agent.messages):
                    print(index, message.get("role"), repr(message.get("content")))
                """
            ),
        ]

    if index == 4:
        return common + [
            nbformat.v4.new_markdown_cell(
                "### 实验 1：Environment 如何把完成输出变成 `Submitted`"
            ),
            code(
                """
                from minisweagent.environments.local import LocalEnvironment
                from minisweagent.exceptions import Submitted

                environment = LocalEnvironment(cwd=str(REPO))
                try:
                    environment.execute({
                        "command": "echo COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT\\necho final-answer"
                    })
                except Submitted as error:
                    print("异常类型:", type(error).__name__)
                    print("携带消息:", error.messages)
                """
            ),
            nbformat.v4.new_markdown_cell("### 实验 2：step limit 如何结束主循环"),
            code(
                """
                from minisweagent.agents.default import DefaultAgent
                from minisweagent.models.test_models import DeterministicToolcallModel, make_toolcall_output

                action = {"command": "echo only-one-step", "tool_call_id": "call_1"}
                model = DeterministicToolcallModel(
                    outputs=[make_toolcall_output("第一步", [], [action])]
                )
                limited_agent = DefaultAgent(
                    model,
                    LocalEnvironment(cwd=str(REPO)),
                    system_template="system",
                    instance_template="{{task}}",
                    step_limit=1,
                    cost_limit=5,
                )
                result = limited_agent.run("这个任务不会主动提交")
                print("result =", result)
                print("last message =", limited_agent.messages[-1])
                """
            ),
            nbformat.v4.new_markdown_cell(
                "### 实验 3：命令超时是 Observation，不是 Agent 退出\n\n这个单元格大约运行一秒。"
            ),
            code(
                """
                timed_output = LocalEnvironment(timeout=1).execute({
                    "command": "printf partial-output; sleep 2"
                })
                timed_output
                """
            ),
            nbformat.v4.new_markdown_cell(
                "### 现在回答\n\n模型、Environment、`run()` 在完成链路中分别负责什么？为什么单个命令超时和整个 Agent 超时不是一回事？"
            ),
        ]

    if index == 5:
        return common + [
            nbformat.v4.new_markdown_cell("### 实验 1：查看 Bash Tool Schema"),
            code(
                """
                from pprint import pprint
                from minisweagent.models.utils.actions_toolcall import BASH_TOOL

                pprint(BASH_TOOL)
                """
            ),
            nbformat.v4.new_markdown_cell("### 实验 2：把合法 tool call 解析为 action"),
            code(
                """
                from types import SimpleNamespace
                from minisweagent.models.utils.actions_toolcall import parse_toolcall_actions

                def tool_call(name="bash", arguments='{"command": "echo hello"}', call_id="call_1"):
                    return SimpleNamespace(
                        id=call_id,
                        function=SimpleNamespace(name=name, arguments=arguments),
                    )

                parse_toolcall_actions(
                    [tool_call()],
                    format_error_template="{{ error }}",
                )
                """
            ),
            nbformat.v4.new_markdown_cell(
                "### 实验 3：观察三种 `FormatError`\n\n没有工具、未知工具、非法 JSON 都会在进入 Environment 前被拒绝。"
            ),
            code(
                """
                from minisweagent.exceptions import FormatError

                cases = {
                    "没有工具调用": [],
                    "未知工具": [tool_call(name="python")],
                    "非法 JSON": [tool_call(arguments="{not-json")],
                }

                for label, calls in cases.items():
                    try:
                        parse_toolcall_actions(calls, format_error_template="{{ error }}")
                    except FormatError as error:
                        print(f"[{label}] {error.messages[0]['content']}")
                """
            ),
            nbformat.v4.new_markdown_cell(
                "### 现在回答\n\n为什么 action parsing 属于 Model 边界？为什么解析失败后不能把原始字符串直接交给 Environment？"
            ),
        ]

    raise ValueError(f"Unknown chapter index: {index}")


def build() -> None:
    NOTEBOOK_DIR.mkdir(parents=True, exist_ok=True)
    for index, (notebook_name, markdown_name) in enumerate(CHAPTERS):
        notebook = nbformat.v4.new_notebook(
            cells=markdown_cells(BOOK_DIR / markdown_name) + lab_cells(index),
            metadata=KERNEL_METADATA,
        )
        nbformat.write(notebook, NOTEBOOK_DIR / notebook_name)
        print(f"built {notebook_name}")


if __name__ == "__main__":
    build()
