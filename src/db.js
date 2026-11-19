import mysql from 'mysql2/promise';
import 'dotenv/config';

const variaveisObrigatorias = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const ausentes = variaveisObrigatorias.filter((nome) => !process.env[nome]);

// Interrompe a inicialização quando alguma configuração essencial não foi informada.
if (ausentes.length > 0) {
  throw new Error(`Variaveis ausentes no .env: ${ausentes.join(', ')}`);
}

// Pool reutiliza conexões e evita abrir uma nova conexão a cada requisição.
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
});
