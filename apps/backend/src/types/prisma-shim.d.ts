// Temporary TypeScript shim for @prisma/client exports to satisfy the compiler
// This file provides minimal `any`-based typings so the project can compile
// while using the generated Prisma client. Replace with real types if needed.
declare module '@prisma/client' {
  export const PrismaClient: any;
  export const Prisma: any;
  export default PrismaClient;
}
