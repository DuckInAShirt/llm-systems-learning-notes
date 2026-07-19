import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  BookOpen,
  BookOpenCheck,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Cloud,
  CloudOff,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FlaskConical,
  Gauge,
  Lightbulb,
  LibraryBig,
  ListChecks,
  LogIn,
  LogOut,
  Mail,
  Pause,
  Play,
  RotateCcw,
  Workflow,
  Square,
  Terminal,
  X,
} from "lucide-react";
import { courseForDay } from "./course";
import { questionsForDay } from "./interview";
import { phases, plan, taskId } from "./plan";
import { allResources, resourcesForDay } from "./resources";
import { authRedirectUrl, supabase, supabaseConfigured } from "./supabase";
import { answerForTask } from "./taskAnswers";

const STORAGE_KEY = "agent-harness-coach-v1";
const CURRICULUM_ID = "agent-harness-v1";
const LAB_REPO_URL =
  "https://github.com/SWE-agent/mini-swe-agent";

const emptyState = {
  curriculumId: CURRICULUM_ID,
  selectedDay: 1,
  completed: {},
  notes: {},
  confidence: {},
  focusSessions: {},
  labDone: {},
  labRecords: {},
  experiments: [],
  startDate: new Date().toISOString().slice(0, 10),
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : emptyState;
  } catch {
    return emptyState;
  }
}

function normalizeState(candidate) {
  if (candidate?.curriculumId !== CURRICULUM_ID) {
    return { ...emptyState };
  }
  return {
    ...emptyState,
    ...candidate,
    completed: { ...emptyState.completed, ...(candidate?.completed || {}) },
    notes: { ...emptyState.notes, ...(candidate?.notes || {}) },
    confidence: { ...emptyState.confidence, ...(candidate?.confidence || {}) },
    focusSessions: {
      ...emptyState.focusSessions,
      ...(candidate?.focusSessions || {}),
    },
    labDone: { ...emptyState.labDone, ...(candidate?.labDone || {}) },
    labRecords: { ...emptyState.labRecords, ...(candidate?.labRecords || {}) },
    experiments: candidate?.experiments || [],
  };
}

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} 分钟`;
  if (!rest) return `${hours} 小时`;
  return `${hours} 小时 ${rest} 分钟`;
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [state, setState] = useState(loadState);
  const [tab, setTab] = useState("today");
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState(
    supabaseConfigured ? "checking" : "disabled",
  );
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const hydratedUserRef = useRef(null);
  const hydratingUserRef = useRef(null);
  const uploadTimerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!supabase) return undefined;

    let mounted = true;

    async function hydrateUser(userId) {
      if (
        !mounted ||
        hydratedUserRef.current === userId ||
        hydratingUserRef.current === userId
      ) {
        return;
      }

      hydratingUserRef.current = userId;
      setSyncStatus("loading");
      const { data, error } = await supabase
        .from("learning_progress")
        .select("state")
        .eq("user_id", userId)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        hydratingUserRef.current = null;
        setSyncStatus("error");
        return;
      }

      if (data?.state) {
        setState(normalizeState(data.state));
      }

      hydratedUserRef.current = userId;
      hydratingUserRef.current = null;
      setSyncStatus("synced");
    }

    function applySession(session) {
      const nextUser = session?.user || null;
      setUser(nextUser);

      if (!nextUser) {
        hydratedUserRef.current = null;
        hydratingUserRef.current = null;
        setSyncStatus("signedOut");
        return;
      }

      window.setTimeout(() => hydrateUser(nextUser.id), 0);
    }

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) applySession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) applySession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (uploadTimerRef.current) {
        window.clearTimeout(uploadTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!supabase || !user || hydratedUserRef.current !== user.id) {
      return undefined;
    }

    if (uploadTimerRef.current) {
      window.clearTimeout(uploadTimerRef.current);
    }

    setSyncStatus("saving");
    uploadTimerRef.current = window.setTimeout(async () => {
      const { error } = await supabase.from("learning_progress").upsert(
        {
          user_id: user.id,
          state,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      setSyncStatus(error ? "error" : "synced");
    }, 700);

    return () => {
      if (uploadTimerRef.current) {
        window.clearTimeout(uploadTimerRef.current);
      }
    };
  }, [state, user]);

  const selected = plan[state.selectedDay - 1];
  const checklistTasks = plan.reduce(
    (sum, day) => sum + day.deep.length + day.fragments.length,
    0,
  );
  const totalTasks = checklistTasks + plan.length;
  const completedTasks =
    Object.values(state.completed).filter(Boolean).length +
    Object.values(state.labDone).filter(Boolean).length;
  const progress = Math.round((completedTasks / totalTasks) * 100);

  const selectedTaskIds = [
    ...selected.deep.map((_, index) => taskId(selected.day, "deep", index)),
    ...selected.fragments.map((_, index) =>
      taskId(selected.day, "fragment", index),
    ),
  ];
  const selectedDone =
    selectedTaskIds.filter((id) => state.completed[id]).length +
    (state.labDone[selected.day] ? 1 : 0);

  function update(patch) {
    setState((current) => ({ ...current, ...patch }));
  }

  function toggleTask(id) {
    setState((current) => ({
      ...current,
      completed: {
        ...current.completed,
        [id]: !current.completed[id],
      },
    }));
  }

  function setConfidence(key, value) {
    setState((current) => ({
      ...current,
      confidence: {
        ...current.confidence,
        [key]: value,
      },
    }));
  }

  function setFocusSession(key, value) {
    setState((current) => ({
      ...current,
      focusSessions: {
        ...current.focusSessions,
        [key]: value,
      },
    }));
  }

  function selectDay(day) {
    update({ selectedDay: day });
    setTab("today");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function sendMagicLink(event) {
    event.preventDefault();
    if (!supabase || !authEmail.trim()) return;

    setAuthMessage("正在发送登录链接...");
    const { error } = await supabase.auth.signInWithOtp({
      email: authEmail.trim(),
      options: {
        emailRedirectTo: authRedirectUrl,
      },
    });

    setAuthMessage(
      error ? `发送失败：${error.message}` : "登录链接已发送，请检查邮箱。",
    );
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAuthModalOpen(false);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <Workflow size={22} strokeWidth={1.8} />
          </span>
          <div>
            <strong>Harness 30</strong>
            <span>Agent Runtime · Eval · 生产落地</span>
          </div>
        </div>

        <nav className="tabs" aria-label="主视图">
          <TabButton
            active={tab === "today"}
            icon={<BookOpenCheck size={17} />}
            label="今日"
            onClick={() => setTab("today")}
          />
          <TabButton
            active={tab === "roadmap"}
            icon={<Workflow size={17} />}
            label="路线"
            onClick={() => setTab("roadmap")}
          />
          <TabButton
            active={tab === "experiments"}
            icon={<FlaskConical size={17} />}
            label="口述"
            onClick={() => setTab("experiments")}
          />
          <TabButton
            active={tab === "review"}
            icon={<Brain size={17} />}
            label="复习"
            onClick={() => setTab("review")}
          />
          <TabButton
            active={tab === "resources"}
            icon={<LibraryBig size={17} />}
            label="资料"
            onClick={() => setTab("resources")}
          />
        </nav>

        <div className="top-actions">
          <SyncControl
            configured={supabaseConfigured}
            user={user}
            status={syncStatus}
            onSignIn={() => {
              setAuthMessage("");
              setAuthModalOpen(true);
            }}
            onSignOut={signOut}
          />
          <div className="overall-progress" aria-label={`总进度 ${progress}%`}>
            <span>{progress}%</span>
            <div>
              <i style={{ width: `${progress}%` }} />
            </div>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={() =>
              downloadJson("agent-harness-progress.json", {
                exportedAt: new Date().toISOString(),
                ...state,
              })
            }
            aria-label="导出学习记录"
            data-tooltip="导出学习记录"
          >
            <Download size={18} />
          </button>
        </div>
      </header>

      <div className="mobile-day-select">
        <label>
          <span>学习日</span>
          <select
            value={state.selectedDay}
            onChange={(event) => selectDay(Number(event.target.value))}
          >
            {plan.map((day) => (
              <option key={day.day} value={day.day}>
                Day {day.day} · {day.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="workspace">
        <aside className="sidebar">
          <div className="sidebar-heading">
            <span>30 天进度</span>
            <strong>
              {completedTasks}/{totalTasks}
            </strong>
          </div>
          {phases.map((phase) => (
            <div className="phase-nav" key={phase.id}>
              <div className="phase-label">
                <span>W{phase.id}</span>
                <strong>{phase.title}</strong>
              </div>
              {plan
                .filter((item) => item.phase === phase.id)
                .map((item) => {
                  const ids = [
                    ...item.deep.map((_, index) =>
                      taskId(item.day, "deep", index),
                    ),
                    ...item.fragments.map((_, index) =>
                      taskId(item.day, "fragment", index),
                    ),
                  ];
                  const done =
                    ids.filter((id) => state.completed[id]).length +
                    (state.labDone[item.day] ? 1 : 0);
                  const total = ids.length + 1;
                  const finished = done === total;
                  return (
                    <button
                      type="button"
                      className={`day-link ${
                        state.selectedDay === item.day ? "is-active" : ""
                      }`}
                      key={item.day}
                      onClick={() => selectDay(item.day)}
                    >
                      <span className={`day-status ${finished ? "is-done" : ""}`}>
                        {finished ? <Check size={13} /> : item.day}
                      </span>
                      <span>{item.title}</span>
                      <small>
                        {done}/{total}
                      </small>
                    </button>
                  );
                })}
            </div>
          ))}
        </aside>

        <main className="main-content">
          {tab === "today" && (
            <TodayView
              day={selected}
              state={state}
              selectedDone={selectedDone}
              totalSelected={selectedTaskIds.length + 1}
              toggleTask={toggleTask}
              update={update}
              onConfidence={setConfidence}
              onFocusSession={setFocusSession}
            />
          )}
          {tab === "roadmap" && (
            <RoadmapView
              state={state}
              selectDay={selectDay}
              progress={progress}
            />
          )}
          {tab === "experiments" && (
            <LabsView state={state} update={update} />
          )}
          {tab === "review" && (
            <ReviewView
              state={state}
              onConfidence={setConfidence}
              selectDay={selectDay}
            />
          )}
          {tab === "resources" && <ResourcesView />}
        </main>
      </div>
      {authModalOpen && (
        <AuthModal
          email={authEmail}
          message={authMessage}
          onEmailChange={setAuthEmail}
          onSubmit={sendMagicLink}
          onClose={() => setAuthModalOpen(false)}
        />
      )}
    </div>
  );
}

function SyncControl({ configured, user, status, onSignIn, onSignOut }) {
  if (!configured) return null;

  const labels = {
    checking: "检查同步",
    loading: "读取云端",
    saving: "保存中",
    synced: "已同步",
    error: "同步失败",
    signedOut: "登录同步",
  };

  return (
    <button
      className={`sync-control ${status === "error" ? "is-error" : ""}`}
      type="button"
      onClick={user ? onSignOut : onSignIn}
      aria-label={user ? "退出云端同步" : "登录并开启云端同步"}
      title={user ? "退出云端同步" : "登录并开启云端同步"}
    >
      {user ? <Cloud size={16} /> : <CloudOff size={16} />}
      <span>{user ? labels[status] || "已同步" : labels.signedOut}</span>
      {user ? <LogOut size={14} /> : <LogIn size={14} />}
    </button>
  );
}

function AuthModal({
  email,
  message,
  onEmailChange,
  onSubmit,
  onClose,
}) {
  return (
    <div className="auth-backdrop" role="presentation">
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <div className="auth-modal-heading">
          <div>
            <span className="eyebrow">Cloud Sync</span>
            <h2 id="auth-title">登录后同步学习进度</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="关闭登录窗口"
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </div>
        <p>使用邮箱接收一次性登录链接，不需要设置或记忆密码。</p>
        <form onSubmit={onSubmit}>
          <label className="auth-field">
            <span>邮箱</span>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          {message && <p className="auth-message">{message}</p>}
          <div className="auth-actions">
            <button className="secondary-action" type="button" onClick={onClose}>
              取消
            </button>
            <button className="primary-action" type="submit">
              <Mail size={16} />
              发送登录链接
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function TabButton({ active, icon, label, onClick }) {
  return (
    <button
      type="button"
      className={active ? "is-active" : ""}
      aria-selected={active}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function TodayView({
  day,
  state,
  selectedDone,
  totalSelected,
  toggleTask,
  update,
  onConfidence,
  onFocusSession,
}) {
  const deepMinutes = day.deep.reduce((sum, task) => sum + task.minutes, 0);
  const fragmentMinutes = day.fragments.reduce(
    (sum, task) => sum + task.minutes,
    0,
  );
  const questions = questionsForDay(day);
  const lesson = courseForDay(day.day);
  const resources = resourcesForDay(day.day);

  return (
    <>
      <section className="day-header">
        <div>
          <div className="eyebrow">
            Week {day.phase} · Day {day.day}
          </div>
          <h1>{day.title}</h1>
          <p>{day.objective}</p>
        </div>
        <div className="day-completion">
          <strong>
            {selectedDone}/{totalSelected}
          </strong>
          <span>今日任务</span>
        </div>
      </section>

      <div className="stat-grid">
        <Stat
          icon={<Clock3 size={19} />}
          label="两段专注"
          value={formatMinutes(deepMinutes)}
          context="09:30 / 20:30"
        />
        <Stat
          icon={<Activity size={19} />}
          label="碎片复习"
          value={formatMinutes(fragmentMinutes)}
          context="通勤与间隙"
        />
        <Stat
          icon={<Gauge size={19} />}
          label="当日产出"
          value={day.deliverable}
          context="完成才进入下一天"
          compact
        />
      </div>

      <div className="today-layout">
        <div className="task-column">
          <CourseLesson
            lesson={lesson}
            done={Boolean(state.labDone[day.day])}
            onToggle={() =>
              update({
                labDone: {
                  ...state.labDone,
                  [day.day]: !state.labDone[day.day],
                },
              })
            }
          />
          <TaskSection
            title="课后巩固"
          subtitle={`${formatMinutes(deepMinutes)} · 理解、口述、评测`}
            tasks={day.deep}
            bucket="deep"
            day={day.day}
            completed={state.completed}
            onToggle={toggleTask}
          />
          <TaskSection
            title="碎片任务"
            subtitle={`${formatMinutes(fragmentMinutes)} · 口述与记忆`}
            tasks={day.fragments}
            bucket="fragment"
            day={day.day}
            completed={state.completed}
            onToggle={toggleTask}
          />
          <DailyInterview
            day={day}
            questions={questions}
            confidence={state.confidence}
            onConfidence={onConfidence}
          />
          <DailyResources resources={resources} />
          <section className="notes-section">
            <div className="section-title">
              <div>
                <h2>今日记录</h2>
                <span>不会的问题、追问、没有想通的因果链</span>
              </div>
            </div>
            <textarea
              value={state.notes[day.day] || ""}
              onChange={(event) =>
                update({
                  notes: { ...state.notes, [day.day]: event.target.value },
                })
              }
              placeholder="记录今天真正卡住的地方..."
              rows={7}
            />
          </section>
        </div>

        <aside className="right-rail">
          <FocusTimer
            day={day.day}
            completed={state.focusSessions}
            onSessionChange={onFocusSession}
          />
          <section className="output-card">
            <span>今日验收</span>
            <strong>{day.deliverable}</strong>
          </section>
        </aside>
      </div>
    </>
  );
}

function CourseLesson({ lesson, done, onToggle }) {
  return (
    <section className="course-section">
      <div className="section-title course-heading">
        <div>
          <h2>本课讲义</h2>
          <span>先建立概念，再用面试口述验收</span>
        </div>
        <BookOpen size={19} />
      </div>

      <div className="lesson-band">
        <span className="lesson-module">{lesson.module}</span>
        <h3>{lesson.lessonTitle}</h3>
        <p>{lesson.lesson}</p>
        <div className="key-point-grid">
          {lesson.keyPoints.map((item) => (
            <article className="key-point" key={item.title}>
              <Lightbulb size={17} />
              <div>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="lab-band">
        <div className="lab-heading">
          <div>
            <span>配套口述</span>
            <h3>{lesson.lab.title}</h3>
          </div>
          <div className="lab-heading-actions">
            <span className="lab-environment">{lesson.lab.environment}</span>
            <a
              className="lab-source-link"
              href={LAB_REPO_URL}
              target="_blank"
              rel="noreferrer"
            >
              实践项目
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
        <p className="lab-goal">{lesson.lab.goal}</p>

        <div className="lab-steps">
          {lesson.lab.steps.map((step, index) => (
            <article className="lab-step" key={step.title}>
              <span className="lab-step-number">{index + 1}</span>
              <div>
                <h4>{step.title}</h4>
                <p>{step.detail}</p>
                {step.code && <CodeBlock value={step.code} />}
              </div>
            </article>
          ))}
        </div>

        {lesson.lab.code && (
          <div className="lab-command">
            <span>
              <Terminal size={16} />
              运行入口
            </span>
            <CodeBlock value={lesson.lab.code} />
          </div>
        )}

        <div className="lab-acceptance">
          <div>
            <ListChecks size={18} />
            <strong>验收标准</strong>
          </div>
          <ul>
            {lesson.lab.acceptance.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            <span>产出物</span>
            {lesson.lab.deliverable}
          </p>
        </div>

        <button
          className={`lab-complete ${done ? "is-complete" : ""}`}
          type="button"
          onClick={onToggle}
        >
          {done ? <CheckCircle2 size={18} /> : <Square size={17} />}
          {done ? "口述已完成" : "完成验收后标记口述"}
        </button>
      </div>
    </section>
  );
}

function CodeBlock({ value }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const field = document.createElement("textarea");
        field.value = value;
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        document.execCommand("copy");
        field.remove();
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="code-block">
      <pre>
        <code>{value}</code>
      </pre>
      <button
        type="button"
        aria-label="复制代码"
        title="复制代码"
        onClick={copy}
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
    </div>
  );
}

function Stat({ icon, label, value, context, compact = false }) {
  return (
    <div className={`stat-card ${compact ? "is-compact" : ""}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{context}</small>
      </div>
    </div>
  );
}

function TaskSection({
  title,
  subtitle,
  tasks,
  bucket,
  day,
  completed,
  onToggle,
}) {
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    setOpenIndex(null);
  }, [bucket, day]);

  return (
    <section className="task-section">
      <div className="section-title">
        <div>
          <h2>{title}</h2>
          <span>{subtitle}</span>
        </div>
      </div>
      <div className="task-list">
        {tasks.map((task, index) => {
          const id = taskId(day, bucket, index);
          const checked = Boolean(completed[id]);
          const open = openIndex === index;
          const answerLabel =
            bucket === "fragment" ? "快速回顾" : "参考完成标准";
          return (
            <article
              className={`task-item ${checked ? "is-complete" : ""}`}
              key={id}
            >
              <div className="task-row">
                <label className="task-main">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(id)}
                  />
                  <span className="custom-check">
                    {checked && <Check size={14} strokeWidth={2.5} />}
                  </span>
                  <span className="task-copy">
                    <strong>{task.label}</strong>
                    {task.kind && <small>{task.kind}</small>}
                  </span>
                </label>
                <span className="task-time">{task.minutes} min</span>
                <button
                  className="task-answer-toggle"
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenIndex(open ? null : index)}
                >
                  {bucket === "fragment" ? "回顾" : "参考"}
                  <ChevronDown size={15} className={open ? "is-rotated" : ""} />
                </button>
              </div>
              {open && (
                <div className="task-answer-panel">
                  <span>{answerLabel}</span>
                  <p>{answerForTask(day, bucket, index)}</p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

const STUDY_WINDOWS = [
  { id: "morning", label: "上班前", time: "09:30 - 10:30" },
  { id: "evening", label: "下班后", time: "20:30 - 21:30" },
];

const INTERVIEW_GUIDES = {
  1: {
    structure: "先区分模型 API、协议、Runtime 和 Harness，再沿一次工具调用讲主链路。",
    followUps: ["失败或无限循环时由谁处理？", "这个抽象在主流框架中如何体现？"],
  },
  2: {
    structure: "先给一个具体失败场景，再讲状态、权限、预算和恢复机制。",
    followUps: ["有副作用的工具如何避免重复执行？", "Prompt Injection 下这套机制还安全吗？"],
  },
  3: {
    structure: "按任务集、成功判据、Outcome、Trajectory、指标和失败归因回答。",
    followUps: ["如何证明评测结果可信？", "Judge 与人工不一致时怎么办？"],
  },
  4: {
    structure: "先明确任务、风险和 SLO，再讲执行、状态、工具、安全、观测和评测。",
    followUps: ["长任务如何恢复和回滚？", "质量、延迟和成本冲突时如何决策？"],
  },
};

function defaultStudyWindow() {
  const hour = new Date().getHours();
  return hour >= 15 ? "evening" : "morning";
}

function FocusTimer({ day, completed, onSessionChange }) {
  const [selectedWindow, setSelectedWindow] = useState(defaultStudyWindow);
  const [phase, setPhase] = useState("focus");
  const [seconds, setSeconds] = useState(50 * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const selected = STUDY_WINDOWS.find((item) => item.id === selectedWindow);
  const duration = phase === "focus" ? 50 : 10;
  const sessionKey = `${day}-${selectedWindow}`;
  const sessionDone = Boolean(completed[sessionKey]);

  useEffect(() => {
    if (!running) return undefined;
    intervalRef.current = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(intervalRef.current);
          setRunning(false);
          if (phase === "focus") {
            onSessionChange(sessionKey, true);
            setPhase("break");
            return 10 * 60;
          }
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(intervalRef.current);
  }, [onSessionChange, phase, running, sessionKey]);

  useEffect(() => {
    setPhase("focus");
    setSeconds(50 * 60);
    setRunning(false);
  }, [day]);

  function changeWindow(windowId) {
    setSelectedWindow(windowId);
    setPhase("focus");
    setSeconds(50 * 60);
    setRunning(false);
  }

  function changePhase(nextPhase) {
    setPhase(nextPhase);
    setSeconds((nextPhase === "focus" ? 50 : 10) * 60);
    setRunning(false);
  }

  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const rest = String(seconds % 60).padStart(2, "0");
  const elapsed = 1 - seconds / (duration * 60);

  return (
    <section className="timer-card">
      <div className="timer-heading">
        <span>今日番茄钟 · 50+10</span>
        {sessionDone && <CheckCircle2 size={18} className="session-check" />}
      </div>
      <div className="study-window-tabs">
        {STUDY_WINDOWS.map((item) => {
          const done = completed[`${day}-${item.id}`];
          return (
            <button
              type="button"
              key={item.id}
              aria-pressed={selectedWindow === item.id}
              onClick={() => changeWindow(item.id)}
            >
              <span>
                {item.label}
                {done && <Check size={13} />}
              </span>
              <small>{item.time}</small>
            </button>
          );
        })}
      </div>
      <div className="timer-subheading">
        <span>{selected.time}</span>
        <div className="segmented">
          {[
            ["focus", "专注 50m"],
            ["break", "休息 10m"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              aria-pressed={phase === value}
              onClick={() => changePhase(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div
        className="timer-ring"
        style={{ "--timer-progress": `${elapsed * 360}deg` }}
      >
        <div>
          <strong>
            {minutes}:{rest}
          </strong>
          <span>{phase === "focus" ? `${selected.label}专注` : "离开屏幕休息"}</span>
        </div>
      </div>
      <div className="timer-actions">
        <button
          className="primary-action"
          type="button"
          onClick={() => setRunning((value) => !value)}
        >
          {running ? <Pause size={17} /> : <Play size={17} />}
          {running ? "暂停" : "开始"}
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label="重置计时器"
          data-tooltip="重置计时器"
          onClick={() => {
            setRunning(false);
            setSeconds(duration * 60);
          }}
        >
          <RotateCcw size={17} />
        </button>
      </div>
      <button
        className={`session-toggle ${sessionDone ? "is-complete" : ""}`}
        type="button"
        onClick={() => onSessionChange(sessionKey, !sessionDone)}
      >
        {sessionDone ? <CheckCircle2 size={16} /> : <Square size={15} />}
        {sessionDone ? "本段已完成" : "标记本段完成"}
      </button>
    </section>
  );
}

function DailyInterview({ day, questions, confidence, onConfidence }) {
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    setOpenIndex(null);
  }, [day.day]);

  return (
    <section className="interview-section">
      <div className="section-title">
        <div>
          <h2>今日八股</h2>
          <span>5 题 · 先口述，再看答案与追问</span>
        </div>
        <CircleHelp size={19} />
      </div>
      <div className="interview-list">
        {questions.map((item, index) => (
          <InterviewQuestion
            key={`${day.day}-${index}`}
            day={day}
            index={index}
            item={item}
            open={openIndex === index}
            status={confidence[`${day.day}-${index}`] || "unrated"}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            onConfidence={(value) =>
              onConfidence(`${day.day}-${index}`, value)
            }
          />
        ))}
      </div>
    </section>
  );
}

function InterviewQuestion({
  day,
  index,
  item,
  open,
  status,
  onToggle,
  onConfidence,
  showDay = false,
  onOpenDay,
}) {
  const guide = INTERVIEW_GUIDES[day.phase];

  return (
    <article className="interview-item">
      <button className="interview-question" type="button" onClick={onToggle}>
        <span className="question-index">
          {showDay ? `D${String(day.day).padStart(2, "0")} · Q${index + 1}` : `Q${index + 1}`}
        </span>
        <strong>{item.question}</strong>
        {item.required && <span className="required-label">必答</span>}
        <span className={`confidence-dot ${status}`} />
        <ChevronDown size={17} className={open ? "is-rotated" : ""} />
      </button>
      {open && (
        <div className="interview-answer">
          <div className="answer-block">
            <span>参考回答</span>
            <p>{item.answer}</p>
          </div>
          <div className="answer-guide">
            <div>
              <span>回答结构</span>
              <p>{guide.structure}</p>
            </div>
            <div>
              <span>常见追问</span>
              <ul>
                {guide.followUps.map((followUp) => (
                  <li key={followUp}>{followUp}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="review-actions">
            <div className="segmented">
              <button
                type="button"
                aria-pressed={status === "weak"}
                onClick={() => onConfidence("weak")}
              >
                需要复习
              </button>
              <button
                type="button"
                aria-pressed={status === "confident"}
                onClick={() => onConfidence("confident")}
              >
                能脱稿回答
              </button>
            </div>
            {onOpenDay && (
              <button
                className="secondary-action"
                type="button"
                onClick={onOpenDay}
              >
                查看当天任务
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function DailyResources({ resources }) {
  return (
    <section className="resources-section">
      <div className="section-title">
        <div>
          <h2>今日资料</h2>
          <span>先看主修，再按需要打开补充；每份资料都对应今天的 Lab</span>
        </div>
        <LibraryBig size={19} />
      </div>
      <div className="resource-list">
        {resources.map((resource, index) => (
          <ResourceRow
            resource={resource}
            key={resource.id}
            showOrder
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

function resourceTypeClass(type) {
  return {
    文档: "is-doc",
    论文: "is-paper",
    源码: "is-code",
    视频: "is-video",
  }[type];
}

function ResourceRow({ resource, showOrder = false, index = 0 }) {
  return (
    <a
      className="resource-row"
      href={resource.url}
      target="_blank"
      rel="noreferrer"
    >
      <span className="resource-badge">
        <span className={`resource-type ${resourceTypeClass(resource.type)}`}>
          {resource.type}
        </span>
        {showOrder && <small>{index === 0 ? "先看" : "补充"}</small>}
      </span>
      <span className="resource-copy">
        <strong>{resource.title}</strong>
        <small>{resource.studyGuide || resource.note}</small>
        <span className="resource-meta">
          {resource.difficulty} · {resource.time}
        </span>
      </span>
      <ExternalLink size={17} />
    </a>
  );
}

function RoadmapView({ state, selectDay, progress }) {
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">30 天路线</div>
          <h1>从 Agent Loop 到生产评测</h1>
          <p>四个阶段覆盖 Harness 面试边界；mini-swe-agent 作为你独立推进的实践主线。</p>
        </div>
        <strong className="large-progress">{progress}%</strong>
      </section>

      <section className="phase-track" aria-label="四周学习路线">
        {phases.map((phase) => {
          const days = plan.filter((day) => day.phase === phase.id);
          const ids = days.flatMap((day) => [
            ...day.deep.map((_, index) => taskId(day.day, "deep", index)),
            ...day.fragments.map((_, index) =>
              taskId(day.day, "fragment", index),
            ),
          ]);
          const done =
            ids.filter((id) => state.completed[id]).length +
            days.filter((day) => state.labDone[day.day]).length;
          const total = ids.length + days.length;
          const percent = Math.round((done / total) * 100);
          return (
            <div className="phase-block" key={phase.id}>
              <div className="phase-number">0{phase.id}</div>
              <div>
                <span>{phase.range}</span>
                <strong>{phase.title}</strong>
                <p>{phase.outcome}</p>
                <div className="phase-progress">
                  <i style={{ width: `${percent}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="roadmap-table">
        <div className="table-header">
          <span>Day</span>
          <span>主题</span>
          <span>产出</span>
          <span>进度</span>
        </div>
        {plan.map((day) => {
          const ids = [
            ...day.deep.map((_, index) => taskId(day.day, "deep", index)),
            ...day.fragments.map((_, index) =>
              taskId(day.day, "fragment", index),
            ),
          ];
          const done =
            ids.filter((id) => state.completed[id]).length +
            (state.labDone[day.day] ? 1 : 0);
          const total = ids.length + 1;
          return (
            <button
              className="table-row"
              type="button"
              key={day.day}
              onClick={() => selectDay(day.day)}
            >
              <span>{String(day.day).padStart(2, "0")}</span>
              <strong>{day.title}</strong>
              <span>{day.deliverable}</span>
              <span>
                {done}/{total}
                <ChevronRight size={15} />
              </span>
            </button>
          );
        })}
      </section>
    </>
  );
}

const LAB_FILTERS = [
  "全部",
  "Harness 基础",
  "可靠执行",
  "Agent 评测",
  "生产与面试",
];

function labCategoryForDay(day) {
  if (day <= 7) return "Harness 基础";
  if (day <= 14) return "可靠执行";
  if (day <= 21) return "Agent 评测";
  return "生产与面试";
}

function LabsView({ state, update }) {
  const [filter, setFilter] = useState("全部");
  const visibleDays = plan.filter(
    (day) => filter === "全部" || labCategoryForDay(day.day) === filter,
  );
  const completed = Object.values(state.labDone).filter(Boolean).length;
  const selected = plan[state.selectedDay - 1];
  const lesson = courseForDay(selected.day);

  function selectLab(day) {
    update({ selectedDay: day });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">30 Day Oral Practice</div>
          <h1>面试口述工作台</h1>
          <p>
            每天闭卷回答 5 道 Harness 高频题，再用失败场景和评测追问检验理解。
            mini-swe-agent 实践单独推进，这里只负责八股覆盖与复习。
          </p>
        </div>
        <div className="library-count">
          <strong>
            {completed}/{plan.length}
          </strong>
          <span>口述已完成</span>
        </div>
      </section>

      <div className="lab-workspace">
        <aside className="lab-catalog">
          <div className="lab-catalog-heading">
            <strong>30 次配套口述</strong>
            <span>{visibleDays.length} 个</span>
          </div>
          <div className="lab-filter">
            {LAB_FILTERS.map((item) => (
              <button
                type="button"
                key={item}
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="lab-catalog-list">
            {visibleDays.map((day) => {
              const dayLesson = courseForDay(day.day);
              const done = Boolean(state.labDone[day.day]);
              return (
                <button
                  className={`lab-catalog-item ${
                    selected.day === day.day ? "is-active" : ""
                  }`}
                  type="button"
                  key={day.day}
                  onClick={() => selectLab(day.day)}
                >
                  <span className={`lab-status ${done ? "is-done" : ""}`}>
                    {done ? <Check size={13} /> : String(day.day).padStart(2, "0")}
                  </span>
                  <span>
                    <small>{labCategoryForDay(day.day)}</small>
                    <strong>{dayLesson.lab.title}</strong>
                  </span>
                  <ChevronRight size={15} />
                </button>
              );
            })}
          </div>
        </aside>

        <main className="lab-workbench">
          <CourseLesson
            lesson={lesson}
            done={Boolean(state.labDone[selected.day])}
            onToggle={() =>
              update({
                labDone: {
                  ...state.labDone,
                  [selected.day]: !state.labDone[selected.day],
                },
              })
            }
          />
          <section className="lab-record-section">
            <div className="section-title">
              <div>
                <h2>本次口述记录</h2>
                <span>记录漏掉的要点、没有答住的追问和下一次复习重点</span>
              </div>
              <Code2 size={19} />
            </div>
            <textarea
              value={state.labRecords[selected.day] || ""}
              onChange={(event) =>
                update({
                  labRecords: {
                    ...state.labRecords,
                    [selected.day]: event.target.value,
                  },
                })
              }
              placeholder={`例如：\n必答题：基本答出\n漏掉：tool_call_id 的作用\n追问：副作用工具如何重试\n下次复习：幂等键与 checkpoint`}
              rows={9}
            />
          </section>
        </main>
      </div>
    </>
  );
}

function ResourcesView() {
  const resources = allResources;
  const groups = ["文档", "源码", "论文", "视频"];

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">Learning Library</div>
          <h1>Agent Harness 学习资料库</h1>
          <p>只保留与八股对应的官方文档、论文和基准；实践主线由你单独学习 mini-swe-agent。</p>
        </div>
        <div className="library-count">
          <strong>{resources.length}</strong>
          <span>份资料</span>
        </div>
      </section>

      <div className="resource-library">
        {groups.map((type) => {
          const items = resources.filter((resource) => resource.type === type);
          return (
            <section className="resource-group" key={type}>
              <div className="resource-group-heading">
                <h2>{type}</h2>
                <span>{items.length}</span>
              </div>
              <div className="resource-list">
                {items.map((resource) => (
                  <ResourceRow resource={resource} key={resource.id} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function ReviewView({ state, onConfidence, selectDay }) {
  const [openQuestion, setOpenQuestion] = useState(null);
  const questionRows = plan.flatMap((day) =>
    questionsForDay(day).map((item, index) => ({
      day,
      item,
      index,
      key: `${day.day}-${index}`,
    })),
  );
  const confident = questionRows.filter(
    (row) => state.confidence[row.key] === "confident",
  ).length;

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">Interview Review</div>
          <h1>{questionRows.length} 道 Harness 高频口述题</h1>
          <p>先说结论与因果链，再对照参考答案、回答结构和常见追问。</p>
        </div>
        <div className="review-score">
          <strong>{confident}/{questionRows.length}</strong>
          <span>已掌握</span>
        </div>
      </section>

      <section className="review-list interview-list">
        {questionRows.map(({ day, item, index, key }) => (
          <InterviewQuestion
            key={key}
            day={day}
            index={index}
            item={item}
            open={openQuestion === key}
            status={state.confidence[key] || "unrated"}
            onToggle={() =>
              setOpenQuestion(openQuestion === key ? null : key)
            }
            onConfidence={(value) => onConfidence(key, value)}
            showDay
            onOpenDay={() => selectDay(day.day)}
          />
        ))}
      </section>
    </>
  );
}

export default App;
