const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const convenioRepository = require('./repositories/convenioRepository');
const clienteRepository = require('./repositories/clienteRepository');
const procedimentoRepository = require('./repositories/procedimentoRepository');
const getConnection = require('./infra/db/connection');
const { format } = require('date-fns');
const { zonedTimeToUtc } = require('date-fns-tz');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true })); // Middleware para fazer o parsing dos dados enviados pelo formulário

const port = 3000;

// Rota para renderizar o HTML com os convênios
app.get('/convenios', async (req, res) => {
  try {
    const listaConvenios = await convenioRepository.obterConvenios();
    res.json(listaConvenios);
  } catch (error) {
    console.error('Erro ao obter lista de convênios:', error);
    res.status(500).json({ error: 'Erro ao obter lista de convênios' });
  }
});

// Rota para renderizar o HTML com os clientes
app.get('/clientes', async (req, res) => {
  try {
    const listaClientes = await clienteRepository.obterClientes();
    res.json(listaClientes);
  } catch (error) {
    console.error('Erro ao obter lista de clientes:', error);
    res.status(500).json({ error: 'Erro ao obter lista de clientes' });
  }
});

// Rota para obter o procedimento com base no código
app.get('/procedimentos/:codigo', async (req, res) => {
  const codigo = req.params.codigo;
  try {
    const procedimento = await procedimentoRepository.obterProcedimentoPorCodigo(codigo);
    res.json(procedimento);
  } catch (error) {
    console.error('Erro ao obter procedimento:', error);
    res.status(500).json({ error: 'Erro ao obter procedimento' });
  }
});

// Rota para consultar dados da tabela lanc_fatur
app.get('/consulta', async (req, res) => {
  try {
    
    const convenio = req.query.convenio;
    const cliente = req.query.cliente;
    const dataExecucao = req.query['data-procedimento'];
    const paciente = req.query.paciente;
    const codigoProcedimento = req.query['codigo-procedimento'];
    const descricaoProcedimento = req.query['descricao-procedimento'];
    const valorProcedimento = req.query['valor-procedimento'];
    const dataRecebimento = req.query['data-recebimento'];

    // Construa a consulta SQL com base nos parâmetros fornecidos
    let sql = 'SELECT lf.*, p.ds_procedimento FROM lanc_fatur lf JOIN procedimentos p ON lf.cd_procedimento = p.procedimento WHERE 1=1';
    let params = [];

    if (convenio) {
      sql += ' AND lf.cd_convenio = ?';
      params.push(convenio);
    }

    if (cliente) {
      sql += ' AND lf.cd_cliente = ?';
      params.push(cliente);
    }

    if (dataExecucao) {
      sql += ' AND lf.dt_execucao_procedimento = ?';
      params.push(dataExecucao);
    }

    if (paciente) {
      sql += ' AND lf.nm_paciente LIKE ?';
      params.push('%' + paciente + '%');
    }

    if (codigoProcedimento) {
      sql += ' AND lf.cd_procedimento = ?';
      params.push(codigoProcedimento);
    }

    if (descricaoProcedimento) {
      sql += ' AND p.ds_procedimento LIKE ?';
      params.push('%' + descricaoProcedimento + '%');
    }

    if (valorProcedimento) {
      sql += ' AND lf.vl_receber = ?';
      params.push(valorProcedimento);
    }

    if (dataRecebimento) {
      sql += ' AND lf.dt_recebimento = ?';
      params.push(dataRecebimento);
    }

    sql += ' ORDER BY lf.dt_execucao_procedimento DESC'; // Ordenar por data de execução em ordem ascendente

    const connection = await getConnection();
    const [rows] = await connection.execute(sql, params);
    connection.release();

    res.json(rows);
  } catch (error) {
    console.error('Erro ao consultar dados da tabela lanc_fatur:', error);
    res.status(500).json({ error: 'Erro ao consultar dados da tabela lanc_fatur' });
  }
});


app.post('/gravar', async (req, res) => {
  try {
    console.log('Dados recebidos:', req.body);

    const connection = await getConnection();

    const {
      convenio,
      cliente,
      'data-procedimento': dataProcedimento,
      paciente,
      'codigo-procedimento': codigoProcedimento,
      'descricao-procedimento': descricaoProcedimento,
      'valor-procedimento': valorProcedimento,
      'data-recebimento': dataRecebimento,
    } = req.body;

    // Extrair o código do convênio e limitar o tamanho
    const convenioCodigo = convenio && convenio.substr(0, convenio.indexOf(' - '));

    // Extrair o código do cliente e limitar o tamanho
    const clienteCodigo = cliente && cliente.substr(0, cliente.indexOf(' - '));

    // Converter para maiúsculas antes de passar os valores para a consulta SQL
    const values = [
      convenioCodigo.toUpperCase(),
      clienteCodigo.toUpperCase(),
      zonedTimeToUtc(new Date(dataProcedimento + 'T00:00:00'), 'America/Cuiaba'),
      paciente.toUpperCase(),
      codigoProcedimento.toUpperCase(),
      valorProcedimento.toUpperCase(),
      zonedTimeToUtc(new Date(dataRecebimento + 'T00:00:00'), 'America/Cuiaba'),
    ];

    // Converter a data recebida para o fuso horário do servidor antes de inserir no banco de dados
    const dataProcedimentoServerTimezone = format(zonedTimeToUtc(new Date(dataProcedimento + 'T00:00:00'), 'America/Cuiaba'), 'yyyy-MM-dd');
    const dataRecebimentoServerTimezone = format(zonedTimeToUtc(new Date(dataRecebimento + 'T00:00:00'), 'America/Cuiaba'), 'yyyy-MM-dd');

    // Atualizar o valor da data de execução no array de valores
    values[2] = dataProcedimentoServerTimezone;

    // Atualizar o valor da data de recebimento no array de valores
    values[6] = dataRecebimentoServerTimezone;

    // Consulta para verificar se o registro já existe
    console.log('Verificando duplicidade...');
    const duplicateCheckQuery = 'SELECT COUNT(*) AS count FROM lanc_fatur WHERE cd_convenio = ? AND cd_cliente = ? AND dt_execucao_procedimento = ? AND nm_paciente = ? AND cd_procedimento = ? AND vl_receber = ? AND dt_recebimento = ?';
    const duplicateCheckValues = [...values];
    const [duplicateCheckResults] = await connection.query(duplicateCheckQuery, duplicateCheckValues);

    const { count } = duplicateCheckResults[0];

    if (count > 0) {
      // Registro duplicado encontrado, enviar resposta com status de erro
      console.log('Registro duplicado encontrado:', req.body);
      return res.status(400).json({ error: 'Registro duplicado encontrado' });
    } else {
      // Registro não duplicado, realizar a inserção no banco
      console.log('Inserindo registro:', req.body);

      // Construir a consulta SQL para inserção dos dados
      const insertQuery = 'INSERT INTO lanc_fatur (cd_convenio, cd_cliente, dt_execucao_procedimento, nm_paciente, cd_procedimento, vl_receber, dt_recebimento) VALUES (?, ?, ?, ?, ?, ?, ?)';

      // Executar a consulta SQL para inserção dos dados
      await connection.query(insertQuery, values);

      // Enviar resposta com status de sucesso
      console.log('Dados gravados no banco de dados:', req.body);
      return res.status(200).json({ success: 'Dados gravados no banco de dados' });
    }
  } catch (error) {
    console.error('Erro ao gravar dados no banco de dados:', error);
    res.status(500).json({ error: 'Erro ao gravar dados' });
  }
});

// Rota para renderizar o HTML com o formulário
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'lanc_faturamento.html'));
});

// Tratamento genérico de erros
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Erro interno do servidor');
});

// Iniciar o Servidor
app.listen(port, () => {
  console.log(`Servidor Online em: http://localhost:${port}`);
  console.log('Para desligar o servidor: ctrl + c');
});
