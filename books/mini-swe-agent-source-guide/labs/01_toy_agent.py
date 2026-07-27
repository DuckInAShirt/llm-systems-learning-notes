# 1. 假模型：按剧本顺序返回回复
class FakeModel:
    def __init__(self, script):
        self.script = script
        self.i = -1
    def query(self, messages):
        self.i += 1
        return self.script[self.i]

# 2. 假环境：假装执行命令，返回一段输出字符串
class FakeEnv:
    def execute(self, action): 
        # TODO: 返回类似 "[执行 pwd 的输出]" 的字符串
        if action["type"] == "bash":
            command = action["command"]
            return f"[执行 {command} 的输出]"

# 3. 核心循环
def toy_run(model, env, task):
    messages = [{"role": "user", "content": task}]
    while True:
        reply = model.query(messages)
        messages.append(reply)
        if reply["action"]["type"] == "submit":   # 注意这里怎么判断
            content = reply["action"]["result"]
            messages.append({"role": "submit", "content": f"[提交的内容{content}]"})
            return messages
        result = env.execute(reply["action"])
        messages.append({"role": "tool", "content": result})

# 4. 你来写剧本：至少 2 个普通动作 + 1 个 submit 动作
script = [
    {"role": "assistant", "content": "我先看看当前目录在哪里", "action": {"type": "bash", "command": "pwd"}},
    {"role": "assistant", "content": "好的，现在列出目录里的内容", "action": {"type": "bash", "command": "ls"}},
    {"role": "assistant", "content": "提交结果", "action": {"type": "submit", "result": ["a.txt", "b.txt"]}}
]

# 5. 跑起来并打印每条消息的 role 和 content
final = toy_run(FakeModel(script), FakeEnv(), task="看看目录里有什么")
# TODO: 遍历 final 打印
for m in final:
    print(m["role"], "|", m["content"])