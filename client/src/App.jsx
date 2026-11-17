import { useEffect, useState } from 'react'

function formatDueDate(value) {
  if (!value) return ''
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return ''
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(year, month - 1, day))
}

function formatCommentDate(value) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    .format(new Date(value))
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('boardly-token') || '')
  const [authUser, setAuthUser] = useState(() => { try { return JSON.parse(localStorage.getItem('boardly-user') || 'null') } catch { return null } })
  const [authMode, setAuthMode] = useState('login')
  const [authName, setAuthName] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [boards, setBoards] = useState([])
  const [apiMessage, setApiMessage] = useState('Loading boards…')
  const [selectedBoard, setSelectedBoard] = useState(null)
  const [tasks, setTasks] = useState([])
  const [boardLists, setBoardLists] = useState([])
  const [boardMembers, setBoardMembers] = useState([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [acceptCode, setAcceptCode] = useState('')
  const [newListName, setNewListName] = useState('')
  const [tasksMessage, setTasksMessage] = useState('')
  const [activities, setActivities] = useState([])
  const [activityMessage, setActivityMessage] = useState('')
  const [isActivityOpen, setIsActivityOpen] = useState(true)
  const [commentsByTask, setCommentsByTask] = useState({})
  const [openComments, setOpenComments] = useState({})
  const [commentDrafts, setCommentDrafts] = useState({})
  const [commentErrors, setCommentErrors] = useState({})
  const [loadingComments, setLoadingComments] = useState({})
  const [savingCommentTaskId, setSavingCommentTaskId] = useState(null)
  const [isBoardFormOpen, setIsBoardFormOpen] = useState(false)
  const [isBoardSettingsOpen, setIsBoardSettingsOpen] = useState(false)
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [boardTitle, setBoardTitle] = useState('')
  const [boardDescription, setBoardDescription] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskListId, setTaskListId] = useState('')
  const [taskAssigneeId, setTaskAssigneeId] = useState('')
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [deletingTaskId, setDeletingTaskId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  async function apiFetch(url, options = {}) {
    const headers = new Headers(options.headers || {})
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const response = await fetch(url, { ...options, headers })
    if (response.status === 401 && token) {
      localStorage.removeItem('boardly-token'); localStorage.removeItem('boardly-user')
      setToken(''); setAuthUser(null); setAuthError('Your session expired. Please sign in again.')
    }
    return response
  }

  async function handleAuth(event) {
    event.preventDefault(); setAuthError(''); setAuthBusy(true)
    try {
      const response = await fetch(`/api/auth/${authMode === 'register' ? 'register' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: authName, email: authEmail, password: authPassword }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not sign in.')
      localStorage.setItem('boardly-token', data.token); localStorage.setItem('boardly-user', JSON.stringify(data.user))
      setToken(data.token); setAuthUser(data.user); setAuthPassword(''); setAuthError('')
    } catch (error) { setAuthError(error.message || 'Could not sign in.') }
    finally { setAuthBusy(false) }
  }

  useEffect(() => {
    if (!token || !authUser) return
    apiFetch('/api/boards')
      .then((response) => {
        if (!response.ok) throw new Error('Could not load boards')
        return response.json()
      })
      .then((data) => {
        setBoards(Array.isArray(data.boards) ? data.boards : [])
        setApiMessage('Boards loaded from MongoDB')
      })
      .catch(() => setApiMessage('Could not load boards. Check the backend.'))
  }, [token, authUser?._id])

  useEffect(() => {
    if (!selectedBoard) return

    let isCurrent = true
    setTasks([])
    setTasksMessage('Loading tasks…')
    setCommentsByTask({})
    setOpenComments({})
    setCommentDrafts({})
    setCommentErrors({})
    setTaskListId('')
    setTaskAssigneeId('')
    apiFetch(`/api/boards/${selectedBoard._id}/tasks`)
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Could not load tasks.')
        return data
      })
      .then((data) => {
        if (!isCurrent) return
        setTasks(Array.isArray(data.tasks) ? data.tasks : [])
        setTasksMessage('')
      })
      .catch((error) => {
        if (isCurrent) setTasksMessage(error.message || 'Could not load tasks.')
      })

    return () => { isCurrent = false }
  }, [selectedBoard])

  useEffect(() => {
    if (!selectedBoard) return
    let current = true
    Promise.all([
      apiFetch(`/api/boards/${selectedBoard._id}/lists`).then((r) => r.json()),
      apiFetch(`/api/boards/${selectedBoard._id}/team`).then((r) => r.json()),
    ]).then(([listData, teamData]) => {
      if (!current) return
      setBoardLists(Array.isArray(listData.lists) ? listData.lists : [])
      setBoardMembers(Array.isArray(teamData.members) ? teamData.members : [])
    }).catch(() => {})
    return () => { current = false }
  }, [selectedBoard])

  async function handleInvite(event) {
    event.preventDefault(); setInviteMessage(''); setInviteCode('')
    try {
      const response = await apiFetch(`/api/boards/${selectedBoard._id}/team/invite`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: inviteEmail }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not create the invite.')
      setInviteCode(data.inviteCode); setInviteEmail(''); setInviteMessage('Invite created. Share this code with the invited person; it expires in 7 days.')
      const team = await apiFetch(`/api/boards/${selectedBoard._id}/team`).then((r) => r.json())
      setBoardMembers(team.members || [])
    } catch (error) { setInviteMessage(error.message) }
  }

  async function handleAcceptInvite(event) {
    event.preventDefault(); setInviteMessage('')
    try {
      const response = await apiFetch(`/api/auth/invitations/${encodeURIComponent(acceptCode)}/accept`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not accept the invite.')
      setAcceptCode(''); setInviteMessage('Invite accepted. Your boards have been refreshed.')
      const result = await apiFetch('/api/boards').then((r) => r.json()); setBoards(result.boards || [])
    } catch (error) { setInviteMessage(error.message) }
  }

  async function handleCreateList(event) {
    event.preventDefault(); const title = newListName.trim(); if (!title) return
    try {
      const response = await apiFetch(`/api/boards/${selectedBoard._id}/lists`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) })
      const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Could not add list.')
      setBoardLists((current) => [...current, data.list]); setNewListName('')
    } catch (error) { setFormError(error.message) }
  }

  useEffect(() => {
    if (!selectedBoard) return

    let isCurrent = true
    setActivities([])
    setActivityMessage('Loading activity…')
    apiFetch(`/api/boards/${selectedBoard._id}/activities`)
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Could not load activity.')
        return data
      })
      .then((data) => {
        if (!isCurrent) return
        setActivities(Array.isArray(data.activities) ? data.activities : [])
        setActivityMessage('')
      })
      .catch((error) => {
        if (isCurrent) setActivityMessage(error.message || 'Could not load activity.')
      })

    return () => { isCurrent = false }
  }, [selectedBoard])

  async function refreshActivityFeed(boardId = selectedBoard?._id) {
    if (!boardId) return
    try {
      const response = await apiFetch(`/api/boards/${boardId}/activities`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not refresh activity.')
      setActivities(Array.isArray(data.activities) ? data.activities : [])
      setActivityMessage('')
    } catch (error) {
      setActivityMessage(error.message || 'Could not refresh activity.')
    }
  }

  async function handleCreateBoard(event) {
    event.preventDefault()
    setFormError('')
    setIsSaving(true)

    try {
      const response = await apiFetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: boardTitle, description: boardDescription }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not create the board.')

      setBoards((currentBoards) => [data.board, ...currentBoards])
      setApiMessage('Board saved to MongoDB')
      setBoardTitle('')
      setBoardDescription('')
      setIsBoardFormOpen(false)
    } catch (error) {
      setFormError(error.message || 'Could not create the board. Check the backend.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveBoardSettings(event) {
    event.preventDefault(); if (!selectedBoard) return
    setIsSaving(true); setFormError('')
    try {
      const response = await apiFetch(`/api/boards/${selectedBoard._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: boardTitle, description: boardDescription }) })
      const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Could not update the board.')
      setSelectedBoard(data.board); setBoards((current) => current.map((board) => board._id === data.board._id ? data.board : board)); setIsBoardSettingsOpen(false)
    } catch (error) { setFormError(error.message) }
    finally { setIsSaving(false) }
  }

  async function handleCreateTask(event) {
    event.preventDefault()
    if (!selectedBoard) return
    setFormError('')
    setIsSaving(true)

    try {
      const response = await apiFetch(`/api/boards/${selectedBoard._id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle, description: taskDescription, dueDate: taskDueDate || null, ...(taskListId ? { listId: taskListId } : {}), assignedTo: taskAssigneeId || null }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not create the task.')

      setTasks((currentTasks) => [data.task, ...currentTasks])
      await refreshActivityFeed(selectedBoard._id)
      setTaskTitle('')
      setTaskDescription('')
      setTaskDueDate('')
      setTaskListId('')
      setTaskAssigneeId('')
      setIsTaskFormOpen(false)
    } catch (error) {
      setFormError(error.message || 'Could not create the task.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleMoveTask(task, listId) {
    if (String(task.list?._id || task.list || '') === String(listId) || !selectedBoard) return
    setFormError('')

    try {
      const response = await apiFetch(`/api/boards/${selectedBoard._id}/tasks/${task._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not update the task.')
      setTasks((currentTasks) => currentTasks.map((item) => item._id === task._id ? data.task : item))
      await refreshActivityFeed(selectedBoard._id)
    } catch (error) {
      setFormError(error.message || 'Could not update the task.')
    }
  }

  async function handleAssignTask(task, userId) {
    try {
      const response = await apiFetch(`/api/boards/${selectedBoard._id}/tasks/${task._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignedTo: userId || null }) })
      const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Could not assign task.')
      setTasks((current) => current.map((item) => item._id === task._id ? data.task : item))
      await refreshActivityFeed(selectedBoard._id)
    } catch (error) { setFormError(error.message) }
  }

  function startEditingTask(task) {
    setFormError('')
    setEditingTaskId(task._id)
    setEditTitle(task.title)
    setEditDescription(task.description || '')
    setEditDueDate(task.dueDate ? String(task.dueDate).slice(0, 10) : '')
  }

  async function handleSaveTaskEdit(event, task) {
    event.preventDefault()
    if (!selectedBoard) return
    setFormError('')
    setIsSaving(true)

    try {
      const response = await apiFetch(`/api/boards/${selectedBoard._id}/tasks/${task._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          dueDate: editDueDate || null,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not save task changes.')
      setTasks((currentTasks) => currentTasks.map((item) => item._id === task._id ? data.task : item))
      await refreshActivityFeed(selectedBoard._id)
      setEditingTaskId(null)
    } catch (error) {
      setFormError(error.message || 'Could not save task changes.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteTask(task) {
    if (!selectedBoard || !window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return
    setFormError('')
    setDeletingTaskId(task._id)

    try {
      const response = await apiFetch(`/api/boards/${selectedBoard._id}/tasks/${task._id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not delete the task.')
      setTasks((currentTasks) => currentTasks.filter((item) => item._id !== task._id))
      await refreshActivityFeed(selectedBoard._id)
      if (editingTaskId === task._id) setEditingTaskId(null)
    } catch (error) {
      setFormError(error.message || 'Could not delete the task.')
    } finally {
      setDeletingTaskId(null)
    }
  }

  async function toggleTaskComments(task) {
    const taskId = task._id
    if (openComments[taskId]) {
      setOpenComments((current) => ({ ...current, [taskId]: false }))
      return
    }

    setOpenComments((current) => ({ ...current, [taskId]: true }))
    if (Object.hasOwn(commentsByTask, taskId)) return

    setLoadingComments((current) => ({ ...current, [taskId]: true }))
    setCommentErrors((current) => ({ ...current, [taskId]: '' }))
    try {
      const response = await apiFetch(`/api/boards/${selectedBoard._id}/tasks/${taskId}/comments`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not load comments.')
      setCommentsByTask((current) => ({ ...current, [taskId]: Array.isArray(data.comments) ? data.comments : [] }))
    } catch (error) {
      setCommentErrors((current) => ({ ...current, [taskId]: error.message || 'Could not load comments.' }))
    } finally {
      setLoadingComments((current) => ({ ...current, [taskId]: false }))
    }
  }

  async function handleCreateComment(event, task) {
    event.preventDefault()
    const taskId = task._id
    const text = (commentDrafts[taskId] || '').trim()
    if (!text) {
      setCommentErrors((current) => ({ ...current, [taskId]: 'Please write a comment.' }))
      return
    }

    setSavingCommentTaskId(taskId)
    setCommentErrors((current) => ({ ...current, [taskId]: '' }))
    try {
      const response = await apiFetch(`/api/boards/${selectedBoard._id}/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not post the comment.')
      setCommentsByTask((current) => ({
        ...current,
        [taskId]: [...(current[taskId] || []), data.comment],
      }))
      await refreshActivityFeed(selectedBoard._id)
      setCommentDrafts((current) => ({ ...current, [taskId]: '' }))
    } catch (error) {
      setCommentErrors((current) => ({ ...current, [taskId]: error.message || 'Could not post the comment.' }))
    } finally {
      setSavingCommentTaskId(null)
    }
  }

  const inputClass = 'mt-1 w-full rounded-lg border border-[#dfe3dc] px-3 py-2 outline-none focus:border-[#426b55]'

  if (!token || !authUser) return (
    <main className="grid min-h-screen place-items-center bg-[#f7f6f1] px-5 text-[#24352d]">
      <form className="w-full max-w-md rounded-3xl border border-[#eaeae2] bg-white p-8 shadow-sm" onSubmit={handleAuth}>
        <div className="flex items-center gap-3 text-xl font-bold"><span className="grid size-10 place-items-center rounded-xl bg-[#426b55] text-white">b</span> boardly</div>
        <h1 className="mt-8 text-2xl font-semibold">{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="mt-2 text-sm text-[#7d8980]">Sign in to manage your boards and tasks.</p>
        {authMode === 'register' && <><label className="mt-5 block text-sm font-medium" htmlFor="auth-name">Name</label><input className={inputClass} autoComplete="name" id="auth-name" maxLength={80} onChange={(event) => setAuthName(event.target.value)} required value={authName} /></>}
        <label className="mt-5 block text-sm font-medium" htmlFor="auth-email">Email</label><input className={inputClass} autoComplete="email" id="auth-email" onChange={(event) => setAuthEmail(event.target.value)} required type="email" value={authEmail} />
        <label className="mt-4 block text-sm font-medium" htmlFor="auth-password">Password</label><input className={inputClass} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} id="auth-password" minLength={8} onChange={(event) => setAuthPassword(event.target.value)} required type="password" value={authPassword} />
        {authError && <p className="mt-3 text-sm text-red-700" role="alert">{authError}</p>}
        <button className="mt-6 w-full rounded-xl bg-[#426b55] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={authBusy} type="submit">{authBusy ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'}</button>
        <p className="mt-5 text-center text-sm text-[#7d8980]">{authMode === 'login' ? 'New to Boardly?' : 'Already have an account?'} <button className="font-semibold text-[#426b55]" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError('') }} type="button">{authMode === 'login' ? 'Create account' : 'Sign in'}</button></p>
      </form>
    </main>
  )

  return (
    <div className="min-h-screen bg-[#f7f6f1] text-[#24352d]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#e9e9e1] bg-[#fbfaf7] px-5 py-7 lg:block">
        <a className="flex items-center gap-3 text-xl font-bold tracking-tight" href="#home">
          <span className="grid size-9 place-items-center rounded-xl bg-[#426b55] text-lg text-white">b</span> boardly
        </a>
        <button className="mt-10 flex w-full items-center justify-between rounded-xl border border-[#e8e8df] bg-white px-3 py-3 text-left text-sm shadow-sm" type="button">
          <span><span className="block font-semibold">{authUser.name}’s workspace</span><span className="mt-1 block text-xs text-[#8a958d]">Free plan</span></span><span className="text-[#879188]">⌄</span>
        </button>
        <p className="mb-3 mt-9 px-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#99a199]">Workspace</p>
        <nav className="space-y-1 text-sm">
          <button className="flex w-full items-center gap-3 rounded-lg bg-[#e9f0e9] px-3 py-2.5 text-left font-semibold text-[#426b55]" onClick={() => setSelectedBoard(null)} type="button"><span>▦</span> My boards</button>
          <a className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#6f7c73]" href="#tasks"><span>☷</span> My tasks</a>
          <a className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#6f7c73]" href="#team"><span>♧</span> Team</a>
        </nav>
        <div className="absolute inset-x-5 bottom-6 rounded-2xl bg-[#edf1e9] p-4">
          <p className="text-sm font-semibold">A little progress adds up.</p><p className="mt-1 text-xs leading-5 text-[#78867a]">Keep your team in sync, one task at a time.</p>
          <div className="mt-4 h-1.5 rounded-full bg-white"><div className="h-1.5 w-2/3 rounded-full bg-[#73977b]" /></div>
        </div>
      </aside>

      <main className="mx-auto max-w-6xl px-5 pb-16 pt-6 sm:px-8 lg:ml-64 lg:px-12 lg:pt-9">
        <header className="flex items-center justify-between border-b border-[#e9e9e1] pb-5">
          <a className="flex items-center gap-2 text-lg font-bold lg:hidden" href="#home"><span className="grid size-8 place-items-center rounded-lg bg-[#426b55] text-white">b</span> boardly</a>
          <div className="hidden items-center gap-2 text-sm text-[#89948b] lg:flex">
            <button className="hover:text-[#426b55]" onClick={() => setSelectedBoard(null)} type="button">Workspace</button><span>›</span><span className="font-medium text-[#43564a]">{selectedBoard ? selectedBoard.title : 'My boards'}</span>
          </div>
          <button aria-label="Sign out" className="grid size-9 place-items-center rounded-full bg-[#e7d5c2] text-xs font-bold text-[#765e4a]" onClick={() => { localStorage.removeItem('boardly-token'); localStorage.removeItem('boardly-user'); setToken(''); setAuthUser(null); setSelectedBoard(null); setBoards([]) }} title="Sign out" type="button">{authUser.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</button>
        </header>

        {selectedBoard ? (
          <>
            <section className="flex flex-col justify-between gap-6 pt-10 sm:flex-row sm:items-end sm:pt-14">
              <div>
                <button className="mb-3 text-sm font-medium text-[#718077] hover:text-[#426b55]" onClick={() => { setSelectedBoard(null); setIsTaskFormOpen(false); setEditingTaskId(null); setFormError('') }} type="button">← All boards</button>
                <p className="text-sm text-[#859188]">Boards / {selectedBoard.title}</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{selectedBoard.title}</h1>
                <p className="mt-3 text-[#7d8980]">{selectedBoard.description || 'Keep your team’s work moving forward.'}</p>
              </div>
              <div className="flex gap-2">{String(selectedBoard.owner) === String(authUser._id) && <button className="rounded-xl border border-[#dfe3dc] px-4 py-3 text-sm font-semibold text-[#426b55]" onClick={() => { setBoardTitle(selectedBoard.title); setBoardDescription(selectedBoard.description || ''); setIsBoardSettingsOpen((open) => !open); setFormError('') }} type="button">Board settings</button>}<button className="rounded-xl bg-[#426b55] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#355b47]" onClick={() => { setIsTaskFormOpen((open) => !open); setFormError('') }} type="button">＋ <span className="ml-1">{isTaskFormOpen ? 'Cancel' : 'Add task'}</span></button></div>
            </section>

            {isBoardSettingsOpen && <form className="mt-5 max-w-xl rounded-2xl border border-[#eaeae2] bg-white p-5" onSubmit={handleSaveBoardSettings}><h2 className="font-semibold">Board settings</h2><label className="mt-4 block text-sm font-medium" htmlFor="settings-board-title">Board title</label><input className={inputClass} id="settings-board-title" maxLength={100} onChange={(event) => setBoardTitle(event.target.value)} required value={boardTitle} /><label className="mt-4 block text-sm font-medium" htmlFor="settings-board-description">Description</label><textarea className={inputClass} id="settings-board-description" maxLength={500} onChange={(event) => setBoardDescription(event.target.value)} rows={3} value={boardDescription} />{formError && <p className="mt-3 text-sm text-red-700" role="alert">{formError}</p>}<div className="mt-4 flex gap-2"><button className="rounded-lg bg-[#426b55] px-3 py-2 text-sm font-semibold text-white" disabled={isSaving} type="submit">Save settings</button><button className="rounded-lg border border-[#dfe3dc] px-3 py-2 text-sm" onClick={() => setIsBoardSettingsOpen(false)} type="button">Cancel</button></div></form>}

            <section className="mt-6 grid gap-4 rounded-2xl border border-[#eaeae2] bg-white p-5 sm:grid-cols-2">
              {String(selectedBoard.owner) === String(authUser._id) && <form className="flex gap-2" onSubmit={handleInvite}><label className="sr-only" htmlFor="invite-email">Invite by email</label><input className="min-w-0 flex-1 rounded-lg border border-[#dfe3dc] px-3 py-2 text-sm" id="invite-email" onChange={(event) => setInviteEmail(event.target.value)} placeholder="Teammate email" required type="email" value={inviteEmail} /><button className="rounded-lg bg-[#426b55] px-3 py-2 text-sm font-semibold text-white" type="submit">Invite</button></form>}
              {String(selectedBoard.owner) === String(authUser._id) && <form className="flex gap-2" onSubmit={handleCreateList}><label className="sr-only" htmlFor="new-list-name">New list name</label><input className="min-w-0 flex-1 rounded-lg border border-[#dfe3dc] px-3 py-2 text-sm" id="new-list-name" onChange={(event) => setNewListName(event.target.value)} placeholder="New list name" required value={newListName} /><button className="rounded-lg border border-[#dfe3dc] px-3 py-2 text-sm font-semibold text-[#426b55]" type="submit">Add list</button></form>}
              {(inviteMessage || inviteCode) && <div className="text-sm text-[#55735d]">{inviteMessage}{inviteCode && <p className="mt-2 break-all rounded bg-[#f7f8f4] p-2 font-mono text-xs">Invite code: {inviteCode}</p>}</div>}
              {boardMembers.length > 0 && <div className="text-sm"><p className="mb-2 font-semibold">Board members</p><ul className="space-y-1 text-[#718077]">{boardMembers.map((member) => <li className="flex justify-between gap-2" key={member._id}><span>{member.user?.name || member.invitedEmail} · {member.status}</span>{String(selectedBoard.owner) === String(authUser._id) && <button className="text-xs text-red-700" onClick={async () => { if (!window.confirm('Remove this member or invite?')) return; const response = await apiFetch(`/api/boards/${selectedBoard._id}/team/${member._id}`, { method: 'DELETE' }); if (response.ok) setBoardMembers((current) => current.filter((item) => item._id !== member._id)) }} type="button">Remove</button>}</li>)}</ul></div>}
            </section>

            {isTaskFormOpen && (
              <form className="mt-6 max-w-xl rounded-2xl border border-[#eaeae2] bg-white p-5" onSubmit={handleCreateTask}>
                <h2 className="text-lg font-semibold">Add a task</h2>
                <label className="mt-4 block text-sm font-medium" htmlFor="task-title">Task title</label>
                <input className={inputClass} id="task-title" maxLength={120} onChange={(event) => setTaskTitle(event.target.value)} placeholder="For example, Draft the homepage" required value={taskTitle} />
                <label className="mt-4 block text-sm font-medium" htmlFor="task-description">Description (optional)</label>
                <textarea className={inputClass} id="task-description" maxLength={500} onChange={(event) => setTaskDescription(event.target.value)} placeholder="Add a few details" rows={3} value={taskDescription} />
                <label className="mt-4 block text-sm font-medium" htmlFor="task-due-date">Due date (optional)</label>
                <input className={inputClass} id="task-due-date" onChange={(event) => setTaskDueDate(event.target.value)} type="date" value={taskDueDate} />
                <label className="mt-4 block text-sm font-medium" htmlFor="task-list">List</label>
                <select className={inputClass} id="task-list" onChange={(event) => setTaskListId(event.target.value)} value={taskListId || boardLists[0]?._id || ''}>{boardLists.map((list) => <option key={list._id} value={list._id}>{list.title}</option>)}</select>
                <label className="mt-4 block text-sm font-medium" htmlFor="task-assignee">Assign to</label>
                <select className={inputClass} id="task-assignee" onChange={(event) => setTaskAssigneeId(event.target.value)} value={taskAssigneeId}><option value="">Unassigned</option><option value={authUser._id}>{authUser.name} (you)</option>{boardMembers.filter((member) => member.status === 'active' && member.user && String(member.user._id) !== String(authUser._id)).map((member) => <option key={member._id} value={member.user._id}>{member.user.name}</option>)}</select>
                {formError && <p className="mt-3 text-sm text-red-700" role="alert">{formError}</p>}
                <button className="mt-4 rounded-xl bg-[#426b55] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={isSaving} type="submit">{isSaving ? 'Saving…' : 'Save task'}</button>
              </form>
            )}

            {!isTaskFormOpen && formError && <p className="mt-4 text-sm text-red-700" role="alert">{formError}</p>}

            <section aria-label="Task board" className="mt-8 grid gap-4 overflow-x-auto pb-3 md:grid-cols-3">
              {boardLists.map((status) => {
                const statusTasks = tasks.filter((task) => String(task.list?._id || task.list || '') === String(status._id))
                return (
                  <div className="min-w-0 rounded-2xl bg-[#eff0eb] p-4 sm:p-5" key={status._id}>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center justify-between gap-2"><h2 className="font-semibold">{status.title}<span className="ml-2 rounded-full bg-white/80 px-2 py-1 text-xs font-medium text-[#718077]">{statusTasks.length}</span></h2>{String(selectedBoard.owner) === String(authUser._id) && <div className="flex gap-1"><button aria-label={`Rename ${status.title}`} className="text-xs text-[#718077]" onClick={async () => { const title = window.prompt('List name', status.title)?.trim(); if (!title) return; const response = await apiFetch(`/api/boards/${selectedBoard._id}/lists/${status._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) }); const data = await response.json(); if (response.ok) setBoardLists((current) => current.map((list) => list._id === status._id ? data.list : list)); else setFormError(data.message) }} type="button">Edit</button><button aria-label={`Delete ${status.title}`} className="text-xs text-red-700" onClick={async () => { if (!window.confirm(`Delete list “${status.title}”?`)) return; const response = await apiFetch(`/api/boards/${selectedBoard._id}/lists/${status._id}`, { method: 'DELETE' }); const data = await response.json(); if (response.ok) setBoardLists((current) => current.filter((list) => list._id !== status._id)); else setFormError(data.message) }} type="button">Delete</button></div>}</div>
                      <button aria-label={`Add task to ${status.title}`} className="text-lg text-[#718077] hover:text-[#426b55]" onClick={() => { setTaskListId(status._id); setIsTaskFormOpen(true); setFormError('') }} type="button">＋</button>
                    </div>
                    <div className="space-y-3">
                      {statusTasks.map((task) => (
                        <article className="rounded-xl border border-[#e8e9e2] bg-white p-4 shadow-sm" key={task._id}>
                          {editingTaskId === task._id ? (
                            <form onSubmit={(event) => handleSaveTaskEdit(event, task)}>
                              <label className="block text-sm font-medium" htmlFor={`edit-task-title-${task._id}`}>Task title</label>
                              <input className={inputClass} id={`edit-task-title-${task._id}`} maxLength={120} onChange={(event) => setEditTitle(event.target.value)} required value={editTitle} />
                              <label className="mt-3 block text-sm font-medium" htmlFor={`edit-task-description-${task._id}`}>Description</label>
                              <textarea className={inputClass} id={`edit-task-description-${task._id}`} maxLength={500} onChange={(event) => setEditDescription(event.target.value)} rows={3} value={editDescription} />
                              <label className="mt-3 block text-sm font-medium" htmlFor={`edit-task-due-date-${task._id}`}>Due date</label>
                              <input className={inputClass} id={`edit-task-due-date-${task._id}`} onChange={(event) => setEditDueDate(event.target.value)} type="date" value={editDueDate} />
                              <div className="mt-4 flex gap-2">
                                <button className="rounded-lg bg-[#426b55] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60" disabled={isSaving} type="submit">{isSaving ? 'Saving…' : 'Save changes'}</button>
                                <button className="rounded-lg border border-[#dfe3dc] px-3 py-2 text-xs font-semibold text-[#66746a]" onClick={() => { setEditingTaskId(null); setFormError('') }} type="button">Cancel</button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <h3 className="font-semibold">{task.title}</h3>
                              <p className="mt-2 min-h-5 text-sm leading-5 text-[#89948b]">{task.description || 'No description'}</p>
                              {task.dueDate && <p className="mt-3 text-xs font-medium text-[#8b6f3e]">Due {formatDueDate(task.dueDate)}</p>}
                              <div className="mt-4 flex items-center justify-between gap-2">
                                <label className="sr-only" htmlFor={`task-status-${task._id}`}>Move {task.title}</label>
                                <select className="rounded-lg border border-[#e5e8e1] bg-[#fbfaf7] px-2.5 py-1.5 text-xs font-medium text-[#55735d] outline-none focus:border-[#426b55]" id={`task-status-${task._id}`} onChange={(event) => handleMoveTask(task, event.target.value)} value={String(task.list?._id || task.list || '')}>
                                  {boardLists.map((option) => <option key={option._id} value={option._id}>{option.title}</option>)}
                                </select>
                                <select aria-label={`Assign ${task.title}`} className="max-w-28 rounded-lg border border-[#e5e8e1] bg-[#fbfaf7] px-2 py-1.5 text-xs text-[#55735d]" onChange={(event) => handleAssignTask(task, event.target.value)} value={task.assignedTo?._id || task.assignedTo || ''}><option value="">Unassigned</option><option value={authUser._id}>{authUser.name} (you)</option>{boardMembers.filter((member) => member.status === 'active' && member.user && String(member.user._id) !== String(authUser._id)).map((member) => <option key={member._id} value={member.user._id}>{member.user.name}</option>)}</select>
                                <div className="flex items-center gap-1">
                                  <button className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#55735d] hover:bg-[#edf1e9]" onClick={() => startEditingTask(task)} type="button">Edit</button>
                                  <button className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#a34438] hover:bg-[#fbefed] disabled:opacity-50" disabled={deletingTaskId === task._id} onClick={() => handleDeleteTask(task)} type="button">{deletingTaskId === task._id ? 'Deleting…' : 'Delete'}</button>
                                </div>
                              </div>
                              <button className="mt-3 text-xs font-semibold text-[#55735d] hover:text-[#355b47]" onClick={() => toggleTaskComments(task)} type="button">
                                {openComments[task._id] ? 'Hide comments' : `Comments${Object.hasOwn(commentsByTask, task._id) ? ` (${commentsByTask[task._id].length})` : ''}`}
                              </button>
                              {openComments[task._id] && (
                                <div className="mt-3 border-t border-[#edf0e9] pt-3">
                                  {loadingComments[task._id] && <p className="text-xs text-[#89948b]" role="status">Loading comments…</p>}
                                  <div className="space-y-3">
                                    {(commentsByTask[task._id] || []).map((comment) => (
                                      <div className="rounded-lg bg-[#f7f8f4] p-3" key={comment._id}>
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-xs font-semibold">{comment.authorName}</span>
                                          <time className="text-[10px] text-[#9aa39c]" dateTime={comment.createdAt}>{formatCommentDate(comment.createdAt)}</time>
                                        </div>
                                        <p className="mt-1 whitespace-pre-wrap text-sm text-[#66746a]">{comment.text}</p>
                                      </div>
                                    ))}
                                    {!loadingComments[task._id] && Object.hasOwn(commentsByTask, task._id) && commentsByTask[task._id].length === 0 && <p className="text-xs text-[#89948b]">No comments yet.</p>}
                                  </div>
                                  <form className="mt-3" onSubmit={(event) => handleCreateComment(event, task)}>
                                    <label className="sr-only" htmlFor={`comment-${task._id}`}>Add a comment to {task.title}</label>
                                    <textarea className={inputClass} id={`comment-${task._id}`} maxLength={1000} onChange={(event) => setCommentDrafts((current) => ({ ...current, [task._id]: event.target.value }))} placeholder="Write a comment…" rows={2} value={commentDrafts[task._id] || ''} />
                                    <div className="mt-2 flex items-center justify-between gap-2">
                                      <span className="text-[10px] text-[#9aa39c]">Commenting as {authUser.name}</span>
                                      <button className="rounded-lg bg-[#426b55] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60" disabled={savingCommentTaskId === task._id} type="submit">{savingCommentTaskId === task._id ? 'Posting…' : 'Post comment'}</button>
                                    </div>
                                  </form>
                                  {commentErrors[task._id] && <p className="mt-2 text-xs text-red-700" role="alert">{commentErrors[task._id]}</p>}
                                </div>
                              )}
                            </>
                          )}
                        </article>
                      ))}
                      {statusTasks.length === 0 && !tasksMessage && <p className="rounded-xl border border-dashed border-[#d9ddd5] px-4 py-6 text-center text-sm text-[#929b94]">No tasks here yet.</p>}
                    </div>
                  </div>
                )
              })}
            </section>
            <section className="mt-5 rounded-2xl border border-[#eaeae2] bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Recent activity</h2>
                  <p className="mt-1 text-xs text-[#89948b]">Updates to tasks and comments on this board.</p>
                </div>
                <button aria-expanded={isActivityOpen} className="rounded-lg px-3 py-2 text-sm font-semibold text-[#55735d] hover:bg-[#edf1e9]" onClick={() => setIsActivityOpen((open) => !open)} type="button">
                  {isActivityOpen ? 'Hide' : 'Show'}
                </button>
              </div>
              {isActivityOpen && (
                <div className="mt-4">
                  {activityMessage && <p className="text-sm text-[#89948b]" role="status">{activityMessage}</p>}
                  {!activityMessage && activities.length === 0 && <p className="text-sm text-[#89948b]">No activity yet. Task and comment updates will appear here.</p>}
                  {activities.length > 0 && (
                    <ol className="divide-y divide-[#edf0e9]">
                      {activities.map((activity) => (
                        <li className="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between" key={activity._id}>
                          <p className="text-sm"><span className="font-semibold">{activity.actorName}</span> {activity.action} <span className="font-medium text-[#426b55]">{activity.targetName}</span></p>
                          <time className="shrink-0 text-xs text-[#9aa39c]" dateTime={activity.createdAt}>{formatCommentDate(activity.createdAt)}</time>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </section>
            {tasksMessage && <p className="mt-4 text-sm text-[#89948b]" role="status">{tasksMessage}</p>}
          </>
        ) : (
          <>
            <section className="pt-10 sm:pt-14" id="home">
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                <div><p className="text-sm font-medium text-[#859188]">{today}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{greeting}, {authUser.name} <span className="text-[#c99c5b]">✳</span></h1><p className="mt-3 text-[#7d8980]">Here’s what’s happening across your workspace.</p></div>
                <button className="rounded-xl bg-[#426b55] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#355b47]" onClick={() => { setIsBoardFormOpen((open) => !open); setFormError('') }} type="button">＋ <span className="ml-1">{isBoardFormOpen ? 'Cancel' : 'Create a board'}</span></button>
              </div>
            </section>

            {isBoardFormOpen && (
              <form className="mt-6 max-w-xl rounded-2xl border border-[#eaeae2] bg-white p-5" onSubmit={handleCreateBoard}>
                <h2 className="text-lg font-semibold">Create a board</h2>
                <label className="mt-4 block text-sm font-medium" htmlFor="board-title">Board title</label>
                <input className={inputClass} id="board-title" maxLength={100} onChange={(event) => setBoardTitle(event.target.value)} placeholder="For example, Website redesign" required value={boardTitle} />
                <label className="mt-4 block text-sm font-medium" htmlFor="board-description">Description (optional)</label>
                <textarea className={inputClass} id="board-description" maxLength={500} onChange={(event) => setBoardDescription(event.target.value)} placeholder="What is this board for?" rows={3} value={boardDescription} />
                {formError && <p className="mt-3 text-sm text-red-700" role="alert">{formError}</p>}
                <button className="mt-4 rounded-xl bg-[#426b55] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={isSaving} type="submit">{isSaving ? 'Saving…' : 'Save board'}</button>
              </form>
            )}

            <form className="mt-5 flex max-w-xl gap-2" onSubmit={handleAcceptInvite}><label className="sr-only" htmlFor="accept-invite-code">Accept a board invite</label><input className="min-w-0 flex-1 rounded-lg border border-[#dfe3dc] bg-white px-3 py-2 text-sm" id="accept-invite-code" onChange={(event) => setAcceptCode(event.target.value)} placeholder="Have an invite code? Paste it here" required value={acceptCode} /><button className="rounded-lg border border-[#dfe3dc] px-3 py-2 text-sm font-semibold text-[#426b55]" type="submit">Join board</button></form>
            {inviteMessage && <p className="mt-2 text-sm text-[#55735d]">{inviteMessage}</p>}

            <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Workspace summary">
              {[
                ['Active boards', boards.length, 'Across your workspace'],
                ['Tasks in progress', '—', 'Open a board to view tasks'],
                ['Tasks completed', '—', 'Track progress by board'],
              ].map(([label, value, note]) => <article className="rounded-2xl border border-[#eaeae2] bg-white p-5" key={label}><p className="text-sm text-[#87928a]">{label}</p><p className="mt-3 text-3xl font-semibold">{value}</p><p className="mt-2 text-xs text-[#9aa39c]">{note}</p></article>)}
            </section>

            <section className="mt-12" id="boards">
              <div className="mb-5"><h2 className="text-xl font-semibold">Your boards</h2><p className="mt-1 text-sm text-[#89948b]">Pick up where your team left off.</p></div>
              {boards.length === 0 && <p className="rounded-2xl border border-dashed border-[#dfe3dc] bg-white px-5 py-8 text-center text-sm text-[#89948b]">No boards yet. Create one to get started.</p>}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {boards.map((board) => (
                  <button className="rounded-2xl border border-[#eaeae2] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#cbd9cc] hover:shadow-sm" key={board._id} onClick={() => { setSelectedBoard(board); setFormError('') }} type="button">
                    <span className="flex items-start justify-between gap-3"><span className="font-semibold">{board.title}</span><span aria-hidden="true" className="text-[#839188]">↗</span></span>
                    <span className="mt-2 block text-sm text-[#929b94]">{board.description || 'No description yet'}</span>
                    <span className="mt-5 block text-xs font-semibold text-[#55735d]">Open board →</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
        <footer className="mt-12 border-t border-[#e9e9e1] pt-5 text-xs text-[#9aa39c]">{selectedBoard ? 'Tasks saved to MongoDB' : apiMessage} · Boardly</footer>
      </main>
    </div>
  )
}

export default App
