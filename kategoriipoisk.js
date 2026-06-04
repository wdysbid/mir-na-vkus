document.addEventListener("DOMContentLoaded", function () {
    const API_URL = "http://localhost:5000/api";

    // 1. Подсветка активного пункта меню
    const currentPage = window.location.pathname.split("/").pop();
    const menuLinks = document.querySelectorAll("nav ul li a");

    menuLinks.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === currentPage) {
            link.classList.add("active");
        }
    });

    // 2. Глобальные переменные
    let allRecipes = []; 
    let userFavorites = []; // Теперь храним избранное из БД здесь

    const searchInput = document.getElementById("search-input");
    const recipeListSearch = document.getElementById("recipe-list");
    const filters = document.querySelectorAll("input[name='filter']");
    const categoryButtons = document.querySelectorAll(".category-buttons button");

    // 3. ФУНКЦИИ ИЗБРАННОГО (ЧЕРЕЗ БАЗУ ДАННЫХ)
    
    // Получаем избранное пользователя с сервера
    async function loadUserFavorites() {
        const user = localStorage.getItem("loggedInUser");
        if (!user) return;
        try {
            const response = await fetch(`${API_URL}/favorites/${user}`);
            if (response.ok) {
                userFavorites = await response.json();
            }
        } catch (err) {
            console.error("Ошибка при получении избранного из БД:", err);
        }
    }

    function isAuthorized() {
        return !!localStorage.getItem("loggedInUser");
    }

    function isRecipeFavorite(recipe) {
        return userFavorites.some(fav => fav.name === recipe.name);
    }

    // Переключение избранного через API
    async function toggleFavorite(recipe, button) {
        if (!isAuthorized()) {
            alert("Вы не авторизованы! Войдите в профиль, чтобы сохранять рецепты.");
            return;
        }

        const user = localStorage.getItem("loggedInUser");
        const isFav = isRecipeFavorite(recipe);
        
        // Выбираем маршрут в зависимости от того, добавляем или удаляем
        const endpoint = isFav ? '/favorites/remove' : '/favorites/add';
        const body = isFav 
            ? { username: user, recipeName: recipe.name } 
            : { username: user, recipe: recipe };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                // После успешного ответа сервера обновляем локальный массив и иконку
                if (isFav) {
                    userFavorites = userFavorites.filter(f => f.name !== recipe.name);
                    button.src = "heartblack1.png";
                    button.classList.remove("active");
                } else {
                    userFavorites.push(recipe);
                    button.src = "heart.png";
                    button.classList.add("active");
                }
            } else {
                alert("Ошибка при сохранении в базу");
            }
        } catch (err) {
            console.error("Ошибка связи с сервером:", err);
            alert("Нет связи с сервером");
        }
    }

    // 4. ОТРИСОВКА КАРТОЧЕК
    function renderRecipeCard(recipe) {
        const isFavorite = isRecipeFavorite(recipe);
        const recipeCard = document.createElement("div");
        recipeCard.classList.add("recipe");

        recipeCard.innerHTML = `
            <div class="favorite-icon">
                <img class="favorite-btn ${isFavorite ? 'active' : ''}" 
                     src="${isFavorite ? 'heart.png' : 'heartblack1.png'}" 
                     alt="Избранное">
            </div>
            <img src="${recipe.image}" alt="${recipe.name}" onerror="this.src='default.png'"/>
            <div class="recipe-content">
                <h3>${recipe.name}</h3>
                <p class="details"><strong>Кухня:</strong> ${recipe.cuisine}</p>
                <p class="details"><strong>Ингредиенты:</strong> ${recipe.ingredients}</p>
                <p class="category"><strong>Категория:</strong> ${formatCategory(recipe.category)}</p>
                <p class="instructions" style="display: none;">${recipe.instructions}</p>
                <button class="toggle-instructions">Способ приготовления</button>
            </div>
        `;

        const favoriteBtn = recipeCard.querySelector(".favorite-btn");
        favoriteBtn.addEventListener("click", () => toggleFavorite(recipe, favoriteBtn));

        return recipeCard;
    }

    function formatCategory(cat) {
        const categories = {
            "main": "Основное блюдо",
            "soup": "Супы",
            "bkdessert": "Выпечка и десерты",
            "snack": "Закуски",
            "drink": "Напитки"
        };
        return categories[cat] || cat;
    }

    function displayRecipes(recipesToDisplay) {
        if (!recipeListSearch) return;
        recipeListSearch.innerHTML = "";
        recipesToDisplay.forEach(recipe => {
            recipeListSearch.appendChild(renderRecipeCard(recipe));
        });
        addToggleInstructions();
    }

    function addToggleInstructions() {
        document.querySelectorAll(".toggle-instructions").forEach(button => {
            button.onclick = function () {
                const instructions = this.previousElementSibling;
                const isHidden = instructions.style.display === "none";
                instructions.style.display = isHidden ? "block" : "none";
                this.textContent = isHidden ? "Скрыть" : "Способ приготовления";
            };
        });
    }

    // 5. ПОИСК И ФИЛЬТРЫ
    function searchRecipes() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedFilter = document.querySelector("input[name='filter']:checked").value;

        const filteredRecipes = allRecipes.filter(recipe => {
            const fieldToSearch = selectedFilter === "name" ? recipe.name : recipe.ingredients;
            return (fieldToSearch || "").toLowerCase().includes(searchTerm);
        });

        displayRecipes(filteredRecipes);
    }

    function displayRecipesByCategory(category) {
        const filtered = category === "all" 
            ? allRecipes 
            : allRecipes.filter(r => r.category === category);
        displayRecipes(filtered);
    }

    // 6. ЗАГРУЗКА ДАННЫХ ИЗ БАЗЫ
    async function loadRecipesFromDB() {
        try {
            console.log("Загрузка данных из БД...");
            
            // Сначала загружаем избранное пользователя, чтобы правильно отрисовать сердечки
            await loadUserFavorites();

            const response = await fetch(`${API_URL}/recipes`);
            if (!response.ok) throw new Error("Ошибка сервера");
            
            allRecipes = await response.json();
            displayRecipes(allRecipes);
        } catch (error) {
            console.error("Ошибка загрузки:", error);
            if (recipeListSearch) {
                recipeListSearch.innerHTML = `<p style="color: red; text-align: center;">Ошибка загрузки. Проверьте запущен ли сервер.</p>`;
            }
        }
    }

    // 7. ИНИЦИАЛИЗАЦИЯ СОБЫТИЙ
    if (searchInput) {
        searchInput.addEventListener("input", searchRecipes);
        filters.forEach(filter => filter.addEventListener("change", searchRecipes));
    }

    if (categoryButtons.length > 0) {
        categoryButtons.forEach(button => {
            button.addEventListener("click", function () {
                categoryButtons.forEach(btn => btn.classList.remove("active"));
                this.classList.add("active");
                displayRecipesByCategory(this.getAttribute("data-category"));
            });
        });
    }

    // ЗАПУСК
    loadRecipesFromDB();
});