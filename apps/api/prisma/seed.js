import { db } from '../src/lib/db.js'
import { seedDatabase } from '../src/lib/seed.js'

seedDatabase(db)
  .then(() => console.log('Seeded. Admin login: admin@akganesh.com / Admin@123'))
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
