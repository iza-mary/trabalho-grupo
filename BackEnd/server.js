const express = require("express");
const cors = require("cors");

const doacaoRotas = require("./routes/doacaoRoute");
const doadorRotas = require("./routes/doadorRoute");
const idosoRotas = require("./routes/idosoRoute");
const eventoRotas = require("./routes/eventoRoute");
const eventoRotas = require("./routes/eventoRoute");

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use("/api/doacoes", doacaoRotas);
app.use('/api/doadores', doadorRotas);
app.use('/api/idosos', idosoRotas);
app.use('/api/eventos', eventoRotas);
app.use('/api/eventos', eventoRotas);

app.get('/', (req, res) => {
    res.json({ message: "API de Doações funcionando!" })
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta: ${PORT}`);
});