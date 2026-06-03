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

    // 2. Fetch danh mục bài viết từ index.json
    try {
        const res = await fetch('data/index.json');
        allTips = await res.json();
        renderList(allTips);
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
    });

    // 4. Xử lý nút quay lại
    document.getElementById('back-btn').addEventListener('click', () => {
        document.getElementById('reader-view').classList.add('hidden');
        document.getElementById('main-view').classList.remove('hidden');
    });

    // 5. Đăng ký Service Worker và Persistent Storage (PWA Core)
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
        // Khi click vào thẻ, mở file markdown tương ứng
        card.addEventListener('click', () => openArticle(tip.path));
        list.appendChild(card);
    });
}

async function openArticle(path) {
    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error('Network response was not ok');
        const mdText = await res.text();
        
        // Parse Markdown sang HTML bằng marked.js
        document.getElementById('markdown-content').innerHTML = marked.parse(mdText);
        
        // Chuyển view
        document.getElementById('main-view').classList.add('hidden');
        document.getElementById('reader-view').classList.remove('hidden');
        window.scrollTo(0, 0);
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
