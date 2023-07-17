const getConnection = require('../infra/db/connection');


// Função para obter nome do procedimento
async function obterProcedimentos() {
  const query = 'SELECT ds_procedimento as procedimento FROM procedimentos';

  try {
    const connection = await getConnection(); 
    const [results] = await connection.query(query);
    console.log(results);
    let listaProcedimentos = [];
    
    if (Array.isArray(results)) {
        listaProcedimentos = results.map((row) => row.procedimento);
    }
    
    return listaProcedimentos;
  } catch (error) {
    console.error('Erro ao obter Procedimentos:', error);
    throw error;
  }
}

// Função para obter o procedimento com base no código
async function obterProcedimentoPorCodigo(codigo) {
    const query = 'SELECT ds_procedimento AS procedimento FROM procedimentos WHERE procedimento = ?';
  
    try {
      const connection = await getConnection(); 
      const [results] = await connection.query(query, [codigo]);
      
      if (results.length > 0) {
        return results[0].procedimento;
      } else {
        throw new Error('Procedimento não encontrado');
      }
    } catch (error) {
      console.error('Erro ao obter procedimento por código:', error);
      throw error;
    }
  }
  
  module.exports = {
    obterProcedimentos,
    obterProcedimentoPorCodigo
  };
  