const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./banco'); 

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

app.post('/signup', async (req, res) => {
    const {nome, email, senha} = req.body;
    if (!nome || !email || !senha) {
        return req.status(400).json({message: 'Todos os campos são obrigatorios.'});
    }
    try {
        const senhaHash = await bcrypt.hash(senha, 10);
        const resultado = await db.query(
             "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, email",
            [nome, email, senhaHash]
        );
        res.status(201).json({message:  "Usuário criado com sucesso!", usuario: resultado.rows[0]})
    } catch (error) {
         res.status(500).json({ message: "Erro ao criar usuário. O email já pode estar em uso." });
    }
});

app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const resultado = await db.query("SELECT * FROM usuarios WHERE email = $1", [email]);
        if (resultado.rows.length === 0) {
            return res.status(400).json({ message: "Email ou senha inválidos." });
        }
        const usuario = resultado.rows[0];

     
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(400).json({ message: "Email ou senha inválidos." });
        }

     
        const accessToken = jwt.sign(
            { id: usuario.id, email: usuario.email },
            process.env.JWT_SECRET,
            { expiresIn: '8h' } 
        );
        res.json({ token: accessToken });
    } catch (error) {
        res.status(500).json({ message: "Erro interno do servidor." });
    }
});







// --- ROTAS DA API PARA TAREFAS ---

// ROTA 1: Obter (Ler) todas as tarefas
app.get('/tasks', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM tarefas ORDER BY id'); 
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar tarefas.' });
    }
});

// ROTA 2: Adicionar (Criar) uma nova tarefa
app.post('/tasks', async (req, res) => {
    const { titulo } = req.body; // ALTERADO: "titulo"
    if (!titulo) {
        return res.status(400).json({ message: 'O título é obrigatório.' });
    }
    try {
        const result = await db.query(
            'INSERT INTO tarefas (titulo, concluida) VALUES ($1, false) RETURNING *', // ALTERADO: "tarefas", "titulo", "concluida"
            [titulo] // ALTERADO: "titulo"
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao criar tarefa.' });
    }
});

// ROTA 3: Atualizar uma tarefa (marcar como concluída/não concluída)
app.put('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { concluida } = req.body; // ALTERADO: "concluida"
    try {
        const result = await db.query(
            'UPDATE tarefas SET concluida = $1 WHERE id = $2 RETURNING *', // ALTERADO: "tarefas", "concluida"
            [concluida, id] // ALTERADO: "concluida"
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Tarefa não encontrada.' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar tarefa.' });
    }
});

// ROTA 4: Deletar uma tarefa
app.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM tarefas WHERE id = $1', [id]); // ALTERADO: "tarefas"
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Tarefa não encontrada.' });
        }
        res.sendStatus(204);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao deletar tarefa.' });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});