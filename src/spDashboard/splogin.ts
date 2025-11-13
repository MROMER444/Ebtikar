import e, { Router, Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import jwt from "jsonwebtoken";
import { decode } from "punycode";

const router = Router();
const prisma = new PrismaClient();



router.post("/login", async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Missing email or password" });
        }
        const sp = await prisma.serviceProvider.findUnique({ where: { email } });
        if (!sp) {
            return res.status(404).json({ success: false, message: "Service provider not found" });
        }
        if (sp.password !== password) {
            return res.status(401).json({ success: false, message: "Invalid password or email" });
        }
        const token = jwt.sign({ sp_id: sp.id }, process.env.JWT_SECRET as string, { expiresIn: "1d" });
        return res.status(200).json({ "success": true, "token": token, "id": sp.id, "username": sp.providerName, "sp": { "id": sp.id, "providerName": sp.providerName, "email": sp.email, "serviceName": sp.serviceName, "status": sp.status } });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error", error });
    }
});


router.get("/profile/:id", async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, message: "Authorization header missing" });
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Token missing" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { sp_id: string };
        if (decoded.sp_id !== req.params.id) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        const sp = await prisma.serviceProvider.findUnique({ where: { id: decoded.sp_id } });
        if (!sp) {
            return res.status(404).json({ success: false, message: "Service provider not found" });
        }
        return res.status(200).json({ success: true, data: { "id": sp.id, "providerName": sp.providerName, "email": sp.email, "serviceName": sp.serviceName, "username": sp.providerName, "status": sp.status, "createdAt": sp.createdAt, "updatedAt": sp.updatedAt } });
    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Token expired", expiredAt: error.expiredAt });
        }
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});

router.get("/services/:sp_id", async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, message: "Authorization header missing" });
        }
        const token = authHeader.split(" ")[1];
        console.log(token);
        
        if (!token) {
            return res.status(401).json({ success: false, message: "Token missing" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { sp_id: string };
        if (decoded.sp_id !== req.params.sp_id) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }
        const services = await prisma.serviceProvider.findUnique({
            where: { id: req.params.sp_id },
            select: {
                serviceName: true
            }
        });
        return res.status(200).json({ success: true, data: services || [] });


    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Token expired", expiredAt: error.expiredAt });
        }
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});


export default router;