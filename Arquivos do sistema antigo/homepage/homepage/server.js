const express = require("express");
const homeRoute = require("./routes/homeRoute");

const app = express();
const PORT = 3000;

app.use(express.json());

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use("/", homeRoute);

app.listen(PORT, function() {
    console.log("servidor rodando na porta 3000");
})