// Utilitário para gerar hash bcrypt de uma senha
// Uso: node src/utils/gerarHash.js suaSenhaAqui

const bcrypt = require('bcryptjs');

const senha = process.argv[2];

if (!senha) {
  console.log('❌ Informe a senha como argumento.');
  console.log('   Exemplo: node src/utils/gerarHash.js minhasenha123');
  process.exit(1);
}

bcrypt.hash(senha, 10).then((hash) => {
  console.log('\n✅ Hash gerado com sucesso!\n');
  console.log('Senha:', senha);
  console.log('Hash: ', hash);
  console.log('\n📋 SQL para atualizar o super_admin:');
  console.log(`UPDATE users SET senha_hash = '${hash}' WHERE email = 'superadmin@portaria.com';\n`);
});
