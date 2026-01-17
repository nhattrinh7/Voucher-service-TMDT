import { defineConfig, env } from 'prisma/config'
import 'dotenv/config'

export default defineConfig({
  schema: 'src/infrastructure/database/prisma/schema.prisma',
  migrations: {
    path: 'src/infrastructure/database/prisma/migrations',
  },
  engine: 'classic',
  datasource: {
    url: env('DATABASE_URL'),
  },
})
