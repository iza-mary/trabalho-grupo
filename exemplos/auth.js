import jwt from 'jsonwebtoken'

export function authenticate (req, res, next){
    const token = req.cookies.auth_token;
    if(!token) return res.status(401).json({error: 'Token ausente!'});
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET, {issuer: 'myapp'})
        req.user = payload;
        return next()
    }
    catch (error) {
        return res.status(401).json({error: 'Token inválido ou expirado'})
    }
}

export function authorize (...roles){
    return (req, res, next) => {
        if(!req.user) return res.status(401).json({error: 'Não autenticado'})
        if(roles.length && !roles.includes(req.user.role)){
            return res.status(403).json({error: 'Sem permissão'})
        }
        next()
    }
}