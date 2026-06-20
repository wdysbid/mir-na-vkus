document.addEventListener("DOMContentLoaded", () => {
    const authButton = document.getElementById("auth-button");
    const authModal = document.getElementById("auth-modal");
    const closeAuth = document.getElementById("close-auth");
    const skipAuth = document.querySelector(".skip-auth");
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

    // Живой адрес твоего бэкенда на Render
    const BACKEND_URL = "https://mir-na-vkus-backend.onrender.com/";

    // Функция автоматического исправления путей к картинкам
    function fixImagePath(path) {
        if (!path) return "Фото блюд/besh.jpg"; // Заглушка, если путь пустой
        if (path.includes("localhost:5000")) {
            return path.replace(/http:\/\/localhost:5000\/?/, BACKEND_URL);
        }
        if (!path.startsWith("http") && !path.startsWith("https")) {
            // Если путь относительный (например, "Фото блюд/airan.jpg"), склеиваем с бэкендом
            return BACKEND_URL + path;
        }
        return path;
    }

    function updateAuthState() {
        const loggedInUser = localStorage.getItem("loggedInUser");

        if (loggedInUser) {
            if (authButton) {
                authButton.textContent = "Профиль";
                authButton.href = "profile.html";
                authButton.onclick = null;
            }
            profileContent?.classList.remove("hidden");
            if (usernameSpan) usernameSpan.textContent = loggedInUser;
            if (authModal) authModal.style.display = "none";
        } else {
            if (authButton) {
                authButton.textContent = "Профиль";
                authButton.href = "#";
                authButton.onclick = (e) => {
                    e.preventDefault();
                    if (authModal) authModal.style.display = "block";
                };
            }
            profileContent?.classList.add("hidden");

            // Защита: если не авторизован и зашел в профиль — перенаправляем на карту
            if (window.location.pathname.includes("profile.html")) {
                window.location.href = "karta.html";
            }
        }
    }

    function registerUser() {
        const login = document.getElementById("register-login").value.trim();
        const password = document.getElementById("register-password").value.trim();
        const confirmPassword = document.getElementById("confirm-password").value.trim();

        if (login === "" || password === "" || confirmPassword === "") {
            alert("Заполните все поля!");
            return;
        }

        if (password !== confirmPassword) {
            alert("Пароли не совпадают!");
            return;
        }

        localStorage.setItem("user", JSON.stringify({ login, password }));
        alert("Регистрация успешна! Теперь войдите в аккаунт.");
        switchToLogin();
    }

    function loginUser() {
        const login = document.getElementById("login-login").value.trim();
        const password = document.getElementById("login-password").value.trim();
        const savedUser = JSON.parse(localStorage.getItem("user"));

        if (!savedUser || savedUser.login !== login || savedUser.password !== password) {
            alert("Неверные данные!");
            return;
        }

        localStorage.setItem("loggedInUser", login);
        updateAuthState();
        window.location.href = "profile.html";
    }

    function logoutUser() {
        localStorage.removeItem("loggedInUser");
        updateAuthState();
        window.location.href = "karta.html";
    }

    function switchToLogin() {
        registerForm?.classList.add("hidden");
        loginForm?.classList.remove("hidden");
    }

    function switchToRegister() {
        loginForm?.classList.add("hidden");
        registerForm?.classList.remove("hidden");
    }

    function closeAuthModal() {
        if (authModal) authModal.style.display = "none";
    }

    function skipAndGoHome() {
        closeAuthModal();
        window.location.href = "karta.html";
    }

    // Навешиваем события
    closeAuth?.addEventListener("click", closeAuthModal);
    skipAuth?.addEventListener("click", skipAndGoHome);
    showLogin?.addEventListener("click", switchToLogin);
    showRegister?.addEventListener("click", switchToRegister);
    registerBtn?.addEventListener("click", registerUser);
    loginBtn?.addEventListener("click", loginUser);
    if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);

    // ====== ИЗБРАННОЕ (сердечко на кнопках, если они есть на странице) ======
    function updateFavoritesUI() {
        const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
        document.querySelectorAll(".favorite-btn").forEach((btn) => {
            const recipeName = btn.getAttribute("data-name");
            if (favorites.some(recipe => recipe.name === recipeName)) {
                btn.classList.add("favorited");
            } else {
                btn.classList.remove("favorited");
            }
        });
    }

    function toggleFavorite(event) {
        const button = event.currentTarget;
        const recipeName = button.getAttribute("data-name");
        const recipeImage = button.getAttribute("data-image");
        const recipeCuisine = button.getAttribute("data-cuisine");
        const recipeIngredients = button.getAttribute("data-ingredients");

        let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

        if (favorites.some(recipe => recipe.name === recipeName)) {
            favorites = favorites.filter(recipe => recipe.name !== recipeName);
        } else {
            favorites.push({ name: recipeName, image: recipeImage, cuisine: recipeCuisine, ingredients: recipeIngredients });
        }

        localStorage.setItem("favorites", JSON.stringify(favorites));
        updateFavoritesUI();
    }

    document.querySelectorAll(".favorite-btn").forEach(button => {
        button.addEventListener("click", toggleFavorite);
    });

    // ====== ОТОБРАЖЕНИЕ ИЗБРАННЫХ РЕЦЕПТОВ В ПРОФИЛЕ ======
    function renderFavorites() {
        if (!favoritesList) return;

        let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

        if (favorites.length === 0) {
            favoritesList.innerHTML = "<p style='color: white; text-align: center;'>Нет избранных рецептов.</p>";
            return;
        }

        favoritesList.innerHTML = "";
        favorites.forEach(recipe => {
            const name = recipe.name || "Без названия";
            const cuisine = recipe.cuisine || "Не указана";
            const ingredients = recipe.ingredients || "Не указаны";
            const finalImgSrc = fixImagePath(recipe.image); // Корректируем ссылку на картинку

            const recipeItem = document.createElement("div");
            recipeItem.classList.add("recipe"); // Твой адаптивный класс карточки
            recipeItem.innerHTML = `
                <img src="${finalImgSrc}" alt="${name}">
                <div class="recipe-content">
                    <h3>${name}</h3>
                    <p class="category"><strong>Кухня:</strong> ${cuisine}</p>
                    <p class="details"><strong>Ингредиенты:</strong> ${ingredients}</p>
                    <button class="remove-btn" data-name="${name}" style="background: #ff4d4f; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px; margin-top: 10px;">Удалить</button>
                </div>
            `;
            favoritesList.appendChild(recipeItem);
        });

        // Слушатель событий на кнопки удаления внутри личного кабинета
        document.querySelectorAll(".remove-btn").forEach(button => {
            button.addEventListener("click", function () {
                const recipeName = this.getAttribute("data-name");
                let currentFavs = JSON.parse(localStorage.getItem("favorites")) || [];
                currentFavs = currentFavs.filter(recipe => recipe.name !== recipeName);
                localStorage.setItem("favorites", JSON.stringify(currentFavs));
                
                // Удаляем карточку из DOM дерева страницы
                this.closest(".recipe").remove();
                
                if (currentFavs.length === 0) {
                    favoritesList.innerHTML = "<p style='color: white; text-align: center;'>Нет избранных рецептов.</p>";
                }
            });
        });
    }

    // Инициализация функций при загрузке страницы
    updateAuthState();
    updateFavoritesUI();
    renderFavorites();
});