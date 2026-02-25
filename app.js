// ============================================
// University Educational Platform - App.js
// Enhanced with Search, Auth, Ratings
// ============================================

// Global State
let coursesData = [];
let userProgress = {};
let currentUser = null;
let userRatings = {};
let currentRoute = { page: 'courses', courseId: null, lessonId: null };
let currentRatingCourseId = null;
let selectedRating = 0;

// DOM Elements
const coursesGrid = document.getElementById('courses-grid');
const courseDetails = document.getElementById('course-details');
const lessonContent = document.getElementById('lesson-content');
const levelFilter = document.getElementById('level-filter');
const semesterFilter = document.getElementById('semester-filter');
const facultyFilter = document.getElementById('faculty-filter');
const resetFiltersBtn = document.getElementById('reset-filters');
const searchInput = document.getElementById('search-input');
const authBtn = document.getElementById('auth-btn');
const userMenu = document.getElementById('user-menu');
const userName = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    loadCoursesData();
    setupEventListeners();
    handleRoute();
    updateAuthUI();
});

// ============================================
// Data Loading & Storage
// ============================================

async function loadCoursesData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Failed to load courses data');
        const data = await response.json();
        coursesData = data.courses;
        renderCourses();
    } catch (error) {
        console.error('Error loading courses:', error);
        showToast('حدث خطأ في تحميل البيانات', 'error');
    }
}

function loadUserData() {
    // Load user progress
    const savedProgress = localStorage.getItem('userProgress');
    if (savedProgress) {
        userProgress = JSON.parse(savedProgress);
    }

    // Load current user
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }

    // Load user ratings
    const savedRatings = localStorage.getItem('userRatings');
    if (savedRatings) {
        userRatings = JSON.parse(savedRatings);
    }
}

function saveUserProgress() {
    localStorage.setItem('userProgress', JSON.stringify(userProgress));
}

function saveUserRatings() {
    localStorage.setItem('userRatings', JSON.stringify(userRatings));
}

function saveCurrentUser() {
    if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
        localStorage.removeItem('currentUser');
    }
}

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
    // Filter events
    levelFilter.addEventListener('change', filterCourses);
    semesterFilter.addEventListener('change', filterCourses);
    facultyFilter.addEventListener('change', filterCourses);
    resetFiltersBtn.addEventListener('click', resetFilters);

    // Search event
    searchInput.addEventListener('input', handleSearch);

    // Auth events
    authBtn.addEventListener('click', () => {
        if (currentUser) return;
        openLoginModal();
    });

    logoutBtn.addEventListener('click', logout);

    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);

    // Register form
    document.getElementById('register-form').addEventListener('submit', handleRegister);

    // Rating events
    setupRatingStars();
    document.getElementById('submit-rating').addEventListener('click', submitRating);

    // Hash change for routing
    window.addEventListener('hashchange', handleRoute);

    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const page = e.target.dataset.page;
            if (page) navigateTo(page);
        });
    });
}

// ============================================
// Search Functionality
// ============================================

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    renderCourses(searchTerm);
}

// ============================================
// Authentication
// ============================================

function openLoginModal() {
    document.getElementById('login-modal').classList.add('active');
}

function closeLoginModal() {
    document.getElementById('login-modal').classList.remove('active');
    document.getElementById('login-form').reset();
}

function openRegisterModal() {
    document.getElementById('register-modal').classList.add('active');
}

function closeRegisterModal() {
    document.getElementById('register-modal').classList.remove('active');
    document.getElementById('register-form').reset();
}

function switchToRegister() {
    closeLoginModal();
    openRegisterModal();
}

function switchToLogin() {
    closeRegisterModal();
    openLoginModal();
}

function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        showToast('الرجاء إدخال اسم المستخدم وكلمة المرور', 'error');
        return;
    }

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        currentUser = { username: user.username, email: user.email };
        saveCurrentUser();
        updateAuthUI();
        closeLoginModal();
        showToast(`مرحباً بك ${user.username}! 🎉`);
    } else {
        showToast('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    if (!username || !email || !password || !confirmPassword) {
        showToast('الرجاء ملء جميع الحقول', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showToast('كلمات المرور غير متطابقة', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }

    // Get existing users
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // Check if username exists
    if (users.find(u => u.username === username)) {
        showToast('اسم المستخدم مستخدم بالفعل', 'error');
        return;
    }

    // Add new user
    users.push({ username, email, password });
    localStorage.setItem('users', JSON.stringify(users));

    // Auto login
    currentUser = { username, email };
    saveCurrentUser();
    updateAuthUI();
    closeRegisterModal();
    showToast(`تم إنشاء الحساب بنجاح! مرحباً بك ${username}! 🎉`);
}

function logout() {
    currentUser = null;
    saveCurrentUser();
    updateAuthUI();
    navigateTo('courses');
    showToast('تم تسجيل الخروج بنجاح');
}

function updateAuthUI() {
    if (currentUser) {
        authBtn.style.display = 'none';
        userMenu.style.display = 'flex';
        userName.textContent = currentUser.username;
    } else {
        authBtn.style.display = 'block';
        userMenu.style.display = 'none';
    }
}

// ============================================
// Course Ratings
// ============================================

function openRatingModal(courseId) {
    if (!currentUser) {
        showToast('الرجاء تسجيل الدخول للتقييم', 'error');
        openLoginModal();
        return;
    }

    currentRatingCourseId = courseId;
    selectedRating = 0;
    updateRatingStars(0);
    document.getElementById('rating-modal').classList.add('active');
}

function closeRatingModal() {
    document.getElementById('rating-modal').classList.remove('active');
    currentRatingCourseId = null;
    selectedRating = 0;
}

function setupRatingStars() {
    const stars = document.querySelectorAll('.rating-stars-interactive .star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.rating);
            updateRatingStars(selectedRating);
        });

        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.dataset.rating);
            updateRatingStars(rating);
        });
    });

    document.querySelector('.rating-stars-interactive').addEventListener('mouseleave', () => {
        updateRatingStars(selectedRating);
    });
}

function updateRatingStars(rating) {
    const stars = document.querySelectorAll('.rating-stars-interactive .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });

    const ratingTexts = ['اختر التقييم', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز', 'متميز'];
    document.getElementById('rating-text').textContent = ratingTexts[rating];
}

function submitRating() {
    if (selectedRating === 0) {
        showToast('الرجاء اختيار تقييم', 'error');
        return;
    }

    // Save user rating
    if (!userRatings[currentRatingCourseId]) {
        userRatings[currentRatingCourseId] = [];
    }

    // Check if user already rated
    const existingIndex = userRatings[currentRatingCourseId].findIndex(r => r.user === currentUser.username);
    if (existingIndex >= 0) {
        userRatings[currentRatingCourseId][existingIndex].rating = selectedRating;
    } else {
        userRatings[currentRatingCourseId].push({
            user: currentUser.username,
            rating: selectedRating
        });
    }

    saveUserRatings();

    // Update course average rating
    const course = coursesData.find(c => c.id === currentRatingCourseId);
    if (course) {
        const ratings = userRatings[currentRatingCourseId].map(r => r.rating);
        const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        course.rating = Math.round(avgRating * 10) / 10;
        course.ratingsCount = ratings.length;
    }

    closeRatingModal();
    renderCourses();
    renderCourseDetails(currentRatingCourseId);
    showToast('شكراً لك! تم إرسال تقييمك بنجاح ⭐');
}

function getCourseRating(courseId) {
    const course = coursesData.find(c => c.id === courseId);
    if (!course) return { rating: 0, count: 0 };

    const userRating = userRatings[courseId]?.find(r => r.user === currentUser?.username);
    return {
        rating: course.rating || 0,
        count: course.ratingsCount || 0,
        userRating: userRating?.rating || 0
    };
}

function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            stars += '★';
        } else if (i - 0.5 <= rating) {
            stars += '★';
        } else {
            stars += '☆';
        }
    }
    return stars;
}

// ============================================
// Routing
// ============================================

function handleRoute() {
    const hash = window.location.hash || '#courses';

    // Remove # from hash
    const route = hash.substring(1);

    if (route === 'courses' || route === '') {
        navigateTo('courses', false);
    } else if (route === 'about') {
        navigateTo('about', false);
    } else if (route.startsWith('course/')) {
        const courseId = parseInt(route.split('/')[1]);
        navigateTo('course-details', false, courseId);
    } else if (route.startsWith('lesson/')) {
        const parts = route.split('/');
        const courseId = parseInt(parts[1]);
        const lessonId = parseInt(parts[2]);
        navigateTo('lesson', false, courseId, lessonId);
    }
}

function navigateTo(page, updateHash = true, courseId = null, lessonId = null) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page ||
            (page === 'course-details' && link.dataset.page === 'courses')) {
            link.classList.add('active');
        }
    });

    // Show target page
    let hash = page;

    switch (page) {
        case 'courses':
            document.getElementById('courses-page').classList.add('active');
            hash = '#courses';
            renderCourses();
            break;
        case 'about':
            document.getElementById('about-page').classList.add('active');
            hash = '#about';
            break;
        case 'course-details':
            if (courseId) {
                document.getElementById('course-details-page').classList.add('active');
                renderCourseDetails(courseId);
                hash = `#course/${courseId}`;
            }
            break;
        case 'lesson':
            if (courseId && lessonId) {
                document.getElementById('lesson-page').classList.add('active');
                renderLesson(courseId, lessonId);
                hash = `#lesson/${courseId}/${lessonId}`;
            }
            break;
    }

    // Update URL hash
    if (updateHash) {
        window.location.hash = hash;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
    const hash = window.location.hash;
    if (hash.startsWith('#lesson/')) {
        const courseId = hash.split('/')[1];
        navigateTo('course-details', true, parseInt(courseId));
    } else {
        navigateTo('courses');
    }
}

// ============================================
// Rendering Functions
// ============================================

function renderCourses(searchTerm = '') {
    const level = levelFilter.value;
    const semester = semesterFilter.value;
    const faculty = facultyFilter.value;

    // Filter courses
    let filteredCourses = coursesData;

    // Apply search filter
    if (searchTerm) {
        filteredCourses = filteredCourses.filter(c =>
            c.name.toLowerCase().includes(searchTerm) ||
            c.nameEn.toLowerCase().includes(searchTerm) ||
            c.description.toLowerCase().includes(searchTerm)
        );
    }

    if (level !== 'all') {
        filteredCourses = filteredCourses.filter(c => c.level === parseInt(level));
    }

    if (semester !== 'all') {
        filteredCourses = filteredCourses.filter(c => c.semester === semester);
    }

    if (faculty !== 'all') {
        filteredCourses = filteredCourses.filter(c => c.faculty === faculty);
    }

    // Render courses
    if (filteredCourses.length === 0) {
        coursesGrid.innerHTML = `
            <div class="no-results">
                <h3>لا توجد كورسات</h3>
                <p>لم يتم العثور على كورسات تطابق معايير البحث</p>
            </div>
        `;
        return;
    }

    coursesGrid.innerHTML = filteredCourses.map(course => {
        const progress = calculateCourseProgress(course.id, course.lessons.length);
        const facultyLabel = course.faculty === 'engineering' ? 'علوم الحاسوب' : 'هندسة انظمة الحاسوب' + ' + علوم حاسوب';
        const semesterLabel = course.semester === 'first' ? 'الأول' : 'الثاني';
        const ratingInfo = getCourseRating(course.id);

        return `
            <div class="course-card" onclick="navigateTo('course-details', true, ${course.id})">
                <div class="course-card-header">
                    <h3>${course.name}</h3>
                    <span class="course-faculty">${facultyLabel}</span>
                </div>
                <div class="course-card-body">
                    <div class="course-rating">
                        <span class="rating-stars">${renderStars(ratingInfo.rating)}</span>
                        <span class="rating-count">(${ratingInfo.rating.toFixed(1)} - ${ratingInfo.count} تقييم)</span>
                    </div>
                    <div class="course-meta">
                        <span class="course-badge badge-level">المستوى ${course.level}</span>
                        <span class="course-badge badge-semester">الفصل ${semesterLabel}</span>
                    </div>
                    <p class="course-description">${course.description}</p>
                    <div class="course-lessons">
                        <span>📚</span>
                        <span>${course.lessons.length} دروس</span>
                    </div>
                    <div class="course-progress">
                        <div class="course-progress-bar" style="width: ${progress}%"></div>
                    </div>
                </div>
                <div class="course-card-footer">
                    <button class="btn-view">عرض تفاصيل المقرر</button>
                    ${currentUser ? `
                        <button class="btn-rate" onclick="event.stopPropagation(); openRatingModal(${course.id})">
                            ⭐ ${ratingInfo.userRating > 0 ? 'تعديل التقييم' : 'قيّم الآن'}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderCourseDetails(courseId) {
    const course = coursesData.find(c => c.id === courseId);

    if (!course) {
        courseDetails.innerHTML = '<div class="no-results"><h3>المقرر غير موجود</h3></div>';
        return;
    }

    const progress = calculateCourseProgress(course.id, course.lessons.length);
    const facultyLabel = course.faculty === 'engineering' ? 'كلية الهندسة' : 'كلية تقنية المعلومات';
    const semesterLabel = course.semester === 'first' ? 'الفصل الدراسي الأول' : 'الفصل الدراسي الثاني';
    const ratingInfo = getCourseRating(courseId);

    courseDetails.innerHTML = `
        <div class="course-details-header">
            <h2>${course.name}</h2>
            <div class="course-details-meta">
                <span class="course-badge badge-level">${facultyLabel}</span>
                <span class="course-badge badge-level">المستوى ${course.level}</span>
                <span class="course-badge badge-semester">${semesterLabel}</span>
                <span class="rating-stars" style="color: var(--secondary-color);">${renderStars(ratingInfo.rating)}</span>
            </div>
        </div>
        <div class="course-details-body">
            <p class="course-details-description">${course.description}</p>
            
            ${currentUser ? `
                <button class="btn-rate" onclick="openRatingModal(${course.id})" style="margin-bottom: 1.5rem; width: auto;">
                    ⭐ ${ratingInfo.userRating > 0 ? `تقييمك: ${ratingInfo.userRating} stars` : 'قيّم هذا المقرر'}
                </button>
            ` : ''}
            
            <div class="course-progress" style="margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="font-weight: 600;">تقدمك في المقرر</span>
                    <span style="color: var(--primary-color);">${progress}%</span>
                </div>
                <div class="course-progress-bar" style="width: ${progress}%"></div>
            </div>

            <div class="lessons-list">
                <h3>📚 البلاي ليست الخاصة بالمقرر + الملفات </h3>
                ${course.lessons.map((lesson, index) => {
        const isCompleted = isLessonCompleted(course.id, lesson.id);
        return `
                        <div class="lesson-item" onclick="navigateTo('lesson', true, ${course.id}, ${lesson.id})">
                            <div class="lesson-item-info">
                                <span class="lesson-number">${index + 1}</span>
                                <span class="lesson-title">${lesson.title}</span>
                            </div>
                            <div class="lesson-status">
                                ${isCompleted ?
                '<span class="status-completed">✓ مكتمل</span>' :
                '<span class="status-pending">○ غير مكتمل</span>'
            }
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
}

function renderLesson(courseId, lessonId) {
    const course = coursesData.find(c => c.id === courseId);

    if (!course) {
        lessonContent.innerHTML = '<div class="no-results"><h3>المقرر غير موجود</h3></div>';
        return;
    }

    const lesson = course.lessons.find(l => l.id === lessonId);

    if (!lesson) {
        lessonContent.innerHTML = '<div class="no-results"><h3>الدرس غير موجود</h3></div>';
        return;
    }

    const isCompleted = isLessonCompleted(courseId, lessonId);
    const completedLessons = getCompletedLessonsCount(courseId);

    lessonContent.innerHTML = `
        <div class="lesson-header">
            <h2>${lesson.title}</h2>
            <p>${course.name} - المستوى ${course.level}</p>
        </div>
        <div class="lesson-video">
            <iframe 
                src="${lesson.videoUrl}" 
                title="${lesson.title}"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        </div>
        <div class="lesson-body">
            <p class="lesson-description">${lesson.description}</p>

            ${lesson.slides ? `
                <div class="slides-actions" style="margin-top: 20px; display: flex; gap: 15px; align-items: center;">
                    
                    <a href="${lesson.slides}" 
                    download="${lesson.title}.pdf" 
                    class="btn-download" 
                    style="background-color: #28a745; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                    📥 تحميل السلايدات
                    </a>
                </div>
            ` : ''}
            
            <div style="margin-bottom: 1rem; color: var(--text-light);">
                <span>📊 تقدمك: ${completedLessons} من ${course.lessons.length} دروس</span>
            </div>
            
            <div class="lesson-actions">
                <button 
                    class="btn-complete ${isCompleted ? 'completed' : ''}" 
                    onclick="toggleLessonComplete(${courseId}, ${lessonId})"
                    ${isCompleted ? 'disabled' : ''}
                >
                    ${isCompleted ?
            '✓ تم إكمال هذا الدرس' :
            '✓ وضع علامة مكتمل والانتقال للدرس التالي'
        }
                </button>
                
                ${lessonId < course.lessons.length ?
            `<button class="btn btn-primary" onclick="navigateTo('lesson', true, ${courseId}, ${lessonId + 1})">
                        الدرس التالي →
                    </button>` : ''
        }
            </div>
        </div>
    `;
}

// ============================================
// Filtering
// ============================================

function filterCourses() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    renderCourses(searchTerm);
}

function resetFilters() {
    levelFilter.value = 'all';
    semesterFilter.value = 'all';
    facultyFilter.value = 'all';
    searchInput.value = '';
    renderCourses();
}

// ============================================
// Progress Tracking
// ============================================

function calculateCourseProgress(courseId, totalLessons) {
    if (!userProgress[courseId]) return 0;
    const completed = Object.values(userProgress[courseId]).filter(v => v).length;
    return Math.round((completed / totalLessons) * 100);
}

function getCompletedLessonsCount(courseId) {
    if (!userProgress[courseId]) return 0;
    return Object.values(userProgress[courseId]).filter(v => v).length;
}

function isLessonCompleted(courseId, lessonId) {
    return userProgress[courseId] && userProgress[courseId][lessonId] === true;
}

function toggleLessonComplete(courseId, lessonId) {
    if (!currentUser) {
        showToast('الرجاء تسجيل الدخول لحفظ تقدمك', 'error');
        openLoginModal();
        return;
    }

    if (!userProgress[courseId]) {
        userProgress[courseId] = {};
    }

    const wasCompleted = userProgress[courseId][lessonId];

    if (wasCompleted) {
        // Don't allow uncompleting
        return;
    }

    userProgress[courseId][lessonId] = true;
    saveUserProgress();

    showToast('تم وضع علامة مكتمل بنجاح! 🎉');

    // Find next lesson
    const course = coursesData.find(c => c.id === courseId);
    if (course) {
        const nextLesson = course.lessons.find(l => l.id > lessonId);
        if (nextLesson) {
            setTimeout(() => {
                navigateTo('lesson', true, courseId, nextLesson.id);
            }, 1500);
        }
    }
}

// ============================================
// Utilities
// ============================================

function showToast(message, type = 'success') {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    if (type === 'error') {
        toast.classList.add('error');
    }
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Make functions globally available for onclick handlers
window.navigateTo = navigateTo;
window.goBack = goBack;
window.toggleLessonComplete = toggleLessonComplete;
window.filterCourses = filterCourses;
window.resetFilters = resetFilters;
window.openRatingModal = openRatingModal;
window.closeRatingModal = closeRatingModal;
