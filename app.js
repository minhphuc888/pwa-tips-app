let allTips = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Khởi tạo Theme Sáng/Tối
    const themeToggle = document.getElementById('theme-toggle');
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });

    // Nút tải offline các bài viết quan trọng
    const cacheAllBtn = document.getElementById('cache-all-btn');
    if (cacheAllBtn) {
        cacheAllBtn.addEventListener('click', async () => {
            if (!confirm('Bạn có muốn tải các bài viết quan trọng về máy để xem ngoại tuyến không?')) return;
            
            const originalText = cacheAllBtn.innerText;
            cacheAllBtn.innerText = '⏳ Đang tải...';
            cacheAllBtn.disabled = true;
            
            try {
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    const currentCacheName = cacheNames.length > 0 ? cacheNames[0] : 'pwa-tips-v9';
                    const cache = await caches.open(currentCacheName);
                    const importantTips = allTips.filter(tip => tip.important);
                    const paths = importantTips.map(tip => tip.path);
                    const timestamp = new Date().getTime();
                    
                    const promises = paths.map(async (path) => {
                        try {
                            const response = await fetch(`${path}?t=${timestamp}`);
                            if (response.ok) {
                                await cache.put(path, response.clone());
                            }
                        } catch (e) {
                            console.error('Không thể tải:', path, e);
                        }
                    });
                    
                    await Promise.all(promises);
                    alert('Đã tải và cập nhật các bài viết quan trọng thành công!');
                } else {
                    const importantTips = allTips.filter(tip => tip.important);
                    const promises = importantTips.map(tip => fetch(tip.path));
                    await Promise.all(promises);
                    alert('Đã tải các bài viết quan trọng thành công!');
                }
            } catch (err) {
                console.error('Lỗi khi tải offline:', err);
                alert('Có lỗi xảy ra khi tải bài viết!');
            } finally {
                cacheAllBtn.innerText = originalText;
                cacheAllBtn.disabled = false;
            }
        });
    }

    // Các thành phần UI của Sidebar
    const tipsTree = document.getElementById('tips-tree');
    const expandAllBtn = document.getElementById('expand-all-btn');
    const collapseAllBtn = document.getElementById('collapse-all-btn');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const brandTitle = document.getElementById('brand-title');

    // 2. Fetch danh mục bài viết từ index.json
    try {
        const res = await fetch('data/index.json');
        allTips = await res.json();
        
        // Render lưới bài viết ở trang chủ
        renderList(allTips);
        
        // Xây dựng và render cây thư mục ở sidebar
        const treeData = buildTree(allTips);
        renderTreeHTML(treeData, tipsTree);
    } catch (err) {
        console.error('Lỗi khi tải dữ liệu mục lục:', err);
        document.getElementById('tips-list').innerHTML = '<p style="color:red">Không thể tải dữ liệu. Vui lòng kiểm tra kết nối mạng hoặc thử lại.</p>';
    }

    // 3. Logic Tìm kiếm Real-time (Loại bỏ dấu Tiếng Việt)
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const query = removeAccents(e.target.value.toLowerCase());
        const filtered = allTips.filter(tip => {
            const titleMatch = removeAccents(tip.title.toLowerCase()).includes(query);
            const tagsMatch = tip.tags.some(tag => removeAccents(tag.toLowerCase()).includes(query));
            return titleMatch || tagsMatch;
        });
        renderList(filtered);
        
        // Lọc cây thư mục ở sidebar
        filterTreeNodes(query);
    });

    // 4. Xử lý nút quay lại
    document.getElementById('back-btn').addEventListener('click', () => {
        document.getElementById('reader-view').classList.add('hidden');
        document.getElementById('main-view').classList.remove('hidden');
        // Bỏ highlight bài viết trong sidebar
        document.querySelectorAll('.tree-tip').forEach(el => el.classList.remove('active'));
    });

    // Quay lại trang chủ khi click vào tiêu đề ứng dụng
    brandTitle.addEventListener('click', () => {
        document.getElementById('reader-view').classList.add('hidden');
        document.getElementById('main-view').classList.remove('hidden');
        // Bỏ highlight và làm sạch ô tìm kiếm
        document.querySelectorAll('.tree-tip').forEach(el => el.classList.remove('active'));
        searchInput.value = '';
        renderList(allTips);
        filterTreeNodes('');
        
        // Đóng sidebar trên mobile nếu đang mở
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
    });

    // 5. Thao tác Expand/Collapse tất cả các folder trên sidebar
    expandAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.tree-folder').forEach(el => {
            el.classList.add('expanded');
        });
    });

    collapseAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.tree-folder').forEach(el => {
            el.classList.remove('expanded');
        });
    });

    // 6. Xử lý mở/đóng menu trên mobile
    menuToggle.addEventListener('click', () => {
        sidebar.classList.add('open');
        backdrop.classList.add('active');
    });

    backdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
    });

    // 7. Đăng ký Service Worker và Persistent Storage (PWA Core)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('Service Worker Registered'))
            .catch(err => console.error('Service Worker Registration Failed:', err));
    }

    if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().then(granted => {
            if (granted) console.log("Persistent storage granted.");
        });
    }
});

// Tạo cấu trúc cây phân cấp: Category -> SubCategory -> Tips
function buildTree(tips) {
    const tree = {};
    tips.forEach(tip => {
        const cat = tip.category || 'Mẹo Khác';
        const sub = tip.subCategory || 'Chung';
        
        if (!tree[cat]) {
            tree[cat] = {};
        }
        if (!tree[cat][sub]) {
            tree[cat][sub] = [];
        }
        tree[cat][sub].push(tip);
    });
    return tree;
}

// Render cấu trúc cây thư mục sang HTML
function renderTreeHTML(tree, container) {
    container.innerHTML = '';
    
    // Sắp xếp các Category theo bảng chữ cái
    const categories = Object.keys(tree).sort();
    
    categories.forEach(cat => {
        const catFolder = document.createElement('div');
        catFolder.className = 'tree-folder';
        catFolder.dataset.category = cat;
        
        const catHeader = document.createElement('div');
        catHeader.className = 'folder-header';
        catHeader.innerHTML = `
            <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            <span class="folder-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
            </span>
            <span class="folder-title">${cat}</span>
        `;
        
        const catChildren = document.createElement('div');
        catChildren.className = 'folder-children';
        
        // Sắp xếp các SubCategory
        const subCategories = Object.keys(tree[cat]).sort();
        subCategories.forEach(sub => {
            const subFolder = document.createElement('div');
            subFolder.className = 'tree-folder';
            subFolder.dataset.subCategory = sub;
            
            const subHeader = document.createElement('div');
            subHeader.className = 'folder-header';
            subHeader.innerHTML = `
                <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                <span class="folder-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                </span>
                <span class="folder-title">${sub}</span>
            `;
            
            const subChildren = document.createElement('div');
            subChildren.className = 'folder-children';
            
            // Bài viết trong danh mục con này
            const tips = tree[cat][sub];
            tips.forEach(tip => {
                const tipItem = document.createElement('div');
                tipItem.className = 'tree-tip';
                tipItem.dataset.id = tip.id;
                tipItem.dataset.path = tip.path;
                tipItem.innerHTML = `
                    <svg class="item-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    <span class="tip-title">${tip.title}</span>
                `;
                
                tipItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectTip(tip);
                });
                
                subChildren.appendChild(tipItem);
            });
            
            subHeader.addEventListener('click', (e) => {
                e.stopPropagation();
                subFolder.classList.toggle('expanded');
            });
            
            subFolder.appendChild(subHeader);
            subFolder.appendChild(subChildren);
            catChildren.appendChild(subFolder);
        });
        
        catHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            catFolder.classList.toggle('expanded');
        });
        
        catFolder.appendChild(catHeader);
        catFolder.appendChild(catChildren);
        container.appendChild(catFolder);
    });
}

// Xử lý chọn bài viết (đồng bộ Highlight sidebar, mở folder cha và tải bài viết)
function selectTip(tip) {
    // 1. Highlight trong sidebar
    document.querySelectorAll('.tree-tip').forEach(el => el.classList.remove('active'));
    const activeItem = document.querySelector(`.tree-tip[data-id="${tip.id}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
        
        // Tự động mở các thư mục cha
        let parent = activeItem.parentElement;
        while (parent && parent !== document.getElementById('tips-tree')) {
            if (parent.classList.contains('folder-children')) {
                parent.parentElement.classList.add('expanded');
            }
            parent = parent.parentElement;
        }
    }
    
    // 2. Mở nội dung bài viết
    openArticle(tip);
    
    // 3. Trên mobile, tự động đóng sidebar sau khi chọn
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
    }
}

// Lọc cây thư mục động dựa trên bộ lọc tìm kiếm
function filterTreeNodes(query) {
    if (!query) {
        // Hiện lại toàn bộ nếu không tìm kiếm
        document.querySelectorAll('.tree-tip, .tree-folder').forEach(el => {
            el.classList.remove('search-hidden');
        });
        return;
    }
    
    // 1. Lọc các bài viết
    const tips = document.querySelectorAll('.tree-tip');
    tips.forEach(tipNode => {
        const id = tipNode.dataset.id;
        const tipData = allTips.find(t => t.id === id);
        if (tipData) {
            const titleMatch = removeAccents(tipData.title.toLowerCase()).includes(query);
            const tagsMatch = tipData.tags.some(tag => removeAccents(tag.toLowerCase()).includes(query));
            if (titleMatch || tagsMatch) {
                tipNode.classList.remove('search-hidden');
            } else {
                tipNode.classList.add('search-hidden');
            }
        }
    });
    
    // 2. Lọc các folder con (SubCategory)
    const subFolders = document.querySelectorAll('.tree-folder[data-sub-category]');
    subFolders.forEach(subFolder => {
        const childrenTips = subFolder.querySelectorAll('.tree-tip:not(.search-hidden)');
        if (childrenTips.length > 0) {
            subFolder.classList.remove('search-hidden');
            subFolder.classList.add('expanded'); // Tự động mở rộng khi có kết quả trùng khớp
        } else {
            subFolder.classList.add('search-hidden');
        }
    });
    
    // 3. Lọc các folder cha (Category)
    const catFolders = document.querySelectorAll('.tree-folder[data-category]');
    catFolders.forEach(catFolder => {
        const childrenSubs = catFolder.querySelectorAll('.tree-folder[data-sub-category]:not(.search-hidden)');
        if (childrenSubs.length > 0) {
            catFolder.classList.remove('search-hidden');
            catFolder.classList.add('expanded'); // Tự động mở rộng
        } else {
            catFolder.classList.add('search-hidden');
        }
    });
}

function renderList(tips) {
    const list = document.getElementById('tips-list');
    list.innerHTML = '';
    
    if (tips.length === 0) {
        list.innerHTML = '<p>Không tìm thấy mẹo vặt nào phù hợp.</p>';
        return;
    }

    tips.forEach(tip => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>${tip.title}</h3>
            <div class="category">${tip.category} > ${tip.subCategory}</div>
            <div class="tags">${tip.tags.map(t => `<span>#${t}</span>`).join('')}</div>
        `;
        // Khi click vào thẻ, chọn bài viết và highlight ở sidebar
        card.addEventListener('click', () => selectTip(tip));
        list.appendChild(card);
    });
}

async function openArticle(tip) {
    try {
        const res = await fetch(tip.path);
        if (!res.ok) throw new Error('Network response was not ok');
        const mdText = await res.text();
        
        // Lưu vào cache nếu là bài viết quan trọng
        if (tip.important && 'caches' in window) {
            caches.open('pwa-tips-v9').then(cache => {
                cache.put(tip.path, res.clone());
            });
        }
        
        // Parse Markdown sang HTML bằng marked.js
        document.getElementById('markdown-content').innerHTML = marked.parse(mdText);
        
        // Chuyển view
        document.getElementById('main-view').classList.add('hidden');
        document.getElementById('reader-view').classList.remove('hidden');
        
        // Cuộn mượt lên đầu trang nội dung chính
        document.querySelector('.main-content').scrollTo(0, 0);
    } catch (err) {
        alert('Không thể tải bài viết lúc này. Bạn có đang offline và bài viết chưa được cache không?');
    }
}

// Hàm hỗ trợ: Loại bỏ dấu Tiếng Việt để tìm kiếm chính xác
function removeAccents(str) {
    return str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd')
              .replace(/Đ/g, 'D');
}
