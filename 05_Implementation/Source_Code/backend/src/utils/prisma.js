const { PrismaClient } = require("@prisma/client");

/**
 * Initializes PrismaClient for database interactions across the application
 * @type {PrismaClient}
 */
const prisma = new PrismaClient();

module.exports = prisma;
