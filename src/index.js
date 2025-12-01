// Importa variáveis de ambiente do arquivo .env
import 'dotenv/config'; 

// Importa o Express para criar o servidor e rotas
import express from 'express'; 
import cors from 'cors';     

// Importa o Mongoose para conectar e manipular o MongoDB
import mongoose from 'mongoose'; 

// Cria a instância do Express
const app = express(); 

// Middleware para interpretar requisições com JSON no corpo
app.use(cors());  
app.use(express.json()); 

// Cria um router separado para organizar as rotas da API
const router = express.Router(); 

// Conexão com o MongoDB usando URI do arquivo .env
mongoose.connect(process.env.MONGODB_URI, { dbName: 'HumorAcademicoInteligente' })
   .then(() => console.log('Conectado ao MongoDB com sucesso!'))
   .catch((err) => console.error('Erro ao conectar ao MongoDB:', err.message));

                   // SCHEMA DE HUMOR //
                   
// Define o formato dos documentos da coleção 'humores'
const HumorSchema = new mongoose.Schema({
  humor: { 
    type: String, 
    required: true, // campo obrigatório
    enum: [ // valores permitidos
      "cansada", "estressada", "desanimada", "motivada",
      "curiosa", "ansiosa", "confusa", "feliz",
      "procrastinadora", "insegura", "inspirada", "sobrecarregada"
    ],
    trim: true // remove espaços extras
  },
  frases: { 
    type: [String], 
    required: true,
    validate: [arr => arr.length > 0, 'Deve ter pelo menos uma frase.'], 
    trim: true
  },
  dicas_estudo: { 
    type: [String], 
    required: true,
    validate: [arr => arr.length > 0, 'Deve ter pelo menos uma dica.'], 
    trim: true
  },
  musicas: { 
    type: [String], 
    required: true,
    validate: [arr => arr.length > 0, 'Deve ter pelo menos uma música.'], 
    trim: true
  },
  cores: { 
    type: [String], 
    required: true,
    validate: [arr => arr.length > 0, 'Deve ter pelo menos uma cor.'], 
    trim: true
  },
  snacks: { 
    type: [String], 
    required: true,
    validate: [arr => arr.length > 0, 'Deve ter pelo menos um snack.'], 
    trim: true
  },
  emojis: { 
    type: [String], 
    required: true,
    validate: [arr => arr.length > 0, 'Deve ter pelo menos um emoji.'], 
    trim: true
  },
  metas_rapidas: { 
    type: [String], 
    required: true,
    validate: [arr => arr.length > 0, 'Deve ter pelo menos uma meta rápida.'], 
    trim: true
  },
  descanso: { 
    type: [String], 
    required: true,
    validate: [arr => arr.length > 0, 'Deve ter pelo menos um descanso.'], 
    trim: true
  }
}, { collection: 'humores', timestamps: true }); // timestamps adiciona createdAt e updatedAt

// Cria o modelo para manipular documentos da coleção 'humores'
const Humor = mongoose.model('Humor', HumorSchema, 'humores');

// Conecta o router principal do Express
app.use('/', router);

                  //ROTAS DE HUMOR//

// GET - Listar todos os humores
router.get('/', async (req, res) => {
  try {
    const humores = await Humor.find(); // busca todos os documentos
    res.json(humores); // envia resultado em JSON
  } catch (err) {
    res.status(500).json({ message: err.message }); // erro interno
  }
});

// GET - Buscar humor pelo ID
router.get('/:id', async (req, res) => {
  try {
    const humor = await Humor.findById(req.params.id); // busca por ID
    if (!humor) return res.status(404).json({ message: 'Humor não encontrado' });

    // Atualizando estatísticas de uso (collection 'estatisticas')
    await Estatistica.findOneAndUpdate(
      { humor: humor.humor }, // procura pelo nome do humor
      { $inc: { totalAcessos: 1 }, $set: { ultimaConsulta: new Date() } }, 
      { upsert: true, new: true } // cria se não existir
    );

    res.json(humor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET - Filtrar humores por tipo
router.get('/filtro', async (req, res) => {
  const { humor } = req.query; // lê ?humor=cansada
  if (!humor) return res.status(400).json({ message: 'Informe um humor para filtrar.' });

  try {
    const resultados = await Humor.find({ humor }); // filtra pelo campo humor
    res.json(resultados);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST - Criar novo humor
router.post('/', async (req, res) => {
  const humor = new Humor({
    humor: req.body.humor,
    frases: req.body.frases,
    dicas_estudo: req.body.dicas_estudo,
    musicas: req.body.musicas,
    cores: req.body.cores,
    snacks: req.body.snacks,
    emojis: req.body.emojis,
    metas_rapidas: req.body.metas_rapidas,
    descanso: req.body.descanso
  });

  try {
    const novoHumor = await humor.save(); // salva no MongoDB
    res.status(201).json(novoHumor);
  } catch (err) {
    res.status(400).json({ message: err.message }); // erro de validação
  }
});

// PUT - Atualizar humor pelo ID
router.put('/:id', async (req, res) => {
  try {
    const humor = await Humor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // retorna o novo documento atualizado
    );
    if (!humor) return res.status(404).json({ message: 'Humor não encontrado' });
    res.json(humor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE - Remover humor pelo ID
router.delete('/:id', async (req, res) => {
  try {
    const humor = await Humor.findByIdAndDelete(req.params.id);
    if (!humor) return res.status(404).json({ message: 'Humor não encontrado' });
    res.json({ message: 'Humor removido com sucesso!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//  SCHEMA DE ESTATÍSTICAS  //
const EstatisticaSchema = new mongoose.Schema({
  humor: { type: String, required: true },
  totalAcessos: { type: Number, default: 0 },
  ultimaConsulta: { type: Date, default: Date.now }
}, { collection: 'estatisticas', timestamps: true });

const Estatistica = mongoose.model('Estatistica', EstatisticaSchema, 'estatisticas');

// GET - Listar estatísticas
router.get('/estatisticas', async (req, res) => {
  try {
    const stats = await Estatistica.find(); // busca todas as estatísticas
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

                              // INICIAR SERVIDOR  //
app.listen(process.env.PORT, () => 
  console.log(`Servidor rodando na porta em http://localhost:${process.env.PORT}`)
);

