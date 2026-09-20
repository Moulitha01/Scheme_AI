// backend/src/env.js — must be the FIRST import in index.js
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const here = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(here, '..', '.env'), override: true })