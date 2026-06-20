// Живой адрес твоего бэкенда на Render
const API_URL = "https://mir-na-vkus-backend.onrender.com/api";

// ====== ГЛОБАЛЬНЫЕ ФУНКЦИИ (вынесены из DOMContentLoaded, чтобы работать в onclick) ======

// Удаление из избранного
window.removeFavorite = async (recipeName) => {
    const user = localStorage.getItem("loggedInUser");
    if (!user) return;
    if (!confirm(`Удалить "${recipeName}" из избранного?`)) return;

    try {
        const response = await fetch(`${API_URL}/favorites/remove`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, recipeName: recipeName })
        });
        if (response.ok) {
            // Перерисовываем список
            if (typeof window.refreshFavoritesUI === "function") {
                window.refreshFavoritesUI();
            }
        } else {
            alert("Не удалось удалить рецепт.");
        }
    } catch (err) {
        alert("Ошибка при удалении");
    }
};

// Выход из аккаунта
window.logoutUser = () => {
    localStorage.removeItem("loggedInUser");
    window.location.href = "karta.html";
};


// ====== ОСНОВНАЯ ЛОГИКА СТРАНИЦЫ ======
document.addEventListener("DOMContentLoaded", () => {
    // 1. Основные элементы интерфейса
    const authModal = document.getElementById("auth-modal");
    const closeAuth = document.getElementById("close-auth");
    const skipAuthBtn = document.getElementById('skip-auth');
    
    const registerForm = document.getElementById("registration-form");
    const loginForm = document.getElementById("login-form");
    
    const showLogin = document.getElementById("show-login");
    const showRegister = document.getElementById("show-register");
    const registerBtn = document.getElementById("register-btn");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    
    const profileContent = document.getElementById("profile-content");
    const usernameSpan = document.getElementById("username");
    const favoritesList = document.getElementById("favorites-list");

    // 2. Функция обновления состояния страницы
    function updateAuthState() {
        const loggedInUser = localStorage.getItem("loggedInUser");
        const isProfilePage = window.location.pathname.includes("profile.html");

        if (loggedInUser) {
            if (isProfilePage) {
                profileContent?.classList.remove("hidden");
                if (usernameSpan) usernameSpan.textContent = loggedInUser;
                if (authModal) authModal.style.display = "none";
                displayFavorites(); // Загружаем избранные рецепты
            }
        } else {
            if (isProfilePage) {
                profileContent?.classList.add("hidden");
                if (authModal) authModal.style.display = "block";
            }
        }
    }

    // 3. Авторизация (Вход)
    async function loginUser(e) {
        if (e) e.preventDefault(); // Отменяем перезагрузку страницы
        
        const usernameInput = document.getElementById("login-login");
        const passwordInput = document.getElementById("login-password");

        if (!usernameInput.value.trim() || !passwordInput.value.trim()) {
            alert("Заполните все поля для входа!");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    username: usernameInput.value.trim(), 
                    password: passwordInput.value.trim() 
                })
            });
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem("loggedInUser", data.username);
                updateAuthState();
            } else {
                alert(data.message || "Ошибка входа");
            }
        } catch (err) { 
            alert("Ошибка сервера."); 
        }
    }

    // 4. Регистрация
    async function registerUser(e) {
        if (e) e.preventDefault(); // Отменяем перезагрузку страницы
        
        const usernameInput = document.getElementById("register-login");
        const passwordInput = document.getElementById("register-password");
        const confirmInput = document.getElementById("confirm-password");

        if (!usernameInput.value.trim() || !passwordInput.value.trim() || !confirmInput.value.trim()) {
            return alert("Заполните все поля регистрации!");
        }

        if (passwordInput.value !== confirmInput.value) {
            return alert("Пароли не совпадают!");
        }

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    username: usernameInput.value.trim(), 
                    password: passwordInput.value.trim() 
                })
            });
            
            if (response.ok) {
                alert("Регистрация успешна!");
                if (showLogin) showLogin.click();
            } else {
                const data = await response.json();
                alert(data.message || "Ошибка регистрации");
            }
        } catch (err) { 
            alert("Нет связи с сервером"); 
        }
    }

    // 5. Отображение избранных рецептов
    async function displayFavorites() {
        if (!favoritesList) return;
        const user = localStorage.getItem("loggedInUser");
        if (!user) return;

        try {
            const response = await fetch(`${API_URL}/favorites/${user}`);
            const favs = await response.json();

            if (!favs || favs.length === 0) {
                favoritesList.innerHTML = `<p style="text-align:center; width:100%; color: white;">У вас пока нет избранных рецептов.</p>`;
                return;
            }

            favoritesList.innerHTML = favs.map(recipe => `
                <div class="recipe">
                    <div class="favorite-icon" onclick="removeFavorite('${recipe.name}')" style="position: absolute; top: 10px; right: 10px; z-index: 10;">
                        <img src="heart.png" alt="Удалить" style="width:25px; cursor:pointer;">
                    </div>
                    <img src="${recipe.image}" alt="${recipe.name}" onerror="this.src='default.png'">
                    <div class="recipe-content">
                        <h3>${recipe.name}</h3>
                        <p class="details"><strong>Ингредиенты:</strong> ${recipe.ingredients}</p>
                        <div class="instructions" style="display: none; margin-top: 10px;">
                            <hr style="border-color: rgba(255,255,255,0.2);">
                            <strong>Способ приготовления:</strong>
                            <p>${recipe.instructions || 'Инструкция скоро появится...'}</p>
                        </div>
                        <button class="toggle-instructions" style="margin-top:10px;">Способ приготовления</button>
                    </div>
                </div>`).join("");

            attachDetailsLogic();
        } catch (err) { 
            console.error("Ошибка при получении избранного:", err); 
        }
    }

    // Прокидываем функцию обновления списка наружу
    window.refreshFavoritesUI = displayFavorites;

    // Логика кнопок "Показать способ приготовления"
    function attachDetailsLogic() {
        document.querySelectorAll(".toggle-instructions").forEach(btn => {
            btn.onclick = function() {
                const card = this.closest(".recipe-content");
                const inst = card.querySelector(".instructions");
                const isHidden = inst.style.display === "none";
                inst.style.display = isHidden ? "block" : "none";
                this.textContent = isHidden ? "Скрыть" : "Способ приготовления";
            };
        });
    }

    // 6. Слушатели событий клика и перенаправления
    closeAuth?.addEventListener("click", () => {
        window.location.href = "karta.html";
    });

    skipAuthBtn?.addEventListener('click', () => {
        window.location.href = 'karta.html';
    });

    showLogin?.addEventListener("click", (e) => {
        e.preventDefault();
        registerForm?.classList.add("hidden");
        loginForm?.classList.remove("hidden");
    });

    showRegister?.addEventListener("click", (e) => {
        e.preventDefault();
        loginForm?.classList.add("hidden");
        registerForm?.classList.remove("hidden");
    });

    // Возвращаем обычные слушатели клика на кнопки
    registerBtn?.addEventListener("click", registerUser);
    loginBtn?.addEventListener("click", loginUser);
    
    if (logoutBtn) {
        logoutBtn.addEventListener("click", window.logoutUser);
    }

    // Запуск проверки авторизации при загрузке
    updateAuthState();
});