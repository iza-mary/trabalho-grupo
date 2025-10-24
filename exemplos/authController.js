import jwt from 'jsonwebtoken'

const USERS = [
    {id: 1, email: 'admin@site.com', password: 'admin123', role: 'admin'},
    {id: 2, email: 'user@site.com', password: 'admin123', role: 'operador'}
]

export const Login = (req, res) => {
    const {email, password} = req.body;
    
    if (!email || !password) {
        return res.status(400).json({error: 'Email e senha são obrigatórios'});
    }
    
    const user = USERS.find(u => u.email === email && u.password === password);
    if(!user) return res.status(401).json({error: 'Credenciais inválidas'});

    const token = jwt.sign(
        {sub: user.id, role: user.role}, 
        process.env.JWT_SECRET, 
        {expiresIn: process.env.JWT_EXPIRES_IN || '1h', issuer: 'myapp'}
    )

    res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24*60*60*1000
    })

    return res.json({
        user: { id: user.id, email: user.email, role: user.role }
    })
}