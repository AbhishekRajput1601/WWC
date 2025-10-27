import User from "../models/User";

const isAdmin = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.body.userId || req.params.userId;
        if (!userId) {
            return res.status(400).json({
                success : false, 
                message: "User ID not provided" 
            });
        }
        const user = await User.findById(userId);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ 
                success : false,
                message: "Access denied. Admins only." 
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ 
            success : false,
            message: "Server error"
        });
    }
};

export default isAdmin;