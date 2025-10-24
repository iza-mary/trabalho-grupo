const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const despesasRoutes = require("./routes/despesasRoutes");

app.use("/despesas", despesasRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
