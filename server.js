const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORTA = 3000;

// ========================================
// CONFIGURAÇÕES
// ========================================

// Permite receber dados em JSON
app.use(express.json());

// Permite receber dados de formulários
app.use(express.urlencoded({ extended: true }));

// Define a pasta pública do site
app.use(express.static(path.join(__dirname, "public")));

// ========================================
// BANCO DE DADOS
// ========================================

const caminhoBanco = path.join(
    __dirname,
    "database",
    "banco.db"
);

const db = new sqlite3.Database(caminhoBanco, (erro) => {
    if (erro) {
        console.error("❌ Erro ao conectar ao banco:", erro.message);
    } else {
        console.log("✅ Banco de dados conectado!");
    }
});

// ========================================
// CRIAÇÃO DAS TABELAS
// ========================================

db.serialize(() => {

    // -----------------------------
    // TABELA DE SERVIÇOS
    // -----------------------------

    db.run(`
        CREATE TABLE IF NOT EXISTS servicos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            preco REAL DEFAULT 0,
            duracao INTEGER DEFAULT 30
        )
    `, (erro) => {

        if (erro) {
            console.error("Erro ao criar tabela servicos:", erro.message);
        } else {
            console.log("✅ Tabela servicos pronta!");
        }

    });


    // -----------------------------
    // TABELA DE PROFISSIONAIS
    // -----------------------------

    db.run(`
        CREATE TABLE IF NOT EXISTS profissionais (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            ativo INTEGER DEFAULT 1
        )
    `, (erro) => {

        if (erro) {
            console.error(
                "Erro ao criar tabela profissionais:",
                erro.message
            );
        } else {
            console.log("✅ Tabela profissionais pronta!");
        }

    });


    // -----------------------------
    // TABELA DE CLIENTES
    // -----------------------------

    db.run(`
        CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            whatsapp TEXT NOT NULL,
            email TEXT NOT NULL
        )
    `, (erro) => {

        if (erro) {
            console.error(
                "Erro ao criar tabela clientes:",
                erro.message
            );
        } else {
            console.log("✅ Tabela clientes pronta!");
        }

    });


    // -----------------------------
    // TABELA DE AGENDAMENTOS
    // -----------------------------

    db.run(`
        CREATE TABLE IF NOT EXISTS agendamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            cliente_id INTEGER NOT NULL,

            servico_id INTEGER NOT NULL,

            profissional_id INTEGER NOT NULL,

            data TEXT NOT NULL,

            horario TEXT NOT NULL,

            status TEXT DEFAULT 'agendado',

            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (cliente_id)
                REFERENCES clientes(id),

            FOREIGN KEY (servico_id)
                REFERENCES servicos(id),

            FOREIGN KEY (profissional_id)
                REFERENCES profissionais(id),

            UNIQUE (
                profissional_id,
                data,
                horario
            )
        )
    `, (erro) => {

        if (erro) {
            console.error(
                "Erro ao criar tabela agendamentos:",
                erro.message
            );
        } else {
            console.log("✅ Tabela agendamentos pronta!");
        }

    });

});


// ========================================
// INSERIR SERVIÇOS
// ========================================

const servicos = [

    ["Corte degradê", 35, 40],

    ["Corte social", 30, 30],

    ["Barba", 25, 30],

    ["Corte + barba", 50, 60],

    ["Sobrancelha", 15, 15],

    ["Corte e penteado", 45, 50],

    ["Limpeza de pele", 60, 60],

    ["Corte + progressiva", 100, 120],

    ["Corte + alisamento", 100, 120],

    ["Corte + botox", 110, 120],

    ["Corte + hidratação", 80, 90],

    ["Acabamento", 20, 20],

    ["Corte + luzes", 150, 180]

];


// ========================================
// INSERIR SERVIÇOS APENAS SE NÃO EXISTIREM
// ========================================

db.get(
    "SELECT COUNT(*) AS total FROM servicos",
    (erro, resultado) => {

        if (erro) {
            console.error(
                "Erro ao verificar serviços:",
                erro.message
            );

            return;
        }

        if (resultado.total === 0) {

            const comando = `
                INSERT INTO servicos
                (nome, preco, duracao)
                VALUES (?, ?, ?)
            `;

            servicos.forEach((servico) => {

                db.run(
                    comando,
                    servico,
                    (erro) => {

                        if (erro) {
                            console.error(
                                "Erro ao inserir serviço:",
                                erro.message
                            );
                        }

                    }
                );

            });

            console.log("✅ Serviços cadastrados!");

        }

    }
);


// ========================================
// INSERIR PROFISSIONAIS
// ========================================

const profissionais = [
    "Carlos",
    "João",
    "Lucas"
];


db.get(
    "SELECT COUNT(*) AS total FROM profissionais",
    (erro, resultado) => {

        if (erro) {

            console.error(
                "Erro ao verificar profissionais:",
                erro.message
            );

            return;
        }

        if (resultado.total === 0) {

            const comando = `
                INSERT INTO profissionais
                (nome)
                VALUES (?)
            `;

            profissionais.forEach((nome) => {

                db.run(
                    comando,
                    [nome],
                    (erro) => {

                        if (erro) {

                            console.error(
                                "Erro ao inserir profissional:",
                                erro.message
                            );

                        }

                    }
                );

            });

            console.log("✅ Profissionais cadastrados!");

        }

    }
);


// ========================================
// ROTA PRINCIPAL
// ========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


// ========================================
// LISTAR SERVIÇOS
// ========================================

app.get("/api/servicos", (req, res) => {

    db.all(
        `
        SELECT *
        FROM servicos
        ORDER BY nome
        `,
        [],
        (erro, resultados) => {

            if (erro) {

                console.error(erro);

                return res.status(500).json({
                    erro: "Erro ao buscar serviços."
                });

            }

            res.json(resultados);

        }
    );

});


// ========================================
// LISTAR PROFISSIONAIS
// ========================================

app.get("/api/profissionais", (req, res) => {

    db.all(
        `
        SELECT *
        FROM profissionais
        WHERE ativo = 1
        ORDER BY nome
        `,
        [],
        (erro, resultados) => {

            if (erro) {

                console.error(erro);

                return res.status(500).json({
                    erro: "Erro ao buscar profissionais."
                });

            }

            res.json(resultados);

        }
    );

});


// ========================================
// VERIFICAR HORÁRIO
// ========================================

app.get("/api/horario-disponivel", (req, res) => {

    const {
        profissional_id,
        data,
        horario
    } = req.query;


    if (
        !profissional_id ||
        !data ||
        !horario
    ) {

        return res.status(400).json({
            disponivel: false,
            erro: "Dados incompletos."
        });

    }


    const sql = `
        SELECT id
        FROM agendamentos
        WHERE profissional_id = ?
        AND data = ?
        AND horario = ?
        AND status = 'agendado'
    `;


    db.get(
        sql,
        [
            profissional_id,
            data,
            horario
        ],
        (erro, resultado) => {

            if (erro) {

                console.error(erro);

                return res.status(500).json({
                    disponivel: false,
                    erro: "Erro ao verificar horário."
                });

            }


            res.json({
                disponivel: !resultado
            });

        }
    );

});


// ========================================
// CRIAR AGENDAMENTO
// ========================================

// ========================================
// CONSULTAR AGENDAMENTO
// ========================================

app.get("/api/agendamentos/:id", (req, res) => {

    const id = req.params.id;

    const sql = `
        SELECT
            agendamentos.id,
            clientes.nome AS cliente,
            clientes.whatsapp,
            clientes.email,
            servicos.nome AS servico,
            servicos.preco,
            profissionais.nome AS profissional,
            agendamentos.data,
            agendamentos.horario,
            agendamentos.status,
            agendamentos.criado_em
        FROM agendamentos

        INNER JOIN clientes
            ON clientes.id = agendamentos.cliente_id

        INNER JOIN servicos
            ON servicos.id = agendamentos.servico_id

        INNER JOIN profissionais
            ON profissionais.id = agendamentos.profissional_id

        WHERE agendamentos.id = ?
    `;

    db.get(sql, [id], (erro, agendamento) => {

        if (erro) {
            console.error("Erro ao consultar agendamento:", erro);

            return res.status(500).json({
                sucesso: false,
                mensagem: "Erro ao consultar agendamento."
            });
        }

        if (!agendamento) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Agendamento não encontrado."
            });
        }

        res.json({
            sucesso: true,
            agendamento: agendamento
        });
    });
});

app.post("/api/agendamentos", (req, res) => {

    const {
        nome,
        whatsapp,
        email,
        servico_id,
        profissional_id,
        data,
        horario
    } = req.body;


    // -----------------------------
    // VALIDAR CAMPOS
    // -----------------------------

    if (
        !nome ||
        !whatsapp ||
        !email ||
        !servico_id ||
        !profissional_id ||
        !data ||
        !horario
    ) {

        return res.status(400).json({
            sucesso: false,
            mensagem: "Preencha todos os campos."
        });

    }


    // -----------------------------
    // VERIFICAR HORÁRIO
    // -----------------------------

    const verificarHorario = `
        SELECT id
        FROM agendamentos
        WHERE profissional_id = ?
        AND data = ?
        AND horario = ?
        AND status = 'agendado'
    `;


    db.get(
        verificarHorario,
        [
            profissional_id,
            data,
            horario
        ],
        (erro, agendamentoExistente) => {

            if (erro) {

                console.error(erro);

                return res.status(500).json({
                    sucesso: false,
                    mensagem: "Erro ao verificar horário."
                });

            }


            if (agendamentoExistente) {

                return res.status(409).json({
                    sucesso: false,
                    mensagem:
                        "Esse horário já está ocupado."
                });

            }


            // -----------------------------
            // CRIAR CLIENTE
            // -----------------------------

            const sqlCliente = `
                INSERT INTO clientes
                (nome, whatsapp, email)
                VALUES (?, ?, ?)
            `;


            db.run(
                sqlCliente,
                [
                    nome,
                    whatsapp,
                    email
                ],
                function (erro) {

                    if (erro) {

                        console.error(erro);

                        return res.status(500).json({
                            sucesso: false,
                            mensagem:
                                "Erro ao cadastrar cliente."
                        });

                    }


                    const clienteId = this.lastID;


                    // -----------------------------
                    // CRIAR AGENDAMENTO
                    // -----------------------------

                    const sqlAgendamento = `
                        INSERT INTO agendamentos
                        (
                            cliente_id,
                            servico_id,
                            profissional_id,
                            data,
                            horario
                        )
                        VALUES (?, ?, ?, ?, ?)
                    `;


                    db.run(
                        sqlAgendamento,
                        [
                            clienteId,
                            servico_id,
                            profissional_id,
                            data,
                            horario
                        ],
                        function (erro) {

                            if (erro) {

                                console.error(erro);

                                return res.status(500).json({
                                    sucesso: false,
                                    mensagem:
                                        "Erro ao criar agendamento."
                                });

                            }


                            res.status(201).json({

                                sucesso: true,

                                mensagem:
                                    "Agendamento realizado com sucesso!",

                                agendamento_id:
                                    this.lastID

                            });

                        }
                    );

                }
            );

        }
    );

});

// ========================================
// CANCELAR AGENDAMENTO
// ========================================

app.put("/api/agendamentos/:id/cancelar", (req, res) => {

    const id = req.params.id;

    const sql = `
        UPDATE agendamentos
        SET status = 'cancelado'
        WHERE id = ?
        AND status = 'agendado'
    `;

    db.run(sql, [id], function (erro) {

        if (erro) {

            console.error("Erro ao cancelar agendamento:", erro);

            return res.status(500).json({
                sucesso: false,
                mensagem: "Erro ao cancelar agendamento."
            });

        }

        if (this.changes === 0) {

            return res.status(400).json({
                sucesso: false,
                mensagem:
                    "Agendamento não encontrado ou já foi cancelado."
            });

        }

        res.json({
            sucesso: true,
            mensagem: "Agendamento cancelado com sucesso!"
        });

    });

});

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORTA, () => {

    console.log("");
    console.log("=================================");
    console.log("💈 BARBEARIA");
    console.log("=================================");
    console.log(
        `🚀 Servidor rodando em http://localhost:${PORTA}`
    );
    console.log("=================================");
    console.log("");

});