import { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma";
import axios from "axios";
const prisma = new PrismaClient();



const router = Router();


router.get("/service-providers", async (req: Request, res: Response) => {
  try {
    const providers = await prisma.serviceProvider.findMany({});
    if (!providers) {
      return res.status(404).json({ message: "No service providers found." });
    }
    return res.status(200).json({
      success: true,
      data: providers,
      message: "Service providers retrieved successfully."
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error retrieving service providers",
      error: error.message,
    });
  }
});




router.post("/service-providers", async (req: Request, res: Response) => {
  try {
    const { serviceName, providerName, email, ipAddress, password, callbackUrl } = req.body;

    if (!serviceName || !email || !password) {
      return res.status(400).json({ success: false, message: "serviceName, email, and password are required" });
    }

    const newSP = await prisma.serviceProvider.create({
      data: {
        serviceName,
        providerName,
        email,
        ipAddress,
        password,
        callbackUrl,
      },
    });

    return res.status(201).json({ success: true, data: newSP });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});



router.put("/service-providers/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "ID parameter is required" });
    }
    const { serviceName, providerName, email, password, callbackUrl, status, token } = req.body;

    if (status != true && status != false) {
      return res.status(400).json({ success: false, message: "Invalid status value it must be a true or false" });
    }

    const updatedSP = await prisma.serviceProvider.update({
      where: { id },
      data: {
        serviceName,
        providerName,
        email,
        password,
        callbackUrl,
        status,
        token,
      },
    });

    return res.status(200).json({ success: true, message: "ServiceProvider updated successfully", data: updatedSP });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "ServiceProvider not found" });
    } else if (error.code === "P2002") {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


router.delete("/service-provider/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, message: "ServiceProvider ID is required" });
  }

  try {
    const deletedSP = await prisma.serviceProvider.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "ServiceProvider deleted successfully",
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "ServiceProvider not found" });
    }
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error", error });
  }
});




router.get("/get-service-provider", async (req: Request, res: Response) => {
  try {
    const { id, serviceName, providerName, email } = req.query;

    const filters: any = {};

    if (id) filters.id = id as string;
    if (serviceName) filters.serviceName = { contains: serviceName as string };
    if (providerName) filters.providerName = { contains: providerName as string };
    if (email) filters.email = { contains: email as string };

    const serviceProviders = await prisma.serviceProvider.findMany({
      where: filters,
    });

    return res.status(200).json({
      success: true,
      data: serviceProviders,
    });
  } catch (error) {
    console.error("Error fetching service providers:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
});


router.post("/create-admin", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.admin.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    return res.status(201).json({ success: true, data: admin });
  } catch (error) {
    console.error("Error creating admin:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error });
  }
});





router.get("/profile", async (req: Request, res: Response) => {
  try {
    const adminId = req.query.id as string;

    if (!adminId) {
      return res.status(400).json({ success: false, message: "Admin ID is required" });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, username: true, email: true, role: true, status: true, createdAt: true, updatedAt: true },
    });

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    return res.status(200).json({ success: true, data: admin });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error });
  }
});



router.get("/get-subscriptions", async (req: Request, res: Response) => {
  try {
    const { msisdn } = req.query;

    const whereClause = msisdn ? { msisdn: msisdn as string } : {};

    const subscriptions = await prisma.subscriber_details.findMany({
      where: whereClause,
      select: {
        id: true,
        msisdn: true,
        created_at: true,
        device_type: true,
        service_name: true,
        expiration_date: true,
        subscription: true,
        is_active: true,
      },
    });

    if (msisdn && subscriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No subscriptions found for MSISDN: ${msisdn}`,
      });
    }

    return res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error });
  }
});





router.get("/reports/service-performance", async (req: Request, res: Response) => {
  try {
    const { service_name, service_names, startDate, endDate } = req.query;

    // Handle multiple service names
    let serviceNameArray: string[] = [];
    if (service_names) {
      serviceNameArray = Array.isArray(service_names)
        ? service_names.map(s => s.toString())
        : service_names.toString().split(",").map(s => s.trim()).filter(Boolean);
    } else if (service_name) {
      serviceNameArray = [service_name.toString()];
    }

    if (serviceNameArray.length === 0 || !startDate || !endDate) {
      return res.status(400).json({
        error: "service_name(s), startDate, and endDate are required",
      });
    }

    const start = new Date(startDate.toString());
    const end = new Date(endDate.toString());
    end.setHours(23, 59, 59, 999);

    // Fetch existing service names
    const allServices = await prisma.subscriber_details.findMany({
      select: { service_name: true },
      distinct: ["service_name"],
    });

    const existingServiceNames = allServices.map(s => s.service_name.toLowerCase());
    const missingServices = serviceNameArray.filter(
      name => !existingServiceNames.includes(name.toLowerCase())
    );

    if (missingServices.length > 0) {
      return res.status(404).json({
        error: `Service(s) not found: ${missingServices.join(", ")}`,
      });
    }

    // Generate reports for each service
    const reports = await Promise.all(
      serviceNameArray.map(async rawName => {
        const actualName =
          allServices.find(
            s => s.service_name.toLowerCase() === rawName.toLowerCase()
          )?.service_name || rawName;

        // Generate all days between start and end
        const days = [];
        const current = new Date(start);
        while (current <= end) {
          days.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }

        // Collect per-day data
        const dailyData = await Promise.all(
          days.map(async date => {
            const nextDay = new Date(date);
            nextDay.setHours(23, 59, 59, 999);

            const optins = await prisma.subscriber_details.count({
              where: {
                service_name: actualName,
                created_at: { gte: date, lte: nextDay },
              },
            });

            const optouts = await prisma.unsubscribes.count({
              where: {
                service_name: actualName,
                cancel_date: { gte: date, lte: nextDay },
              },
            });

            const renewalsData = await prisma.renewals.aggregate({
              where: {
                service_name: actualName,
                debit_date: { gte: date, lte: nextDay },
                status: "SUCCESS",
              },
              _count: { _all: true },
              _sum: { amount: true },
            });

            return {
              date: date.toISOString().split("T")[0],
              optins,
              optouts,
              charge_units: renewalsData._count?._all ?? 0,
              total_revenue: renewalsData._sum?.amount ?? 0,
            };
          })
        );

        // Compute totals
        const total = dailyData.reduce(
          (acc, d) => {
            acc.optins += d.optins;
            acc.optouts += d.optouts;
            acc.charge_units += d.charge_units;
            acc.total_revenue += d.total_revenue;
            return acc;
          },
          { optins: 0, optouts: 0, charge_units: 0, total_revenue: 0 }
        );

        return {
          service_name: actualName,
          startDate: startDate.toString(),
          endDate: endDate.toString(),
          daily: dailyData,
          total,
        };
      })
    );

    res.json(serviceNameArray.length === 1 ? reports[0] : reports);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});








router.get("/services", async (req: Request, res: Response) => {
  try {
    const services = await prisma.serviceProvider.findMany({
      select: { serviceName: true },
      distinct: ["serviceName"],
      orderBy: { serviceName: "asc" },
    });

    const serviceNames = services.map((s) => s.serviceName);

    res.json({ services: serviceNames });
  } catch (error: any) {
    console.error("Error fetching services:", error);
    res.status(500).json({
      error: "Failed to fetch services",
      details: error.message,
    });
  }
});



export default router;