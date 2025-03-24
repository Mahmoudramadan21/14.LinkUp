const { PrismaClient } = require("@prisma/client");

// Create a new instance of PrismaClient
const prisma = new PrismaClient();

// Export the Prisma client for use in other parts of the application
module.exports = prisma;
