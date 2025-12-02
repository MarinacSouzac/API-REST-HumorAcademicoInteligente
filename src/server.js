// Importa variáveis de ambiente do arquivo .env
import 'dotenv/config';

// Importa bibliotecas essenciais
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// Cria o app Express
const app = express();

// Habilita CORS para todas as requisições
app.use(cors());

// Permite receber requisições com JSON no corpo
app.use(express.json());

// Cria router principal
const router = express.Router();

// Conexão com MongoDB
mongoose.connect(process.env.MONGODB_URI, { dbName: 'HumorAcademicoInteligente' })
  .then(() => console.log('Conectado ao MongoDB com sucesso!'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err.message));

// Schema do Humor
const HumorSchema = new mongoose.Schema({
  humor: {
    type: String,
    required: true,
    trim: true
  },
  frases: { type: [String], required: true, validate: [arr => arr.length > 0, 'Deve ter pelo menos uma frase.'], trim: true },
  dicas_estudo: { type: [String], required: true, validate: [arr => arr.length > 0, 'Deve ter pelo menos uma dica.'], trim: true },
  musicas: { type: [String], required: true, validate: [arr => arr.length > 0, 'Deve ter pelo menos uma música.'], trim: true },
  cores: { type: [String], required: true, validate: [arr => arr.length > 0, 'Deve ter pelo menos uma cor.'], trim: true },
  snacks: { type: [String], required: true, validate: [arr => arr.length > 0, 'Deve ter pelo menos um snack.'], trim: true },
  emojis: { type: [String], required: true, validate: [arr => arr.length > 0, 'Deve ter pelo menos um emoji.'], trim: true },
  metas_rapidas: { type: [String], required: true, validate: [arr => arr.length > 0, 'Deve ter pelo menos uma meta rápida.'], trim: true },
  descanso: { type: [String], required: true, validate: [arr => arr.length > 0, 'Deve ter pelo menos um descanso.'], trim: true }
}, { collection: 'humores', timestamps: true });

const Humor = mongoose.model('Humor', HumorSchema);

// Schema das Estatísticas
const EstatisticaSchema = new mongoose.Schema({
  humor: { type: String, required: true },
  uso: { type: Number, default: 0 },
  ultimaConsultas: { type: [Date], default: [] }
}, { collection: 'estatisticas', timestamps: true });

const Estatistica = mongoose.model('Estatistica', EstatisticaSchema);

// Rota GET para listar todas as estatísticas
router.get('/estatisticas', async (req, res) => {
  try {
    const estatisticas = await Estatistica.find().sort({ uso: -1 });
    res.json(estatisticas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rota POST para registrar acesso a um humor
router.post('/estatisticas/registrar/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const humor = await Humor.findById(id);
    if (!humor) return res.status(404).json({ message: 'Humor não encontrado para registrar estatística.' });

    await Estatistica.findOneAndUpdate(
      { humor: humor.humor },
      { $inc: { uso: 1 }, $push: { ultimaConsultas: new Date() } },
      { upsert: true }
    );

    res.status(200).json({ message: 'Estatística registrada com sucesso.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rota GET para listar todos os humores
router.get('/humores', async (req, res) => {
  try {
    const humores = await Humor.find();
    res.json(humores);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rota GET para filtrar humores por nome
router.get('/humores/filtro', async (req, res) => {
  const { humor } = req.query;
  if (!humor) return res.status(400).json({ message: 'Informe um humor para filtrar.' });

  try {
    const resultados = await Humor.find({ humor });
    res.json(resultados);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rota GET para buscar humor por ID
router.get('/humores/:id', async (req, res) => {
  try {
    const humor = await Humor.findById(req.params.id);
    if (!humor) return res.status(404).json({ message: 'Humor não encontrado' });
    res.json(humor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rota POST para criar novo humor
router.post('/humores', async (req, res) => {
  const humorDigitado = req.body.humor;
  const existente = await Humor.findOne({ humor: humorDigitado });
  if (existente) return res.status(400).json({ message: "Esse humor já existe!" });

  const humor = new Humor({
    humor: humorDigitado,
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
    const estatistica = new Estatistica({ humor: humorDigitado });
    await estatistica.save();
    res.status(201).json(novoHumor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Rota PUT para atualizar humor
router.put("/humores/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { humor, cores, frases, dicas_estudo, musicas, snacks, emojis, metas_rapidas, descanso } = req.body;

    const nomeExistente = await Humor.findOne({ humor: humor, _id: { $ne: id } });
    if (nomeExistente) return res.status(400).json({ erro: "Já existe um humor com esse nome!" });

    const humorAntigo = await Humor.findById(id);
    if (!humorAntigo) return res.status(404).json({ erro: "Humor não encontrado!" });
    const nomeAntigo = humorAntigo.humor;

    const atualizado = await Humor.findByIdAndUpdate(
      id,
      { humor, cores, frases, dicas_estudo, musicas, snacks, emojis, metas_rapidas, descanso },
      { new: true }
    );

    await Estatistica.findOneAndUpdate(
      { humor: nomeAntigo },
      { humor: humor },
      { new: true }
    );

    res.json(atualizado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao atualizar humor" });
  }
});

// Rota DELETE para remover humor
router.delete("/humores/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const deletado = await Humor.findById(id);
    if (!deletado) return res.status(404).json({ erro: "Humor não encontrado" });

    await Humor.findByIdAndDelete(id);
    await Estatistica.deleteOne({ humor: deletado.humor });

    res.json({ msg: "Humor e estatística removidos com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao deletar humor", detalhe: err });
  }
});

// Usa o router no app
app.use("/", router);

// Inicia servidor
app.listen(process.env.PORT, () => 
  console.log(`Servidor rodando na porta em http://localhost:${process.env.PORT}`)
);
