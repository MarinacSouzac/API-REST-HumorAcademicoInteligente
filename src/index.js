import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';


const app= express();
app.use(express.json());

const router = express.Router();

mongoose.connect(process.env.MONGODB_URI, {dbName: 'HumorAcademicoInteligente'})
   .then(() => console.log('Conectado ao MongoDB com sucesso!'))
   .catch((err) => console.error('Erro ao conectar ao MongoDB:', err.message));

const HumorSchema = new mongoose.Schema({
  humor: { 
    type: String, 
    required: true,
    enum: [
      "cansada", "estressada", "desanimada", "motivada",
      "curiosa", "ansiosa", "confusa", "feliz",
      "procrastinadora", "insegura", "inspirada", "sobrecarregada"
    ],
    trim: true
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
}, {collection: 'humores', timestamps: true }); 

const Humor = mongoose.model('Humor', HumorSchema,'humores');

app.use('/', router);

// GET - Listar todos os humores
router.get('/', async (req, res) => {
  try {
    const humores = await Humor.find();
    res.json(humores);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET - Buscar um humor específico pelo ID
router.get('/:id', async (req, res) => {
  try {
    const humor = await Humor.findById(req.params.id);
    if (!humor) return res.status(404).json({ message: 'Humor não encontrado' });
    res.json(humor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST - Criar um novo humor
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
    const novoHumor = await humor.save();
    res.status(201).json(novoHumor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT - Atualizar um humor existente pelo ID
router.put('/:id', async (req, res) => {
  try {
    const humor = await Humor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!humor) return res.status(404).json({ message: 'Humor não encontrado' });
    res.json(humor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE - Remover um humor pelo ID
router.delete('/:id', async (req, res) => {
  try {
    const humor = await Humor.findByIdAndDelete(req.params.id);
    if (!humor) return res.status(404).json({ message: 'Humor não encontrado' });
    res.json({ message: 'Humor removido com sucesso!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(process.env.PORT, () => 
  console.log(`Servidor rodando na porta em http://localhost:${process.env.PORT}`)
);
