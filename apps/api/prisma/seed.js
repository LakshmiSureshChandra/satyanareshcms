import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import transliterate from 'any-ascii'

const db = new PrismaClient()

const slug = (t) =>
  transliterate(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

async function main() {
  // admin user
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

  // categories (reference site's menu categories)
  const catNames = ['దైవం', 'వ్యాపారం', 'వెండి తెర', 'పుస్తకాలు', 'తాజా వార్తలు', 'ప్రత్యేకం']
  const cats = {}
  for (const name of catNames) {
    cats[name] = await db.category.upsert({
      where: { slug: slug(name) },
      update: {},
      create: { name, slug: slug(name), status: true },
    })
  }

  // settings
  const settings = {
    site_name: 'AK Ganesh',
    site_email: 'contact@akganesh.com',
    site_phone: '',
    google_analytics: '',
    facebook_link: '', twitter_link: '', linkedin_link: '', instagram_link: '', youtube_link: '',
    copy_rights_info: `© ${new Date().getFullYear()} AKGanesh.com. All rights reserved.`,
    robot_txt: 'User-agent: *\nAllow: /',
    home_hero_category_id: String(cats['తాజా వార్తలు'].id),
    home_featured_category_id: String(cats['ప్రత్యేకం'].id),
  }
  for (const [key, value] of Object.entries(settings)) {
    await db.option.upsert({ where: { key }, update: {}, create: { key, value } })
  }

  // static pages
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

  // sample posts (Telugu)
  const samples = [
    ['తిరుమల శ్రీవారి బ్రహ్మోత్సవాలు ఘనంగా ప్రారంభం', 'దైవం'],
    ['హైదరాబాద్‌లో కొత్త స్టార్టప్ హబ్ ప్రారంభం', 'వ్యాపారం'],
    ['టాలీవుడ్ కొత్త చిత్రం రికార్డుల మోత', 'వెండి తెర'],
    ['ఈ నెల చదవాల్సిన ఐదు తెలుగు పుస్తకాలు', 'పుస్తకాలు'],
    ['రాష్ట్రంలో భారీ వర్షాలు — అప్రమత్తత అవసరం', 'తాజా వార్తలు'],
    ['అయోధ్య రామమందిర దర్శన సమయాల్లో మార్పులు', 'దైవం'],
    ['చిన్న వ్యాపారాలకు కొత్త రుణ పథకం', 'వ్యాపారం'],
    ['ప్రముఖ దర్శకుడి కొత్త ప్రాజెక్ట్ ప్రకటన', 'వెండి తెర'],
    ['వేసవిలో ఆరోగ్య జాగ్రత్తలు — నిపుణుల సూచనలు', 'ప్రత్యేకం'],
    ['విద్యార్థులకు ఉచిత శిక్షణ కార్యక్రమం', 'తాజా వార్తలు'],
    ['పండుగ సీజన్‌లో బంగారం ధరల పెరుగుదల', 'వ్యాపారం'],
    ['సాహిత్య అకాడమీ అవార్డుల ప్రకటన', 'పుస్తకాలు'],
  ]
  for (let i = 0; i < samples.length; i++) {
    const [title, catName] = samples[i]
    const s = `${slug(title)}` || `post-${i}`
    const post = await db.post.upsert({
      where: { slug: s },
      update: {},
      create: {
        title, slug: s, type: 'post', status: true,
        publishedAt: new Date(Date.now() - i * 6 * 3600 * 1000),
        tags: 'తెలుగు,వార్తలు',
        content: `<p>${title}. ఇది నమూనా వార్తా కథనం. అడ్మిన్ ప్యానెల్ నుండి ఈ కంటెంట్‌ను మార్చవచ్చు.</p><p>పూర్తి వివరాలు త్వరలో అందుబాటులోకి వస్తాయి.</p>`,
        metaDescription: `${title} — పూర్తి వివరాలు చదవండి.`,
        createdBy: 1,
      },
    })
    await db.categoryPost.upsert({
      where: { postId_categoryId: { postId: post.id, categoryId: cats[catName].id } },
      update: {},
      create: { postId: post.id, categoryId: cats[catName].id },
    })
  }

  // default menu
  if ((await db.menu.count()) === 0) {
    const about = await db.post.findUnique({ where: { slug: 'about-us' } })
    const items = [
      { title: 'Home', type: 'custom', url: '/' },
      ...catNames.slice(0, 4).map((n) => ({ title: n, type: 'category', refId: cats[n].id })),
      { title: 'About', type: 'page', refId: about.id },
      { title: 'Contact', type: 'custom', url: '/contact' },
    ]
    for (let i = 0; i < items.length; i++) {
      await db.menu.create({ data: { ...items[i], order: i } })
    }
  }

  console.log('Seeded. Admin login: admin@akganesh.com / Admin@123')
}

main().finally(() => db.$disconnect())
