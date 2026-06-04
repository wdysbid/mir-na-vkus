const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// 1. Схема пользователей
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    favorites: { type: Array, default: [] }
});

// Хэширование пароля перед сохранением
userSchema.pre('save', async function() {
    // Если пароль не менялся — просто выходим из функции
    if (!this.isModified('password')) return;

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        // В async функциях в новых версиях Mongoose next() не нужен
    } catch (err) {
        throw err; // Пробрасываем ошибку дальше
    }
});

// 2. Схема рецептов
const recipeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String },
    cuisine: { type: String },
    category: { type: String },
    ingredients: { type: String },
    instructions: { type: String }
});

// Создаем модели
const User = mongoose.model('User', userSchema);
const Recipe = mongoose.model('Recipe', recipeSchema);

// Экспортируем обе модели
module.exports = { User, Recipe };