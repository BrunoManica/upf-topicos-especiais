import express from 'express'
import { rotas } from './routes/router';


const app = express();
const porta = 3000;

app.use(express.json())
app.use(rotas)

app.listen(porta,()=>{
    console.log(`servidor rodando em http://localhost:${porta}`)
})