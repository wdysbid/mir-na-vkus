const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');

const { Recipe, User } = require('./models'); 

const app = express();


const MONGO_URI = 'mongodb://yunnastya:yunnastya24052007@ac-jbqt754-shard-00-00.25ibbr2.mongodb.net:27017,ac-jbqt754-shard-00-01.25ibbr2.mongodb.net:27017,ac-jbqt754-shard-00-02.25ibbr2.mongodb.net:27017/mir-na-vkus?ssl=true&replicaSet=atlas-kkk9qy-shard-0&authSource=admin&appName=Cluster0';

app.use(cors()); 
app.use(express.json()); 
app.use(express.static(__dirname));

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ База данных подключена!'))
    .catch(err => console.error('❌ Ошибка подключения:', err));

// --- РЕЦЕПТЫ ---
app.get('/api/recipes', async (req, res) => {
    try {
        const countryName = req.query.country;
        let filter = countryName ? { cuisine: new RegExp('^' + countryName + '$', 'i') } : {};
        const recipes = await Recipe.find(filter);
        res.json(recipes);
    } catch (err) { res.status(500).json({ message: "Ошибка сервера" }); }
});

// --- АВТОРИЗАЦИЯ ---
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ success: false, message: "Пользователь существует" });
        const newUser = new User({ username, password });
        await newUser.save();
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ success: false, message: "Не найден" });
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) res.json({ success: true, username: user.username });
        else res.status(401).json({ success: false, message: "Неверный пароль" });
    } catch (err) { res.status(500).json({ success: false }); }
});

// --- ИЗБРАННОЕ ---
app.get('/api/favorites/:username', async (req, res) => {
    const user = await User.findOne({ username: req.params.username });
    res.json(user ? user.favorites : []);
});

app.post('/api/favorites/add', async (req, res) => {
    await User.findOneAndUpdate({ username: req.body.username }, { $addToSet: { favorites: req.body.recipe } });
    res.json({ success: true });
});

app.post('/api/favorites/remove', async (req, res) => {
    await User.findOneAndUpdate({ username: req.body.username }, { $pull: { favorites: { name: req.body.recipeName } } });
    res.json({ success: true });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'karta.html')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));