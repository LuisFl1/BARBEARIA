const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORTA = process.env.PORT || 3000;

// ========================================
// CONFIGURAÇÕES
// ========================================

// Permite receber dados em JSON
app.use(express.json());

// Permite receber dados de formulários
app.use(express.urlencoded({ extended: true }));

// ========================================
// PROTEÇÃO DO PAINEL ADMINISTRATIVO
// ========================================

const usuarioAdmin = process.env.ADMIN_USER;
const senhaAdmin = process.env.ADMIN_PASSWORD;

function protegerAdmin(req, res, next) {
    if (!usuarioAdmin || !senhaAdmin) {
        return res.status(503).send(
            "Painel administrativo não configurado."
        );
    }

    const auth = req.headers.authorization || "";
    const [tipo, credenciais] = auth.split(" ");

    let usuario = "";
    let senha = "";

    if (tipo === "Basic" && credenciais) {
        try {
            const texto = Buffer.from(credenciais, "base64").toString("utf8");
            const separador = texto.indexOf(":");

            if (separador !== -1) {
                usuario = texto.slice(0, separador);
                senha = texto.slice(separador + 1);
            }
        } catch (erro) {
            // Credenciais inválidas
        }
    }

    if (usuario === usuarioAdmin && senha === senhaAdmin) {
        return next();
    }

    res.set("WWW-Authenticate", 'Basic realm="Painel Barbearia"');
    return res.status(401).send("Acesso não autorizado.");
}

// Protege a página e todas as rotas administrativas
app.use("/admin.html", protegerAdmin);
app.use("/api/admin", protegerAdmin);

// Define a pasta pública do site
app.use(express.static(path.join(__dirname, "public")));

// ========================================
// BANCO DE DADOS
// ========================================

const caminhoBanco = process.env.DATABASE_PATH || path.join(
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
            agendamentos.profissional_id,
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

                    // ========================================
// LISTAR HORÁRIOS DISPONÍVEIS
// ========================================

app.get("/api/horarios-disponiveis", (req, res) => {

    const {
        profissional_id,
        data
    } = req.query;

    if (!profissional_id || !data) {

        return res.status(400).json({
            sucesso: false,
            mensagem: "Informe o profissional e a data."
        });

    }

    // Horários de funcionamento
    const horarios = [
        "08:00",
        "08:30",
        "09:00",
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "13:00",
        "13:30",
        "14:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
        "16:30",
        "17:00",
        "17:30"
    ];

    const sql = `
        SELECT horario
        FROM agendamentos
        WHERE profissional_id = ?
        AND data = ?
        AND status = 'agendado'
    `;

    db.all(
        sql,
        [profissional_id, data],
        (erro, resultados) => {

            if (erro) {

                console.error(
                    "Erro ao buscar horários:",
                    erro
                );

                return res.status(500).json({
                    sucesso: false,
                    mensagem:
                        "Erro ao buscar horários disponíveis."
                });

            }

            const ocupados =
                resultados.map(
                    agendamento => agendamento.horario
                );

            const disponiveis =
                horarios.filter(
                    horario => !ocupados.includes(horario)
                );

            res.json({
                sucesso: true,
                horarios: disponiveis
            });

        }
    );

});


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


/* ========================================
   PAINEL ADMINISTRATIVO
======================================== */

app.get("/api/admin/agendamentos", (req, res) => {

    // Data de hoje no formato YYYY-MM-DD
    const agora = new Date();

    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");

    const hoje = `${ano}-${mes}-${dia}`;

    // Lista os agendamentos ativos de hoje
    const sqlAgendamentos = `
        SELECT
            a.id,
            a.data,
            a.horario,
            a.status,
            c.nome AS cliente,
            s.nome AS servico,
            s.preco AS preco,
            p.nome AS profissional
        FROM agendamentos a
        JOIN clientes c ON c.id = a.cliente_id
        JOIN servicos s ON s.id = a.servico_id
        JOIN profissionais p ON p.id = a.profissional_id
        WHERE a.data = ?
        AND a.status IN ('agendado', 'confirmado')
        ORDER BY a.horario ASC
    `;

    db.all(sqlAgendamentos, [hoje], (erro, agendamentos) => {

        if (erro) {
            console.error("Erro ao buscar agendamentos:", erro);

            return res.status(500).json({
                sucesso: false,
                mensagem: "Erro ao buscar os agendamentos."
            });
        }

        // Busca os totais para os cartões do painel
        const sqlResumo = `
            SELECT
                (
                    SELECT COUNT(*)
                    FROM agendamentos
                    WHERE data = ?
                    AND status IN ('agendado', 'confirmado')
                ) AS totalHoje,

                (
                    SELECT COUNT(*)
                    FROM agendamentos
                    WHERE data >= ?
                    AND status IN ('agendado', 'confirmado')
                ) AS proximos,

                (
                    SELECT COALESCE(SUM(s.preco), 0)
                    FROM agendamentos a
                    JOIN servicos s ON s.id = a.servico_id
                    WHERE a.data = ?
                      AND a.status IN ('agendado', 'confirmado')
                ) AS faturamento
        `;

        db.get(sqlResumo, [hoje, hoje, hoje], (erroResumo, resumo) => {

            if (erroResumo) {
                console.error("Erro ao buscar resumo:", erroResumo);

                return res.status(500).json({
                    sucesso: false,
                    mensagem: "Erro ao calcular o resumo."
                });
            }

            res.json({
                sucesso: true,
                totalHoje: resumo.totalHoje,
                proximos: resumo.proximos,
                faturamento: resumo.faturamento,
                agendamentos: agendamentos
            });

        });

    });

});


/* ========================================
   ALTERAR STATUS DO AGENDAMENTO PELO PAINEL
======================================== */

app.patch("/api/admin/agendamentos/:id/status", (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Número de atendimento inválido."
        });
    }

    if (!["confirmado", "cancelado"].includes(status)) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Status inválido."
        });
    }

    const sql = `
        UPDATE agendamentos
        SET status = ?
        WHERE id = ?
          AND status IN ('agendado', 'confirmado')
    `;

    db.run(sql, [status, id], function (erro) {
        if (erro) {
            console.error("Erro ao alterar atendimento:", erro);

            return res.status(500).json({
                sucesso: false,
                mensagem: "Não foi possível alterar o atendimento."
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Atendimento não encontrado ou já cancelado."
            });
        }

        res.json({
            sucesso: true,
            mensagem: status === "confirmado"
                ? "Atendimento confirmado!"
                : "Atendimento cancelado!"
        });
    });
});


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

// ========================================
// REMARCAR AGENDAMENTO
// ========================================

app.put("/api/agendamentos/:id/remarcar", (req, res) => {

    const id = req.params.id;

    const {
        data,
        horario
    } = req.body;

    // Verificar se os dados foram enviados
    if (!data || !horario) {

        return res.status(400).json({
            sucesso: false,
            mensagem: "Informe a nova data e o novo horário."
        });

    }

    // Verificar se o horário já está ocupado
    const verificarHorario = `
        SELECT id
        FROM agendamentos
        WHERE profissional_id = (
            SELECT profissional_id
            FROM agendamentos
            WHERE id = ?
        )
        AND data = ?
        AND horario = ?
        AND status = 'agendado'
        AND id != ?
    `;

    db.get(
        verificarHorario,
        [id, data, horario, id],
        (erro, agendamentoExistente) => {

            if (erro) {

                console.error(
                    "Erro ao verificar horário:",
                    erro
                );

                return res.status(500).json({
                    sucesso: false,
                    mensagem: "Erro ao verificar disponibilidade."
                });

            }

            if (agendamentoExistente) {

                return res.status(409).json({
                    sucesso: false,
                    mensagem:
                        "Esse horário já está ocupado."
                });

            }

            // Atualizar o atendimento
            const atualizar = `
                UPDATE agendamentos
                SET data = ?, horario = ?
                WHERE id = ?
                AND status = 'agendado'
            `;

            db.run(
                atualizar,
                [data, horario, id],
                function (erro) {

                    if (erro) {

                        console.error(
                            "Erro ao remarcar:",
                            erro
                        );

                        return res.status(500).json({
                            sucesso: false,
                            mensagem:
                                "Erro ao remarcar atendimento."
                        });

                    }

                    if (this.changes === 0) {

                        return res.status(400).json({
                            sucesso: false,
                            mensagem:
                                "Atendimento não encontrado ou já cancelado."
                        });

                    }

                    res.json({
                        sucesso: true,
                        mensagem:
                            "Atendimento remarcado com sucesso!"
                    });

                }
            );

        }
    );

});