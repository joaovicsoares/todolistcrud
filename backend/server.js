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

const autenticarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.usuario = usuario;
        next();
    })
}


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



// --- ROTAS QUE PRECISAM DE AUTENTICAÇÃO ---

// ROTA 1: Obter (Ler) todas as tarefas
app.get('/tasks', autenticarToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM tarefas WHERE idusuario = $1 ORDER BY id', [req.usuario.id]); 
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar tarefas.' });
    }
});

// ROTA 2: Adicionar (Criar) uma nova tarefa
app.post('/tasks', autenticarToken, async (req, res) => {
    const { titulo } = req.body; 
    if (!titulo) {
        return res.status(400).json({ message: 'O título é obrigatório.' });
    }
    try {
        const result = await db.query(
            'INSERT INTO tarefas (titulo, concluida, idusuario) VALUES ($1, false, $2) RETURNING *', 
            [titulo, req.usuario.id] 
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao criar tarefa.' });
    }
});

// ROTA 3: Atualizar uma tarefa (marcar como concluída/não concluída)
app.put('/tasks/:id', autenticarToken, async (req, res) => {
    const { id } = req.params;
    const { concluida } = req.body; 
    try {
        const result = await db.query(
            'UPDATE tarefas SET concluida = $1 WHERE id = $2 RETURNING *', 
            [concluida, id] 
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
app.delete('/tasks/:id', autenticarToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM tarefas WHERE id = $1', [id]); 
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