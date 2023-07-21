const getConnection = require('../infra/db/connection');


// Função para obter lista de convênios
async function obterConvenios() {
  const query = 'SELECT CONCAT(cd_convenio, " - ", ds_convenio) AS convenio FROM convenio';

  try {
    const connection = await getConnection() 
    const [results] = await connection.query(query);

    let listaConvenios = [];
    
    if (Array.isArray(results)) {
      listaConvenios = results.map((row) => row.convenio);
    }
    
    return listaConvenios;
  } catch (error) {
    console.error('Erro ao obter convênios:', error);
    throw error;
  }
}

module.exports = {
  obterConvenios
};
