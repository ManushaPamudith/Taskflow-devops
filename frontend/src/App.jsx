import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  CheckCheck,
  CheckSquare2,
  Clock3,
  Edit3,
  Filter,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

const API_URL = 'http://127.0.0.1:5000/api/tasks'

const priorityOptions = [
  { value: 'all', label: 'All Priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

const emptyForm = {
  title: '',
  description: '',
  priority: 'medium',
}

function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeView, setActiveView] = useState('tasks')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    loadTasks()
  }, [])

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((task) => task.completed).length
    const pending = total - completed
    const highPriority = tasks.filter((task) => task.priority === 'high').length

    return { total, completed, pending, highPriority }
  }, [tasks])

  const filteredTasks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && !task.completed) ||
        (statusFilter === 'completed' && task.completed)

      const matchesPriority =
        priorityFilter === 'all' || task.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tasks, searchTerm, statusFilter, priorityFilter])

  const groupedTasks = useMemo(
    () => ({
      high: filteredTasks.filter((task) => task.priority === 'high'),
      medium: filteredTasks.filter((task) => task.priority === 'medium'),
      low: filteredTasks.filter((task) => task.priority === 'low'),
    }),
    [filteredTasks],
  )

  const reportStats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((task) => task.completed).length
    const pending = total - completed
    const highPriority = tasks.filter((task) => task.priority === 'high').length
    const mediumPriority = tasks.filter((task) => task.priority === 'medium').length
    const lowPriority = tasks.filter((task) => task.priority === 'low').length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      total,
      completed,
      pending,
      highPriority,
      mediumPriority,
      lowPriority,
      completionRate,
    }
  }, [tasks])

  async function loadTasks() {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(API_URL)

      if (!response.ok) {
        throw new Error('Unable to load tasks right now.')
      }

      const data = await response.json()
      setTasks(data)
    } catch (loadError) {
      setError(loadError.message || 'Something went wrong while loading tasks.')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingTask(null)
    setFormData(emptyForm)
    setIsModalOpen(true)
  }

  function openEditModal(task) {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingTask(null)
    setFormData(emptyForm)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')

      const url = editingTask ? `${API_URL}/${editingTask.id}` : API_URL
      const method = editingTask ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Unable to save task.')
      }

      setTasks((currentTasks) =>
        editingTask
          ? currentTasks.map((task) => (task.id === result.id ? result : task))
          : [...currentTasks, result],
      )
      closeModal()
    } catch (saveError) {
      setError(saveError.message || 'Something went wrong while saving.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleCompleted(task) {
    try {
      const response = await fetch(`${API_URL}/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          priority: task.priority,
          completed: !task.completed,
        }),
      })

      const updatedTask = await response.json()

      if (!response.ok) {
        throw new Error(updatedTask.error || 'Unable to update task.')
      }

      setTasks((currentTasks) =>
        currentTasks.map((item) => (item.id === updatedTask.id ? updatedTask : item)),
      )
    } catch (updateError) {
      setError(updateError.message || 'Something went wrong while updating.')
    }
  }

  async function deleteTask(taskId) {
    if (!window.confirm('Delete this task?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/${taskId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Unable to delete task.')
      }

      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))
    } catch (deleteError) {
      setError(deleteError.message || 'Something went wrong while deleting.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <Sidebar activeView={activeView} onNavigate={setActiveView} />

        <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-slate-950/30 backdrop-blur-xl sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                {activeView === 'reports'
                  ? 'Reports overview'
                  : activeView === 'priority'
                    ? 'Priority workspace'
                    : 'Productivity dashboard'}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                TaskFlow
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                {activeView === 'reports'
                  ? 'A quick summary of how your work is progressing across priorities and completion.'
                  : activeView === 'priority'
                    ? 'A focused view for sorting tasks by priority without losing access to the full workflow.'
                    : 'A polished task management workspace for focused planning, priority sorting, and quick execution.'}
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5 hover:shadow-cyan-500/40"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </button>
          </header>

          {error ? (
            <div className="mb-6 flex items-start gap-3 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-100 shadow-lg shadow-rose-950/20">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{error}</p>
                <button
                  type="button"
                  onClick={loadTasks}
                  className="mt-2 text-sm font-semibold text-white underline-offset-4 hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : null}

          {activeView === 'reports' ? (
            <ReportsView stats={reportStats} tasks={tasks} />
          ) : (
            <>
              <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  icon={LayoutDashboard}
                  label="Total Tasks"
                  value={stats.total}
                  accent="from-cyan-400/20 to-cyan-400/5"
                />
                <StatCard
                  icon={CheckCheck}
                  label="Completed"
                  value={stats.completed}
                  accent="from-emerald-400/20 to-emerald-400/5"
                />
                <StatCard
                  icon={Clock3}
                  label="Pending"
                  value={stats.pending}
                  accent="from-amber-400/20 to-amber-400/5"
                />
                <StatCard
                  icon={BarChart3}
                  label="High Priority"
                  value={stats.highPriority}
                  accent="from-rose-400/20 to-rose-400/5"
                />
              </section>

              <section className="mb-6 rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/20 backdrop-blur-xl sm:p-6">
                <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 transition focus-within:border-cyan-400/40 focus-within:bg-white/8">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search tasks, descriptions, or notes"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {priorityOptions.map((option) => (
                      <FilterButton
                        key={option.value}
                        active={priorityFilter === option.value}
                        onClick={() => setPriorityFilter(option.value)}
                      >
                        {option.label}
                      </FilterButton>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((option) => (
                      <FilterButton
                        key={option.value}
                        active={statusFilter === option.value}
                        onClick={() => setStatusFilter(option.value)}
                      >
                        {option.label}
                      </FilterButton>
                    ))}
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                    <Filter className="h-4 w-4 text-cyan-300" />
                    Showing {filteredTasks.length} of {tasks.length} tasks
                  </div>
                </div>
              </section>
            </>
          )}

          {loading ? (
            <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <TaskSkeleton key={index} />
              ))}
            </section>
          ) : activeView === 'reports' ? null : activeView === 'priority' ? (
            filteredTasks.length === 0 ? (
              <EmptyState onCreateTask={openCreateModal} hasFilter={tasks.length > 0} />
            ) : (
              <section className="grid gap-4 xl:grid-cols-3">
                {['high', 'medium', 'low'].map((priority) => {
                  const items = groupedTasks[priority]

                  if (priorityFilter !== 'all' && priorityFilter !== priority) {
                    return null
                  }

                  return (
                    <PriorityColumn
                      key={priority}
                      priority={priority}
                      tasks={items}
                      onToggleCompleted={toggleCompleted}
                      onEdit={openEditModal}
                      onDelete={deleteTask}
                    />
                  )
                })}
              </section>
            )
          ) : (
            <>
              {filteredTasks.length === 0 ? (
                <EmptyState onCreateTask={openCreateModal} hasFilter={tasks.length > 0} />
              ) : (
                <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleCompleted={() => toggleCompleted(task)}
                      onEdit={() => openEditModal(task)}
                      onDelete={() => deleteTask(task.id)}
                    />
                  ))}
                </section>
              )}
            </>
          )}
        </main>
      </div>

      {isModalOpen ? (
        <TaskModal
          saving={saving}
          editingTask={editingTask}
          formData={formData}
          onChangeFormData={setFormData}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  )
}

function Sidebar({ activeView, onNavigate }) {
  const navItems = [
    { label: 'Tasks', icon: CheckSquare2, value: 'tasks' },
    { label: 'Priority', icon: Filter, value: 'priority' },
    { label: 'Reports', icon: BarChart3, value: 'reports' },
  ]

  return (
    <aside className="border-b border-white/10 bg-slate-900/80 px-4 py-4 shadow-xl shadow-slate-950/30 backdrop-blur-xl lg:w-80 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <div className="flex items-center justify-between lg:hidden">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">TaskFlow</p>
          <p className="text-sm text-slate-400">Work smarter, not harder</p>
        </div>
        <button
          type="button"
          className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-200"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="hidden rounded-3xl border border-white/10 bg-white/5 p-5 lg:block">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-white">TaskFlow</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          A clean command center for planning, tracking, and finishing work with clarity.
        </p>
      </div>

      <nav className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onNavigate(item.value)}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                activeView === item.value
                  ? 'bg-cyan-400/15 text-cyan-100 ring-1 ring-inset ring-cyan-400/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="mt-5 rounded-3xl border border-cyan-400/15 bg-cyan-400/10 p-4 text-sm text-cyan-50">
        <p className="font-semibold">Focus mode</p>
        <p className="mt-1 text-cyan-50/80">
          Keep the highest priority work visible and move the rest through the pipeline.
        </p>
      </div>
    </aside>
  )
}

function PriorityColumn({ priority, tasks, onToggleCompleted, onEdit, onDelete }) {
  const titles = {
    high: 'High Priority',
    medium: 'Medium Priority',
    low: 'Low Priority',
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Priority</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{titles[priority]}</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">
          {tasks.length}
        </span>
      </div>

      <div className="mt-4 grid gap-4">
        {tasks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            No tasks in this priority group.
          </p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleCompleted={() => onToggleCompleted(task)}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task.id)}
            />
          ))
        )}
      </div>
    </section>
  )
}

function ReportsView({ stats, tasks }) {
  const completionWidth = `${stats.completionRate}%`

  return (
    <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="grid gap-4 sm:grid-cols-2">
        <ReportMetric label="Total tasks" value={stats.total} accent="from-cyan-400/20 to-cyan-400/5" />
        <ReportMetric label="Completed tasks" value={stats.completed} accent="from-emerald-400/20 to-emerald-400/5" />
        <ReportMetric label="Pending tasks" value={stats.pending} accent="from-amber-400/20 to-amber-400/5" />
        <ReportMetric label="High priority" value={stats.highPriority} accent="from-rose-400/20 to-rose-400/5" />
        <ReportMetric label="Medium priority" value={stats.mediumPriority} accent="from-indigo-400/20 to-indigo-400/5" />
        <ReportMetric label="Low priority" value={stats.lowPriority} accent="from-emerald-400/20 to-emerald-400/5" />
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Progress</p>
            <h3 className="mt-1 text-lg font-semibold text-white">Task completion</h3>
          </div>
          <div className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-100">
            {stats.completionRate}%
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all"
            style={{ width: completionWidth }}
          />
        </div>

        <div className="mt-6 grid gap-3 text-sm text-slate-300">
          <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
            <span>Completion rate</span>
            <span className="font-semibold text-white">{stats.completionRate}%</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
            <span>Completion gap</span>
            <span className="font-semibold text-white">{100 - stats.completionRate}%</span>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">Recent tasks</p>
          <div className="mt-4 grid gap-3">
            {tasks.slice(0, 3).map((task) => (
              <div key={task.id} className="rounded-2xl bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-white">{task.title}</span>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                    {task.priority}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-slate-400">{task.description || 'No description provided.'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ReportMetric({ label, value, accent }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-gradient-to-br ${accent} p-5 shadow-2xl shadow-slate-950/20 backdrop-blur-xl`}>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-gradient-to-br ${accent} p-5 shadow-2xl shadow-slate-950/20 backdrop-blur-xl`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-cyan-100">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function FilterButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? 'bg-white text-slate-950 shadow-lg shadow-white/10'
          : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function TaskCard({ task, onToggleCompleted, onEdit, onDelete }) {
  const badgeStyles = {
    high: 'bg-rose-500/15 text-rose-200 ring-1 ring-inset ring-rose-500/20',
    medium: 'bg-amber-500/15 text-amber-200 ring-1 ring-inset ring-amber-500/20',
    low: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-inset ring-emerald-500/20',
  }

  return (
    <article className="group rounded-3xl border border-white/10 bg-slate-900/75 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-400/20 hover:bg-slate-900/90">
      <div className="flex items-start gap-4">
        <label className="mt-1 inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={onToggleCompleted}
            className="peer sr-only"
          />
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-white/5 text-transparent transition peer-checked:border-cyan-400 peer-checked:bg-cyan-400 peer-checked:text-slate-950">
            <CheckCheck className="h-4 w-4" />
          </span>
        </label>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3
                className={`truncate text-lg font-semibold tracking-tight ${
                  task.completed ? 'text-slate-400 line-through' : 'text-white'
                }`}
              >
                {task.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">
                {task.description || 'No description provided.'}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${badgeStyles[task.priority]}`}
            >
              {task.priority}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20 hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function TaskSkeleton() {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/65 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
      <div className="animate-pulse space-y-4">
        <div className="flex items-start gap-4">
          <div className="h-6 w-6 rounded-full bg-white/10" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-3/5 rounded-full bg-white/10" />
            <div className="h-4 w-full rounded-full bg-white/10" />
            <div className="h-4 w-5/6 rounded-full bg-white/10" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 rounded-full bg-white/10" />
          <div className="h-9 w-20 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onCreateTask, hasFilter }) {
  return (
    <section className="col-span-full rounded-3xl border border-dashed border-white/15 bg-slate-900/65 p-10 text-center shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/10 text-cyan-200">
        <CheckSquare2 className="h-8 w-8" />
      </div>
      <h3 className="mt-5 text-2xl font-semibold text-white">
        {hasFilter ? 'No tasks match your filters' : 'Your task board is ready'}
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
        {hasFilter
          ? 'Try adjusting search, status, or priority filters to reveal more tasks.'
          : 'Add your first task to start planning work in a clean, focused dashboard.'}
      </p>
      <button
        type="button"
        onClick={onCreateTask}
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
      >
        <Plus className="h-4 w-4" />
        Add Task
      </button>
    </section>
  )
}

function TaskModal({ saving, editingTask, formData, onChangeFormData, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <form
        onSubmit={onSubmit}
        className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-slate-950/40 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">
              {editingTask ? 'Edit task' : 'Add task'}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {editingTask ? 'Update task details' : 'Create a new task'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-5">
          <label className="grid gap-2 text-sm text-slate-300">
            Title
            <input
              type="text"
              value={formData.title}
              onChange={(event) =>
                onChangeFormData((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Write project brief"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:bg-white/8"
              required
            />
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            Description
            <textarea
              value={formData.description}
              onChange={(event) =>
                onChangeFormData((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Add a short note describing the work"
              rows="5"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:bg-white/8"
            />
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            Priority
            <select
              value={formData.priority}
              onChange={(event) =>
                onChangeFormData((current) => ({ ...current, priority: event.target.value }))
              }
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400/40 focus:bg-white/8"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {editingTask ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default App
