const { PrismaClient } = require("@prisma/client");

/**
 * Initializes PrismaClient for database interactions across the application
 * @type {PrismaClient}
 */
let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

module.exports = prisma;
