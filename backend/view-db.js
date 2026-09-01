const pool = require('./config/db');

async function viewDatabase() {
  console.log('\n======================================================');
  console.log('             📊 SPAY DATABASE VIEWER (spay_db)         ');
  console.log('======================================================\n');

  try {
    // 1. Tables List
    const [tables] = await pool.query('SHOW TABLES');
    console.log('📁 TABLES IN DATABASE:');
    tables.forEach((t) => console.log(`   • ${Object.values(t)[0]}`));
    console.log('');

    // 2. Users Table
    console.log('------------------------------------------------------');
    console.log('👤 USERS TABLE (`users`):');
    console.log('------------------------------------------------------');
    const [users] = await pool.query('SELECT id, name, email, phone, spay_id, role, created_at FROM users');
    if (users.length === 0) {
      console.log('   (No users found)');
    } else {
      console.table(users);
    }
    console.log('');

    // 3. Wallets Table
    console.log('------------------------------------------------------');
    console.log('💳 WALLETS TABLE (`wallets`):');
    console.log('------------------------------------------------------');
    const [wallets] = await pool.query(
      `SELECT w.id, w.user_id, u.name AS user_name, u.email, w.balance, w.created_at
       FROM wallets w
       LEFT JOIN users u ON w.user_id = u.id`
    );
    if (wallets.length === 0) {
      console.log('   (No wallets found)');
    } else {
      console.table(wallets);
    }
    console.log('');

    // 4. Transactions Table
    console.log('------------------------------------------------------');
    console.log('💸 TRANSACTIONS TABLE (`transactions`):');
    console.log('------------------------------------------------------');
    const [transactions] = await pool.query(
      `SELECT t.id, t.transaction_id, t.amount, t.transaction_type, t.status, t.description, t.created_at
       FROM transactions t
       ORDER BY t.created_at DESC`
    );
    if (transactions.length === 0) {
      console.log('   (No transactions yet)');
    } else {
      console.table(transactions);
    }
    console.log('');

    console.log('======================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error reading database:', error.message);
    process.exit(1);
  }
}

viewDatabase();

