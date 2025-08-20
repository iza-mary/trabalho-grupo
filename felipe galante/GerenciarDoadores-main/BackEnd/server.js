const express = require("express");
const cors = require("cors");
const DoadorRoutes = require("./routes/doadorRoutes");
const DoacaoRoutes = require("./routes/doacaoRoutes.js");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/doadores', DoadorRoutes);
app.use('/api/doacoes', DoacaoRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'API de doadores funcionando!' })
});
app.listen(PORT, () => {
    console.log("Servidor rodando na porta:", PORT);
});