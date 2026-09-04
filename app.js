// ============================================================
//  app.js - د PVP Store اصلي غوښتنلیک کوډ
// ============================================================

const STORAGE_KEY = 'pvp_store_posts';
let posts = [];

// ============================================================
//  د معلوماتو ذخیره او لوډ کول
// ============================================================
function loadPosts() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try { posts = JSON.parse(stored); } catch (e) { posts = []; }
    } else {
        posts = [{
            id: '1',
            type: 'image',
            title: 'د سایبرپنک کوڅه',
            category: 'سای-فای',
            prompt: 'د باران، انعکاسونو، او هولوګرافیک اعلاناتو سره د نیون څخه ډکه د سایبرپنک کوڅه، 8k، ډیر تفصیلي.',
            media_url: 'https://picsum.photos/id/1/400/400',
            created_at: Date.now() - 3600000
        }, {
            id: '2',
            type: 'image',
            title: 'جادویی ځنګل',
            category: 'فانتزي',
            prompt: 'د روښانه مرخیړیو او افسانوي رڼا سره جادویی ځنګل، فانتزي هنر، خوب لیدونکی.',
            media_url: 'https://picsum.photos/id/10/400/400',
            created_at: Date.now() - 7200000
        }, {
            id: '3',
            type: 'video',
            title: 'د AI ښار وخت تېریدل',
            category: 'سای-فای',
            prompt: 'د راتلونکي ښار وخت تېریدل د الوتونکو موټرو، نیون رڼا، او متحرک هوا سره، د RunwayML سره جوړ شوی.',
            media_url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
            created_at: Date.now() - 10800000
        }];
        savePosts();
    }
    posts = posts.filter(p => p.id);
    savePosts();
    return posts;
}

function savePosts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    const bc = new BroadcastChannel('pvp_channel');
    bc.postMessage({ type: 'sync', data: posts });
    bc.close();
}

function listenForUpdates() {
    const bc = new BroadcastChannel('pvp_channel');
    bc.onmessage = (e) => {
        if (e.data.type === 'sync') {
            posts = e.data.data;
            renderGallery();
            if (document.getElementById('adminPanel').classList.contains('open')) {
                renderAdminTable();
            }
        }
    };
}

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// ============================================================
//  د ګالري ښودل
// ============================================================
function renderGallery(filter = 'all', search = '', category = '') {
    const gallery = document.getElementById('gallery');
    let filtered = [...posts];

    if (filter === 'image') filtered = filtered.filter(p => p.type === 'image');
    else if (filter === 'video') filtered = filtered.filter(p => p.type === 'video');

    if (search.trim()) {
        const s = search.toLowerCase().trim();
        filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(s) ||
            p.category.toLowerCase().includes(s) ||
            p.prompt.toLowerCase().includes(s)
        );
    }

    if (category) {
        filtered = filtered.filter(p => p.category === category);
    }

    filtered.sort((a, b) => b.created_at - a.created_at);

    if (filtered.length === 0) {
        gallery.innerHTML = `<div class="empty-state"><i class="fas fa-box-open"></i><p>هیڅ پوسټ نشته. لومړی اپلوډر اوسئ!</p></div>`;
        return;
    }

    gallery.innerHTML = filtered.map(post => `
        <div class="post-card" data-id="${post.id}">
            ${post.type === 'image'
                ? `<img class="media" src="${post.media_url}" alt="${post.title}" loading="lazy" />`
                : `<video class="media video" src="${post.media_url}" muted playsinline></video>`
            }
            <div class="card-body">
                <div class="card-title">${escapeHtml(post.title)}</div>
                <span class="card-category">${escapeHtml(post.category)}</span>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem;">
                    <button class="copy-btn" data-id="${post.id}" data-prompt="${escapeHtml(post.prompt)}">
                        <i class="fas fa-copy"></i> کاپي پرامپټ
                    </button>
                    <span style="font-size:0.7rem; color:#aaa;">${post.type === 'image' ? 'انځور' : 'ویډیو'}</span>
                </div>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.post-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.copy-btn')) return;
            const id = card.dataset.id;
            const post = posts.find(p => p.id === id);
            if (post) openDetail(post);
        });
    });

    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const prompt = btn.dataset.prompt;
            if (typeof handleCopyWithPopAds === 'function') {
                await handleCopyWithPopAds(prompt, btn);
            } else {
                await navigator.clipboard.writeText(prompt);
                btn.innerHTML = '✅ کاپي شو!';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.innerHTML = '<i class="fas fa-copy"></i> کاپي پرامپټ';
                    btn.classList.remove('copied');
                }, 3000);
            }
        });
    });
}

// ============================================================
//  تفصیلي کړکۍ (Modal)
// ============================================================
function openDetail(post) {
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');
    const isVideo = post.type === 'video';

    content.innerHTML = `
        ${isVideo
            ? `<video class="media video" src="${post.media_url}" controls autoplay muted playsinline></video>`
            : `<img class="media" src="${post.media_url}" alt="${post.title}" />`
        }
        <div class="modal-title">${escapeHtml(post.title)}</div>
        <span class="modal-category">${escapeHtml(post.category)}</span>
        <div class="modal-prompt"><strong>پرامپټ:</strong> ${escapeHtml(post.prompt)}</div>
        <button class="copy-large-btn" id="modalCopyBtn" data-prompt="${escapeHtml(post.prompt)}">
            <i class="fas fa-copy"></i> کاپي پرامپټ
        </button>
        <span id="modalCopyStatus" style="margin-left:0.8rem; font-weight:500;"></span>
    `;

    modal.classList.add('open');

    document.getElementById('modalCopyBtn').addEventListener('click', async (e) => {
        const prompt = e.currentTarget.dataset.prompt;
        const btn = e.currentTarget;
        if (typeof handleCopyWithPopAds === 'function') {
            await handleCopyWithPopAds(prompt, btn, 'modalCopyStatus');
        } else {
            await navigator.clipboard.writeText(prompt);
            btn.innerHTML = '✅ کاپي شو!';
            btn.classList.add('copied');
            document.getElementById('modalCopyStatus').textContent = '✅ کاپي شو!';
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-copy"></i> کاپي پرامپټ';
                btn.classList.remove('copied');
                document.getElementById('modalCopyStatus').textContent = '';
            }, 3000);
        }
    });
}

document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('detailModal').classList.remove('open');
});
document.getElementById('detailModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) document.getElementById('detailModal').classList.remove('open');
});

// ============================================================
//  اپلوډ سیستم
// ============================================================
const uploadOverlay = document.getElementById('uploadOverlay');
const uploadForm = document.getElementById('uploadForm');

document.getElementById('openUploadBtn').addEventListener('click', () => {
    uploadOverlay.classList.add('open');
    document.getElementById('uploadError').classList.remove('show');
});
document.getElementById('closeUpload').addEventListener('click', () => {
    uploadOverlay.classList.remove('open');
});
uploadOverlay.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) uploadOverlay.classList.remove('open');
});

const fileInput = document.getElementById('uploadFile');
const fileName = document.getElementById('fileName');
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        fileName.textContent = fileInput.files[0].name;
    } else {
        fileName.textContent = 'هیڅ فایل نه دی ټاکل شوی';
    }
});

const fileDrop = document.getElementById('fileDrop');
fileDrop.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDrop.style.borderColor = '#6c5ce7';
    fileDrop.style.background = '#f5f3ff';
});
fileDrop.addEventListener('dragleave', () => {
    fileDrop.style.borderColor = '#d0d0d8';
    fileDrop.style.background = '#fafbfc';
});
fileDrop.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDrop.style.borderColor = '#d0d0d8';
    fileDrop.style.background = '#fafbfc';
    if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        fileName.textContent = e.dataTransfer.files[0].name;
    }
});
fileDrop.addEventListener('click', () => fileInput.click());

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.querySelector('input[name="type"]:checked').value;
    const title = document.getElementById('uploadTitle').value.trim();
    const category = document.getElementById('uploadCategory').value;
    const prompt = document.getElementById('uploadPrompt').value.trim();
    const file = fileInput.files[0];

    const errorEl = document.getElementById('uploadError');
    if (!title || !category || !prompt || !file) {
        errorEl.textContent = 'مهرباني وکړئ ټول ساحې او فایل ډک کړئ.';
        errorEl.classList.add('show');
        return;
    }
    errorEl.classList.remove('show');

    const validImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const validVideo = ['video/mp4', 'video/webm', 'video/ogg'];
    if (type === 'image' && !validImage.includes(file.type)) {
        errorEl.textContent = 'مهرباني وکړئ یو معتبر انځور وټاکئ (JPEG, PNG, WEBP, GIF).';
        errorEl.classList.add('show');
        return;
    }
    if (type === 'video' && !validVideo.includes(file.type)) {
        errorEl.textContent = 'مهرباني وکړئ یو معتبر ویډیو وټاکئ (MP4, WEBM, OGG).';
        errorEl.classList.add('show');
        return;
    }
    if (file.size > 50 * 1024 * 1024) {
        errorEl.textContent = 'د فایل اندازه باید له 50MB څخه کمه وي.';
        errorEl.classList.add('show');
        return;
    }

    const submitBtn = document.getElementById('submitUpload');
    submitBtn.disabled = true;
    document.getElementById('submitText').textContent = 'اپلوډ کیږي...';
    document.getElementById('submitSpinner').style.display = 'inline-block';

    let mediaUrl;
    if (type === 'image') {
        const randomId = Math.floor(Math.random() * 100) + 1;
        mediaUrl = `https://picsum.photos/id/${randomId}/400/400`;
    } else {
        mediaUrl = 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4';
    }

    const newPost = {
        id: genId(),
        type,
        title,
        category,
        prompt,
        media_url: mediaUrl,
        created_at: Date.now()
    };

    posts.unshift(newPost);
    savePosts();

    uploadForm.reset();
    fileName.textContent = 'هیڅ فایل نه دی ټاکل شوی';
    fileInput.value = '';
    submitBtn.disabled = false;
    document.getElementById('submitText').textContent = 'خپور کړئ';
    document.getElementById('submitSpinner').style.display = 'none';

    uploadOverlay.classList.remove('open');
    renderGallery(currentFilter, currentSearch, currentCategory);
});

// ============================================================
//  فلټرونه او لټون
// ============================================================
let currentFilter = 'all';
let currentSearch = '';
let currentCategory = '';

document.querySelectorAll('.filter-tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-tabs button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderGallery(currentFilter, currentSearch, currentCategory);
    });
});

document.getElementById('searchInput').addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderGallery(currentFilter, currentSearch, currentCategory);
});

document.getElementById('categoryFilter').addEventListener('change', (e) => {
    currentCategory = e.target.value;
    renderGallery(currentFilter, currentSearch, currentCategory);
});

document.querySelectorAll('.nav-links a[data-filter]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-links a[data-filter]').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const filter = link.dataset.filter;
        if (filter === 'all') {
            currentFilter = 'all';
            document.querySelector('.filter-tabs button[data-filter="all"]')?.click();
        } else if (filter === 'image') {
            currentFilter = 'image';
            document.querySelector('.filter-tabs button[data-filter="image"]')?.click();
        } else if (filter === 'video') {
            currentFilter = 'video';
            document.querySelector('.filter-tabs button[data-filter="video"]')?.click();
        }
        renderGallery(currentFilter, currentSearch, currentCategory);
    });
});

// ============================================================
//  اډمین پینل
// ============================================================
const adminPanel = document.getElementById('adminPanel');
const adminToggle = document.getElementById('adminToggle');

adminToggle.addEventListener('click', () => {
    adminPanel.classList.toggle('open');
    if (adminPanel.classList.contains('open')) renderAdminTable();
});
document.getElementById('closeAdmin').addEventListener('click', () => {
    adminPanel.classList.remove('open');
});
adminPanel.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) adminPanel.classList.remove('open');
});

function renderAdminTable() {
    const tbody = document.getElementById('adminTableBody');
    let data = [...posts];
    const search = document.getElementById('adminSearch').value.toLowerCase().trim();
    if (search) {
        data = data.filter(p =>
            p.title.toLowerCase().includes(search) ||
            p.category.toLowerCase().includes(search) ||
            p.prompt.toLowerCase().includes(search) ||
            p.type.includes(search)
        );
    }
    data.sort((a, b) => b.created_at - a.created_at);

    tbody.innerHTML = data.map(p => `
        <tr>
            <td><span style="background:${p.type==='image'?'#d0e8ff':'#ffe0d0'}; padding:0.1rem 0.6rem; border-radius:20px;font-size:0.7rem;">${p.type === 'image' ? 'انځور' : 'ویډیو'}</span></td>
            <td>${escapeHtml(p.title)}</td>
            <td>${escapeHtml(p.category)}</td>
            <td class="admin-actions">
                <button class="approve" data-id="${p.id}" style="background:#2ecc71;">✓ تصویب</button>
                <button data-id="${p.id}" style="background:#e74c3c;">✕ ړنګول</button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('button[data-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.dataset.id;
            if (btn.textContent.includes('ړنګول') || btn.textContent.includes('✕')) {
                if (confirm('آیا غواړئ دا پوسټ ړنګ کړئ؟')) {
                    posts = posts.filter(p => p.id !== id);
                    savePosts();
                    renderAdminTable();
                    renderGallery(currentFilter, currentSearch, currentCategory);
                }
            } else if (btn.textContent.includes('تصویب') || btn.textContent.includes('✓')) {
                alert('پوسټ تصویب شو! (د تصویب حالت فعال دی)');
            }
        });
    });
}

document.getElementById('adminSearchBtn').addEventListener('click', renderAdminTable);
document.getElementById('adminRefreshBtn').addEventListener('click', () => {
    loadPosts();
    renderAdminTable();
    renderGallery(currentFilter, currentSearch, currentCategory);
});

// ============================================================
//  مرستندویه فنکشنونه
// ============================================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
//  پیل کول
// ============================================================
loadPosts();
listenForUpdates();
renderGallery();

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        uploadOverlay.classList.remove('open');
        adminPanel.classList.remove('open');
        document.getElementById('detailModal').classList.remove('open');
    }
});

console.log('PVP Store تیار دی!'); 
