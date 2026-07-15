import bcrypt from 'bcryptjs'

// Idempotent seed (all upserts) — safe to run repeatedly. Accepts a Prisma client
// so it can be called from the CLI script OR from server boot (auto-seed if empty).
// Creates only the essentials: admin login, settings, page shells, base menu.
// No sample posts or categories — content is authored in the admin panel.
export async function seedDatabase(db) {
  await db.user.upsert({
    where: { email: 'admin@akganesh.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@akganesh.com',
      password: await bcrypt.hash('Admin@123', 10),
      role: 'admin',
      status: true,
    },
  })

  const settings = {
    site_name: 'AK Ganesh',
    site_email: 'mail@akganesh.in',
    site_phone: '',
    google_analytics: '',
    facebook_link: '', twitter_link: '', linkedin_link: '', instagram_link: '', youtube_link: '',
    copy_rights_info: `© ${new Date().getFullYear()} AKGanesh.com. All rights reserved.`,
    robot_txt: 'User-agent: *\nAllow: /',
    // empty = homepage sections fall back to latest-from-all; pick real
    // categories later in Admin → Settings
    home_hero_category_id: '',
    home_featured_category_id: '',
  }
  for (const [key, value] of Object.entries(settings)) {
    await db.option.upsert({ where: { key }, update: {}, create: { key, value } })
  }

  const pages = [
    ['About Us', 'about-us'], ['Privacy Policy', 'privacy-policy'],
    ['Terms and Conditions', 'terms-and-conditions'], ['Disclaimer', 'disclaimer'],
    ['Refund Policy', 'refund-policy'], ['Cookies Policy', 'cookies-policy'],
  ]
  for (const [title, s] of pages) {
    await db.post.upsert({
      where: { slug: s },
      update: {},
      create: {
        title, slug: s, type: 'page', status: true, publishedAt: new Date(),
        content: `<p>${title} content goes here. Edit this page from the admin panel.</p>`,
      },
    })
  }

  // No sample posts or categories — content is created in the admin panel.
  if ((await db.menu.count()) === 0) {
    const about = await db.post.findUnique({ where: { slug: 'about-us' } })
    const items = [
      { title: 'Home', type: 'custom', url: '/' },
      { title: 'About', type: 'page', refId: about.id },
      { title: 'Contact', type: 'custom', url: '/contact' },
    ]
    for (let i = 0; i < items.length; i++) {
      await db.menu.create({ data: { ...items[i], order: i } })
    }
  }
}
