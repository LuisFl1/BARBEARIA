// ========================================
// VARIÁVEIS
// ========================================

let agendamento = {
    servicoId: "",
    servicoNome: "",
    profissionalId: "",
    profissionalNome: "",
    data: "",
    horario: "",
    nome: "",
    whatsapp: "",
    email: ""
};


// ========================================
// ELEMENTOS
// ========================================

const servicosContainer =
    document.querySelector(".servicos-grid");

const profissionaisContainer =
    document.querySelector(".profissionais");

const horarios =
    document.querySelectorAll(".horario");

const campoData =
    document.querySelector("#data");

const campoNome =
    document.querySelector("#nome");

const campoWhatsapp =
    document.querySelector("#whatsapp");

const campoEmail =
    document.querySelector("#email");


// ========================================
// CARREGAR SERVIÇOS DO BANCO
// ========================================

async function carregarServicos() {

    try {

        const resposta =
            await fetch("/api/servicos");

        const servicos =
            await resposta.json();


        servicosContainer.innerHTML = "";


        servicos.forEach(servico => {

            const botao =
                document.createElement("button");

            botao.classList.add("servico");

            botao.dataset.id =
                servico.id;

            botao.innerHTML = `
                <span>✂</span>

                <strong>
                    ${servico.nome}
                </strong>

                <small>
                    R$ ${Number(servico.preco).toFixed(2).replace(".", ",")}
                </small>
            `;


            botao.addEventListener("click", () => {

                document
                    .querySelectorAll(".servico")
                    .forEach(item => {
                        item.classList.remove("selecionado");
                    });


                botao.classList.add("selecionado");


                agendamento.servicoId =
                    servico.id;

                agendamento.servicoNome =
                    servico.nome;


                document.querySelector(
                    "#resumoServico"
                ).textContent =
                    servico.nome;

            });


            servicosContainer.appendChild(botao);

        });


    } catch (erro) {

        console.error(
            "Erro ao carregar serviços:",
            erro
        );

    }

}


// ========================================
// CARREGAR PROFISSIONAIS DO BANCO
// ========================================

async function carregarProfissionais() {

    try {

        const resposta =
            await fetch("/api/profissionais");

        const profissionais =
            await resposta.json();


        profissionaisContainer.innerHTML = "";


        profissionais.forEach(profissional => {

            const botao =
                document.createElement("button");

            botao.classList.add(
                "profissional"
            );

            botao.dataset.id =
                profissional.id;


            const primeiraLetra =
                profissional.nome
                    .charAt(0)
                    .toUpperCase();


            botao.innerHTML = `

                <div class="avatar">
                    ${primeiraLetra}
                </div>

                <div>

                    <strong>
                        ${profissional.nome}
                    </strong>

                    <small>
                        Barbeiro
                    </small>

                </div>

            `;


            botao.addEventListener("click", () => {

                document
                    .querySelectorAll(".profissional")
                    .forEach(item => {
                        item.classList.remove(
                            "selecionado"
                        );
                    });


                botao.classList.add(
                    "selecionado"
                );


                agendamento.profissionalId =
                    profissional.id;

                agendamento.profissionalNome =
                    profissional.nome;


                document.querySelector(
                    "#resumoProfissional"
                ).textContent =
                    profissional.nome;


                atualizarHorarios();

            });


            profissionaisContainer.appendChild(
                botao
            );

        });


    } catch (erro) {

        console.error(
            "Erro ao carregar profissionais:",
            erro
        );

    }

}


// ========================================
// DATA MÍNIMA
// ========================================

const hoje = new Date();

const ano =
    hoje.getFullYear();

const mes =
    String(
        hoje.getMonth() + 1
    ).padStart(2, "0");

const dia =
    String(
        hoje.getDate()
    ).padStart(2, "0");


const dataMinima =
    `${ano}-${mes}-${dia}`;


campoData.min =
    dataMinima;


// ========================================
// ALTERAÇÃO DA DATA
// ========================================

campoData.addEventListener(
    "change",
    () => {

        agendamento.data =
            campoData.value;


        if (agendamento.data) {

            const data =
                new Date(
                    agendamento.data +
                    "T00:00:00"
                );


            document.querySelector(
                "#resumoData"
            ).textContent =
                data.toLocaleDateString(
                    "pt-BR"
                );

        } else {

            document.querySelector(
                "#resumoData"
            ).textContent =
                "Não selecionada";

        }


        agendamento.horario = "";


        document.querySelector(
            "#resumoHorario"
        ).textContent =
            "Não selecionado";


        atualizarHorarios();

    }
);


// ========================================
// HORÁRIOS
// ========================================

horarios.forEach(horario => {

    horario.addEventListener(
        "click",
        async () => {

            if (
                horario.classList.contains(
                    "ocupado"
                )
            ) {

                return;

            }


            if (
                !agendamento.profissionalId
            ) {

                alert(
                    "Escolha primeiro um profissional."
                );

                return;

            }


            if (!agendamento.data) {

                alert(
                    "Escolha primeiro uma data."
                );

                return;

            }


            horarios.forEach(item => {
                item.classList.remove(
                    "selecionado"
                );
            });


            horario.classList.add(
                "selecionado"
            );


            agendamento.horario =
                horario.dataset.horario;


            document.querySelector(
                "#resumoHorario"
            ).textContent =
                agendamento.horario;

        }
    );

});


// ========================================
// VERIFICAR HORÁRIOS NO BANCO
// ========================================

async function atualizarHorarios() {

    horarios.forEach(horario => {

        horario.classList.remove(
            "ocupado"
        );

        horario.classList.remove(
            "selecionado"
        );

    });


    if (
        !agendamento.profissionalId ||
        !agendamento.data
    ) {

        return;

    }


    for (const horario of horarios) {

        const hora =
            horario.dataset.horario;


        try {

            const resposta =
                await fetch(
                    `/api/horario-disponivel?profissional_id=${agendamento.profissionalId}&data=${agendamento.data}&horario=${hora}`
                );


            const dados =
                await resposta.json();


            if (!dados.disponivel) {

                horario.classList.add(
                    "ocupado"
                );

            }

        } catch (erro) {

            console.error(
                "Erro ao verificar horário:",
                erro
            );

        }

    }

}


// ========================================
// DADOS DO CLIENTE
// ========================================

campoNome.addEventListener(
    "input",
    () => {

        agendamento.nome =
            campoNome.value.trim();


        atualizarResumoCliente();

    }
);


campoWhatsapp.addEventListener(
    "input",
    () => {

        agendamento.whatsapp =
            campoWhatsapp.value.trim();

    }
);


campoEmail.addEventListener(
    "input",
    () => {

        agendamento.email =
            campoEmail.value.trim();

    }
);


// ========================================
// RESUMO DO CLIENTE
// ========================================

function atualizarResumoCliente() {

    document.querySelector(
        "#resumoCliente"
    ).textContent =

        agendamento.nome ||
        "Não informado";

}


// ========================================
// CONFIRMAR AGENDAMENTO
// ========================================

const botaoConfirmar =
    document.querySelector("#confirmar");


botaoConfirmar.addEventListener(
    "click",
    async () => {


        // -----------------------------
        // VALIDAÇÕES
        // -----------------------------

        if (!agendamento.servicoId) {

            alert(
                "Selecione um serviço."
            );

            return;

        }


        if (!agendamento.profissionalId) {

            alert(
                "Selecione um profissional."
            );

            return;

        }


        if (!agendamento.data) {

            alert(
                "Selecione uma data."
            );

            return;

        }


        if (!agendamento.horario) {

            alert(
                "Selecione um horário."
            );

            return;

        }


        if (!agendamento.nome) {

            alert(
                "Digite seu nome."
            );

            campoNome.focus();

            return;

        }


        if (!agendamento.whatsapp) {

            alert(
                "Digite seu WhatsApp."
            );

            campoWhatsapp.focus();

            return;

        }


        if (!agendamento.email) {

            alert(
                "Digite seu e-mail."
            );

            campoEmail.focus();

            return;

        }


        // -----------------------------
        // ENVIAR PARA O SERVIDOR
        // -----------------------------

        try {

            const resposta =
                await fetch(
                    "/api/agendamentos",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            nome:
                                agendamento.nome,

                            whatsapp:
                                agendamento.whatsapp,

                            email:
                                agendamento.email,

                            servico_id:
                                agendamento.servicoId,

                            profissional_id:
                                agendamento.profissionalId,

                            data:
                                agendamento.data,

                            horario:
                                agendamento.horario

                        })

                    }
                );


            const dados =
                await resposta.json();


            // -----------------------------
            // ERRO
            // -----------------------------

            if (!resposta.ok) {

                alert(
                    dados.mensagem ||
                    "Não foi possível realizar o agendamento."
                );

                atualizarHorarios();

                return;

            }


            // -----------------------------
            // SUCESSO
            // -----------------------------

            mostrarConfirmacao(
                dados.agendamento_id
            );


        } catch (erro) {

            console.error(
                erro
            );

            alert(
                "Erro de conexão com o servidor."
            );

        }

    }
);


// ========================================
// MOSTRAR CONFIRMAÇÃO
// ========================================

function mostrarConfirmacao(
    idAgendamento
) {

    const mensagem =
        document.querySelector(
            "#mensagem"
        );


    const dadosConfirmacao =
        document.querySelector(
            "#dadosConfirmacao"
        );


    const data =
        new Date(
            agendamento.data +
            "T00:00:00"
        );


    const dataFormatada =
        data.toLocaleDateString(
            "pt-BR"
        );


    dadosConfirmacao.innerHTML = `

        <strong>Cliente:</strong>
        ${agendamento.nome}

        <br>

        <strong>WhatsApp:</strong>
        ${agendamento.whatsapp}

        <br>

        <strong>Serviço:</strong>
        ${agendamento.servicoNome}

        <br>

        <strong>Profissional:</strong>
        ${agendamento.profissionalNome}

        <br>

        <strong>Data:</strong>
        ${dataFormatada}

        <br>

        <strong>Horário:</strong>
        ${agendamento.horario}

        <br>

        <strong>Número do atendimento:</strong>
        ${idAgendamento}

    `;


    mensagem.classList.add(
        "exibir"
    );


    mensagem.scrollIntoView({
        behavior: "smooth"
    });

}


// ========================================
// NOVO AGENDAMENTO
// ========================================

const novoAgendamento =
    document.querySelector(
        "#novoAgendamento"
    );


novoAgendamento.addEventListener(
    "click",
    () => {

        location.reload();

    }
);


// ========================================
// INICIALIZAR SISTEMA
// ========================================

carregarServicos();

carregarProfissionais();

// ========================================
// CONSULTAR MEU ATENDIMENTO
// ========================================

const botaoConsultar = document.querySelector("#consultarAtendimento");
const campoNumero = document.querySelector("#numeroAtendimento");
const resultado = document.querySelector("#resultadoAtendimento");

if (botaoConsultar) {

    botaoConsultar.addEventListener("click", async () => {

        const id = campoNumero.value.trim();

        if (!id) {
            alert("Digite o número do atendimento.");
            campoNumero.focus();
            return;
        }

        resultado.innerHTML = `
            <p>Consultando atendimento...</p>
        `;

        try {

            const resposta = await fetch(`/api/agendamentos/${id}`);

            const dados = await resposta.json();

            console.log("Resposta da API:", dados);

            if (!resposta.ok) {

                resultado.innerHTML = `
                    <div class="card-atendimento">

                        <h3>❌ Atendimento não encontrado</h3>

                        <p>
                            ${dados.mensagem}
                        </p>

                    </div>
                `;

                return;
            }

            const agendamento = dados.agendamento;

            const data = new Date(
                agendamento.data + "T00:00:00"
            );

            const dataFormatada =
                data.toLocaleDateString("pt-BR");

            resultado.innerHTML = `
                <div class="card-atendimento">

                    <h3>💈 Seu Atendimento</h3>

                    <div class="dado-atendimento">
                        <strong>Número:</strong>
                        #${agendamento.id}
                    </div>

                    <div class="dado-atendimento">
                        <strong>Cliente:</strong>
                        ${agendamento.cliente}
                    </div>

                    <div class="dado-atendimento">
                        <strong>WhatsApp:</strong>
                        ${agendamento.whatsapp}
                    </div>

                    <div class="dado-atendimento">
                        <strong>E-mail:</strong>
                        ${agendamento.email}
                    </div>

                    <div class="dado-atendimento">
                        <strong>Serviço:</strong>
                        ${agendamento.servico}
                    </div>

                    <div class="dado-atendimento">
                        <strong>Profissional:</strong>
                        ${agendamento.profissional}
                    </div>

                    <div class="dado-atendimento">
                        <strong>Data:</strong>
                        ${dataFormatada}
                    </div>

                    <div class="dado-atendimento">
                        <strong>Horário:</strong>
                        ${agendamento.horario}
                    </div>

                    <div class="dado-atendimento">
                        <strong>Valor:</strong>
                        R$ ${Number(agendamento.preco)
                            .toFixed(2)
                            .replace(".", ",")}
                    </div>

<div class="dado-atendimento">
    <strong>Status:</strong>
    <span class="status-agendado">${agendamento.status}</span>
</div>

${
    agendamento.status === "agendado"
        ? `
            <button
                class="botao-cancelar"
                onclick="cancelarAtendimento(${agendamento.id})"
            >
                ❌ Cancelar atendimento
            </button>
          `
        : ""
}

                </div>
            `;

        } catch (erro) {

            console.error(
                "Erro ao consultar atendimento:",
                erro
            );

            resultado.innerHTML = `
                <div class="card-atendimento">

                    <h3>❌ Erro</h3>

                    <p>
                        Não foi possível consultar o atendimento.
                    </p>

                </div>
            `;
        }

    });

}

// ========================================
// CANCELAR ATENDIMENTO
// ========================================

async function cancelarAtendimento(id) {

    const confirmar = confirm(
        "Tem certeza que deseja cancelar este atendimento?"
    );

    if (!confirmar) {
        return;
    }

    try {

        const resposta = await fetch(
            `/api/agendamentos/${id}/cancelar`,
            {
                method: "PUT"
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {

            alert(dados.mensagem);
            return;

        }

        alert("✅ Atendimento cancelado com sucesso!");

        // Recarrega a consulta
        const campoNumero = document.querySelector("#numeroAtendimento");
        const botaoConsultar = document.querySelector("#consultarAtendimento");

        if (campoNumero && botaoConsultar) {
            botaoConsultar.click();
        }

    } catch (erro) {

        console.error("Erro ao cancelar:", erro);

        alert(
            "❌ Não foi possível cancelar o atendimento."
        );

    }

}