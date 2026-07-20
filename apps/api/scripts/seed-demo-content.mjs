// One-time demo-content population — run manually, exactly once:
//   node apps/api/scripts/seed-demo-content.mjs
//
// Guarded by the `demo_content_seeded` option (stores the SEED_VERSION below):
// once a version has run, every future run of that same version is a no-op,
// even after the admin deletes everything it created. It is never invoked
// automatically by the app. Bumping SEED_VERSION lets this file's content be
// corrected once (as happened here — v1 was wrongly seeded in Telugu) without
// ever silently re-running for everyone else.
import { db } from '../src/lib/db.js'
import { uniqueSlug } from '../src/lib/slug.js'

const MARKER = 'demo_content_seeded'
const SEED_VERSION = 'v3-en-ca'

// v1 (Telugu, wrong — superseded) content, removed if still present before reseeding
const V1_CATEGORY_NAMES = ['క్రీడలు', 'సినిమా', 'విద్య', 'ఆరోగ్యం']
const V1_POST_TITLES = [
  'స్థానిక క్రికెట్ టోర్నమెంట్ విజయవంతంగా ముగింపు', 'యువజన క్రీడా పోటీలకు నమోదు ప్రారంభం', 'పాఠశాలల మధ్య క్రీడోత్సవం ఘనంగా నిర్వహణ',
  'చిన్న వ్యాపారులకు కొత్త రుణ పథకం ప్రకటన', 'స్థానిక మార్కెట్లో ధరల స్థిరత్వం', 'డిజిటల్ చెల్లింపులపై చిన్న వ్యాపారుల్లో అవగాహన సదస్సు',
  'కొత్త తెలుగు చిత్రం చిత్రీకరణ ప్రారంభం', 'స్థానిక చిత్రోత్సవంలో పలు లఘు చిత్రాల ప్రదర్శన', 'సినీ నటుల భేటీలో సాంకేతిక వర్గాలకు అభినందనలు',
  'ప్రభుత్వ పాఠశాలల్లో డిజిటల్ తరగతుల విస్తరణ', 'విద్యార్థుల కోసం ఉచిత నైపుణ్య శిక్షణ కార్యక్రమం', 'పాఠశాల విద్యార్థుల కోసం గ్రంథాలయ వారోత్సవాలు',
  'ఉచిత ఆరోగ్య పరీక్షల శిబిరం నిర్వహణ', 'వర్షాకాలంలో తీసుకోవాల్సిన జాగ్రత్తలపై అవగాహన', 'రక్తదాన శిబిరానికి విశేష స్పందన',
]
const V1_GALLERY_CATEGORY_NAMES = ['వేడుకలు', 'కార్యక్రమాలు']
const V1_GALLERY_ALBUM_TITLES = ['వార్షిక వేడుక 2026', 'స్థాపన దినోత్సవం', 'అవగాహన సదస్సు', 'సామాజిక సేవా కార్యక్రమం']
const V1_POLL_TITLES = [
  'మా వెబ్‌సైట్ కొత్త డిజైన్ మీకు ఎలా అనిపించింది?', 'మీరు రోజూ మా వెబ్‌సైట్‌ను సందర్శిస్తారా?', 'మీకు ఏ విభాగం వార్తలు ఎక్కువ ఇష్టం?',
]

async function removeV1IfPresent() {
  await db.post.deleteMany({ where: { title: { in: V1_POST_TITLES } } })
  await db.category.deleteMany({ where: { name: { in: V1_CATEGORY_NAMES } } })
  await db.galleryAlbum.deleteMany({ where: { title: { in: V1_GALLERY_ALBUM_TITLES } } })
  await db.galleryCategory.deleteMany({ where: { name: { in: V1_GALLERY_CATEGORY_NAMES } } })
  await db.poll.deleteMany({ where: { title: { in: V1_POLL_TITLES } } })
  console.log('Removed old (v1, Telugu) demo content.')
}

async function main() {
  const marker = await db.option.findUnique({ where: { key: MARKER } })
  if (marker?.value === SEED_VERSION) {
    console.log('Demo content already seeded — nothing to do.')
    return
  }
  if (marker?.value) await removeV1IfPresent()

  const admin = await db.user.findFirst({ where: { role: 'admin' }, orderBy: { id: 'asc' } })
  if (!admin) throw new Error('No admin user found — cannot attribute demo posts.')

  const daysAgo = (n) => new Date(Date.now() - n * 24 * 3600 * 1000)

  // ---- categories + posts (English, CA-firm relevant) ----
  const CATEGORIES = [
    {
      name: 'Tax Updates',
      posts: [
        { title: 'Key Changes in Income Tax Filing This Year', days: 2, body: 'The latest changes to income tax filing procedures bring several updates that taxpayers should be aware of before the deadline. Revised forms and simplified disclosure requirements aim to make the process more straightforward for individuals and businesses alike.\n\nTaxpayers are advised to review their documentation early and consult with their advisor to ensure all applicable deductions and exemptions are correctly claimed.' },
        { title: 'Understanding Advance Tax Payment Deadlines', days: 9, body: 'Advance tax payments help spread the tax liability across the financial year rather than as a single burden at year-end. Missing a scheduled installment can attract interest under the applicable provisions.\n\nBusinesses and professionals with tax liability above the prescribed threshold should plan their cash flow around these quarterly deadlines to avoid penalties.' },
        { title: 'Common Mistakes to Avoid While Filing Tax Returns', days: 16, body: 'Simple errors such as mismatched PAN details, incorrect bank account information, or overlooked income sources are among the most frequent reasons for return processing delays.\n\nA careful review before submission, along with reconciliation against Form 26AS and AIS, helps avoid unnecessary notices and rework later in the year.' },
      ],
    },
    {
      name: 'GST Compliance',
      posts: [
        { title: 'Monthly GST Return Filing — What Businesses Need to Know', days: 3, body: 'Timely filing of monthly GST returns remains essential for maintaining a clean compliance record and uninterrupted input tax credit claims. Late filings can lead to interest and restrictions on credit availability.\n\nBusinesses are encouraged to reconcile their purchase and sales registers regularly rather than waiting until the filing deadline.' },
        { title: 'Input Tax Credit Reconciliation Best Practices', days: 11, body: 'Reconciling input tax credit claimed in returns against supplier filings helps identify mismatches early, reducing the risk of credit reversal during assessments.\n\nMaintaining organized purchase records and following up with vendors on filing delays are simple steps that go a long way in smooth compliance.' },
        { title: 'E-Invoicing Requirements for Growing Businesses', days: 20, body: 'As turnover thresholds for mandatory e-invoicing continue to be revised, more businesses fall within its scope each year. Early adoption of compliant billing systems avoids last-minute disruptions.\n\nBusinesses nearing the threshold should evaluate their invoicing software and internal processes well in advance of any applicability date.' },
      ],
    },
    {
      name: 'Audit & Assurance',
      posts: [
        { title: 'Preparing Your Business for the Annual Statutory Audit', days: 1, body: 'A well-organized set of books, supporting vouchers, and reconciled bank statements can significantly shorten audit timelines. Early preparation reduces last-minute back-and-forth between the audit team and management.\n\nBusinesses are encouraged to close their monthly books consistently through the year rather than catching up at year-end.' },
        { title: 'The Role of Internal Controls in Reducing Audit Findings', days: 8, body: 'Strong internal controls around approvals, documentation, and segregation of duties reduce the likelihood of material misstatements being flagged during audit.\n\nPeriodic internal reviews, even informal ones, help management catch and correct issues before the statutory audit begins.' },
        { title: 'Understanding Different Types of Assurance Engagements', days: 14, body: 'Beyond the standard statutory audit, businesses may require limited reviews, certifications, or special-purpose assurance reports depending on regulatory or lender requirements.\n\nUnderstanding which engagement applies to a given situation helps avoid delays when such reports are requested at short notice.' },
      ],
    },
    {
      name: 'Corporate Compliance',
      posts: [
        { title: 'Annual ROC Filing Checklist for Private Companies', days: 4, body: 'Annual filings with the Registrar of Companies involve several forms and disclosures, each with its own deadline. Missing any one of them can attract additional fees and, in some cases, penalties for the company and its directors.\n\nMaintaining a compliance calendar helps ensure nothing is overlooked during a busy financial year-end.' },
        { title: 'Director KYC and Other Recurring Compliance Requirements', days: 12, body: 'Beyond annual filings, directors and companies have several recurring obligations, including periodic KYC updates, that are easy to miss without a reminder system in place.\n\nSetting up calendar reminders well ahead of statutory deadlines is a simple way to stay compliant throughout the year.' },
        { title: 'Board Meeting and Resolution Documentation Best Practices', days: 18, body: 'Proper documentation of board meetings and resolutions is not just a formality — it becomes essential during due diligence, audits, or regulatory scrutiny.\n\nMaintaining organized minute books and resolution registers from the outset saves considerable effort later.' },
      ],
    },
    {
      name: 'Financial Planning',
      posts: [
        { title: 'Building a Tax-Efficient Investment Strategy', days: 5, body: 'A well-structured investment plan considers not just returns but also the tax implications of each instrument. Balancing growth, liquidity, and tax efficiency requires periodic review as regulations change.\n\nConsulting with an advisor annually helps ensure the strategy remains aligned with current tax provisions.' },
        { title: 'Retirement Planning for Business Owners and Professionals', days: 13, body: 'Unlike salaried individuals with structured retirement benefits, business owners and professionals need to build their own retirement corpus deliberately.\n\nA mix of long-term instruments, reviewed periodically alongside business cash flow, forms the basis of a sound retirement plan.' },
        { title: 'Cash Flow Management Tips for Small Businesses', days: 21, body: 'Healthy cash flow, rather than just profitability on paper, is often what determines whether a small business can meet its short-term obligations comfortably.\n\nRegular cash flow forecasting, even a simple monthly projection, helps businesses anticipate and plan for lean periods.' },
      ],
    },
  ]

  const categoryByName = {}
  for (const cat of CATEGORIES) {
    let category = await db.category.findFirst({ where: { name: cat.name } })
    if (!category) {
      category = await db.category.create({
        data: { name: cat.name, slug: await uniqueSlug('category', cat.name), status: true },
      })
      console.log('created category', cat.name)
    }
    categoryByName[cat.name] = category

    for (const p of cat.posts) {
      const exists = await db.post.findFirst({ where: { title: p.title } })
      if (exists) continue
      const post = await db.post.create({
        data: {
          title: p.title,
          slug: await uniqueSlug('post', p.title),
          content: p.body.split('\n\n').map((para) => `<p>${para}</p>`).join(''),
          type: 'post',
          status: true,
          publishedAt: daysAgo(p.days),
          createdBy: admin.id,
        },
      })
      await db.categoryPost.create({ data: { postId: post.id, categoryId: category.id } })
      console.log('created post', p.title)
    }
  }

  // ---- gallery: categories + albums (no photos — added manually later) ----
  const GALLERY = [
    { name: 'Firm Events', albums: ['Annual Day 2026', 'Office Anniversary Celebration'] },
    { name: 'Seminars & Workshops', albums: ['Tax Awareness Seminar', 'GST Workshop for Clients'] },
  ]
  for (const g of GALLERY) {
    let category = await db.galleryCategory.findFirst({ where: { name: g.name } })
    if (!category) {
      category = await db.galleryCategory.create({
        data: { name: g.name, slug: await uniqueSlug('galleryCategory', g.name), status: true },
      })
      console.log('created gallery category', g.name)
    }
    for (const title of g.albums) {
      const exists = await db.galleryAlbum.findFirst({ where: { title } })
      if (exists) continue
      await db.galleryAlbum.create({
        data: {
          title,
          slug: await uniqueSlug('galleryAlbum', title),
          status: true,
          publishedAt: daysAgo(7),
          categoryId: category.id,
          createdBy: admin.id,
        },
      })
      console.log('created gallery album', title)
    }
  }

  // ---- polls (one live, two archived, with plausible pre-set vote counts) ----
  const POLLS = [
    {
      title: 'How would you rate our new website design?',
      status: true,
      options: [
        ['Excellent', 42],
        ['Good', 27],
        ['Needs improvement', 9],
      ],
    },
    {
      title: 'Do you visit our website regularly for updates?',
      status: false,
      options: [
        ['Yes', 58],
        ['Sometimes', 31],
        ['No', 6],
      ],
    },
    {
      title: 'Which service are you most interested in?',
      status: false,
      options: [
        ['Tax Filing', 22],
        ['GST Compliance', 35],
        ['Audit & Assurance', 14],
        ['Business Advisory', 11],
      ],
    },
  ]
  for (const p of POLLS) {
    const exists = await db.poll.findFirst({ where: { title: p.title } })
    if (exists) continue
    // only one poll site-wide may ever be live — archive any existing live poll
    // before creating one of our own as live, same rule the admin API enforces
    if (p.status) await db.poll.updateMany({ where: { status: true }, data: { status: false } })
    await db.poll.create({
      data: {
        title: p.title,
        status: p.status,
        options: { create: p.options.map(([text, votes], i) => ({ text, votes, sortOrder: i })) },
      },
    })
    console.log('created poll', p.title)
  }

  // ---- point the homepage Hero + Featured Stories sections at populated
  // categories, but only if they're currently unset or pointing at a category
  // with no posts — never override a real editorial choice that already works
  async function ensureHomeCategorySetting(key, fallbackCategoryName) {
    const current = await db.option.findUnique({ where: { key } })
    const currentId = current?.value ? Number(current.value) : null
    if (currentId) {
      const postCount = await db.categoryPost.count({ where: { categoryId: currentId } })
      if (postCount > 0) return // already points somewhere with content — leave it alone
    }
    const fallback = categoryByName[fallbackCategoryName]
    if (!fallback) return
    await db.option.upsert({
      where: { key },
      create: { key, value: String(fallback.id) },
      update: { value: String(fallback.id) },
    })
    console.log(`set ${key} -> ${fallbackCategoryName}`)
  }
  await ensureHomeCategorySetting('home_hero_category_id', 'Tax Updates')
  await ensureHomeCategorySetting('home_featured_category_id', 'GST Compliance')

  await db.option.upsert({
    where: { key: MARKER },
    create: { key: MARKER, value: SEED_VERSION },
    update: { value: SEED_VERSION },
  })
  console.log('Done — demo content seeded and marked so this never runs again.')
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
