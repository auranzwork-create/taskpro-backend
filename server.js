const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// --- DATABASE SEMENTARA (IN-MEMORY) ---
let users = [];
let historyList = [];
let deposits = [];
let withdrawals = [];

// AKUN ADMIN BISA DIBUAT DI SINI (Username & Password Admin)
const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "adminpassword123"
};

// 1. Endpoint Login Admin
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        res.json({ success: true, message: "Login Admin Berhasil!", token: "admin-secret-token" });
    } else {
        res.status(401).json({ success: false, message: "Username atau Password Admin Salah!" });
    }
});

// 2. Endpoint Pendaftaran / Login User
app.post('/api/auth/register', (req, res) => {
    const { fullName, phone, password } = req.body;
    let user = users.find(u => u.phone === phone);
    
    if (!user) {
        user = {
            id: Date.now().toString(),
            fullName,
            phone,
            password,
            balance: 0,
            earnings: 0,
            withdrawBank: '',
            withdrawAccount: '',
            withdrawHolder: ''
        };
        users.push(user);
    }
    
    res.json({ success: true, message: 'Berhasil login/register user!', user });
});

// 3. Endpoint Top Up Modal (User mengirim bukti top up)
app.post('/api/deposit', (req, res) => {
    const { phone, amount, sender, method } = req.body;
    const user = users.find(u => u.phone === phone);

    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    const newDeposit = {
        id: 'DEP-' + Date.now(),
        phone,
        userName: user.fullName,
        amount: Number(amount),
        sender,
        method: method || 'bank',
        status: 'pending',
        date: new Date().toLocaleString('id-ID')
    };

    deposits.unshift(newDeposit);
    res.json({ success: true, message: 'Top up berhasil diajukan! Menunggu persetujuan Admin.', deposit: newDeposit });
});

// 4. Endpoint Admin: Lihat Semua Pengajuan Top Up & Withdraw
app.get('/api/admin/dashboard', (req, res) => {
    res.json({ success: true, deposits, withdrawals, usersCount: users.length });
});

// 5. Endpoint Admin: Setujui (Approve) Top Up Modal User
app.post('/api/admin/approve-deposit', (req, res) => {
    const { depositId } = req.body;
    const dep = deposits.find(d => d.id === depositId);

    if (!dep) return res.status(404).json({ success: false, message: 'Data top up tidak ditemukan' });

    dep.status = 'approved';
    const user = users.find(u => u.phone === dep.phone);
    if (user) {
        user.balance += dep.amount; // Saldo user bertambah setelah di-approve admin
    }

    res.json({ success: true, message: `Top up sebesar Rp ${dep.amount} untuk ${dep.userName} telah DISETUJUI!` });
});

app.listen(PORT, () => console.log(`Server TaskPro aktif di port ${PORT}`));