// ============================================================
// J人夏夏 · 星星人工作台
// ============================================================

const STORAGE_KEY = 'jrenxiaxia_data';

// 默认数据结构
function getDefaultData() {
    const today = getTodayStr();
    return {
        // 养生
        supplementChecks: {},     // { '2026-08-11': ['s1','s2',...] }
        supplementStreak: 0,      // 当前连续天数
        supplementLastDate: null, // 上次完成全部5项的日期
        exerciseChecks: {},       // { '2026-08-11': 'e1' }
        exerciseOtherText: {},    // { '2026-08-11': '游泳' }
        sleepTimes: {},           // { '2026-08-11': '22:30' }

        // 学习
        courses: [
            { id: 'c1', name: '法规', stage: '未开始', progress: 0, lessons: [] },
            { id: 'c2', name: '管理', stage: '未开始', progress: 0, lessons: [] },
            { id: 'c3', name: '技术', stage: '未开始', progress: 0, lessons: [] },
            { id: 'c4', name: '实务', stage: '未开始', progress: 0, lessons: [] },
        ],

        // 项目工作
        projects: [],             // [{ id, name, tasks: [{ id, title, priority, deadline, status }] }]

        // 党建
        partyTasks: [],           // [{ id, title, priority, deadline, status, createdAt }]

        // 其他工作
        otherTasks: [],           // [{ id, title, priority, deadline, status, createdAt }]

        // 周月复盘
        monthlyReviews: {},       // { '2026-08': { planned: [{week, goals}], actual: [{week, done}], notes: '' } }
    };
}

// ── 数据管理 ──
let appData = getDefaultData();

function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            appData = deepMerge(getDefaultData(), parsed);
        }
    } catch (e) {
        console.error('数据加载失败', e);
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (e) {
        console.error('数据保存失败', e);
    }
}

function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
}

function getTodayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function getMonthStr(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
}

function getWeekOfMonth(date) {
    const d = date || new Date();
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    const firstDayOfWeek = firstDay.getDay() || 7;
    const dayOfMonth = d.getDate();
    return Math.ceil((dayOfMonth + firstDayOfWeek - 1) / 7);
}

function genId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

// ── 初始化 ──
loadData();

// ── 导航切换 ──
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        const panelId = item.dataset.panel;
        document.getElementById(panelId).classList.add('active');
        // 渲染对应面板
        renderPanel(panelId);
    });
});

// ── 全局渲染调度 ──
function renderAll() {
    const activePanel = document.querySelector('.panel.active');
    if (activePanel && activePanel.id === 'panel-0') {
        renderSummary();
    }
    updateBadge();
}

function renderPanel(panelId) {
    switch (panelId) {
        case 'panel-0': renderSummary(); break;
        case 'panel-1': renderHealth(); break;
        case 'panel-2': renderStudy(); break;
        case 'panel-3': renderProject(); break;
        case 'panel-4': renderParty(); break;
        case 'panel-5': renderOther(); break;
        case 'panel-6': renderReview(); break;
    }
}

function updateBadge() {
    const today = getTodayStr();
    let count = 0;
    // 补剂未完成数
    const supDone = (appData.supplementChecks[today] || []).length;
    if (supDone < 5) count += (5 - supDone);
    // 运动未完成
    if (!appData.exerciseChecks[today]) count += 1;
    // 项目待办
    appData.projects.forEach(p => {
        p.tasks.forEach(t => {
            if (t.status !== 'done' && (!t.deadline || t.deadline === today)) count++;
        });
    });
    // 党建待办
    appData.partyTasks.forEach(t => {
        if (t.status !== 'done' && (!t.deadline || t.deadline === today)) count++;
    });
    // 其他待办
    appData.otherTasks.forEach(t => {
        if (t.status !== 'done' && (!t.deadline || t.deadline === today)) count++;
    });
    document.getElementById('badge-0').textContent = count;
}

// ============================================================
// 模块0：今日计划汇总
// ============================================================
function renderSummary() {
    const today = getTodayStr();
    document.getElementById('todayDate').textContent = today + ' · ' + getWeekdayCN(new Date());

    let html = '';

    // ── 养生部分 ──
    html += '<div class="card"><div class="card-title"><span class="icon"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/></svg></span>养生计划</div><ul class="checklist">';
    const supItems = [
        { id: 's1', label: '晨起 · 优甲乐 0.5粒' },
        { id: 's2', label: '随早餐 · 叶酸 1粒' },
        { id: 's3', label: '随中餐 · 鱼油 1粒' },
        { id: 's4', label: '中餐后 · 维生素D 1粒' },
        { id: 's5', label: '晚饭后 · 益生菌 1粒' },
    ];
    const todaySup = appData.supplementChecks[today] || [];
    supItems.forEach(si => {
        const done = todaySup.includes(si.id);
        html += `<li class="${done?'done':''}" onclick="toggleSupplement('${si.id}')"><span class="checkbox"></span><span class="task-label">${si.label}</span></li>`;
    });

    const todayEx = appData.exerciseChecks[today];
    const exLabels = { e1: '八段锦', e2: '跳操', e3: '遛狗', e4: '其他' };
    if (todayEx) {
        let exLabel = exLabels[todayEx] || '其他';
        if (todayEx === 'e4') exLabel += '：' + (appData.exerciseOtherText[today] || '');
        html += `<li class="done"><span class="checkbox"></span><span class="task-label">运动：${exLabel}</span></li>`;
    } else {
        html += `<li><span class="checkbox"></span><span class="task-label">运动：尚未完成</span></li>`;
    }

    const sleepTime = appData.sleepTimes[today];
    if (sleepTime) {
        const isGood = sleepTime <= '23:00';
        html += `<li class="${isGood?'done':''}"><span class="checkbox"></span><span class="task-label">睡觉时间：${sleepTime} ${isGood?'<span class="sleep-ok">✓ 11点前</span>':'<span class="sleep-bad">✗ 超过11点</span>'}</span></li>`;
    } else {
        html += `<li><span class="checkbox"></span><span class="task-label">睡觉时间：未填写</span></li>`;
    }
    html += '</ul></div>';

    // ── 项目工作 ──
    html += renderTaskGroupSummary('项目', '项目工作', appData.projects);

    // ── 党建工作 ──
    html += renderTaskGroupSummary('党建', '党建工作', [{ name: '党建', tasks: appData.partyTasks }]);

    // ── 其他工作 ──
    html += renderTaskGroupSummary('其他', '其他工作', [{ name: '其他', tasks: appData.otherTasks }]);

    document.getElementById('summary-content').innerHTML = html || '<div class="empty-state"><div class="empty-icon">⭐</div><p>今天还没有待办事项～</p></div>';
}

function renderTaskGroupSummary(iconText, titleText, projects) {
    let html = '';
    const today = getTodayStr();
    projects.forEach(proj => {
        const todayTasks = proj.tasks.filter(t => t.status !== 'done' && (!t.deadline || t.deadline === today));
        if (todayTasks.length === 0 && proj.tasks.filter(t => t.status === 'done' && t.deadline === today).length === 0) return;
        html += `<div class="card"><div class="card-title"><span class="icon"><svg viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z" fill="currentColor"/></svg></span>${titleText}${proj.name !== '其他' && proj.name !== '党建' ? ' · ' + proj.name : ''}</div><ul class="checklist">`;

        const allToday = proj.tasks.filter(t => !t.deadline || t.deadline === today);
        const sorted = [...allToday].sort((a, b) => {
            if (a.status === 'done' && b.status !== 'done') return 1;
            if (a.status !== 'done' && b.status === 'done') return -1;
            const prio = { high: 0, mid: 1, low: 2 };
            return (prio[a.priority] || 2) - (prio[b.priority] || 2);
        });

        sorted.forEach(t => {
            const done = t.status === 'done';
            const prioTag = t.priority ? `<span class="tag tag-${t.priority}">${t.priority==='high'?'高':t.priority==='mid'?'中':'低'}</span>` : '';
            html += `<li class="${done?'done':''}" onclick="${done?'':`toggleTaskStatus('${getTaskSource(proj.name, projects)}','${t.id}')`}"><span class="checkbox"></span><span class="task-label">${t.title}</span>${prioTag}${t.deadline?`<span class="task-meta">${t.deadline}</span>`:''}</li>`;
        });

        if (allToday.length === 0) {
            html += '<li style="color:var(--text-muted);cursor:default;">暂无今日待办</li>';
        }
        html += '</ul></div>';
    });
    return html;
}

function getTaskSource(projName, projects) {
    if (projName === '党建') return 'party';
    if (projName === '其他') return 'other';
    return 'project';
}

function toggleTaskStatus(source, taskId) {
    if (source === 'party') {
        const t = appData.partyTasks.find(x => x.id === taskId);
        if (t) { t.status = t.status === 'done' ? 'pending' : 'done'; saveData(); renderSummary(); updateBadge(); }
    } else if (source === 'other') {
        const t = appData.otherTasks.find(x => x.id === taskId);
        if (t) { t.status = t.status === 'done' ? 'pending' : 'done'; saveData(); renderSummary(); updateBadge(); }
    } else {
        for (const proj of appData.projects) {
            const t = proj.tasks.find(x => x.id === taskId);
            if (t) { t.status = t.status === 'done' ? 'pending' : 'done'; saveData(); renderSummary(); updateBadge(); return; }
        }
    }
}

// ============================================================
// 模块1：养生计划
// ============================================================
function renderHealth() {
    const today = getTodayStr();
    const todaySup = appData.supplementChecks[today] || [];

    // 补剂勾选状态
    document.querySelectorAll('#supplement-list li').forEach(li => {
        const id = li.dataset.id;
        if (todaySup.includes(id)) li.classList.add('done');
        else li.classList.remove('done');
    });

    // 连续天数
    document.getElementById('supplement-streak').textContent = `连续 ${appData.supplementStreak} 天`;

    // 运动勾选
    const todayEx = appData.exerciseChecks[today];
    document.querySelectorAll('#exercise-list li').forEach(li => {
        if (li.dataset.id === todayEx) li.classList.add('done');
        else li.classList.remove('done');
    });
    document.getElementById('exercise-other-input').value = appData.exerciseOtherText[today] || '';

    // 睡觉时间
    const sleepInput = document.getElementById('sleep-time');
    sleepInput.value = appData.sleepTimes[today] || '23:00';
    updateSleepStatus();
}

document.getElementById('supplement-list').addEventListener('click', function(e) {
    const li = e.target.closest('li');
    if (!li) return;
    toggleSupplement(li.dataset.id);
});

function toggleSupplement(id) {
    const today = getTodayStr();
    if (!appData.supplementChecks[today]) appData.supplementChecks[today] = [];
    const arr = appData.supplementChecks[today];
    if (arr.includes(id)) {
        arr.splice(arr.indexOf(id), 1);
    } else {
        arr.push(id);
    }
    // 更新连续天数
    updateSupplementStreak();
    saveData();
    const activePanel = document.querySelector('.panel.active');
    if (activePanel && activePanel.id === 'panel-1') renderHealth();
    else if (activePanel && activePanel.id === 'panel-0') renderSummary();
    updateBadge();
}

function updateSupplementStreak() {
    // 从今天往前数连续全部完成的天数
    let streak = 0;
    const d = new Date();
    while (true) {
        const ds = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        const checks = appData.supplementChecks[ds] || [];
        if (checks.length >= 5) {
            streak++;
            d.setDate(d.getDate() - 1);
        } else {
            break;
        }
    }
    appData.supplementStreak = streak;
}

document.getElementById('exercise-list').addEventListener('click', function(e) {
    const li = e.target.closest('li');
    if (!li || li.dataset.id === 'e4') return; // e4 特殊处理
    const today = getTodayStr();
    if (appData.exerciseChecks[today] === li.dataset.id) {
        delete appData.exerciseChecks[today];
    } else {
        appData.exerciseChecks[today] = li.dataset.id;
    }
    saveData();
    const activePanel = document.querySelector('.panel.active');
    if (activePanel && activePanel.id === 'panel-1') renderHealth();
    else if (activePanel && activePanel.id === 'panel-0') renderSummary();
    updateBadge();
});

// e4 其他运动 - checkbox点击
document.querySelector('#exercise-list li[data-id="e4"] .checkbox').addEventListener('click', function(e) {
    e.stopPropagation();
    const today = getTodayStr();
    const input = document.getElementById('exercise-other-input');
    if (appData.exerciseChecks[today] === 'e4') {
        delete appData.exerciseChecks[today];
    } else {
        appData.exerciseChecks[today] = 'e4';
        if (input.value.trim()) {
            appData.exerciseOtherText[today] = input.value.trim();
        }
    }
    saveData();
    const activePanel2 = document.querySelector('.panel.active');
    if (activePanel2 && activePanel2.id === 'panel-1') renderHealth();
    else if (activePanel2 && activePanel2.id === 'panel-0') renderSummary();
    updateBadge();
});

document.getElementById('exercise-other-input').addEventListener('input', function() {
    const today = getTodayStr();
    if (appData.exerciseChecks[today] === 'e4') {
        appData.exerciseOtherText[today] = this.value;
        saveData();
    }
});

document.getElementById('sleep-time').addEventListener('change', function() {
    const today = getTodayStr();
    appData.sleepTimes[today] = this.value;
    saveData();
    updateSleepStatus();
    updateBadge();
    const activePanel = document.querySelector('.panel.active');
    if (activePanel && activePanel.id === 'panel-0') renderSummary();
});

function updateSleepStatus() {
    const today = getTodayStr();
    const val = appData.sleepTimes[today] || '23:00';
    const statusEl = document.getElementById('sleep-status');
    if (val <= '23:00') {
        statusEl.innerHTML = '<span class="sleep-ok">满足要求（11点前上床）</span>';
    } else {
        statusEl.innerHTML = '<span class="sleep-bad">超过11点，明天加油！</span>';
    }
}

// ============================================================
// 模块2：学习备考
// ============================================================
function renderStudy() {
    const courses = appData.courses;
    const stages = ['未开始', '基础学习', '强化训练', '冲刺复习', '已完成'];
    const grid = document.getElementById('course-grid');
    grid.innerHTML = courses.map(c => `
        <div class="course-card">
            <h4> ${c.name}</h4>
            <div class="course-stage">阶段：${c.stage}</div>
            <div style="margin:8px 0;">
                <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);">
                    <span>学习进度</span><span>${c.progress}%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width:${c.progress}%"></div></div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
                <select onchange="updateCourseStage('${c.id}', this.value)" style="font-size:12px;padding:6px 8px;flex:1;">
                    ${stages.map(s => `<option value="${s}" ${c.stage===s?'selected':''}>${s}</option>`).join('')}
                </select>
            </div>
            <div style="margin-top:10px;">
                <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">课程安排：</div>
                <div id="lessons-${c.id}" style="font-size:13px;">
                    ${(c.lessons || []).map((l, i) => `
                        <div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #FFF3E0;">
                            <input type="checkbox" ${l.done?'checked':''} onchange="toggleLesson('${c.id}', ${i})" style="width:16px;height:16px;">
                            <span style="${l.done?'text-decoration:line-through;color:var(--text-muted)':''};flex:1;">${l.name}</span>
                            <button class="btn-icon" onclick="deleteLesson('${c.id}', ${i})" style="font-size:12px;width:24px;height:24px;" title="删除">✕</button>
                        </div>
                    `).join('')}
                </div>
                <div class="input-row" style="margin-top:8px;">
                    <input type="text" id="lesson-input-${c.id}" placeholder="添加课程..." style="font-size:12px;padding:6px 8px;">
                    <button class="btn btn-sm btn-primary" onclick="addLesson('${c.id}')">+ 添加</button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateCourseStage(courseId, stage) {
    const course = appData.courses.find(c => c.id === courseId);
    if (course) { course.stage = stage; saveData(); }
}

function addLesson(courseId) {
    const input = document.getElementById('lesson-input-' + courseId);
    const name = input.value.trim();
    if (!name) return;
    const course = appData.courses.find(c => c.id === courseId);
    if (course) {
        if (!course.lessons) course.lessons = [];
        course.lessons.push({ name, done: false });
        recalcCourseProgress(course);
        input.value = '';
        saveData();
        renderStudy();
    }
}

function toggleLesson(courseId, index) {
    const course = appData.courses.find(c => c.id === courseId);
    if (course && course.lessons[index]) {
        course.lessons[index].done = !course.lessons[index].done;
        recalcCourseProgress(course);
        saveData();
        renderStudy();
    }
}

function deleteLesson(courseId, index) {
    const course = appData.courses.find(c => c.id === courseId);
    if (course && course.lessons) {
        course.lessons.splice(index, 1);
        recalcCourseProgress(course);
        saveData();
        renderStudy();
    }
}

function recalcCourseProgress(course) {
    if (!course.lessons || course.lessons.length === 0) {
        course.progress = 0;
    } else {
        const done = course.lessons.filter(l => l.done).length;
        course.progress = Math.round((done / course.lessons.length) * 100);
    }
}

// ============================================================
// 模块3/4/5：通用任务管理（项目工作/党建/其他工作）
// ============================================================

// 当前选中的筛选标签
const taskFilters = { project: 'today', party: 'today', other: 'today' };

function renderProject() {
    const container = document.getElementById('project-content');
    let html = '';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">';
    html += '<button class="btn btn-primary" onclick="showProjectModal()">+ 新建项目</button>';
    html += '</div>';

    if (appData.projects.length === 0) {
        html += '<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24" width="48" height="48"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" fill="#FFB74D"/></svg></div><p>还没有项目，点击上方按钮创建</p></div>';
    } else {
        appData.projects.forEach(proj => {
            html += renderTaskModule('project', proj.id, proj.name, proj.tasks);
        });
    }
    container.innerHTML = html;
}

function renderParty() {
    const container = document.getElementById('party-content');
    container.innerHTML = renderTaskModule('party', 'party', '党建任务', appData.partyTasks);
}

function renderOther() {
    const container = document.getElementById('other-content');
    container.innerHTML = renderTaskModule('other', 'other', '其他工作', appData.otherTasks);
}

function renderTaskModule(source, moduleId, title, tasks) {
    const filter = taskFilters[source] || 'today';
    const today = getTodayStr();

    let filtered = [...tasks];
    if (filter === 'today') {
        filtered = filtered.filter(t => t.status !== 'done' && (!t.deadline || t.deadline === today));
    } else if (filter === 'pending') {
        filtered = filtered.filter(t => t.status === 'pending');
    } else if (filter === 'active') {
        filtered = filtered.filter(t => t.status === 'in_progress');
    } else if (filter === 'done') {
        filtered = filtered.filter(t => t.status === 'done');
    }

    // 排序：优先级 > 截止日期
    const prioOrder = { high: 0, mid: 1, low: 2 };
    filtered.sort((a, b) => {
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (a.status !== 'done' && b.status === 'done') return -1;
        return (prioOrder[a.priority] || 2) - (prioOrder[b.priority] || 2);
    });

    let html = `<div class="card">`;
    html += `<div class="card-title" style="justify-content:space-between;flex-wrap:wrap;gap:8px;">`;
    const moduleIcons = {
        project: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z" fill="currentColor"/></svg>',
        party: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 3L2 9v12h7v-7h6v7h7V9L12 3zm0-2.27l9.91 5.91L22 9.09V22h-9v-7H11v7H2V9.09l.09-.45L12 .73z" fill="currentColor"/></svg>',
        other: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/></svg>'
    };
    html += `<span style="display:flex;align-items:center;gap:8px;">${moduleIcons[source]} ${title}</span>`;
    html += `<button class="btn btn-sm btn-primary" onclick="showTaskModal('${source}', '${moduleId}')">+ 添加任务</button>`;
    html += `</div>`;

    // 筛选标签
    html += `<div class="filter-tabs">`;
    const tabs = [
        { key: 'today', label: '今日待办' },
        { key: 'pending', label: '待开始' },
        { key: 'active', label: '进行中' },
        { key: 'done', label: '已完成' },
    ];
    tabs.forEach(tab => {
        html += `<span class="filter-tab ${filter===tab.key?'active':''}" onclick="setTaskFilter('${source}','${tab.key}')">${tab.label}</span>`;
    });
    html += `</div>`;

    if (filtered.length === 0) {
        html += `<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24" width="48" height="48"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="#FFB74D"/></svg></div><p>暂无任务</p></div>`;
    } else {
        html += `<ul class="checklist">`;
        filtered.forEach(t => {
            const done = t.status === 'done';
            const prioTag = t.priority ? `<span class="tag tag-${t.priority}">${t.priority==='high'?'高':t.priority==='mid'?'中':'低'}</span>` : '';
            const statusTag = t.status === 'done' ? '<span class="tag tag-done">已完成</span>' :
                              t.status === 'in_progress' ? '<span class="tag tag-active">进行中</span>' :
                              '<span class="tag tag-pending">待开始</span>';
            html += `<li class="${done?'done':''}" style="flex-wrap:wrap;gap:4px;">`;
            html += `<span class="checkbox" onclick="toggleTaskComplete('${source}','${moduleId}','${t.id}')"></span>`;
            html += `<span class="task-label" style="flex:1;min-width:120px;">${t.title}</span>`;
            html += `${prioTag} ${statusTag}`;
            if (t.deadline) html += `<span class="task-meta">${t.deadline}</span>`;
            html += `<button class="btn-icon" onclick="event.stopPropagation();deleteTask('${source}','${moduleId}','${t.id}')" style="font-size:12px;width:24px;height:24px;margin-left:auto;" title="删除">×</button>`;
            html += `</li>`;
        });
        html += `</ul>`;
    }
    html += `</div>`;
    return html;
}

function setTaskFilter(source, filter) {
    taskFilters[source] = filter;
    if (source === 'project') renderProject();
    else if (source === 'party') renderParty();
    else renderOther();
}

function toggleTaskComplete(source, moduleId, taskId) {
    let task = null;
    if (source === 'party') {
        task = appData.partyTasks.find(t => t.id === taskId);
    } else if (source === 'other') {
        task = appData.otherTasks.find(t => t.id === taskId);
    } else {
        const proj = appData.projects.find(p => p.id === moduleId);
        if (proj) task = proj.tasks.find(t => t.id === taskId);
    }
    if (task) {
        task.status = task.status === 'done' ? 'pending' : 'done';
        saveData();
        updateBadge();
        if (source === 'project') renderProject();
        else if (source === 'party') renderParty();
        else renderOther();
        const activePanel = document.querySelector('.panel.active');
        if (activePanel && activePanel.id === 'panel-0') renderSummary();
    }
}

function deleteTask(source, moduleId, taskId) {
    if (source === 'party') {
        appData.partyTasks = appData.partyTasks.filter(t => t.id !== taskId);
    } else if (source === 'other') {
        appData.otherTasks = appData.otherTasks.filter(t => t.id !== taskId);
    } else {
        const proj = appData.projects.find(p => p.id === moduleId);
        if (proj) proj.tasks = proj.tasks.filter(t => t.id !== taskId);
    }
    saveData();
    updateBadge();
    if (source === 'project') renderProject();
    else if (source === 'party') renderParty();
    else renderOther();
    const activePanel3 = document.querySelector('.panel.active');
    if (activePanel3 && activePanel3.id === 'panel-0') renderSummary();
}

// ── 模态框：新建/编辑任务 ──
function showTaskModal(source, moduleId) {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
        <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
            <div class="modal">
                <h3>➕ 添加任务</h3>
                <div class="form-group">
                    <label>任务名称</label>
                    <input type="text" id="modal-task-title" placeholder="输入任务名称...">
                </div>
                <div class="form-group">
                    <label>优先级</label>
                    <select id="modal-task-priority">
                        <option value="high"> 高</option>
                        <option value="mid" selected> 中</option>
                        <option value="low"> 低</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>截止日期（可选）</label>
                    <input type="date" id="modal-task-deadline" value="${getTodayStr()}">
                </div>
                <div class="form-group">
                    <label>状态</label>
                    <select id="modal-task-status">
                        <option value="pending">待开始</option>
                        <option value="in_progress">进行中</option>
                        <option value="done">已完成</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button class="btn btn-outline" onclick="closeModal()">取消</button>
                    <button class="btn btn-primary" onclick="addTaskFromModal('${source}','${moduleId}')">确认添加</button>
                </div>
            </div>
        </div>`;
}

function addTaskFromModal(source, moduleId) {
    const title = document.getElementById('modal-task-title').value.trim();
    if (!title) return;
    const priority = document.getElementById('modal-task-priority').value;
    const deadline = document.getElementById('modal-task-deadline').value;
    const status = document.getElementById('modal-task-status').value;

    const task = { id: genId(), title, priority, deadline, status, createdAt: getTodayStr() };

    if (source === 'party') {
        appData.partyTasks.push(task);
    } else if (source === 'other') {
        appData.otherTasks.push(task);
    } else {
        let proj = appData.projects.find(p => p.id === moduleId);
        if (proj) {
            proj.tasks.push(task);
        }
    }
    closeModal();
    saveData();
    updateBadge();
    if (source === 'project') renderProject();
    else if (source === 'party') renderParty();
    else renderOther();
    const activePanel4 = document.querySelector('.panel.active');
    if (activePanel4 && activePanel4.id === 'panel-0') renderSummary();
}

function showProjectModal() {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
        <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
            <div class="modal">
                <h3>➕ 新建项目</h3>
                <div class="form-group">
                    <label>项目名称</label>
                    <input type="text" id="modal-project-name" placeholder="输入项目名称...">
                </div>
                <div class="form-actions">
                    <button class="btn btn-outline" onclick="closeModal()">取消</button>
                    <button class="btn btn-primary" onclick="addProjectFromModal()">确认创建</button>
                </div>
            </div>
        </div>`;
}

function addProjectFromModal() {
    const name = document.getElementById('modal-project-name').value.trim();
    if (!name) return;
    appData.projects.push({ id: genId(), name, tasks: [] });
    closeModal();
    saveData();
    renderProject();
}

function closeModal() {
    document.getElementById('modal-container').innerHTML = '';
}

// ============================================================
// 模块6：周月复盘
// ============================================================
let reviewCurrentMonth = getMonthStr();
let reviewCurrentWeek = getWeekOfMonth();

function renderReview() {
    const container = document.getElementById('review-content');
    const monthStr = reviewCurrentMonth;
    const [y, m] = monthStr.split('-').map(Number);

    if (!appData.monthlyReviews[monthStr]) {
        appData.monthlyReviews[monthStr] = initMonthlyReview(y, m);
        saveData();
    }

    const review = appData.monthlyReviews[monthStr];
    const weeksInMonth = getWeeksInMonth(y, m);

    // 确保计划与实际数据对齐
    while (review.planned.length < weeksInMonth) {
        review.planned.push({ week: review.planned.length + 1, goals: '' });
    }
    while (review.actual.length < weeksInMonth) {
        review.actual.push({ week: review.actual.length + 1, done: '' });
    }

    let html = '';

    // 月份选择器
    html += `<div class="month-selector">`;
    html += `<button class="btn btn-outline btn-sm" onclick="changeReviewMonth(-1)">◀ 上月</button>`;
    html += `<span class="month-label">${y}年${m}月</span>`;
    html += `<button class="btn btn-outline btn-sm" onclick="changeReviewMonth(1)">下月 ▶</button>`;
    html += `</div>`;

    // 树形成长展示
    const completionRate = calcMonthCompletion(monthStr);
    const treeStage = getTreeStage(completionRate);
    html += `<div class="card" style="text-align:center;">`;
    html += `<div class="tree-container">`;
    html += `<div class="tree-emoji" style="display:flex;justify-content:center;align-items:center;height:110px;">${treeStage.svg}</div>`;
    html += `<div class="tree-label" style="font-size:18px;font-weight:700;color:#E65100;margin-top:8px;">${treeStage.label}</div>`;
    html += `<div style="font-size:13px;color:var(--text-muted);">本月完成率</div>`;
    html += `<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);max-width:300px;margin:8px auto 0;">
        <span>0%</span><span class="completion-rate" style="font-weight:700;color:#E65100;font-size:16px;">${completionRate}%</span><span>100%</span>
    </div>`;
    html += `<div class="progress-bar tree-progress-fill" style="max-width:300px;margin:4px auto 0;height:14px;"><div class="progress-fill" style="width:${completionRate}%;background:linear-gradient(90deg,#66BB6A,#43A047);"></div></div>`;
    html += `</div></div>`;

    // 每周计划 vs 实际
    for (let w = 1; w <= weeksInMonth; w++) {
        const planned = review.planned.find(p => p.week === w) || { week: w, goals: '' };
        const actual = review.actual.find(a => a.week === w) || { week: w, done: '' };
        const weekDone = planned.goals.trim() && actual.done.trim();
        const weekRate = weekDone ? 100 : (planned.goals.trim() ? 0 : null);

        html += `<div class="card">`;
        html += `<div class="card-title">第${w}周</div>`;
        html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">`;
        html += `<div><label style="font-size:13px;font-weight:600;color:var(--text-light);">计划目标</label>
            <textarea onchange="updateReviewWeek('${monthStr}',${w},'planned',this.value)" style="width:100%;min-height:80px;margin-top:4px;resize:vertical;">${planned.goals}</textarea></div>`;
        html += `<div><label style="font-size:13px;font-weight:600;color:var(--text-light);">实际完成</label>
            <textarea onchange="updateReviewWeek('${monthStr}',${w},'actual',this.value)" style="width:100%;min-height:80px;margin-top:4px;resize:vertical;">${actual.done}</textarea></div>`;
        html += `</div>`;
        if (weekRate !== null) {
            html += `<div id="week-progress-${w}" style="margin-top:8px;"><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);"><span>完成度</span><span>${weekRate}%</span></div>`;
            html += `<div class="progress-bar"><div class="progress-fill" style="width:${weekRate}%;background:${weekRate===100?'linear-gradient(90deg,#66BB6A,#43A047)':'linear-gradient(90deg,#FFD54F,#FFB300)'};"></div></div></div>`;
        } else {
            html += `<div id="week-progress-${w}" style="margin-top:8px;display:none;"></div>`;
        }
        html += `</div>`;
    }

    // 月度总结
    const summary = review.summary || '';
    html += `<div class="card">`;
    html += `<div class="card-title">月度总结报告</div>`;
    html += `<textarea id="review-summary-${monthStr}" onchange="updateReviewSummary('${monthStr}',this.value)" style="width:100%;min-height:100px;resize:vertical;" placeholder="写下本月总结...">${summary}</textarea>`;
    if (summary.trim()) {
        html += `<div class="report-card"><h4>${y}年${m}月总结</h4><p>${summary.replace(/\n/g, '<br>')}</p></div>`;
    }
    html += `<button class="btn btn-primary" style="margin-top:12px;" onclick="generateMonthlyReport('${monthStr}')">生成本月总结报告</button>`;
    html += `</div>`;

    container.innerHTML = html;
}

function initMonthlyReview(year, month) {
    const weeks = getWeeksInMonth(year, month);
    const planned = [];
    const actual = [];
    for (let w = 1; w <= weeks; w++) {
        planned.push({ week: w, goals: '' });
        actual.push({ week: w, done: '' });
    }
    return { planned, actual, summary: '' };
}

function getWeeksInMonth(year, month) {
    const lastDay = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1);
    const firstDayOfWeek = firstDay.getDay() || 7;
    return Math.ceil((lastDay + firstDayOfWeek - 1) / 7);
}

function calcMonthCompletion(monthStr) {
    const review = appData.monthlyReviews[monthStr];
    if (!review) return 0;
    let totalWeeks = 0;
    let completedWeeks = 0;
    for (let i = 0; i < review.planned.length; i++) {
        const p = review.planned[i];
        const a = review.actual[i];
        if (p.goals.trim()) {
            totalWeeks++;
            if (a.done.trim()) completedWeeks++;
        }
    }
    return totalWeeks === 0 ? 0 : Math.round((completedWeeks / totalWeeks) * 100);
}

function getTreeStage(rate) {
    const stages = [
        { label: '小种子', svg: `<svg viewBox="0 0 120 120" width="100" height="100"><circle cx="60" cy="70" r="18" fill="#8D6E63"/><path d="M60 55 Q55 40 60 25 Q65 40 60 55" fill="#66BB6A"/></svg>` },
        { label: '发芽啦', svg: `<svg viewBox="0 0 120 120" width="100" height="100"><path d="M55 95 Q50 70 60 50 Q70 70 65 95 Z" fill="#8D6E63"/><path d="M60 55 Q40 35 30 45 Q45 55 60 55" fill="#66BB6A"/><path d="M60 55 Q80 30 95 40 Q80 55 60 55" fill="#66BB6A"/></svg>` },
        { label: '小树苗', svg: `<svg viewBox="0 0 120 120" width="100" height="100"><rect x="57" y="70" width="6" height="35" fill="#8D6E63" rx="3"/><circle cx="60" cy="55" r="22" fill="#66BB6A"/><circle cx="45" cy="65" r="14" fill="#81C784"/><circle cx="75" cy="62" r="16" fill="#81C784"/></svg>` },
        { label: '茁壮成长', svg: `<svg viewBox="0 0 120 120" width="100" height="100"><rect x="56" y="75" width="8" height="35" fill="#8D6E63" rx="4"/><ellipse cx="60" cy="55" rx="32" ry="28" fill="#43A047"/><ellipse cx="42" cy="60" rx="18" ry="16" fill="#66BB6A"/><ellipse cx="78" cy="52" rx="20" ry="18" fill="#66BB6A"/><ellipse cx="60" cy="35" rx="16" ry="14" fill="#81C784"/></svg>` },
        { label: '枝繁叶茂', svg: `<svg viewBox="0 0 120 120" width="100" height="100"><rect x="55" y="80" width="10" height="30" fill="#8D6E63" rx="5"/><circle cx="60" cy="50" r="35" fill="#2E7D32"/><circle cx="38" cy="55" r="22" fill="#43A047"/><circle cx="82" cy="48" r="24" fill="#43A047"/><circle cx="60" cy="28" r="18" fill="#66BB6A"/><circle cx="28" cy="42" r="14" fill="#66BB6A"/><circle cx="92" cy="38" r="15" fill="#66BB6A"/></svg>` },
        { label: '参天大树！', svg: `<svg viewBox="0 0 120 120" width="100" height="100"><rect x="54" y="82" width="12" height="30" fill="#5D4037" rx="6"/><path d="M60 20 L30 80 L90 80 Z" fill="#1B5E20"/><path d="M60 35 L40 75 L80 75 Z" fill="#2E7D32"/><path d="M60 10 L45 40 L75 40 Z" fill="#66BB6A"/><circle cx="35" cy="55" r="8" fill="#FFCA28"/><circle cx="85" cy="45" r="6" fill="#FFCA28"/><circle cx="70" cy="25" r="5" fill="#FFCA28"/></svg>` }
    ];
    if (rate === 0) return stages[0];
    if (rate < 25) return stages[1];
    if (rate < 50) return stages[2];
    if (rate < 75) return stages[3];
    if (rate < 100) return stages[4];
    return stages[5];
}

function changeReviewMonth(delta) {
    const [y, m] = reviewCurrentMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    reviewCurrentMonth = getMonthStr(d);
    reviewCurrentWeek = getWeekOfMonth(new Date());
    renderReview();
}

function updateReviewWeek(monthStr, week, type, value) {
    if (!appData.monthlyReviews[monthStr]) return;
    const arr = appData.monthlyReviews[monthStr][type];
    const entry = arr.find(e => e.week === week);
    if (entry) {
        entry.goals = type === 'planned' ? value : entry.goals;
        entry.done = type === 'actual' ? value : entry.done;
    }
    saveData();
    updateReviewProgressUI(monthStr, week);
}

function updateReviewProgressUI(monthStr, week) {
    const review = appData.monthlyReviews[monthStr];
    const p = review.planned.find(e => e.week === week);
    const a = review.actual.find(e => e.week === week);
    const weekRate = (p.goals.trim() && a.done.trim()) ? 100 : (p.goals.trim() ? 0 : null);

    const container = document.getElementById(`week-progress-${week}`);
    if (container) {
        if (weekRate !== null) {
            container.innerHTML = `<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);"><span>完成度</span><span>${weekRate}%</span></div><div class="progress-bar"><div class="progress-fill" style="width:${weekRate}%;background:${weekRate===100?'linear-gradient(90deg,#66BB6A,#43A047)':'linear-gradient(90deg,#FFD54F,#FFB300)'};"></div></div>`;
            container.style.display = 'block';
        } else {
            container.innerHTML = '';
            container.style.display = 'none';
        }
    }

    // 更新顶部树
    const rate = calcMonthCompletion(monthStr);
    const treeStage = getTreeStage(rate);
    const treeEmoji = document.querySelector('.tree-emoji');
    const treeLabel = document.querySelector('.tree-label');
    const completionRate = document.querySelector('.completion-rate');
    const treeProgressFill = document.querySelector('.tree-progress-fill .progress-fill');
    if (treeEmoji) treeEmoji.innerHTML = treeStage.svg;
    if (treeLabel) treeLabel.textContent = treeStage.label;
    if (completionRate) completionRate.textContent = rate + '%';
    if (treeProgressFill) treeProgressFill.style.width = rate + '%';
}

function updateReviewSummary(monthStr, value) {
    if (!appData.monthlyReviews[monthStr]) return;
    appData.monthlyReviews[monthStr].summary = value;
    saveData();
}

function generateMonthlyReport(monthStr) {
    const review = appData.monthlyReviews[monthStr];
    if (!review) return;
    const [y, m] = monthStr.split('-').map(Number);
    const rate = calcMonthCompletion(monthStr);
    const treeStage = getTreeStage(rate);

    let report = `## ${y}年${m}月月度总结\n\n`;
    report += `### 成长状态：${treeStage.label}\n`;
    report += `- 本月完成率：**${rate}%**\n\n`;
    report += `### 各周回顾\n\n`;

    for (let i = 0; i < review.planned.length; i++) {
        const p = review.planned[i];
        const a = review.actual[i];
        report += `**第${p.week}周**\n`;
        report += `- 计划：${p.goals || '（未填写）'}\n`;
        report += `- 实际：${a.done || '（未填写）'}\n`;
        if (p.goals.trim() && a.done.trim()) {
            report += `- 状态：已完成\n`;
        } else if (p.goals.trim()) {
            report += `- 状态：未完成\n`;
        }
        report += '\n';
    }

    report += `### 总结\n${review.summary || '（尚未填写）'}\n\n`;
    report += `---\n*由 J人夏夏 自动生成*`;

    review.summary = report;
    saveData();
    renderReview();
}

// ============================================================
// 工具函数
// ============================================================
function getWeekdayCN(date) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[date.getDay()];
}

// ── 初始化渲染 ──
function init() {
    updateSupplementStreak();
    saveData();
    renderAll();
}

init();
