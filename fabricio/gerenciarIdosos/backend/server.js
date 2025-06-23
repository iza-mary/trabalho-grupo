const express = require('express');
const cors = require('cors');
const idosoRouters = require('./routers/idosoRouters')

const app = express();
const port = 3000

//Middlewares
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());

app.use('/api/idosos', idosoRouters)

app.get('/', (req, res) => {
    res.json({message: 'API de Idosos funcionando!'})
});

app.listen(port, () =>{
    console.log(`Servidor rodando em http://localhost:${port}`)
});
