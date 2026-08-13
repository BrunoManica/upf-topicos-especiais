import express from 'express';
import { rotas } from './routes/router';
import { documentacaoSwagger } from './configuracoes/swagger';
import swaggerUi from 'swagger-ui-express';

const app = express();
const porta = 3000;

app.use(express.json());
app.use('/documentacao', swaggerUi.serve, swaggerUi.setup(documentacaoSwagger));
app.use(rotas);

app.listen(porta, () => {
  console.log(`servidor rodando em http://localhost:${porta}`);
  console.log(`servidor rodando em http://localhost:${porta}/documentacao`);
});
