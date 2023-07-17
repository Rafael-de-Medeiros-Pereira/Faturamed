const mysql = require('mysql2/promise');

// Configurações da conexão com o banco de dados
const dbConfig = {
  host: 'localhost',         // Endereço do servidor do banco de dados
  user: 'root',       // Nome de usuário do banco de dados
  password: 'root',     // Senha do banco de dados
  database: 'suafatura'  // Nome do banco de dados
};

// Função para obter uma conexão do banco de dados
async function getConnection() {
  const connection = await mysql.createPool(dbConfig).getConnection();
  return connection;
}

module.exports = getConnection;

