document.addEventListener("DOMContentLoaded", () => {
    // Заменили локальный адрес на живой сервер в интернете
    const API_URL = "https://mir-na-vkus-backend.onrender.com/api";
    // --- ФУНКЦИИ ДАННЫХ ---

    // Получаем рецепты из базы данных по названию страны
    async function fetchRecipesByCountry(country) {
        try {
            const response = await fetch(`${API_URL}/recipes?country=${encodeURIComponent(country)}`);
            if (!response.ok) throw new Error("Ошибка загрузки");
            return await response.json();
        } catch (error) {
            console.error("Ошибка при получении данных:", error);
            return [];
        }
    }

    // ТЕПЕРЬ ПОЛУЧАЕМ ИЗБРАННОЕ ИЗ БД
    async function getUserFavoritesFromDB() {
        const user = localStorage.getItem("loggedInUser");
        if (!user) return [];
        try {
            const response = await fetch(`${API_URL}/favorites/${user}`);
            return await response.json();
        } catch (err) {
            return [];
        }
    }

    // --- ФУНКЦИИ ОТОБРАЖЕНИЯ ---

    async function showRecipes(country) {
        const container = document.getElementById('recipe-container');
        const list = document.getElementById('recipe-list');

        list.innerHTML = '<p class="loading">Загрузка вкусных рецептов...</p>';
        container.classList.remove('hidden');

        // Параллельно загружаем рецепты страны и избранное пользователя
        const [recipesData, favorites] = await Promise.all([
            fetchRecipesByCountry(country),
            getUserFavoritesFromDB()
        ]);

        list.innerHTML = ''; 

        if (recipesData.length === 0) {
            list.innerHTML = `<p class="empty">Для страны ${country} пока нет рецептов.</p>`;
            return;
        }

        recipesData.forEach(recipe => {
            const recipeDiv = document.createElement('div');
            recipeDiv.classList.add('recipe');

            // Проверяем, есть ли этот рецепт в избранном (в БД)
            const isFavorite = favorites.some(fav => fav.name === recipe.name);

            recipeDiv.innerHTML = `
                <div class="image-wrapper">
                    <img src="${recipe.image}" alt="${recipe.name}" onerror="this.src='default.png'">
                    <img src="${isFavorite ? 'heart.png' : 'heartblack1.png'}"
                         class="heart-icon"
                         data-name="${recipe.name}"
                         alt="Избранное">
                </div>
                <div class="recipe-info">
                    <h3>${recipe.name}</h3>
                    <p class="ingredients"><b>Ингредиенты:</b> ${recipe.ingredients}</p>
                    <p class="cuisine"><b>Кухня:</b> ${recipe.cuisine || country}</p>
                    <div class="instructions" style="display: none;">
                        <hr>
                        <b>Способ приготовления:</b>
                        <p>${recipe.instructions}</p>
                    </div>
                    <button class="toggle-instructions">Подробнее</button>
                </div>
            `;
            list.appendChild(recipeDiv);
        });
    }

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---

    document.querySelectorAll('.country').forEach(countryElement => {
        countryElement.addEventListener('click', function () {
            const countryName = this.textContent.trim();
            showRecipes(countryName);
            setTimeout(() => {
                document.getElementById('recipe-container').scrollIntoView({ behavior: "smooth" });
            }, 300);
        });
    });

    document.getElementById('recipe-list').addEventListener('click', function (event) {
        const target = event.target;
        if (target.classList.contains('toggle-instructions')) {
            const instructions = target.closest('.recipe').querySelector('.instructions');
            const isHidden = instructions.style.display === "none" || instructions.style.display === "";
            instructions.style.display = isHidden ? "block" : "none";
            target.textContent = isHidden ? "Скрыть" : "Подробнее";
        }

        if (target.classList.contains('heart-icon')) {
            const recipeCard = target.closest('.recipe');
            const recipeData = {
                name: target.dataset.name,
                image: recipeCard.querySelector('.image-wrapper img').src,
                ingredients: recipeCard.querySelector('.ingredients').textContent.replace('Ингредиенты: ', ''),
                cuisine: recipeCard.querySelector('.cuisine').textContent.replace('Кухня: ', ''),
                instructions: recipeCard.querySelector('.instructions p').textContent
            };
            toggleFavoriteInDB(recipeData, target);
        }
    });

    // ФУНКЦИЯ ПЕРЕКЛЮЧЕНИЯ ИЗБРАННОГО ЧЕРЕЗ СЕРВЕР
    async function toggleFavoriteInDB(recipe, heartIcon) {
        const user = localStorage.getItem("loggedInUser");
        if (!user) return alert("Войдите в аккаунт!");

        const isCurrentlyFavorite = heartIcon.src.includes('heart.png') && !heartIcon.src.includes('heartblack1.png');
        const endpoint = isCurrentlyFavorite ? '/favorites/remove' : '/favorites/add';
        const body = isCurrentlyFavorite 
            ? { username: user, recipeName: recipe.name } 
            : { username: user, recipe: recipe };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                heartIcon.src = isCurrentlyFavorite ? 'heartblack1.png' : 'heart.png';
            }
        } catch (err) {
            alert("Ошибка связи с сервером");
        }
    }

    document.getElementById('close-recipes')?.addEventListener('click', () => {
        document.getElementById('recipe-container').classList.add('hidden');
    });
});