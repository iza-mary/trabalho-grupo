const express = require("express");
const cors = require("cors");

const doacaoRotas = require("./routes/doacaoRoute");
const doadorRotas = require("./routes/doadorRoute");

const app = express();
const PORT = 3000;

//Middlewares

app.use(cors());
app.use(express.json());

app.use("/api/doacoes", doacaoRotas);
app.use('/api/doadores', doadorRotas);

app.get('/', (req, res) => {
    res.json({message: "API de Doações funcionando!"})
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta: ${PORT}`);
});