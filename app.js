const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
require ("dotenv").config();
const helmet = require("helmet");

const userRoutes = require("./routes/user");
const sauceRoutes = require("./routes/sauce");

const app = express();

app.use(helmet());

mongoose.connect(`mongodb+srv://${process.env.DEV_USER}:${process.env.DEV_PASS}@cluster0.jx7ax.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`,{ useNewUrlParser: true,useUnifiedTopology: true })
.then(() => console.log('Connexion à MongoDB réussie !'))
.catch(() => console.log('Connexion à MongoDB échouée !'));

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});

app.use(bodyParser.json());

app.use("/images", express.static(path.join(__dirname, "images")));

app.use("/api/auth", userRoutes);
app.use("/api/sauces", sauceRoutes);

module.exports = app;