console.log('Script.js carregado.'); // Linha adicionada
('use strict');

const form = document.getElementById('lancamento');

// Função para preencher um elemento select com as opções fornecidas
function preencherSelect(elementId, options) {
  const selectElement = document.getElementById(elementId);

  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.text = option;
    selectElement.appendChild(optionElement);
  });
}

// Função para carregar convênios
async function carregarConvenios() {
  try {
    const response = await fetch('/convenios');
    const convenios = await response.json();
    preencherSelect('convenio', convenios);
  } catch (error) {
    console.error('Erro ao carregar convênios:', error);
  }
}

// Função para carregar clientes
async function carregarClientes() {
  try {
    const response = await fetch('/clientes');
    const clientes = await response.json();
    preencherSelect('cliente', clientes);
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
  }
}

// Função para obter a nomenclatura do procedimento com base no código digitado
async function obterNomenclaturaProcedimento(codigoProcedimento) {
  try {
    const response = await fetch(`/procedimentos/${codigoProcedimento}`);
    const procedimento = await response.json();
    if (response.status !== 200) {
      // não fazemos nada
      return;
    }
    const descricaoProcedimento = document.getElementById(
      'descricao-procedimento'
    );
    descricaoProcedimento.value = procedimento;
  } catch (error) {
    console.error('Erro ao obter nomenclatura do procedimento:', error);
  }
}

// Função para lidar com o evento de mudança no campo "Código do Procedimento"
function handleCodigoProcedimentoChange(event) {
  const codigoProcedimento = event.target.value;
  obterNomenclaturaProcedimento(codigoProcedimento);
}

// Função para formatar o campo "Valor do Procedimento" com a máscara de moeda
function formatarValorProcedimento() {
  const valorProcedimentoInput = document.getElementById('valor-procedimento');

  // Remove qualquer formatação anterior
  valorProcedimentoInput.value = valorProcedimentoInput.value.replace(
    /[^0-9.,]/g,
    ''
  );

  // Adiciona evento de saída de foco ao campo
  valorProcedimentoInput.addEventListener('blur', function (event) {
    const valor = event.target.value.replace(/[^\d.,]/g, ''); // Remove todos os caracteres não numéricos, exceto ponto (.) e vírgula (,)

    if (valor !== '') {
      const valorFormatado = formatarNumeroMoeda(valor);
      event.target.value = valorFormatado;
    }
  });
}

// Função auxiliar para formatar número como moeda
function formatarNumeroMoeda(numero) {
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const numeroFormatado = formatter.format(
    parseFloat(numero.replace(',', '.').replace(/\.(?=[^.]*\.)/g, ''))
  );
  return numeroFormatado;
}

// Função para exibir a mensagem em um modal
function exibirModal(mensagem) {
  const modal = document.getElementById('modal');
  const modalMessage = document.getElementById('modal-message');
  const closeModal = document.getElementsByClassName('close')[0];

  modalMessage.textContent = mensagem;

  modal.style.display = 'block';

  closeModal.onclick = function () {
    modal.style.display = 'none';
  };

  window.onclick = function (event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
}

// Função para gravar os dados do formulário
async function gravarDadosFormulario() {
  try {
    const elements = form.elements;
    const data = {
      convenio: elements.convenio.value,
      cliente: elements.cliente.value,
      'data-procedimento': elements['data-procedimento'].value,
      paciente: elements.paciente.value,
      'codigo-procedimento': elements['codigo-procedimento'].value,
      'descricao-procedimento': elements['descricao-procedimento'].value,
      'valor-procedimento': elements['valor-procedimento'].value,
      'data-recebimento': elements['data-recebimento'].value,
    };
    console.log(data);
    const response = await fetch('/gravar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const data = await response.json();
      // Exibe a mensagem de sucesso sem o modal
      console.log('Sucesso:', data.success);
    } else {
      const errorData = await response.json();
      // Exibe a mensagem de erro sem o modal
      console.error('Erro:', errorData.error);
    }
  } catch (error) {
    console.error('Erro ao gravar dados:', error);
  }
}

// Função para pesquisar dados do formulário
async function pesquisarDadosFormulario() {
  try {
    const searchParams = new URLSearchParams(new FormData(form));
    console.log('Parâmetros de pesquisa:', searchParams.toString());

    const response = await fetch('/consulta?' + searchParams.toString());
    const data = await response.json();

    const tbody = document.querySelector('#quadro-inferior table tbody');
    tbody.innerHTML = '';

    data.forEach(row => {
      const tr = document.createElement('tr');

      const convenioTd = document.createElement('td');
      convenioTd.textContent = row.cd_convenio;
      convenioTd.classList.add('table-cell-centered'); // Adiciona a classe CSS
      tr.appendChild(convenioTd);

      const clienteTd = document.createElement('td');
      clienteTd.textContent = row.cd_cliente;
      clienteTd.classList.add('table-cell-centered'); // Adiciona a classe CSS
      tr.appendChild(clienteTd);

      const dataExecucaoTd = document.createElement('td');
      const dataExecucao = new Date(row.dt_execucao_procedimento);
      dataExecucaoTd.textContent = dataExecucao.toLocaleDateString('pt-BR');
      tr.appendChild(dataExecucaoTd);

      const pacienteTd = document.createElement('td');
      pacienteTd.textContent = row.nm_paciente;
      tr.appendChild(pacienteTd);

      const codigoProcedimentoTd = document.createElement('td');
      codigoProcedimentoTd.textContent = row.cd_procedimento;
      codigoProcedimentoTd.classList.add('table-cell-centered'); // Adiciona a classe CSS
      tr.appendChild(codigoProcedimentoTd);

      const descricaoProcedimentoTd = document.createElement('td');
      descricaoProcedimentoTd.textContent = row.ds_procedimento;
      tr.appendChild(descricaoProcedimentoTd);

      const valorProcedimentoTd = document.createElement('td');
      valorProcedimentoTd.textContent = row.vl_receber;
      valorProcedimentoTd.classList.add('table-cell-centered'); // Adiciona a classe CSS
      tr.appendChild(valorProcedimentoTd);

      const dataRecebimentoTd = document.createElement('td');
      const dataRecebimento = new Date(row.dt_recebimento);
      dataRecebimento.setDate(dataRecebimento.getDate() + 1); // Adiciona um dia à data
      const dataRecebimentoFormatted = dataRecebimento.toLocaleDateString(
        'pt-BR',
        { timeZone: 'America/Cuiaba' }
      );
      dataRecebimentoTd.textContent = dataRecebimentoFormatted;
      dataRecebimentoTd.classList.add('table-cell-centered'); // Adiciona a classe CSS
      tr.appendChild(dataRecebimentoTd);

      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Erro ao pesquisar dados:', error);
  }
}

// Chama as funções para carregar os convênios, clientes e procedimento
window.addEventListener('DOMContentLoaded', async () => {
  await carregarConvenios();
  await carregarClientes();

  const codigoProcedimentoInput = document.getElementById(
    'codigo-procedimento'
  );
  codigoProcedimentoInput.addEventListener(
    'blur',
    handleCodigoProcedimentoChange
  );

  formatarValorProcedimento();

  form.addEventListener('submit', event => {
    event.preventDefault();
    gravarDadosFormulario();
  });

  const btnPesquisar = document.getElementById('btn-pesquisar');
  btnPesquisar.addEventListener('click', () => {
    console.log('Botão "Pesquisar" clicado.');
    pesquisarDadosFormulario(document.getElementById('lancamento'));
  });
});
