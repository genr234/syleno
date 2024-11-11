import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";


const app = new Elysia()
  .use(cors())
  .get('/status', () => (`Up and running on ${app.server?.hostname}:${app.server?.port} with Bun ${Bun.version} and Elysia ${app.version}`))
  .listen(8080);

console.log(`Up and running at ${app.server?.url}`)