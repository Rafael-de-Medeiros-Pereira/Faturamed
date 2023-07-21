const getConnection = require('../infra/db/connection');


// Função para obter lista de clientes
async function obterClientes() {
  const query = 'SELECT CONCAT(cd_cliente, " - ", nm_razao_social) AS cliente FROM suafatura.clientes';

  try {
    const connection = await getConnection(); 
    const [results] = await connection.query(query);

    let listaClientes = [];
    
    if (Array.isArray(results)) {
        listaClientes = results.map((row) => row.cliente);
    }
    
    return listaClientes;
  } catch (error) {
    console.error('Erro ao obter clientes:', error);
    throw error;
  }
}

module.exports = {
    obterClientes
};
